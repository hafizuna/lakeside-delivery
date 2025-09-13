import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { JwtPayload } from '../types/auth';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Authentication middleware to verify JWT tokens
 * Adds user information to request object if valid
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required',
    });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }

  // Add user info to request
  req.user = payload;
  next();
};

/**
 * Optional authentication middleware
 * Does not require authentication but adds user info if token is present
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
};

/**
 * Role-based authorization middleware
 * Requires authentication and specific roles
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Customer-only access middleware
 */
export const requireCustomer = requireRole('CUSTOMER');

/**
 * Restaurant-only access middleware
 */
export const requireRestaurant = requireRole('RESTAURANT');

/**
 * Driver-only access middleware
 */
export const requireDriver = requireRole('DRIVER');

/**
 * Admin-only access middleware
 */
export const requireAdmin = requireRole('ADMIN');
