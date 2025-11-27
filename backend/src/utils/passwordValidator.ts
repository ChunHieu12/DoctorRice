/**
 * Password Validation Utility
 * Ensures password meets security requirements
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate password strength
 * Requirements:
 * - More than 6 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length <= 6) {
    errors.push('Password must be more than 6 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least 1 uppercase letter (A-Z)');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least 1 lowercase letter (a-z)');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least 1 number (0-9)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get password requirements as string (for error messages)
 */
export const getPasswordRequirements = (): string => {
  return 'Password must be more than 6 characters and contain at least 1 uppercase letter, 1 lowercase letter, and 1 number';
};

