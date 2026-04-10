import { Request, Response } from 'express';
import pool from '../config/database';
import logger from '../utils/logger';

export async function checkUsernameAvailability(req: Request, res: Response): Promise<void> {
  const { username } = req.query;

  if (!username || typeof username !== 'string' || username.trim().length < 2) {
    res.status(400).json({
      success: false,
      errors: [{ field: 'username', message: 'Username must be at least 2 characters', code: 'INVALID_USERNAME' }],
    });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT 1 FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [username.trim()]
    );

    res.json({
      success: true,
      available: result.rows.length === 0,
    });
  } catch (error) {
    logger.error('Username availability check failed', { error });
    res.status(503).json({
      success: false,
      message: 'Unable to validate - check connection',
      retryAfter: 30,
    });
  }
}

const MOCK_INSURANCE_DB: Record<string, { eligible: boolean; reason?: string }> = {
  'ABC123456789': { eligible: true },
  'W12345678': { eligible: true },
  'EXPIRED001': { eligible: false, reason: 'Policy expired on 2025-12-31' },
  'INACTIVE01': { eligible: false, reason: 'Policy is inactive' },
};

export async function checkInsuranceEligibility(req: Request, res: Response): Promise<void> {
  const { memberId, provider } = req.body;

  if (!memberId || typeof memberId !== 'string') {
    res.status(400).json({
      success: false,
      errors: [{ field: 'memberId', message: 'Insurance member ID is required', code: 'REQUIRED_FIELD' }],
    });
    return;
  }

  if (!provider || typeof provider !== 'string') {
    res.status(400).json({
      success: false,
      errors: [{ field: 'provider', message: 'Insurance provider is required', code: 'REQUIRED_FIELD' }],
    });
    return;
  }

  try {
    const record = MOCK_INSURANCE_DB[memberId.trim()];

    if (record) {
      res.json({
        success: true,
        eligible: record.eligible,
        reason: record.reason,
      });
    } else {
      res.json({
        success: true,
        eligible: false,
        reason: 'Member ID not found in records',
      });
    }
  } catch (error) {
    logger.error('Insurance eligibility check failed', { error });
    res.status(503).json({
      success: false,
      message: 'Unable to validate - check connection',
      retryAfter: 30,
    });
  }
}
