/**
 * useFieldManagement Hook
 * Manages rice field CRUD operations and state
 */

import * as fieldService from '@/services/field.service';
import type { CreateFieldData, Field } from '@/types';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export interface UseFieldManagementReturn {
  fields: Field[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  selectedField: Field | null;
  hasAnyIoTField: boolean; // NEW: Check if user has any IoT-connected field
  fetchFields: () => Promise<void>;
  createField: (data: CreateFieldData) => Promise<Field | null>;
  updateField: (fieldId: string, data: Partial<CreateFieldData>) => Promise<Field | null>;
  deleteField: (fieldId: string) => Promise<boolean>;
  selectField: (field: Field | null) => void;
  refresh: () => Promise<void>;
  getNearestIoTField: (currentLat: number, currentLng: number) => Field | null; // NEW: Find nearest IoT field
}

export const useFieldManagement = (): UseFieldManagementReturn => {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<Field | null>(null);

  /**
   * Fetch all fields
   */
  const fetchFields = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fieldService.getFields();

      if (response.success && response.data) {
        setFields(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch fields');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching fields:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new field
   */
  const createField = useCallback(
    async (data: CreateFieldData): Promise<Field | null> => {
      try {
        setLoading(true);
        setError(null);

        // Auto-calculate area if not provided
        const fieldData = {
          ...data,
          metadata: {
            ...data.metadata,
            area: data.metadata?.area || fieldService.calculateFieldArea(data.radius),
          },
        };

        const response = await fieldService.createField(fieldData);

        if (response.success && response.data) {
          // Add new field to list - ensure prev is array
          setFields((prev) => {
            const currentFields = Array.isArray(prev) ? prev : [];
            return [...currentFields, response.data!];
          });
          return response.data;
        } else {
          throw new Error(response.error?.message || 'Failed to create field');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        Alert.alert('Lỗi', `Không thể tạo ruộng: ${errorMessage}`);
        console.error('Error creating field:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Update an existing field
   */
  const updateField = useCallback(
    async (fieldId: string, data: Partial<CreateFieldData>): Promise<Field | null> => {
      try {
        setLoading(true);
        setError(null);

        // Recalculate area if radius changed
        const fieldData = {
          ...data,
          ...(data.radius && {
            metadata: {
              ...data.metadata,
              area: fieldService.calculateFieldArea(data.radius),
            },
          }),
        };

        const response = await fieldService.updateField(fieldId, fieldData);

        if (response.success && response.data) {
          // Update field in list - ensure prev is array
          setFields((prev) => {
            const currentFields = Array.isArray(prev) ? prev : [];
            return currentFields.map((field) => (field._id === fieldId ? response.data! : field));
          });

          // Update selected field if it's the same
          if (selectedField?._id === fieldId) {
            setSelectedField(response.data);
          }

          return response.data;
        } else {
          throw new Error(response.error?.message || 'Failed to update field');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        Alert.alert('Lỗi', `Không thể cập nhật ruộng: ${errorMessage}`);
        console.error('Error updating field:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [selectedField]
  );

  /**
   * Delete a field (soft delete)
   */
  const deleteField = useCallback(
    async (fieldId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fieldService.deleteField(fieldId);

        if (response.success) {
          // Remove field from list - ensure prev is array
          setFields((prev) => {
            const currentFields = Array.isArray(prev) ? prev : [];
            return currentFields.filter((field) => field._id !== fieldId);
          });

          // Clear selection if deleted
          if (selectedField?._id === fieldId) {
            setSelectedField(null);
          }

          return true;
        } else {
          throw new Error(response.error?.message || 'Failed to delete field');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        Alert.alert('Lỗi', `Không thể xóa ruộng: ${errorMessage}`);
        console.error('Error deleting field:', err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [selectedField]
  );

  /**
   * Select a field
   */
  const selectField = useCallback((field: Field | null) => {
    setSelectedField(field);
  }, []);

  /**
   * Refresh fields (for pull-to-refresh)
   */
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFields();
    setRefreshing(false);
  }, [fetchFields]);

  /**
   * Check if user has any IoT-connected field
   */
  const hasAnyIoTField = fields.some(
    (field) => field.hasIoTConnection || (field.iotConnection && field.iotConnection.deviceId)
  );

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   */
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  /**
   * Get nearest IoT field based on current GPS location
   */
  const getNearestIoTField = useCallback(
    (currentLat: number, currentLng: number): Field | null => {
      const iotFields = fields.filter(
        (field) => field.hasIoTConnection || (field.iotConnection && field.iotConnection.deviceId)
      );

      if (iotFields.length === 0) {
        return null;
      }

      // Find field with minimum distance
      let nearestField: Field | null = null;
      let minDistance = Infinity;

      iotFields.forEach((field) => {
        if (field.gpsCenter) {
          const distance = calculateDistance(
            currentLat,
            currentLng,
            field.gpsCenter.lat,
            field.gpsCenter.lng
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearestField = field;
          }
        }
      });

      return nearestField;
    },
    [fields]
  );

  /**
   * Auto-fetch on mount
   */
  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  return {
    fields,
    loading,
    refreshing,
    error,
    selectedField,
    hasAnyIoTField,
    fetchFields,
    createField,
    updateField,
    deleteField,
    selectField,
    refresh,
    getNearestIoTField,
  };
};

export default useFieldManagement;

