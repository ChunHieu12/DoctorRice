/**
 * useIoTImages Hook
 * Fetches and manages IoT images from Firebase via backend
 */

import * as firebaseIoTService from '@/services/firebase-iot.service';
import type { IoTImage } from '@/types';
import { useCallback, useEffect, useState } from 'react';

export interface UseIoTImagesParams {
  fieldId: string | null;
  limit?: number;
  autoFetch?: boolean;
}

export interface UseIoTImagesReturn {
  images: IoTImage[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  fetchImages: () => Promise<void>;
  refresh: () => Promise<void>;
  filterByTimeRange: (startTime: number, endTime: number) => Promise<void>;
}

export const useIoTImages = ({
  fieldId,
  limit = 20,
  autoFetch = true,
}: UseIoTImagesParams): UseIoTImagesReturn => {
  const [images, setImages] = useState<IoTImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch IoT images
   */
  const fetchImages = useCallback(
    async (startTime?: number, endTime?: number) => {
      if (!fieldId) {
        setError('No field selected');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('📡 Fetching IoT images...', { fieldId, limit });
        
        const response = await firebaseIoTService.getIoTImages({
          fieldId,
          limit,
          ...(startTime && { startTime }),
          ...(endTime && { endTime }),
        });

        console.log('📥 IoT API Response:', {
          success: response.success,
          dataLength: response.data?.length,
          hasError: !!response.error,
          errorMessage: response.error?.message,
        });

        if (response.success && response.data) {
          console.log('✅ Setting images:', response.data.length, 'images');
          console.log('📍 First image sample:', response.data[0]);
          
          // Transform backend sensor data to frontend format
          const transformedImages = response.data.map((image) => ({
            ...image,
            sensors: {
              temperature: (image.sensors as any)?.temp ?? image.sensors?.temperature ?? 0,
              humidity: image.sensors?.humidity ?? 0,
              ph: image.sensors?.ph ?? 0,
              soilMoisture: (image.sensors as any)?.soil ?? image.sensors?.soilMoisture ?? 0,
              lux: image.sensors?.lux ?? 0,
              windSpeed: (image.sensors as any)?.wind ?? image.sensors?.windSpeed ?? 0,
            },
          }));
          
          console.log('🔄 Transformed first image sensors:', transformedImages[0]?.sensors);
          setImages(transformedImages);
        } else {
          console.error('❌ API Error:', response.error);
          throw new Error(response.error?.message || 'Failed to fetch images');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error fetching IoT images:', err);
      } finally {
        setLoading(false);
      }
    },
    [fieldId, limit]
  );

  /**
   * Refresh images (for pull-to-refresh)
   */
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchImages();
    setRefreshing(false);
  }, [fetchImages]);

  /**
   * Filter images by time range
   */
  const filterByTimeRange = useCallback(
    async (startTime: number, endTime: number) => {
      await fetchImages(startTime, endTime);
    },
    [fetchImages]
  );

  /**
   * Auto-fetch on mount or when fieldId changes
   */
  useEffect(() => {
    if (autoFetch && fieldId) {
      fetchImages();
    }
  }, [fieldId, autoFetch, fetchImages]);

  return {
    images,
    loading,
    refreshing,
    error,
    fetchImages,
    refresh,
    filterByTimeRange,
  };
};

export default useIoTImages;

