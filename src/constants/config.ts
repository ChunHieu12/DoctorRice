/**
 * App configuration constants
 * These values are read from app.json or environment variables
 */
import Constants from "expo-constants";

/**
 * API Configuration
 */
export const API_CONFIG = {
  /**
   * Base URL for backend API
   * Priority: EXPO_PUBLIC_API_URL > app.json extra.apiUrl > fallback
   */
  BASE_URL:
    process.env.EXPO_PUBLIC_API_URL ||
    Constants.expoConfig?.extra?.apiUrl ||
    "https://doctorrice-xdhp.onrender.com/api",

  /**
   * API timeout in milliseconds
   */
  TIMEOUT: 30000, // 30 seconds

  /**
   * Max retry attempts for failed requests
   */
  MAX_RETRIES: 3,

  /**
   * Retry delay in milliseconds
   */
  RETRY_DELAY: 1000, // 1 second
} as const;

/**
 * App Configuration
 */
export const APP_CONFIG = {
  /**
   * App version from app.json
   */
  VERSION: Constants.expoConfig?.version || "1.0.0",

  /**
   * App name
   */
  NAME: Constants.expoConfig?.name || "DoctorRice",

  /**
   * Display name
   */
  DISPLAY_NAME: (Constants.expoConfig as any)?.displayName || "Bác sĩ Lúa",

  /**
   * EAS Project ID
   */
  PROJECT_ID: Constants.expoConfig?.extra?.eas?.projectId || "",
} as const;

/**
 * File Upload Configuration
 */
export const UPLOAD_CONFIG = {
  /**
   * Maximum file size in bytes (10MB)
   */
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  /**
   * Image max dimensions
   */
  IMAGE_MAX_WIDTH: 1280,
  IMAGE_MAX_HEIGHT: 1280,

  /**
   * Image quality (0-1)
   */
  IMAGE_QUALITY: 0.8,

  /**
   * Accepted image formats
   */
  ACCEPTED_FORMATS: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ] as const,
} as const;

/**
 * Development mode check
 */
export const IS_DEV = __DEV__;

/**
 * Log app configuration on startup (only in dev)
 */
if (IS_DEV) {
  console.log("🔧 App Configuration:");
  console.log("  📡 API URL:", API_CONFIG.BASE_URL);
  console.log("  🌍 ENV API:", process.env.EXPO_PUBLIC_API_URL || "(not set)");
  console.log("  📱 App Version:", APP_CONFIG.VERSION);
  console.log("  🏷️  Display Name:", APP_CONFIG.DISPLAY_NAME);
  console.log("  🆔 Project ID:", APP_CONFIG.PROJECT_ID);
}

export default {
  API: API_CONFIG,
  APP: APP_CONFIG,
  UPLOAD: UPLOAD_CONFIG,
  IS_DEV,
};
