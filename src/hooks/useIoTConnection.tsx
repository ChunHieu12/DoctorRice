/**
 * useIoTConnection Hook
 * Manages IoT device connection to fields
 */

import * as iotService from '@/services/iot.service';
import type { IoTConnection } from '@/types';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

export interface UseIoTConnectionReturn {
  connection: IoTConnection | null;
  loading: boolean;
  error: string | null;
  connectDevice: (fieldId: string, deviceId: string, code: string) => Promise<boolean>;
  disconnectDevice: (fieldId: string) => Promise<boolean>;
  checkConnectionStatus: (fieldId: string) => Promise<void>;
}

export const useIoTConnection = (): UseIoTConnectionReturn => {
  const [connection, setConnection] = useState<IoTConnection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Connect IoT device to a field
   */
  const connectDevice = useCallback(
    async (fieldId: string, deviceId: string, code: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await iotService.connectDevice({
          fieldId,
          deviceId,
          connectionCode: code,
        });

        if (response.success && response.data) {
          Alert.alert('Thành công', 'Kết nối thiết bị IoT thành công!');
          return true;
        } else {
          throw new Error(response.error?.message || 'Failed to connect device');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        Alert.alert('Lỗi kết nối', errorMessage);
        console.error('Error connecting device:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Disconnect IoT device
   */
  const disconnectDevice = useCallback(async (fieldId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await iotService.disconnectDevice(fieldId);

      if (response.success) {
        setConnection(null);
        Alert.alert('Thành công', 'Đã ngắt kết nối thiết bị IoT');
        return true;
      } else {
        throw new Error(response.error?.message || 'Failed to disconnect device');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      Alert.alert('Lỗi', `Không thể ngắt kết nối: ${errorMessage}`);
      console.error('Error disconnecting device:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check connection status for a field
   */
  const checkConnectionStatus = useCallback(async (fieldId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await iotService.checkConnectionStatus(fieldId);

      if (response.success && response.data) {
        // Map ConnectionStatus to IoTConnection format if needed
        if (response.data.isConnected) {
          setConnection({
            deviceId: response.data.deviceId || '',
            connectedAt: response.data.connectedAt || '',
            lastSyncAt: response.data.lastSync,
          } as any);
        } else {
          setConnection(null);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error checking connection status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    connection,
    loading,
    error,
    connectDevice,
    disconnectDevice,
    checkConnectionStatus,
  };
};

export default useIoTConnection;

