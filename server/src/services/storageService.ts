/**
 * PDF Storage Service
 * 
 * Service for storing appointment confirmation PDFs to filesystem with:
 * - Organized directory structure (year-month subdirectories)
 * - Metadata tracking in PostgreSQL
 * - Secure download URLs with JWT tokens
 * - Automated cleanup of expired PDFs
 * 
 * File naming: confirmation_[appointment_id]_[timestamp].pdf
 * Storage path: storage/pdfs/YYYY-MM/filename.pdf
 * 
 * @module storageService
 * @created 2026-03-20
 * @task US_018 TASK_002
 */

import fs from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { config } from '../config/env';
import logger from '../utils/logger';
import type {
  PDFStorageOptions,
  PDFSaveResult,
  PDFMetadata,
  SecureDownloadURL,
  DownloadTokenPayload,
  TokenValidationResult,
  PDFMetadataQuery,
  StorageStatistics,
} from '../types/storage.types';

/**
 * Get storage configuration from environment
 */
const getStorageConfig = () => ({
  basePath: config.pdfStorage.basePath,
  downloadUrlExpiryDays: config.pdfStorage.downloadUrlExpiryDays,
  pdfRetentionDays: config.pdfStorage.pdfRetentionDays,
  jwtSecret: config.jwt.secret,
  baseUrl: config.pdfStorage.baseUrl,
});

/**
 * Generate year-month subdirectory name (e.g., "2026-03")
 * @param date Date to format
 * @returns Formatted directory name
 */
