/**
 * GPS Utilities
 * Calculate distance between GPS coordinates and geofencing
 */

/**
 * Calculate distance between two GPS points (Haversine formula)
 * @param lat1 Latitude of point 1
 * @param lng1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lng2 Longitude of point 2
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  const distance = R * c;
  
  return distance;
}

/**
 * Check if a point is within a circular geofence
 * @param pointLat Point latitude
 * @param pointLng Point longitude
 * @param centerLat Center latitude
 * @param centerLng Center longitude
 * @param radius Radius in meters
 * @returns True if point is inside geofence
 */
export function isInsideGeofence(
  pointLat: number,
  pointLng: number,
  centerLat: number,
  centerLng: number,
  radius: number
): boolean {
  const distance = calculateDistance(pointLat, pointLng, centerLat, centerLng);
  return distance <= radius;
}

/**
 * Validate GPS coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @returns True if valid
 */
export function isValidGPS(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Format GPS coordinates for display
 * @param lat Latitude
 * @param lng Longitude
 * @param precision Decimal places
 * @returns Formatted string
 */
export function formatGPS(lat: number, lng: number, precision: number = 6): string {
  return `${lat.toFixed(precision)}°N, ${lng.toFixed(precision)}°E`;
}

