import { JwtPayload } from '../types/auth';
/**
 * Generate a JWT token for a user
 * @param payload - User data to include in token
 * @returns JWT token string
 */
export declare const generateToken: (payload: Omit<JwtPayload, "iat" | "exp">) => string;
/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export declare const verifyToken: (token: string) => JwtPayload | null;
/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Token string or null
 */
export declare const extractTokenFromHeader: (authHeader: string | undefined) => string | null;
/**
 * Generate a refresh token (for future use)
 * @param payload - User data to include in refresh token
 * @returns Refresh token string
 */
export declare const generateRefreshToken: (payload: Omit<JwtPayload, "iat" | "exp">) => string;
//# sourceMappingURL=jwt.d.ts.map