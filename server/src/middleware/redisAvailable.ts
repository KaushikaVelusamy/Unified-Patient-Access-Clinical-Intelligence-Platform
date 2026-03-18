import { Request, Response, NextFunction } from 'express';
import redisClient from '../utils/redisClient';
import logger from '../utils/logger';

/**
 * Redis Availability Middleware
 * 
 * Attaches Redis client to request object if available
 * Allows graceful degradation to database queries when Redis is down
 */

// Extend Express Request interface to include redis
declare global {
  namespace Express {
    interface Request {
      redis: typeof redisClient | null;
      redisAvailable: boolean;
    }
  }
}

/**
 * Middleware to check Redis availability and attach to request
 * 
 * Behavior:
 * - If Redis is available: Attaches redis client to req.redis
 * - If Redis is unavailable: Sets req.redis to null, application continues
 * - Never blocks requests due to Redis unavailability
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const redisAvailable = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Check if Redis is available
  if (redisClient.isAvailable) {
    req.redis = redisClient;
    req.redisAvailable = true;
  } else {
    req.redis = null;
    req.redisAvailable = false;
    
    // Log only on first failure to avoid log spam
    if (redisClient.status === 'error' && redisClient.lastError) {
      logger.debug('Redis not available, using database fallback');
    }
  }

  next();
};

/**
 * Middleware to require Redis availability for specific routes
 * Returns 503 Service Unavailable if Redis is down
 * 
 * Use this for routes that absolutely require caching
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const requireRedis = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!redisClient.isAvailable) {
    logger.warn('Redis required but not available');
    res.status(503).json({
      success: false,
      error: 'Cache service temporarily unavailable',
      message: 'This feature requires Redis to be available. Please try again later.',
    });
    return;
  }

  req.redis = redisClient;
  req.redisAvailable = true;
  next();
};

export default redisAvailable;
