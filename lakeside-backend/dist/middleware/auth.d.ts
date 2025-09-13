import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../types/auth';
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
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Optional authentication middleware
 * Does not require authentication but adds user info if token is present
 */
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Role-based authorization middleware
 * Requires authentication and specific roles
 */
export declare const requireRole: (...allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Customer-only access middleware
 */
export declare const requireCustomer: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Restaurant-only access middleware
 */
export declare const requireRestaurant: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Driver-only access middleware
 */
export declare const requireDriver: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Admin-only access middleware
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.d.ts.map