/**
 * Global TypeScript types and interfaces for DoctorRice app
 */

/**
 * User types
 */
export interface User {
  id: string;
  email?: string;
  phone?: string;
  displayName: string;
  avatar?: string;
  roles: ('user' | 'admin')[];
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
}

/**
 * Auth types
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterCredentials {
  email?: string;
  phone?: string;
  password: string;
  displayName: string;
}

export interface SocialLoginData {
  provider: 'google' | 'facebook';
  idToken?: string;
  accessToken?: string;
}

/**
 * Photo types
 */
export interface PhotoMetadata {
  lat: number;
  lng: number;
  timestamp: number;
  device: string;
  orientation: 'portrait' | 'landscape';
}

export interface Photo {
  id: string;
  userId: string;
  originalUrl: string;
  watermarkedUrl: string;
  thumbnailUrl?: string;
  metadata: PhotoMetadata;
  status: 'processing' | 'completed' | 'failed';
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface UploadPhotoData {
  photo: Blob | File;
  metadata: PhotoMetadata;
}

/**
 * API Response types
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Navigation types (Expo Router)
 */
export type RootStackParamList = {
  '(tabs)': undefined;
  modal: undefined;
};

export type TabsParamList = {
  index: undefined;
  explore: undefined;
};

/**
 * Permission types
 */
export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface PermissionResult {
  status: PermissionStatus;
  canAskAgain: boolean;
}

/**
 * Theme types
 */
export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

/**
 * Utility types
 */
export type Language = 'vi' | 'en';

export type AppEnvironment = 'development' | 'staging' | 'production';

