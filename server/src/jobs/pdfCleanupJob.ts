/**
 * PDF Cleanup Cron Job
 * 
 * Scheduled job that runs daily at 2 AM UTC to delete expired PDFs
 * from filesystem and database. PDFs are considered expired when:
 * - expires_at < NOW() - 30 days (configurable via PDF_RETENTION_DAYS)
 * 
 * Schedule: "0 2 * * *" (2 AM UTC every day)
 * 
 * Features:
 * - Batch deletion of expired PDFs
 * - Error handling for individual file deletions
 * - Comprehensive logging with cleanup summary
 * - Storage statistics reporting
 * 
 * @module pdfCleanupJob
 * @created 2026-03-20
 * @task US_018 TASK_002
 */

import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import { pool } from '../config/database';
import { config } from '../config/env';
import logger from '../utils/logger';
import type { CleanupResult } from '../types/storage.types';

/**
 * Execute PDF cleanup operation
 * 
 * Finds and deletes PDFs that have passed their retention period.
 * Deletes files from filesystem and metadata records from database.
 * 
 * @returns Cleanup result with statistics
 */
export const executePDFCleanup = async (): Promise<CleanupResult> => {
  const startedAt = new Date();
  const startTime = Date.now();
  const errors: string[] = [];
  
  let filesDeleted = 0;
  let recordsDeleted = 0;
  let bytesFree = 0;
  
  try {
    logger.info('Starting PDF cleanup job');
    
    const { basePath } = config.pdfStorage;
    const retentionDays = config.pdfStorage.pdfRetentionDays;
    
    // Calculate cutoff date (retention period)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    logger.debug('Cleanup parameters', {
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
    });
    
    // Query for expired PDFs
    const query = `
      SELECT 
        id,
        appointment_id,
        file_path,
        file_size_bytes,
        expires_at
      FROM pdf_metadata
      WHERE expires_at < $1
      ORDER BY expires_at ASC
    `;
    
    const result = await pool.query(query, [cutoffDate]);
    const expiredPDFs = result.rows;
    
    logger.info(`Found ${expiredPDFs.length} expired PDFs to delete`);
    
    if (expiredPDFs.length === 0) {
      const completedAt = new Date();
      const executionTime = Date.now() - startTime;
      
      logger.info('No expired PDFs to clean up');
      
      return {
        success: true,
        filesDeleted: 0,
        recordsDeleted: 0,
        bytesFree: 0,
        executionTimeMs: executionTime,
        startedAt,
        completedAt,
      };
    }
    
    // Delete each PDF file and database record
    for (const pdf of expiredPDFs) {
      try {
        const absolutePath = path.join(basePath, pdf.file_path);
        
        // Delete file from filesystem
        try {
          await fs.unlink(absolutePath);
          filesDeleted++;
          bytesFree += parseInt(pdf.file_size_bytes, 10);
          
          logger.debug('PDF file deleted', {
            appointmentId: pdf.appointment_id,
            filePath: pdf.file_path,
            size: pdf.file_size_bytes,
          });
        } catch (fileError) {
          if ((fileError as NodeJS.ErrnoException).code === 'ENOENT') {
            // File already doesn't exist, continue with database deletion
            logger.debug('PDF file not found (already deleted)', {
              appointmentId: pdf.appointment_id,
              filePath: pdf.file_path,
            });
          } else {
            const errorMsg = `Failed to delete file ${pdf.file_path}: ${(fileError as Error).message}`;
            errors.push(errorMsg);
            logger.warn(errorMsg);
          }
        }
        
        // Delete metadata record from database
        const deleteQuery = 'DELETE FROM pdf_metadata WHERE id = $1';
        await pool.query(deleteQuery, [pdf.id]);
        recordsDeleted++;
        
        logger.debug('PDF metadata deleted', {
          id: pdf.id,
          appointmentId: pdf.appointment_id,
        });
      } catch (error) {
        const errorMsg = `Failed to delete PDF ${pdf.appointment_id}: ${(error as Error).message}`;
        errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }
    
    const completedAt = new Date();
    const executionTime = Date.now() - startTime;
    
    // Log cleanup summary
    logger.info('PDF cleanup completed', {
      filesDeleted,
      recordsDeleted,
      bytesFree,
      executionTimeMs: executionTime,
      errors: errors.length,
    });
    
    // Log detailed summary for monitoring
    const summaryLog = {
      timestamp: startedAt.toISOString(),
      filesDeleted,
      recordsDeleted,
      bytesFree: `${(bytesFree / 1024 / 1024).toFixed(2)} MB`,
      executionTimeMs: executionTime,
      errors: errors.length > 0 ? errors : undefined,
    };
    
    logger.info('Cleanup Summary', summaryLog);
    
    return {
      success: errors.length === 0,
      filesDeleted,
      recordsDeleted,
      bytesFree,
      executionTimeMs: executionTime,
      errors: errors.length > 0 ? errors : undefined,
      startedAt,
      completedAt,
    };
  } catch (error) {
    const completedAt = new Date();
    const executionTime = Date.now() - startTime;
    
    const errorMsg = `PDF cleanup job failed: ${(error as Error).message}`;
    errors.push(errorMsg);
    
    logger.error('PDF cleanup job failed', {
      error: (error as Error).message,
      stack: (error as Error).stack,
      filesDeleted,
      recordsDeleted,
      executionTimeMs: executionTime,
    });
    
    return {
      success: false,
      filesDeleted,
      recordsDeleted,
      bytesFree,
      executionTimeMs: executionTime,
      errors,
      startedAt,
      completedAt,
    };
  }
};

