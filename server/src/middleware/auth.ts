import { Response, NextFunction } from 'express';
import { ApiError, AuthenticatedRequest } from '../types';
import jwt from 'jsonwebtoken';
import config from '../config/env';

/**
 * JWT authentication middleware
 * Verifies the JWT token from Authorization header
 * Attaches user data to request object
 */
export const authenticateToken = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new ApiError(401, 'Access token is missing or invalid');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      email: string;
      role: 'patient' | 'staff' | 'admin';
    };

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, 'Invalid or expired token'));
    }
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * @param allowedRoles - Array of roles that can access the route
 */
export const authorizeRoles = (...allowedRoles: Array<'patient' | 'staff' | 'admin'>) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'You do not have permission to access this resource'),
      );
    }

    next();
  };
};

export default { authenticateToken, authorizeRoles };
