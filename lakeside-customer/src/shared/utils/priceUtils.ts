/**
 * Utility functions for consistent price formatting across the application
 * Handles both string and number price inputs from API responses
 */

/**
 * Formats a price value with currency symbol and proper decimal places
 * @param price - The price value (string or number)
 * @param currency - The currency symbol to use (default: ₹)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted price string
 */
export const formatPrice = (
  price: string | number | null | undefined, 
  currency: string = '₹', 
  decimals: number = 2
): string => {
  // Handle null/undefined values
  if (price == null) {
    return `${currency}0.${'0'.repeat(decimals)}`;
  }
  
  // Convert to number and validate
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Handle invalid numbers
  if (isNaN(numericPrice) || numericPrice < 0) {
    console.warn('Invalid price value:', price);
    return `${currency}0.${'0'.repeat(decimals)}`;
  }
  
  // Format with specified decimal places
  return `${currency}${numericPrice.toFixed(decimals)}`;
};

/**
 * Converts a price value to a number for calculations
 * @param price - The price value (string or number)
 * @returns Numeric price value or 0 if invalid
 */
export const parsePrice = (price: string | number | null | undefined): number => {
  if (price == null) {
    return 0;
  }
  
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numericPrice) || numericPrice < 0) {
    console.warn('Invalid price value for parsing:', price);
    return 0;
  }
  
  return numericPrice;
};

/**
 * Validates if a price value is valid
 * @param price - The price value to validate
 * @returns True if price is valid, false otherwise
 */
export const isValidPrice = (price: string | number | null | undefined): boolean => {
  if (price == null) {
    return false;
  }
  
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(numericPrice) && numericPrice >= 0;
};

/**
 * Calculates total price from an array of items
 * @param items - Array of items with price property
 * @param quantity - Optional quantity multiplier for each item
 * @returns Total price
 */
export const calculateTotal = (
  items: Array<{ price: string | number; quantity?: number }>,
  additionalFees: number = 0
): number => {
  const itemsTotal = items.reduce((total, item) => {
    const itemPrice = parsePrice(item.price);
    const itemQuantity = item.quantity || 1;
    return total + (itemPrice * itemQuantity);
  }, 0);
  
  return itemsTotal + additionalFees;
};

/**
 * Format price range for display
 * @param minPrice - Minimum price
 * @param maxPrice - Maximum price  
 * @param currency - Currency symbol
 * @returns Formatted price range string
 */
export const formatPriceRange = (
  minPrice: string | number, 
  maxPrice: string | number, 
  currency: string = '₹'
): string => {
  const min = parsePrice(minPrice);
  const max = parsePrice(maxPrice);
  
  if (min === max) {
    return formatPrice(min, currency);
  }
  
  return `${formatPrice(min, currency)} - ${formatPrice(max, currency)}`;
};

// Currency constants for consistency
export const CURRENCY = {
  RUPEE: '₹',
  DOLLAR: '$',
  EURO: '€',
  POUND: '£'
} as const;

// Default currency for the app
export const DEFAULT_CURRENCY = CURRENCY.RUPEE;
