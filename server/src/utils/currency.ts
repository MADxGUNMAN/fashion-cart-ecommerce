// Currency utility functions for server - INR only

/**
 * Format price with INR currency symbol for server responses
 * @param price - Price value in INR
 * @returns Formatted price string with ₹ symbol
 */
export const formatPrice = (price: number): string => {
  return `₹${price.toFixed(2)}`;
};

/**
 * Validate if price is a valid positive number
 * @param price - Price to validate
 * @returns Boolean indicating if price is valid
 */
export const isValidPrice = (price: number): boolean => {
  return !isNaN(price) && price > 0 && isFinite(price);
};

/**
 * Round price to 2 decimal places
 * @param price - Price to round
 * @returns Rounded price
 */
export const roundPrice = (price: number): number => {
  return Math.round(price * 100) / 100;
};
