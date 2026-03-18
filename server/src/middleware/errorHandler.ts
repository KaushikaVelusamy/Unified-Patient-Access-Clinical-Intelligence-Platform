import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';
import config from '../config/env';
import logger from '../utils/logger';

/**
 * Global error handling middleware
 * Must be placed after all routes
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Log the error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Check if it's an operational error (ApiError)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
      timestamp: new Date().toISOString(),
    });
  }

  // Handle unexpected errors
  const statusCode = 500;
  const message =
    config.nodeEnv === 'development'
      ? err.message
      : 'Internal server error. Please try again later.';

  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const error = new ApiError(
    404,
    `Route ${req.method} ${req.url} not found`,
  );
  next(error);
};

export default { errorHandler, notFoundHandler };
