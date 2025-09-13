"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireDriver = exports.requireRestaurant = exports.requireCustomer = exports.requireRole = exports.optionalAuth = exports.authenticateToken = void 0;
const jwt_1 = require("../utils/jwt");
/**
 * Authentication middleware to verify JWT tokens
 * Adds user information to request object if valid
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token is required',
        });
    }
    const payload = (0, jwt_1.verifyToken)(token);
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
exports.authenticateToken = authenticateToken;
/**
 * Optional authentication middleware
 * Does not require authentication but adds user info if token is present
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
    if (token) {
        const payload = (0, jwt_1.verifyToken)(token);
        if (payload) {
            req.user = payload;
        }
    }
    next();
};
exports.optionalAuth = optionalAuth;
/**
 * Role-based authorization middleware
 * Requires authentication and specific roles
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
/**
 * Customer-only access middleware
 */
exports.requireCustomer = (0, exports.requireRole)('CUSTOMER');
/**
 * Restaurant-only access middleware
 */
exports.requireRestaurant = (0, exports.requireRole)('RESTAURANT');
/**
 * Driver-only access middleware
 */
exports.requireDriver = (0, exports.requireRole)('DRIVER');
/**
 * Admin-only access middleware
 */
exports.requireAdmin = (0, exports.requireRole)('ADMIN');
//# sourceMappingURL=auth.js.map