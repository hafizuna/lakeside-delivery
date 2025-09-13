"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePassword = exports.comparePassword = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Hash a plain text password
 * @param password - Plain text password
 * @returns Hashed password
 */
const hashPassword = async (password) => {
    const saltRounds = 12;
    return bcryptjs_1.default.hash(password, saltRounds);
};
exports.hashPassword = hashPassword;
/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns Boolean indicating if passwords match
 */
const comparePassword = async (password, hashedPassword) => {
    return bcryptjs_1.default.compare(password, hashedPassword);
};
exports.comparePassword = comparePassword;
/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and message
 */
const validatePassword = (password) => {
    if (!password) {
        return { isValid: false, message: 'Password is required' };
    }
    if (password.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    if (password.length > 128) {
        return { isValid: false, message: 'Password must be less than 128 characters' };
    }
    // For development, allow simpler passwords
    // TODO: Re-enable strict validation for production
    // const hasLetter = /[a-zA-Z]/.test(password);
    // const hasNumber = /\d/.test(password);
    // if (!hasLetter || !hasNumber) {
    //   return { isValid: false, message: 'Password must contain at least one letter and one number' };
    // }
    return { isValid: true, message: 'Password is valid' };
};
exports.validatePassword = validatePassword;
//# sourceMappingURL=password.js.map