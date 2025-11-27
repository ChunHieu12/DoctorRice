/**
 * IoT Service
 * API calls for IoT device connections and management
 */

import type { ApiResponse } from '@/types';
import { apiDelete, apiGet, apiPost } from './api';

export interface ConnectionStatus {
  isConnected: boolean;
  deviceId?: string;
  fieldName: string;
  connectedAt?: string;
  lastSync?: string;
  firebaseUrl?: string;
}

export interface ConnectDeviceData {
  fieldId: string;
  deviceId: string;
  connectionCode: string;
}

export interface ConnectDeviceResponse {
  connection: {
    _id: string;
    deviceId: string;
    fieldId: string;
    fieldName: string;
    connectedAt: string;
  };
  deviceInfo: {
    deviceId: string;
    firebaseUrl: string;
  };
  message: string;
}

/**
 * Connect IoT device to field
 */
export const connectDevice = async (data: ConnectDeviceData): Promise<ApiResponse<ConnectDeviceResponse>> => {
  return apiPost<ConnectDeviceResponse>('/iot/connect', data);
};

/**
 * Get IoT connection status for a field
 */
export const checkConnectionStatus = async (fieldId: string): Promise<ApiResponse<ConnectionStatus>> => {
  return apiGet<ConnectionStatus>(`/iot/connection/status?fieldId=${fieldId}`);
};

/**
 * Disconnect IoT device from field
 */
export const disconnectDevice = async (fieldId: string): Promise<ApiResponse<{ message: string }>> => {
  // Use apiDelete with body in config.data
  return apiDelete<{ message: string }>('/iot/disconnect', { 
    data: { fieldId }
  });
};

export default {
  connectDevice,
  checkConnectionStatus,
  disconnectDevice,
};

