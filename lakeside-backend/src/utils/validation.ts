/**
 * Validate phone number format
 * Accepts various formats like +1234567890, (123) 456-7890, 123-456-7890
 */
export const validatePhone = (phone: string): { isValid: boolean; message: string } => {
  if (!phone) {
    return { isValid: false, message: 'Phone number is required' };
  }

  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Check if it's a valid phone number (10-15 digits, optionally starting with +)
  const phoneRegex = /^(\+)?[\d]{10,15}$/;
  
  if (!phoneRegex.test(cleaned)) {
    return { isValid: false, message: 'Please enter a valid phone number' };
  }

  return { isValid: true, message: 'Phone number is valid' };
};

/**
 * Validate name format
 */
export const validateName = (name: string): { isValid: boolean; message: string } => {
  if (!name) {
    return { isValid: false, message: 'Name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters long' };
  }

  if (name.trim().length > 100) {
    return { isValid: false, message: 'Name must be less than 100 characters' };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true, message: 'Name is valid' };
};

/**
 * Normalize phone number to a consistent format
 * Removes all formatting and ensures it starts with Ethiopian country code (+251)
 */
export const normalizePhone = (phone: string): string => {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If no country code, assume Ethiopian (+251)
  if (!cleaned.startsWith('+')) {
    // If it starts with 0, remove the 0 and add +251
    if (cleaned.startsWith('0')) {
      cleaned = '+251' + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      // If it's 9 digits (Ethiopian mobile without 0), add +251
      cleaned = '+251' + cleaned;
    } else if (cleaned.length === 10 && cleaned.startsWith('9')) {
      // If it's 10 digits starting with 9 (0922772024 -> 922772024), add +251
      cleaned = '+251' + cleaned;
    } else {
      // For other cases, add +251 prefix
      cleaned = '+251' + cleaned;
    }
  }
  
  return cleaned;
};

/**
 * Validate registration data
 */
export const validateRegistrationData = (data: { name: string; phone: string; password: string }) => {
  const errors: string[] = [];
  
  const nameValidation = validateName(data.name);
  if (!nameValidation.isValid) {
    errors.push(nameValidation.message);
  }
  
  const phoneValidation = validatePhone(data.phone);
  if (!phoneValidation.isValid) {
    errors.push(phoneValidation.message);
  }
  
  // Password validation will be handled by password utility
  if (!data.password) {
    errors.push('Password is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate login data
 */
export const validateLoginData = (data: { phone: string; password: string }) => {
  const errors: string[] = [];
  
  const phoneValidation = validatePhone(data.phone);
  if (!phoneValidation.isValid) {
    errors.push(phoneValidation.message);
  }
  
  if (!data.password) {
    errors.push('Password is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};
