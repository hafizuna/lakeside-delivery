/**
 * Hash a plain text password
 * @param password - Plain text password
 * @returns Hashed password
 */
export declare const hashPassword: (password: string) => Promise<string>;
/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns Boolean indicating if passwords match
 */
export declare const comparePassword: (password: string, hashedPassword: string) => Promise<boolean>;
/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and message
 */
export declare const validatePassword: (password: string) => {
    isValid: boolean;
    message: string;
};
//# sourceMappingURL=password.d.ts.map