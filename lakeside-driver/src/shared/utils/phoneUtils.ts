/**
 * Normalize Ethiopian phone number to +251 format
 * Handles various input formats like 0922772024, 922772024, +251922772024
 */
export const normalizeEthiopianPhone = (phone: string): string => {
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
      // If it's 10 digits starting with 9, add +251
      cleaned = '+251' + cleaned;
    } else {
      // For other cases, add +251 prefix
      cleaned = '+251' + cleaned;
    }
  }
  
  return cleaned;
};

/**
 * Format phone number for display (removes +251 prefix for Ethiopian numbers)
 */
export const formatPhoneForDisplay = (phone: string): string => {
  if (phone.startsWith('+251')) {
    return '0' + phone.substring(4);
  }
  return phone;
};

/**
 * Validate Ethiopian phone number format
 */
export const validateEthiopianPhone = (phone: string): { isValid: boolean; message: string } => {
  if (!phone) {
    return { isValid: false, message: 'Phone number is required' };
  }

  const normalized = normalizeEthiopianPhone(phone);
  
  // Ethiopian mobile numbers should be +251 followed by 9 digits
  const ethiopianMobileRegex = /^\+251[9][0-9]{8}$/;
  
  if (!ethiopianMobileRegex.test(normalized)) {
    return { isValid: false, message: 'Please enter a valid Ethiopian mobile number (e.g., 0922772024)' };
  }

  return { isValid: true, message: 'Phone number is valid' };
};
