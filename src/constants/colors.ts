/**
 * Color constants for DoctorRice app
 */

export const COLORS = {
  // Primary colors
  primary: '#4CAF50', // Green - representing rice/agriculture
  primaryLight: '#81C784',
  primaryDark: '#388E3C',

  // Secondary colors
  secondary: '#2196F3', // Blue
  secondaryLight: '#64B5F6',
  secondaryDark: '#1976D2',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9E9E9E',
  grayLight: '#E0E0E0',
  grayDark: '#616161',

  // Background colors
  background: '#FAFAFA',
  backgroundDark: '#121212',
  surface: '#FFFFFF',
  surfaceDark: '#1E1E1E',

  // Text colors
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#FFFFFF',
  textDark: '#000000',

  // Status colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',

  // Border colors
  border: '#E0E0E0',
  borderDark: '#424242',

  // Special colors
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

/**
 * Color palette for light theme
 */
export const LIGHT_THEME = {
  primary: COLORS.primary,
  secondary: COLORS.secondary,
  background: COLORS.background,
  surface: COLORS.surface,
  text: COLORS.text,
  textSecondary: COLORS.textSecondary,
  border: COLORS.border,
  error: COLORS.error,
  success: COLORS.success,
  warning: COLORS.warning,
} as const;

/**
 * Color palette for dark theme
 */
export const DARK_THEME = {
  primary: COLORS.primaryLight,
  secondary: COLORS.secondaryLight,
  background: COLORS.backgroundDark,
  surface: COLORS.surfaceDark,
  text: COLORS.textLight,
  textSecondary: COLORS.grayLight,
  border: COLORS.borderDark,
  error: COLORS.error,
  success: COLORS.success,
  warning: COLORS.warning,
} as const;

/**
 * Default export (alias for COLORS)
 * Used by IoT components
 */
export const colors = COLORS;

