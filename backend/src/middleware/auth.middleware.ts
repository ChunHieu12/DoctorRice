import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/responses';

interface JWTPayload {
  userId: string;
  email?: string;
  displayName?: string;
  roles: string[];
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Verify JWT token middleware
 */
export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      errorResponse(res, 'AUTH_001', 'No token provided', 401);
      return;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'default-secret';

    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      errorResponse(res, 'AUTH_002', 'Token expired', 401);
      return;
    }
    errorResponse(res, 'AUTH_001', 'Invalid token', 401);
    return;
  }
};

/**
 * Admin role middleware
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user?.roles.includes('admin')) {
    errorResponse(res, 'AUTH_003', 'Admin access required', 403);
    return;
  }
  next();
};

// Alias for backward compatibility
export const authMiddleware = auth;