/**
 * Schedule PDF cleanup job
 * 
 * Sets up cron schedule to run cleanup daily at 2 AM UTC.
 * 
 * Cron expression: "0 2 * * *"
 * - Minute: 0
 * - Hour: 2 (2 AM)
 * - Day of Month: * (every day)
 * - Month: * (every month)
 * - Day of Week: * (every day of week)
 * 
 * @returns Cron job instance (can be used to stop the job)
 * 
 * @example
 * // Start the cleanup job
 * const job = schedulePDFCleanup();
 * 
 * // Stop the cleanup job (for shutdown)
 * job.stop();
 */
export const schedulePDFCleanup = (): cron.ScheduledTask => {
  logger.info('Scheduling PDF cleanup job (daily at 2 AM UTC)');
  
  const job = cron.schedule(
    '0 2 * * *', // 2 AM UTC every day
    async () => {
      logger.info('PDF cleanup job triggered by schedule');
      
      try {
        const result = await executePDFCleanup();
        
        if (result.success) {
          logger.info('Scheduled PDF cleanup completed successfully', {
            filesDeleted: result.filesDeleted,
            recordsDeleted: result.recordsDeleted,
            bytesFree: result.bytesFree,
          });
        } else {
          logger.error('Scheduled PDF cleanup completed with errors', {
            filesDeleted: result.filesDeleted,
            recordsDeleted: result.recordsDeleted,
            errors: result.errors,
          });
        }
      } catch (error) {
        logger.error('Scheduled PDF cleanup failed', {
          error: (error as Error).message,
          stack: (error as Error).stack,
        });
      }
    },
    {
      scheduled: true,
      timezone: 'UTC',
    }
  );
  
  logger.info('PDF cleanup job scheduled successfully', {
    schedule: '0 2 * * * (2 AM UTC daily)',
    timezone: 'UTC',
    enabled: true,
  });
  
  return job;
};

/**
 * Initialize PDF cleanup job on server startup
 * 
 * Call this function during server initialization to start the cleanup job.
 * 
 * @example
 * // In app.ts or server startup file
 * import { initPDFCleanupJob } from './jobs/pdfCleanupJob';
 * 
 * // Start server
 * app.listen(PORT, () => {
 *   console.log('Server started');
 *   initPDFCleanupJob();
 * });
 */
export const initPDFCleanupJob = (): void => {
  const job = schedulePDFCleanup();
  
  // Graceful shutdown handler
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, stopping PDF cleanup job');
    job.stop();
  });
  
  process.on('SIGINT', () => {
    logger.info('SIGINT received, stopping PDF cleanup job');
    job.stop();
  });
  
  logger.info('PDF cleanup job initialized');
};

// Export for manual execution (useful for testing and admin tools)
export default {
  executePDFCleanup,
  schedulePDFCleanup,
  initPDFCleanupJob,
};
