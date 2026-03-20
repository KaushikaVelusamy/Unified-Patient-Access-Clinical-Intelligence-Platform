/**
 * PDF Routes
 * 
 * API routes for PDF generation and download:
 * - POST /api/appointments/:id/generate-pdf - Generate PDF confirmation (authenticated)
 * - GET /api/pdfs/download - Download PDF with secure token (public)
 * 
 * @module pdfRoutes
 * @created 2026-03-20
 * @task US_018 TASK_004
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validatePDFRequest } from '../middleware/validatePDFRequest';
import pdfController from '../controllers/pdfController';

const router = Router();

/**
 * @route   POST /api/appointments/:id/generate-pdf
 * @desc    Generate PDF confirmation for appointment (manual regeneration)
 * @param   id - Appointment UUID
 * @access  Private (patient, provider, or admin)
 * @implements US_018 AC3 - Manual PDF regeneration from appointment history
 * 
 * Response format:
 * {
 *   success: true,
 *   message: "PDF confirmation generated and sent via email",
 *   downloadUrl: "https://.../download?token=...",
 *   emailSent: true,
 *   appointmentId: "uuid"
 * }
 * 
 * Error scenarios (EC1):
 * - PDF generation fails: Returns text-only email fallback
 * - Email fails (EC2): Logs to database for manual review
 */
router.post(
  '/appointments/:id/generate-pdf',
  authenticate,
  validatePDFRequest as any, // Type assertion to resolve middleware signature
  pdfController.generatePDF.bind(pdfController)
);

/**
 * @route   GET /api/pdfs/download
 * @desc    Download PDF confirmation with secure token
 * @query   token - Signed JWT token (expires in 7 days)
 * @access  Public (token-based authentication)
 * @implements US_018 AC2 - Secure download URL valid for 7 days
 * 
 * Response: PDF file stream (Content-Type: application/pdf)
 * 
 * Error scenarios:
 * - Invalid token: 403 Forbidden
 * - Expired token: 403 Forbidden
 * - File not found: 404 Not Found
 */
router.get(
  '/pdfs/download',
  pdfController.downloadPDF.bind(pdfController)
);

export default router;
