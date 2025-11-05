/**
 * Storage keys and constant keys for DoctorRice app
 */

/**
 * SecureStore keys (encrypted storage)
 */
export const SECURE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_ID: 'userId',
} as const;

/**
 * AsyncStorage keys (non-sensitive data)
 */
export const STORAGE_KEYS = {
  LANGUAGE: 'appLanguage',
  THEME: 'appTheme',
  ONBOARDING_COMPLETED: 'onboardingCompleted',
  LAST_SYNC: 'lastSync',
} as const;

/**
 * API endpoint keys
 */
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  SOCIAL_GOOGLE: '/auth/social/google',
  SOCIAL_FACEBOOK: '/auth/social/facebook',
  PHONE_SEND_OTP: '/auth/phone/send-otp',
  PHONE_VERIFY_OTP: '/auth/phone/verify-otp',

  // Photos
  PHOTOS: '/photos',
  PHOTOS_UPLOAD: '/photos/upload',
  PHOTOS_BY_ID: (id: string) => `/photos/${id}`,

  // User
  USER_PROFILE: '/user/profile',
  USER_UPDATE: '/user/update',

  // Health
  HEALTH: '/health',
} as const;

/**
 * Error codes
 */
export const ERROR_CODES = {
  // Auth errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  AUTH_EMAIL_EXISTS: 'AUTH_003',

  // Photo errors
  PHOTO_TOO_LARGE: 'PHOTO_001',
  PHOTO_INVALID_FORMAT: 'PHOTO_002',
  PHOTO_NOT_FOUND: 'PHOTO_003',
  PHOTO_WATERMARK_FAILED: 'PHOTO_004',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_001',

  // Server errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_001',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Permission types
 */
export const PERMISSIONS = {
  CAMERA: 'camera',
  LOCATION: 'location',
  NOTIFICATIONS: 'notifications',
} as const;

/**
 * App configuration keys
 */
export const CONFIG = {
  API_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  IMAGE_MAX_WIDTH: 1280,
  IMAGE_MAX_HEIGHT: 1280,
  IMAGE_QUALITY: 0.8,
} as const;

