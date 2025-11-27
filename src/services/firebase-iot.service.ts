/**
 * Firebase IoT Service
 * Handles interaction with Firebase Realtime Database for IoT data
 * Note: This is a CLIENT-SIDE service that calls backend APIs
 * (Backend handles direct Firebase communication)
 */

import type { ApiResponse, IoTConnection, IoTImage } from '@/types';
import { apiGet, apiPost } from './api';

/**
 * Get IoT connection status for a field
 */
export const getIoTConnectionStatus = async (
  fieldId: string
): Promise<ApiResponse<IoTConnection | null>> => {
  return apiGet<IoTConnection | null>(`/iot/status?fieldId=${fieldId}`);
};

/**
 * Get recent IoT images for a field
 * Images are fetched from Firebase via backend and filtered by GPS geofence
 */
export const getIoTImages = async (params: {
  fieldId: string;
  limit?: number;
  startTime?: number;
  endTime?: number;
}): Promise<ApiResponse<IoTImage[]>> => {
  const queryParams = new URLSearchParams({
    fieldId: params.fieldId,
    ...(params.limit && { limit: params.limit.toString() }),
    ...(params.startTime && { startTime: params.startTime.toString() }),
    ...(params.endTime && { endTime: params.endTime.toString() }),
  });

  return apiGet<IoTImage[]>(`/iot/images?${queryParams.toString()}`);
};

/**
 * Connect an IoT device to a field
 */
export const connectIoTDevice = async (data: {
  fieldId: string;
  deviceId: string;
  connectionCode: string;
}): Promise<ApiResponse<IoTConnection>> => {
  return apiPost<IoTConnection>('/iot/connect', data);
};

/**
 * Disconnect an IoT device from a field
 */
export const disconnectIoTDevice = async (
  connectionId: string
): Promise<ApiResponse<{ message: string }>> => {
  return apiPost<{ message: string }>('/iot/disconnect', { connectionId });
};

/**
 * Format sensor data for display
 */
export const formatSensorValue = (type: string, value: number | null | undefined): string => {
  // Handle null/undefined values
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  switch (type) {
    case 'temperature':
      return `${value.toFixed(1)}°C`;
    case 'humidity':
    case 'soilMoisture':
      return `${value.toFixed(0)}%`;
    case 'ph':
      return value.toFixed(1);
    case 'lux':
      return `${value.toFixed(0)} lx`;
    case 'windSpeed':
      return `${value.toFixed(1)} m/s`;
    default:
      return value.toString();
  }
};

/**
 * Get sensor status color based on value ranges
 */
export const getSensorStatus = (
  type: string,
  value: number | null | undefined
): 'good' | 'warning' | 'danger' => {
  // Handle null/undefined values
  if (value === null || value === undefined || isNaN(value)) {
    return 'good'; // Neutral status for N/A values
  }

  switch (type) {
    case 'temperature':
      if (value < 15 || value > 35) return 'danger';
      if (value < 20 || value > 30) return 'warning';
      return 'good';
    case 'humidity':
      if (value < 40 || value > 90) return 'danger';
      if (value < 50 || value > 80) return 'warning';
      return 'good';
    case 'ph':
      if (value < 5.5 || value > 7.5) return 'danger';
      if (value < 6.0 || value > 7.0) return 'warning';
      return 'good';
    case 'soilMoisture':
      if (value < 30 || value > 90) return 'danger';
      if (value < 40 || value > 80) return 'warning';
      return 'good';
    default:
      return 'good';
  }
};

export default {
  getIoTConnectionStatus,
  getIoTImages,
  connectIoTDevice,
  disconnectIoTDevice,
  formatSensorValue,
  getSensorStatus,
};

