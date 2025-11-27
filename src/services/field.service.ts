/**
 * Field Management Service
 * Handles CRUD operations for rice field management
 */

import type { ApiResponse, CreateFieldData, Field } from '@/types';
import { apiDelete, apiGet, apiPost, apiPut } from './api';

/**
 * Get all fields for current user
 */
export const getFields = async (): Promise<ApiResponse<Field[]>> => {
  return apiGet<Field[]>('/fields/list');
};

/**
 * Get a single field by ID
 */
export const getFieldById = async (fieldId: string): Promise<ApiResponse<Field>> => {
  return apiGet<Field>(`/fields/${fieldId}`);
};

/**
 * Create a new field
 */
export const createField = async (data: CreateFieldData): Promise<ApiResponse<Field>> => {
  return apiPost<Field>('/fields/create', data);
};

/**
 * Update an existing field
 */
export const updateField = async (
  fieldId: string,
  data: Partial<CreateFieldData>
): Promise<ApiResponse<Field>> => {
  return apiPut<Field>(`/fields/${fieldId}`, data);
};

/**
 * Delete a field (soft delete)
 */
export const deleteField = async (fieldId: string): Promise<ApiResponse<{ message: string }>> => {
  return apiDelete<{ message: string }>(`/fields/${fieldId}`);
};

/**
 * Get IoT connection code for a field
 */
export const getFieldIoTCode = async (fieldId: string): Promise<ApiResponse<{ code: string; createdAt: string; expiresAt: string }>> => {
  return apiGet<{ code: string; createdAt: string; expiresAt: string }>(`/fields/${fieldId}/iot-code`);
};

/**
 * Calculate field area based on radius
 * Area = π × r²
 */
export const calculateFieldArea = (radius: number): number => {
  return Math.PI * Math.pow(radius, 2);
};

/**
 * Format field area for display (convert m² to hectare if large)
 */
export const formatFieldArea = (areaM2: number): string => {
  if (areaM2 >= 10000) {
    const hectares = areaM2 / 10000;
    return `${hectares.toFixed(2)} ha`;
  }
  return `${areaM2.toFixed(0)} m²`;
};

export default {
  getFields,
  getFieldById,
  createField,
  updateField,
  deleteField,
  getFieldIoTCode,
  calculateFieldArea,
  formatFieldArea,
};

