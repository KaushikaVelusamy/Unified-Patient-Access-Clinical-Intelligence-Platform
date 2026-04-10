import { Router } from 'express';
import { checkUsernameAvailability, checkInsuranceEligibility } from '../controllers/validationController';
import { asyncValidationRateLimiter } from '../middleware/asyncValidationRateLimiter';

const router = Router();

/**
 * @route   GET /api/validation/check-username
 * @desc    Check if a username/email is available
 * @query   username - The username/email to check
 * @access  Public (rate limited: 10 req/min per IP)
 */
router.get('/check-username', asyncValidationRateLimiter, checkUsernameAvailability);

/**
 * @route   POST /api/validation/check-eligibility
 * @desc    Check insurance eligibility
 * @body    { memberId: string, provider: string }
 * @access  Public (rate limited: 10 req/min per IP)
 */
router.post('/check-eligibility', asyncValidationRateLimiter, checkInsuranceEligibility);

export default router;
