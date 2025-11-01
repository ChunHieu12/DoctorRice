/**
 * Phone Number Normalizer Utility
 * Normalize Vietnamese phone numbers to consistent format (0xxxxxxxxx)
 */

/**
 * Normalize phone number to format: 0xxxxxxxxx
 * Accepts: +84xxxxxxxxx, 84xxxxxxxxx, 0xxxxxxxxx, xxxxxxxxx
 * Returns: 0xxxxxxxxx
 * 
 * @param phone - Phone number in any Vietnamese format
 * @returns Normalized phone number (0xxxxxxxxx)
 * @example
 * normalizePhone('+84987654321') // Returns: '0987654321'
 * normalizePhone('84987654321')  // Returns: '0987654321'
 * normalizePhone('0987654321')   // Returns: '0987654321'
 * normalizePhone('987654321')    // Returns: '0987654321'
 */
export const normalizePhone = (phone: string): string => {
  if (!phone) {
    return '';
  }

  // Remove all spaces and dashes
  let normalized = phone.trim().replace(/[\s-]/g, '');

  // Remove +84 prefix
  if (normalized.startsWith('+84')) {
    normalized = normalized.substring(3);
  }
  // Remove 84 prefix (without +)
  else if (normalized.startsWith('84')) {
    normalized = normalized.substring(2);
  }

  // Add 0 prefix if not present
  if (!normalized.startsWith('0')) {
    normalized = '0' + normalized;
  }

  return normalized;
};

/**
 * Validate Vietnamese phone number format
 * Must be 10 or 11 digits
 * 
 * @param phone - Phone number to validate
 * @returns True if valid Vietnamese phone number
 */
export const isValidVietnamesePhone = (phone: string): boolean => {
  const normalized = normalizePhone(phone);
  // Vietnamese phone: 10 digits starting with 0 (mobile) or 11 digits (landline)
  return /^0\d{9}$/.test(normalized) || /^0\d{10}$/.test(normalized);
};

/**
 * Format phone number for display (add spacing for readability)
 * 
 * @param phone - Phone number
 * @returns Formatted phone number (e.g., 098 765 4321)
 */
export const formatPhoneDisplay = (phone: string): string => {
  const normalized = normalizePhone(phone);
  
  if (normalized.length === 10) {
    // Format: 098 765 4321
    return `${normalized.substring(0, 3)} ${normalized.substring(3, 6)} ${normalized.substring(6)}`;
  } else if (normalized.length === 11) {
    // Format: 024 1234 5678 (landline)
    return `${normalized.substring(0, 3)} ${normalized.substring(3, 7)} ${normalized.substring(7)}`;
  }
  
  return normalized;
};

