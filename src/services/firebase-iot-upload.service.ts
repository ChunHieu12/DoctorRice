/**
 * Firebase IoT Upload Service
 * Upload photos from mobile app to Firebase IoT via BACKEND API
 * (More secure - no direct Firebase access from mobile)
 */

import type { Field } from '@/types';
import { apiPost } from './api';

export interface UploadToIoTParams {
  imageUri: string;
  field: Field;
  gps: {
    lat: number;
    lng: number;
  };
  userId: string;
}

export interface IoTUploadResult {
  success: boolean;
  captureId?: string;
  imageUrl?: string;
  error?: string;
}

/**
 * Main upload function
 * Upload photo from mobile to Firebase IoT via Backend API
 * Backend will handle Firebase Storage + Realtime Database writes
 */
export const uploadPhotoToIoT = async (params: UploadToIoTParams): Promise<IoTUploadResult> => {
  const { imageUri, field, gps } = params;

  try {
    console.log('📤 Starting upload to Firebase IoT via backend:', {
      field: field.name,
      gps,
    });

    // Create form data
    const formData = new FormData();
    
    // Add image file
    const fileName = `iot_capture_${Date.now()}.jpg`;
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: fileName,
    } as any);
    
    // Add metadata
    formData.append('fieldId', field._id);
    formData.append('gps', JSON.stringify(gps));
    formData.append('source', 'mobile-app');

    console.log('📝 Uploading to backend /iot/upload...');

    // Upload via backend API
    const response = await apiPost<{
      captureId: string;
      imageUrl: string;
      message: string;
    }>('/iot/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Upload failed');
    }

    console.log('✅ Upload successful:', response.data);

    return {
      success: true,
      captureId: response.data.captureId,
      imageUrl: response.data.imageUrl,
    };
  } catch (error) {
    console.error('❌ Error uploading to Firebase IoT:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Update capture with AI analysis result
 * (Currently handled by backend automatically - this is a placeholder)
 */
export const updateCaptureWithAnalysis = async (
  captureId: string,
  dateKey: string,
  analysis: {
    disease: string;
    confidence: number;
    treatment?: string;
    detectedClasses?: any[];
  }
): Promise<boolean> => {
  // Backend handles analysis automatically after upload
  // This function is kept for future manual analysis trigger if needed
  console.log(`ℹ️ Analysis will be handled by backend for ${captureId}`);
  return true;
};

export default {
  uploadPhotoToIoT,
  updateCaptureWithAnalysis,
};

