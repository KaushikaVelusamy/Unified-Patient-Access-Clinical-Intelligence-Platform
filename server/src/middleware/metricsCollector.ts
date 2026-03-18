import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestsTotal, activeConnections } from '../utils/metricsRegistry';
import { metricsConfig } from '../config/metrics';
import logger from '../utils/logger';

/**
 * Metrics Collector Middleware
 * 
 * Automatically collects metrics for all HTTP requests:
 * - Increments active connections gauge on request start
 * - Records request duration in histogram on request end
 * - Increments request counter on request end
 * - Decrements active connections gauge on request end
 * 
 * Route Normalization:
 * - /api/users/123 → /api/users/{id}
 * - /api/appointments/abc-def-ghi → /api/appointments/{uuid}
 * This prevents high-cardinality issues
 */

/**
 * Normalize route path to prevent high-cardinality labels
 * 
 * Examples:
 * - /api/users/123 → /api/users/{id}
 * - /api/users/abc123 → /api/users/{id}
 * - /api/appointments/550e8400-e29b-41d4-a716-446655440000 → /api/appointments/{uuid}
 * - /api/reports/2024-03-18 → /api/reports/{date}
 * 
 * @param path - Original request path
 * @returns Normalized path with placeholders
 */
function normalizeRoutePath(path: string): string {
  return path
    // Replace UUIDs (8-4-4-4-12 format)
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/{uuid}')
    // Replace numeric IDs
    .replace(/\/\d+/g, '/{id}')
    // Replace alphanumeric IDs (e.g., abc123, user_abc)
    .replace(/\/[a-z0-9_-]+\d+[a-z0-9_-]*/gi, '/{id}')
    // Replace date patterns (YYYY-MM-DD)
    .replace(/\/\d{4}-\d{2}-\d{2}/g, '/{date}')
    // Replace MongoDB ObjectIDs (24 hex characters)
    .replace(/\/[0-9a-f]{24}/gi, '/{id}')
    // Ensure consistent format
    .toLowerCase();
}

/**
 * Extract user role from request
 * 
 * Supports various authentication strategies:
 * - JWT token with user.role
 * - Session with user.role
 * - Custom authentication headers
 * 
 * @param req - Express request object
 * @returns User role or 'anonymous'
 */
function extractUserRole(req: Request): string {
  // Check if user is authenticated (set by auth middleware)
  // Use type assertion since user may or may not be present
  const user = (req as any).user;
  
  if (user && typeof user === 'object' && user.role) {
    return user.role;
  }
  
  // Fallback to anonymous for unauthenticated requests
  return 'anonymous';
}

/**
 * Metrics Collector Middleware
 * 
 * Wraps all HTTP requests to automatically collect metrics
 */
export const metricsCollector = (req: Request, res: Response, next: NextFunction): void => {
  // Skip metrics collection if disabled
  if (!metricsConfig.enabled) {
    return next();
  }
  
  // Skip metrics collection for the /metrics endpoint itself
  // This prevents recursive metric collection
  if (req.path === '/metrics') {
    return next();
  }
  
  // Increment active connections gauge
  activeConnections.inc();
  
  // Capture request start time
  const startTime = Date.now();
  
  // Store start time on request object for debugging
  (req as any).startTime = startTime;
  
  // Listen for response finish event
  res.on('finish', () => {
    try {
      // Calculate request duration in seconds
      const duration = (Date.now() - startTime) / 1000;
      
      // Normalize route path to prevent high cardinality
      const normalizedRoute = normalizeRoutePath(req.path);
      
      // Extract user role
      const userRole = extractUserRole(req);
      
      // Prepare labels
      const labels = {
        method: req.method,
        route: normalizedRoute,
        status_code: res.statusCode,
        user_role: userRole,
      };
      
      // Record histogram observation (duration)
      httpRequestDuration.observe(labels, duration);
      
      // Increment counter
      httpRequestsTotal.inc(labels);
      
      // Log slow requests (>2 seconds)
      if (duration > 2) {
        logger.warn('Slow request detected', {
          method: req.method,
          path: req.path,
          normalizedRoute,
          duration: `${duration.toFixed(3)}s`,
          statusCode: res.statusCode,
          userRole,
        });
      }
    } catch (error) {
      // Log error but don't crash the application
      logger.error('Error recording metrics:', error);
    } finally {
      // Always decrement active connections, even if metrics recording fails
      activeConnections.dec();
    }
  });
  
  // Listen for response close event (connection closed before finish)
  res.on('close', () => {
    // Only decrement if finish event hasn't fired yet
    if (!res.writableFinished) {
      try {
        activeConnections.dec();
        logger.debug('Connection closed before response finished', {
          method: req.method,
          path: req.path,
        });
      } catch (error) {
        logger.error('Error handling connection close:', error);
      }
    }
  });
  
  next();
};

export default metricsCollector;