function getYearMonthDirectory(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Generate PDF filename with appointment ID and timestamp
 * @param appointmentId Appointment UUID
 * @returns Filename in format: confirmation_[id]_[timestamp].pdf
 */
function generateFilename(appointmentId: string): string {
  const timestamp = Date.now();
  return `confirmation_${appointmentId}_${timestamp}.pdf`;
}

/**
 * Ensure directory exists, create if necessary
 * @param dirPath Absolute directory path
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    logger.info('Created storage directory', { dirPath });
  }
}

/**
 * Save PDF buffer to filesystem with metadata tracking
 * 
 * Saves PDF to organized directory structure, creates database metadata record,
 * and returns save result with file path and metadata.
 * 
 * @param pdfBuffer PDF content as Buffer
 * @param options Storage options including appointment ID
 * @returns Save result with metadata
 * 
 * @example
 * const result = await savePDF(buffer, { 
 *   appointmentId: 'abc123',
 *   createdBy: 'user456'
 * });
 * 
 * if (result.success) {
 *   console.log('PDF saved:', result.filePath);
 * }
 */
export const savePDF = async (
  pdfBuffer: Buffer,
  options: PDFStorageOptions
): Promise<PDFSaveResult> => {
  const startTime = Date.now();
  const { basePath, pdfRetentionDays } = getStorageConfig();
  
  try {
    logger.info('Starting PDF save operation', {
      appointmentId: options.appointmentId,
      bufferSize: pdfBuffer.length,
    });
    
    // Generate file path components
    const yearMonth = getYearMonthDirectory();
    const filename = generateFilename(options.appointmentId);
    const relativePath = path.join(yearMonth, filename);
    const directoryPath = path.join(basePath, yearMonth);
    const absolutePath = path.join(basePath, relativePath);
    
    // Ensure directory exists
    await ensureDirectoryExists(directoryPath);
    
    // Write PDF to filesystem
    await fs.writeFile(absolutePath, pdfBuffer);
    logger.debug('PDF written to filesystem', { absolutePath, size: pdfBuffer.length });
    
    // Calculate expiry date
    const generatedAt = new Date();
    const expiresAt = new Date(generatedAt);
    expiresAt.setDate(expiresAt.getDate() + (options.expiryDays || pdfRetentionDays));
    
    // Insert metadata record to database
    const query = `
      INSERT INTO pdf_metadata (
        appointment_id,
        file_path,
        file_size_bytes,
        generated_at,
        expires_at,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        appointment_id,
        file_path,
        file_size_bytes,
        generated_at,
        expires_at,
        created_by,
        created_at,
        updated_at
    `;
    
    const values = [
      options.appointmentId,
      relativePath,
      pdfBuffer.length,
      generatedAt,
      expiresAt,
      options.createdBy || null,
    ];
    
    const result = await pool.query(query, values);
    const row = result.rows[0];
    
    const metadata: PDFMetadata = {
      id: row.id,
      appointmentId: row.appointment_id,
      filePath: row.file_path,
      fileSizeBytes: row.file_size_bytes,
      generatedAt: row.generated_at,
      expiresAt: row.expires_at,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    
    const executionTime = Date.now() - startTime;
    
    logger.info('PDF saved successfully', {
      appointmentId: options.appointmentId,
      filePath: relativePath,
      size: pdfBuffer.length,
      executionTimeMs: executionTime,
    });
    
    return {
      success: true,
      metadata,
      filePath: relativePath,
      fileSizeBytes: pdfBuffer.length,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    logger.error('PDF save failed', {
      appointmentId: options.appointmentId,
      error: (error as Error).message,
      executionTimeMs: executionTime,
    });
    
    // Attempt to rollback: delete file if it was created
    try {
      const yearMonth = getYearMonthDirectory();
      const filename = generateFilename(options.appointmentId);
      const absolutePath = path.join(basePath, yearMonth, filename);
      await fs.unlink(absolutePath);
      logger.debug('Rolled back file creation', { absolutePath });
    } catch (rollbackError) {
      // Ignore rollback errors
    }
    
    return {
      success: false,
      error: `Failed to save PDF: ${(error as Error).message}`,
    };
  }
};

/**
 * Generate secure download URL with JWT token
 * 
 * Creates a time-limited JWT token for secure PDF downloads.
 * Token includes appointment ID and file path, expires after configured days.
 * 
 * @param appointmentId Appointment UUID
 * @returns Secure download URL with token
 * 
 * @example
 * const url = await generateSecureDownloadURL('abc123');
 * // url.url: "https://api.clinic.com/api/pdfs/download?token=eyJhbG..."
 * // url.expiresAt: 7 days from now
 */
export const generateSecureDownloadURL = async (
  appointmentId: string
): Promise<SecureDownloadURL> => {
  try {
    logger.debug('Generating secure download URL', { appointmentId });
    
    // Get PDF metadata from database
    const metadata = await getPDFMetadata(appointmentId);
    
    if (!metadata) {
      throw new Error(`No PDF found for appointment ${appointmentId}`);
    }
    
    const { jwtSecret, downloadUrlExpiryDays, baseUrl } = getStorageConfig();
    
    // Create JWT payload
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = downloadUrlExpiryDays * 24 * 60 * 60; // Convert days to seconds
    
    const payload: DownloadTokenPayload = {
      appointmentId: metadata.appointmentId,
      filePath: metadata.filePath,
      iat: now,
      exp: now + expiresIn,
    };
    
    // Sign JWT token
    const token = jwt.sign(payload, jwtSecret);
    
    const expiresAt = new Date((now + expiresIn) * 1000);
    
    // Construct download URL
    const url = `${baseUrl}/api/pdfs/download?token=${token}`;
    
    logger.info('Secure download URL generated', {
      appointmentId,
      expiresAt,
    });
    
    return {
      url,
      token,
      expiresAt,
      appointmentId: metadata.appointmentId,
    };
  } catch (error) {
    logger.error('Failed to generate secure download URL', {
      appointmentId,
      error: (error as Error).message,
    });
    
    throw error;
  }
};

/**
 * Validate download token and return file path
 * 
 * Verifies JWT token signature and expiration, checks if file exists,
 * and returns absolute file path for serving the PDF.
 * 
 * @param token JWT token from download URL
 * @returns Validation result with file path if valid
 * 
 * @example
 * const result = await validateDownloadToken(token);
 * 
 * if (result.valid && result.absolutePath) {
 *   // Serve file from result.absolutePath
 * }
 */
export const validateDownloadToken = async (
  token: string
): Promise<TokenValidationResult> => {
  try {
    const { jwtSecret, basePath } = getStorageConfig();
    
    // Verify JWT token
    const decoded = jwt.verify(token, jwtSecret) as DownloadTokenPayload;
    
    logger.debug('Token validated', {
      appointmentId: decoded.appointmentId,
      expiresAt: new Date(decoded.exp * 1000),
    });
    
    // Construct absolute file path
    const absolutePath = path.join(basePath, decoded.filePath);
    
    // Check if file exists
    try {
      await fs.access(absolutePath);
    } catch {
      logger.warn('PDF file not found on filesystem', {
        appointmentId: decoded.appointmentId,
        filePath: decoded.filePath,
      });
      
      return {
        valid: false,
        error: 'PDF file no longer exists. It may have been deleted or expired.',
      };
    }
    
    return {
      valid: true,
      payload: decoded,
      absolutePath,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug('Token expired', { error: error.message });
      return {
        valid: false,
        error: 'Download link has expired. Please request a new link.',
      };
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid token', { error: error.message });
      return {
        valid: false,
        error: 'Invalid download link.',
      };
    }
    
    logger.error('Token validation error', {
      error: (error as Error).message,
    });
    
    return {
      valid: false,
      error: `Token validation failed: ${(error as Error).message}`,
    };
  }
};

/**
 * Get PDF metadata by appointment ID
 * 
 * Retrieves the most recent PDF metadata for the specified appointment.
 * 
 * @param appointmentId Appointment UUID
 * @returns PDF metadata or null if not found
 * 
 * @example
 * const metadata = await getPDFMetadata('abc123');
 * 
 * if (metadata) {
 *   console.log('PDF generated:', metadata.generatedAt);
 *   console.log('Expires:', metadata.expiresAt);
 * }
 */
export const getPDFMetadata = async (
  appointmentId: string
): Promise<PDFMetadata | null> => {
  try {
    const query = `
      SELECT 
        id,
        appointment_id,
        file_path,
        file_size_bytes,
        generated_at,
        expires_at,
        created_by,
        created_at,
        updated_at
      FROM pdf_metadata
      WHERE appointment_id = $1
      ORDER BY generated_at DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query, [appointmentId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    
    return {
      id: row.id,
      appointmentId: row.appointment_id,
      filePath: row.file_path,
      fileSizeBytes: row.file_size_bytes,
      generatedAt: row.generated_at,
      expiresAt: row.expires_at,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    logger.error('Failed to get PDF metadata', {
      appointmentId,
      error: (error as Error).message,
    });
    
    return null;
  }
};

/**
 * Query PDF metadata with filters
 * 
 * Retrieves multiple PDF metadata records matching the query criteria.
 * 
 * @param query Query filters
 * @returns Array of PDF metadata records
 * 
 * @example
 * // Find expired PDFs
 * const expired = await queryPDFMetadata({
 *   expiresBefor: new Date(),
 *   limit: 100
 * });
 */
export const queryPDFMetadata = async (
  query: PDFMetadataQuery
): Promise<PDFMetadata[]> => {
  try {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;
    
    if (query.appointmentId) {
      conditions.push(`appointment_id = $${paramCounter++}`);
      values.push(query.appointmentId);
    }
    
    if (query.expiresBefor) {
      conditions.push(`expires_at < $${paramCounter++}`);
      values.push(query.expiresBefor);
    }
    
    if (query.generatedAfter) {
      conditions.push(`generated_at > $${paramCounter++}`);
      values.push(query.generatedAfter);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const sql = `
      SELECT 
        id,
        appointment_id,
        file_path,
        file_size_bytes,
        generated_at,
        expires_at,
        created_by,
        created_at,
        updated_at
      FROM pdf_metadata
      ${whereClause}
      ORDER BY generated_at DESC
      LIMIT $${paramCounter++}
      OFFSET $${paramCounter}
    `;
    
    values.push(query.limit || 100);
    values.push(query.offset || 0);
    
    const result = await pool.query(sql, values);
    
    return result.rows.map((row) => ({
      id: row.id,
      appointmentId: row.appointment_id,
      filePath: row.file_path,
      fileSizeBytes: row.file_size_bytes,
      generatedAt: row.generated_at,
      expiresAt: row.expires_at,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    logger.error('Failed to query PDF metadata', {
      query,
      error: (error as Error).message,
    });
    
    return [];
  }
};

/**
 * Delete PDF from filesystem and database
 * 
 * Removes PDF file from storage and deletes metadata record.
 * Safe to call even if file doesn't exist (idempotent).
 * 
 * @param appointmentId Appointment UUID
 * @returns True if deletion was successful
 * 
 * @example
 * const deleted = await deletePDF('abc123');
 * 
 * if (deleted) {
 *   console.log('PDF deleted successfully');
 * }
 */
export const deletePDF = async (appointmentId: string): Promise<boolean> => {
  try {
    logger.info('Deleting PDF', { appointmentId });
    
    // Get metadata first
    const metadata = await getPDFMetadata(appointmentId);
    
    if (!metadata) {
      logger.warn('PDF metadata not found for deletion', { appointmentId });
      return false;
    }
    
    const { basePath } = getStorageConfig();
    const absolutePath = path.join(basePath, metadata.filePath);
    
    // Delete file from filesystem
    try {
      await fs.unlink(absolutePath);
      logger.debug('PDF file deleted from filesystem', { absolutePath });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.warn('Failed to delete PDF file', {
          absolutePath,
          error: (error as Error).message,
        });
        // Continue with database deletion even if file doesn't exist
      }
    }
    
    // Delete metadata from database
    const query = 'DELETE FROM pdf_metadata WHERE id = $1';
    await pool.query(query, [metadata.id]);
    
    logger.info('PDF deleted successfully', {
      appointmentId,
      filePath: metadata.filePath,
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to delete PDF', {
      appointmentId,
      error: (error as Error).message,
    });
    
    return false;
  }
};

/**
 * Get storage statistics
 * 
 * Retrieves statistics about PDF storage usage for monitoring.
 * 
 * @returns Storage statistics
 * 
 * @example
 * const stats = await getStorageStatistics();
 * console.log(`Total PDFs: ${stats.totalPdfs}`);
 * console.log(`Total size: ${stats.totalBytes} bytes`);
 */
export const getStorageStatistics = async (): Promise<StorageStatistics> => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_pdfs,
        COALESCE(SUM(file_size_bytes), 0) as total_bytes,
        COUNT(CASE WHEN expires_at < NOW() + INTERVAL '7 days' THEN 1 END) as expiring_soon,
        COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired,
        COALESCE(AVG(file_size_bytes), 0) as average_size,
        MIN(generated_at) as oldest_pdf,
        MAX(generated_at) as newest_pdf
      FROM pdf_metadata
    `;
    
    const result = await pool.query(query);
    const row = result.rows[0];
    
    return {
      totalPdfs: parseInt(row.total_pdfs, 10),
      totalBytes: parseInt(row.total_bytes, 10),
      expiringSoon: parseInt(row.expiring_soon, 10),
      expired: parseInt(row.expired, 10),
      averageSize: parseFloat(row.average_size),
      oldestPdf: row.oldest_pdf,
      newestPdf: row.newest_pdf,
    };
  } catch (error) {
    logger.error('Failed to get storage statistics', {
      error: (error as Error).message,
    });
    
    return {
      totalPdfs: 0,
      totalBytes: 0,
      expiringSoon: 0,
      expired: 0,
      averageSize: 0,
    };
  }
};
