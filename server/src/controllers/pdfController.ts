/**
 * PDF Controller
 * 
 * HTTP request handlers for PDF generation and download API endpoints.
 * Orchestrates PDF generation, storage, and email services with comprehensive error handling.
 * 
 * @module pdfController
 * @created 2026-03-20
 * @task US_018 TASK_004
 */

import { Request, Response } from 'express';
import { generateAppointmentPDFBuffer } from '../services/pdfService';
import { 
  savePDF, 
  generateSecureDownloadURL, 
  validateDownloadToken,
  getPDFMetadata 
} from '../services/storageService';
import { 
  sendAppointmentConfirmationWithPDF, 
  sendAppointmentConfirmationTextOnly 
} from '../services/emailService';
import { pool } from '../config/database';
import { logSecurityEvent } from '../utils/auditLogger';
import logger from '../utils/logger';
import type { AppointmentEmailData } from '../types/email.types';
import fs from 'fs';
import path from 'path';

/**
 * Extended Request with authenticated user
 */
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Fetch appointment data with patient and provider details for email
 * 
 * @param appointmentId - Appointment UUID
 * @returns Appointment data formatted for email template
 */
const fetchAppointmentDataForEmail = async (
  appointmentId: string
): Promise<AppointmentEmailData> => {
  const query = `
    SELECT 
      a.id as appointment_id,
      a.appointment_date,
      a.notes,
      ts.start_time,
      ts.end_time,
      EXTRACT(EPOCH FROM (ts.end_time - ts.start_time))/60 as duration_minutes,
      CONCAT(p.first_name, ' ', p.last_name) as patient_name,
      p.email as patient_email,
      CONCAT(pr.first_name, ' ', pr.last_name) as provider_name,
      pr.credentials as provider_credentials,
      d.name as department_name,
      COALESCE(d.location, 'Building A, Floor 2') as location,
      COALESCE(d.address, '123 Medical Center Dr, Healthcare City, HC 12345') as address,
      COALESCE(d.phone, '(555) 123-4567') as clinic_phone,
      COALESCE(d.email, 'appointments@upaci.health') as clinic_email
    FROM appointments a
    JOIN users p ON a.patient_id = p.id
    JOIN time_slots ts ON a.slot_id = ts.id
    JOIN users pr ON ts.provider_id = pr.id
    JOIN departments d ON ts.department_id = d.id
    WHERE a.id = $1 AND a.status != 'cancelled'
  `;

  try {
    const result = await pool.query(query, [appointmentId]);
    
    if (result.rows.length === 0) {
      throw new Error(
        `Appointment ${appointmentId} not found or has been cancelled`
      );
    }

    const row = result.rows[0];
    
    // Format date for display
    const appointmentDate = new Date(row.appointment_date);
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(appointmentDate);

    // Format time for display
    const formatTime = (timeString: string): string => {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    const appointmentTime = `${formatTime(row.start_time)} - ${formatTime(row.end_time)}`;

    return {
      appointmentId: row.appointment_id,
      patientName: row.patient_name,
      patientEmail: row.patient_email,
      appointmentDate: formattedDate,
      appointmentTime: appointmentTime,
      duration: Math.round(row.duration_minutes),
      type: 'Consultation', // Default type, can be extended
      providerName: row.provider_name,
      providerCredentials: row.provider_credentials || 'MD',
      departmentName: row.department_name,
      location: row.location,
      address: row.address,
      preparationInstructions: row.notes ? [row.notes] : undefined,
      clinicName: 'UPACI Health',
      clinicPhone: row.clinic_phone,
      clinicEmail: row.clinic_email,
      clinicWebsite: 'https://upaci.health',
    };
  } catch (error) {
    logger.error('Error fetching appointment data for email:', error);
    throw error;
  }
};

class PDFController {
  /**
   * Generate PDF confirmation for appointment
   * 
   * POST /api/appointments/:id/generate-pdf
   * 
   * Implements US_018 TASK_004 AC1:
   * - Generates PDF confirmation
   * - Saves to storage with secure download URL (7 days)
   * - Sends email with PDF attachment
   * - Implements retry logic and text-only fallback on PDF failure (EC1)
   * 
   * Requires authentication (patient or provider role)
   * 
   * @param req - Express request with appointment ID in params
   * @param res - Express response
   */
  async generatePDF(req: AuthRequest, res: Response): Promise<void> {
    const appointmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    logger.info('PDF generation requested', {
      appointmentId,
      userId,
      userRole,
    });

    try {
      // Step 1: Fetch appointment and patient data
      const appointmentData = await fetchAppointmentDataForEmail(appointmentId);

      // Step 2: Generate PDF (with retry on failure - EC1)
      let pdfBuffer: Buffer;
      let pdfGenerated = true;
      let pdfFailureReason: string | undefined;

      try {
        pdfBuffer = await generateAppointmentPDFBuffer(appointmentId);
        logger.info('PDF generated successfully', { appointmentId, size: pdfBuffer.length });
      } catch (pdfError: any) {
        logger.warn('PDF generation failed, retrying once', {
          appointmentId,
          error: pdfError.message,
        });

        // Retry once (EC1)
        try {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
          pdfBuffer = await generateAppointmentPDFBuffer(appointmentId);
          logger.info('PDF generated successfully on retry', { appointmentId });
        } catch (retryError: any) {
          pdfGenerated = false;
          pdfFailureReason = retryError.message;
          logger.error('PDF generation failed after retry', {
            appointmentId,
            error: retryError.message,
          });
        }
      }

      // Step 3: Save PDF to storage and get download URL (if PDF generated)
      let downloadUrl: string | undefined;

      if (pdfGenerated && pdfBuffer!) {
        try {
          const saveResult = await savePDF(pdfBuffer!, {
            appointmentId,
            createdBy: appointmentData.patientEmail,
          });

          const downloadUrlResult = await generateSecureDownloadURL(appointmentId);
          downloadUrl = downloadUrlResult.url;

          logger.info('PDF saved to storage', {
            appointmentId,
            filePath: saveResult.filePath,
            downloadUrl,
          });

          // Add download URL to appointment data for email template
          appointmentData.pdfDownloadUrl = downloadUrl;
        } catch (storageError: any) {
          logger.error('PDF storage failed', {
            appointmentId,
            error: storageError.message,
          });
          // Continue to email sending even if storage fails
        }
      }

      // Step 4: Send email with PDF or text-only fallback (EC1)
      let emailResult;

      if (pdfGenerated && pdfBuffer!) {
        // Send email with PDF attachment
        emailResult = await sendAppointmentConfirmationWithPDF(
          appointmentId,
          appointmentData,
          pdfBuffer!
        );
      } else {
        // Fallback: Send text-only email
        emailResult = await sendAppointmentConfirmationTextOnly(
          appointmentId,
          appointmentData,
          pdfFailureReason || 'PDF generation failed'
        );
      }

      // Step 5: Audit log the operation
      await logSecurityEvent(
        userId ? parseInt(userId, 10) : null,
        'PDF_GENERATED',
        {
          appointmentId,
          pdfGenerated,
          emailSent: emailResult.success,
          downloadUrl,
          retried: !pdfGenerated,
        },
        {
          userId: userId ? parseInt(userId, 10) : null,
          userRole: userRole || null,
          ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
        }
      );

      // Step 6: Return response
      if (pdfGenerated && emailResult.success) {
        res.status(200).json({
          success: true,
          message: 'PDF confirmation generated and sent via email',
          downloadUrl,
          emailSent: true,
          appointmentId,
        });
      } else if (!pdfGenerated && emailResult.success) {
        // PDF failed but email sent
        res.status(200).json({
          success: true,
          message: 'PDF generation failed, appointment details sent via email',
          downloadUrl: null,
          emailSent: true,
          appointmentId,
          warning: 'PDF generation failed, you\'ll receive details via email',
        });
      } else {
        // Both PDF and email failed
        res.status(500).json({
          success: false,
          message: 'Failed to generate PDF and send email',
          appointmentId,
          error: emailResult.error || 'Unknown error',
        });
      }
    } catch (error: any) {
      logger.error('Error in generatePDF controller:', error);

      // Audit log the failure
      await logSecurityEvent(
        userId ? parseInt(userId, 10) : null,
        'PDF_GENERATION_FAILED',
        {
          appointmentId,
          error: error.message,
        },
        {
          userId: userId ? parseInt(userId, 10) : null,
          userRole: userRole || null,
          ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
        }
      );

      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF confirmation',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Download PDF confirmation
   * 
   * GET /api/pdfs/download?token=<signed-jwt>
   * 
   * Implements US_018 TASK_004 AC2:
   * - Validates secure download token (JWT)
   * - Verifies token not expired (7 days max)
   * - Streams PDF file to client
   * - Logs download attempt for audit
   * 
   * Public endpoint (token-based authentication)
   * 
   * @param req - Express request with token in query params
   * @param res - Express response
   */
  async downloadPDF(req: Request, res: Response): Promise<void> {
    const token = req.query.token as string;

    if (!token) {
      logger.warn('PDF download attempted without token');
      res.status(400).json({
        success: false,
        message: 'Download token is required',
      });
      return;
    }

    try {
      // Step 1: Validate download token and get file metadata
      const tokenData = await validateDownloadToken(token);

      if (!tokenData.valid) {
        logger.warn('Invalid or expired PDF download token', {
          reason: tokenData.error,
        });

        res.status(403).json({
          success: false,
          message: tokenData.error || 'Invalid or expired download link',
        });
        return;
      }

      const appointmentId = tokenData.payload?.appointmentId;
      const filePath = tokenData.payload?.filePath;

      if (!appointmentId || !filePath) {
        logger.error('Token payload missing required fields');
        res.status(403).json({
          success: false,
          message: 'Invalid token payload',
        });
        return;
      }

      // Step 2: Check if file exists
      const fullFilePath = path.resolve(filePath!);
      
      if (!fs.existsSync(fullFilePath)) {
        logger.error('PDF file not found on filesystem', {
          appointmentId,
          filePath: fullFilePath,
        });

        res.status(404).json({
          success: false,
          message: 'PDF file not found. It may have been deleted.',
        });
        return;
      }

      // Step 3: Get PDF metadata for audit logging
      const metadata = await getPDFMetadata(appointmentId!);

      // Step 4: Stream PDF file to response
      logger.info('Streaming PDF download', {
        appointmentId,
        filePath: fullFilePath,
        size: fs.statSync(fullFilePath).size,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="appointment-${appointmentId}-confirmation.pdf"`
      );

      const fileStream = fs.createReadStream(fullFilePath);
      fileStream.pipe(res);

      fileStream.on('end', () => {
        logger.info('PDF download completed', { appointmentId });
      });

      fileStream.on('error', (streamError) => {
        logger.error('Error streaming PDF file', {
          appointmentId,
          error: streamError.message,
        });
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error downloading PDF file',
          });
        }
      });

      // Step 5: Audit log the download
      await logSecurityEvent(
        null, // No user authentication for token-based downloads
        'PDF_DOWNLOADED',
        {
          appointmentId,
          filePath: fullFilePath,
          fileSize: fs.statSync(fullFilePath).size,
          metadata,
        },
        {
          userId: null,
          userRole: null,
          ip: (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
        }
      );
    } catch (error: any) {
      logger.error('Error in downloadPDF controller:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to download PDF',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

export default new PDFController();
