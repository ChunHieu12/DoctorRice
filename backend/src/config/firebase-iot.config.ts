/**
 * Firebase IoT Configuration
 * Configuration for connecting to IoT Firebase Realtime Database
 */

export const FIREBASE_IOT_CONFIG = {
  // Database URL - Asia Southeast 1 region
  databaseURL: 'https://rice-813b5-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'rice-813b5',
  
  // Paths
  SENSORS_PATH: 'feeds',  // Changed from 'sensors_data' to 'feeds'
  EXECUTIONS_PATH: 'executions',
  TREATMENTS_PATH: 'treatments',
  
  // Sync settings
  SYNC_INTERVAL: 300000, // 5 minutes
  MAX_IMAGES_PER_QUERY: 100,
  IMAGE_RETENTION_DAYS: 30, // Only sync images from last 30 days
  
  // Cache settings
  CACHE_TTL: 300, // 5 minutes in seconds
};

/**
 * Get date keys for last N days
 * Firebase stores data by date key (YYYYMMDD)
 */
export function getDateKeys(days: number = 7): string[] {
  const keys: string[] = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    keys.push(`${year}${month}${day}`);
  }
  
  return keys;
}

/**
 * Parse Firebase image data
 */
export interface FirebaseImageData {
  device_id: string;
  gps: {
    lat: number;
    lon: number;
    alt?: number;
    fix?: boolean;
  };
  env: {
    temp: number;
    hum: number;
    ph: number;
    soil: number;
    lux: number;
    wind: number;
    wind_avg?: number;
  };
  image: {
    url: string;
    object?: string;
  };
  ts: string;
  host?: string;
}

