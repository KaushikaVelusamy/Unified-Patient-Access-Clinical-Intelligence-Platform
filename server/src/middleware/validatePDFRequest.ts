/**
 * PDF Request Validation Middleware
 * 
 * Validates PDF generation and download requests:
 * - Appointment exists and is not cancelled
 * - User has permission to access appointment
 * - Prevents unauthorized PDF access
 * 
 * @module validatePDFRequest
 * @created 2026-03-20
 * @task US_018 TASK_004
 */

import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import logger from '../utils/logger';

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
 * Validate appointment exists and user has permission
 * 
 * Security checks:
 * - Appointment ID is valid UUID format
 * - Appointment exists in database
 * - Appointment is not cancelled
 * - User is either:
 *   1. The patient who owns the appointment
 *   2. The provider assigned to the appointment
 *   3. An admin user
 * 
 * @param req - Express request with user and appointment ID
 * @param res - Express response
 * @param next - Express next function
 */
export const validatePDFRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const appointmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  // Step 1: Validate appointment ID format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!appointmentId || !uuidRegex.test(appointmentId)) {
    logger.warn('Invalid appointment ID format', { appointmentId, userId });
    res.status(400).json({
      success: false,
      message: 'Invalid appointment ID format',
    });
    return;
  }

  try {
    // Step 2: Check if appointment exists and get ownership details
    const query = `
      SELECT 
        a.id,
        a.patient_id,
        a.status,
        ts.provider_id,
        p.email as patient_email,
        pr.email as provider_email
      FROM appointments a
      JOIN time_slots ts ON a.slot_id = ts.id
      JOIN users p ON a.patient_id = p.id
      JOIN users pr ON ts.provider_id = pr.id
      WHERE a.id = $1
    `;

    const result = await pool.query(query, [appointmentId]);

    if (result.rows.length === 0) {
      logger.warn('Appointment not found', { appointmentId, userId });
      res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
      return;
    }

    const appointment = result.rows[0];

    // Step 3: Check if appointment is cancelled
    if (appointment.status === 'cancelled') {
      logger.warn('Attempted PDF generation for cancelled appointment', {
        appointmentId,
        userId,
      });
      res.status(400).json({
        success: false,
        message: 'Cannot generate PDF for cancelled appointment',
      });
      return;
    }

    // Step 4: Verify user has permission to access this appointment
    const isPatient = userId === appointment.patient_id;
    const isProvider = userId === appointment.provider_id;
    const isAdmin = userRole === 'admin';

    if (!isPatient && !isProvider && !isAdmin) {
      logger.warn('Unauthorized PDF generation attempt', {
        appointmentId,
        userId,
        userRole,
        patientId: appointment.patient_id,
        providerId: appointment.provider_id,
      });
      res.status(403).json({
        success: false,
        message: 'You do not have permission to access this appointment',
      });
      return;
    }

    // Validation passed - proceed to controller
    logger.debug('PDF request validation passed', {
      appointmentId,
      userId,
      permission: isPatient ? 'patient' : isProvider ? 'provider' : 'admin',
    });

    next();
  } catch (error: any) {
    logger.error('Error in PDF request validation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate PDF request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
