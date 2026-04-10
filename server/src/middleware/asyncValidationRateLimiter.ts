import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

export const asyncValidationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req: Request) => {
    return (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
  },

  message: {
    success: false,
    message: 'Too many validation requests, please try again later',
    retryAfter: 60,
  },

  handler: (_req: Request, res: Response) => {
    res.set('Retry-After', '60');
    res.status(429).json({
      success: false,
      message: 'Too many validation requests, please try again later',
      retryAfter: 60,
    });
  },
});
