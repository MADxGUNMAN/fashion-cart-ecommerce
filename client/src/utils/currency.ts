// Currency utility functions for INR (Indian Rupees)

/**
 * Format price with INR currency symbol
 * @param price - Price value in INR
 * @returns Formatted price string with ₹ symbol
 */
export const formatPrice = (price: number): string => {
  return `₹${price.toFixed(2)}`;
};

/**
 * Format price for display with proper comma separation
 * @param price - Price value in INR
 * @returns Formatted price string with Indian number format
 */
export const formatPriceWithCommas = (price: number): string => {
  return `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Parse price string to number (removes ₹ symbol and commas)
 * @param priceString - Price string like "₹1,234.56"
 * @returns Price as number
 */
export const parsePrice = (priceString: string): number => {
  return parseFloat(priceString.replace(/[₹,]/g, ''));
};

/**
 * Validate if price is a valid positive number
 * @param price - Price to validate
 * @returns Boolean indicating if price is valid
 */
export const isValidPrice = (price: number): boolean => {
  return !isNaN(price) && price > 0 && isFinite(price);
};
