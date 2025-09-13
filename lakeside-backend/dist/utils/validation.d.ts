/**
 * Validate phone number format
 * Accepts various formats like +1234567890, (123) 456-7890, 123-456-7890
 */
export declare const validatePhone: (phone: string) => {
    isValid: boolean;
    message: string;
};
/**
 * Validate name format
 */
export declare const validateName: (name: string) => {
    isValid: boolean;
    message: string;
};
/**
 * Normalize phone number to a consistent format
 * Removes all formatting and ensures it starts with Ethiopian country code (+251)
 */
export declare const normalizePhone: (phone: string) => string;
/**
 * Validate registration data
 */
export declare const validateRegistrationData: (data: {
    name: string;
    phone: string;
    password: string;
}) => {
    isValid: boolean;
    errors: string[];
};
/**
 * Validate login data
 */
export declare const validateLoginData: (data: {
    phone: string;
    password: string;
}) => {
    isValid: boolean;
    errors: string[];
};
//# sourceMappingURL=validation.d.ts.map