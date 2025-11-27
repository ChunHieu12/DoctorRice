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
 * News types (NewsData API)
 */
export interface NewsArticle {
  article_id: string;
  title: string;
  link: string;
  keywords?: string[];
  creator?: string[];
  video_url?: string;
  description?: string;
  content?: string;
  pubDate: string;
  image_url?: string;
  source_id: string;
  source_priority: number;
  country?: string[];
  category?: string[];
  language: string;
}

export interface NewsResponse {
  status: string;
  totalResults: number;
  results: NewsArticle[];
  nextPage?: string;
}

/**
 * Photo History types
 */
export interface PhotoGroup {
  date: string; // YYYY-MM-DD
  photos: Photo[];
}

export interface PhotoFilter {
  dateFrom?: string;
  dateTo?: string;
  diseaseClass?: string;
}

/**
 * Field Management types
 */
export interface Field {
  _id: string;
  userId: string;
  name: string;
  gpsCenter: {
    lat: number;
    lng: number;
  };
  radius: number; // meters
  metadata?: {
    area?: number; // m²
    cropType?: string;
    notes?: string;
  };
  isDeleted?: boolean;
  hasIoTConnection?: boolean; // True if field has active IoT connection
  iotConnection?: {
    deviceId: string;
    connectedAt: string;
    lastSyncAt?: string;
  };
  iotConnectionCode?: string; // Auto-generated code when field is created
  createdAt: string;
  updatedAt: string;
}

export interface CreateFieldData {
  name: string;
  gpsCenter: {
    lat: number;
    lng: number;
  };
  radius: number;
  metadata?: {
    area?: number;
    cropType?: string;
    notes?: string;
  };
}

/**
 * IoT Connection types
 */
export interface IoTConnection {
  _id: string;
  userId: string;
  fieldId: string;
  deviceId: string;
  connectionCodeHash: string;
  firebaseRealtimeUrl: string;
  status: 'active' | 'inactive';
  lastSync?: string;
  metadata?: {
    deviceName?: string;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ConnectIoTData {
  fieldId: string;
  deviceId: string;
  connectionCode: string;
}

/**
 * IoT Sensor Data types
 */
export interface SensorData {
  temperature: number; // °C
  humidity: number; // %
  ph: number;
  soilMoisture: number; // %
  lux: number;
  windSpeed: number; // m/s
}

/**
 * IoT Image types
 */
export interface IoTImageMetadata {
  deviceId: string;
  fieldId?: string;
  captureId: string;
  firebaseUrl: string;
  sensors: SensorData;
  location?: {
    lat: number;
    lng: number;
  };
  timestamp: number;
}

export interface IoTImage {
  id: string;
  deviceId: string;
  imageUrl: string;
  captureId: string;
  sensors: SensorData;
  location?: {
    lat: number;
    lng: number;
  };
  timestamp: number;
  isInsideGeofence?: boolean;
}

/**
 * Enhanced Photo types with IoT
 */
export interface PhotoIoTMetadata extends IoTImageMetadata {
  // Inherited from IoTImageMetadata
}

export interface PhotoWeatherContext {
  current: {
    temp: number;
    humidity: number;
    description: string;
  };
  forecast: Array<{
    date: string;
    temp: number;
    humidity: number;
    precipitation: number;
    description: string;
  }>;
}

export interface PhotoAIAnalysis {
  diseaseClass: string;
  confidence: number;
  rawAnalysis: string;
  shouldShowSendButton: boolean;
  generatedAt: string;
}

export interface TreatmentData {
  medication?: {
    name: string;
    dosage: string;
    usage: string;
  };
  fertilizer?: {
    name: string;
    dosage: string;
    usage: string;
  };
  schedule?: {
    sprayDates: string[];
    fertilizeDates: string[];
    wateringSchedule: string;
  };
  notes?: string;
}

export interface EnhancedPhoto extends Photo {
  source: 'upload' | 'iot';
  iotMetadata?: PhotoIoTMetadata;
  weatherContext?: PhotoWeatherContext;
  aiAnalysis?: PhotoAIAnalysis;
  treatmentData?: TreatmentData;
}

/**
 * Treatment Log types
 */
export interface TreatmentLog {
  _id: string;
  userId: string;
  fieldId: string;
  photoId: string;
  deviceId: string;
  treatmentData: TreatmentData;
  firebasePath: string;
  sentBy: string;
  status: 'sent' | 'read' | 'failed';
  sentAt: string;
  createdAt: string;
}

export interface SendTreatmentData {
  photoId: string;
  treatmentData: TreatmentData;
}

/**
 * Utility types
 */
export type Language = 'vi' | 'en';

export type AppEnvironment = 'development' | 'staging' | 'production';

