/**
 * Photo Service
 * Handles photo upload, retrieval, and management
 */
import { apiDelete, apiGet, apiPut, apiUpload } from './api';

export interface PhotoMetadata {
  lat: number;
  lng: number;
  timestamp: number;
  device: string;
  orientation: 'portrait' | 'landscape';
}

export interface PhotoPrediction {
  class: string;
  classVi: string;
  confidence: number;
  allPredictions?: Record<string, number>;
}

export interface Photo {
  _id: string;
  userId: string;
  originalUrl: string;
  watermarkedUrl: string;
  thumbnailUrl?: string;
  cloudinaryPublicId?: string;
  metadata: PhotoMetadata & { address?: string };
  prediction?: PhotoPrediction;
  status: 'processing' | 'completed' | 'failed';
  fileSize: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadPhotoResponse {
  photoId: string;
  originalUrl: string;
  watermarkedUrl: string;
  thumbnailUrl?: string;
  metadata: PhotoMetadata;
  prediction?: PhotoPrediction;
  status: string;
  createdAt: string;
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  thumbnail?: string;
  image: string;
  prediction?: PhotoPrediction;
  createdAt: string;
}

export interface PhotoStats {
  total: number;
  completed: number;
  processing: number;
  failed: number;
  diseases: {
    bacterial_leaf_blight: number;
    blast: number;
    brown_spot: number;
    healthy: number;
  };
}

/**
 * Upload photo with metadata
 * @param imageUri - Local image URI
 * @param metadata - GPS and device metadata
 * @param onProgress - Progress callback
 */
export const uploadPhoto = async (
  imageUri: string,
  metadata: PhotoMetadata,
  onProgress?: (progress: number) => void
): Promise<UploadPhotoResponse> => {
  const formData = new FormData();

  // Create file object from URI
  const filename = imageUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('photo', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  // Add metadata as JSON string
  formData.append('metadata', JSON.stringify(metadata));

  const response = await apiUpload<UploadPhotoResponse>(
    '/photos/upload',
    formData,
    (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = (progressEvent.loaded / progressEvent.total) * 100;
        onProgress(Math.round(progress));
      }
    }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Photo upload failed');
  }

  return response.data;
};

/**
 * Get user photos list
 * @param page - Page number
 * @param limit - Items per page
 * @param status - Filter by status
 */
export const getPhotos = async (
  page: number = 1,
  limit: number = 20,
  status?: 'processing' | 'completed' | 'failed'
): Promise<{ photos: Photo[]; pagination: any }> => {
  let url = `/photos?page=${page}&limit=${limit}`;
  if (status) {
    url += `&status=${status}`;
  }

  const response = await apiGet<{ photos: Photo[]; pagination: any }>(url);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to fetch photos');
  }

  return response.data;
};

/**
 * Get single photo by ID
 * @param photoId - Photo ID
 */
export const getPhotoById = async (photoId: string): Promise<Photo> => {
  const response = await apiGet<{ photo: Photo }>(`/photos/${photoId}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Photo not found');
  }

  return response.data.photo;
};

/**
 * Get photos for map view
 */
export const getPhotosForMap = async (): Promise<MapMarker[]> => {
  const response = await apiGet<{ markers: MapMarker[]; total: number }>(
    '/photos/map'
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to fetch map photos');
  }

  return response.data.markers;
};

/**
 * Get photo statistics
 */
export const getPhotoStats = async (): Promise<PhotoStats> => {
  const response = await apiGet<PhotoStats>('/photos/stats');

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to fetch stats');
  }

  return response.data;
};

/**
 * Delete photo
 * @param photoId - Photo ID
 */
export const deletePhoto = async (photoId: string): Promise<void> => {
  const response = await apiDelete(`/photos/${photoId}`);

  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to delete photo');
  }
};

/**
 * Get user's recent photos (for home screen)
 * @param limit - Number of photos to fetch
 */
export const getRecentPhotos = async (limit: number = 6): Promise<Photo[]> => {
  const response = await apiGet<{ photos: Photo[] }>(
    `/photos?page=1&limit=${limit}&sort=-createdAt`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to fetch recent photos');
  }

  return response.data.photos;
};

/**
 * Get photos grouped by date
 * @param page - Page number
 * @param limit - Items per page
 * @param filter - Filter options (date range, disease class)
 */
export const getPhotosByDate = async (
  page: number = 1,
  limit: number = 50,
  filter?: {
    dateFrom?: string;
    dateTo?: string;
    diseaseClass?: string;
  }
): Promise<{ photos: Photo[]; pagination: any }> => {
  let url = `/photos?page=${page}&limit=${limit}&sort=-createdAt`;
  
  if (filter?.dateFrom) {
    url += `&dateFrom=${filter.dateFrom}`;
  }
  if (filter?.dateTo) {
    url += `&dateTo=${filter.dateTo}`;
  }
  if (filter?.diseaseClass) {
    url += `&diseaseClass=${filter.diseaseClass}`;
  }

  const response = await apiGet<{ photos: Photo[]; pagination: any }>(url);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to fetch photos');
  }

  return response.data;
};

/**
 * Group photos by date (client-side grouping)
 * @param photos - Array of photos
 */
export const groupPhotosByDate = (photos: Photo[]): { date: string; photos: Photo[] }[] => {
  const grouped: { [key: string]: Photo[] } = {};

  photos.forEach((photo) => {
    const date = new Date(photo.createdAt).toLocaleDateString('vi-VN');
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(photo);
  });

  return Object.entries(grouped)
    .map(([date, photos]) => ({ date, photos }))
    .sort((a, b) => new Date(b.photos[0].createdAt).getTime() - new Date(a.photos[0].createdAt).getTime());
};

/**
 * Update treatment data for a photo
 */
export const updatePhotoTreatment = async (
  photoId: string,
  treatmentData: any
): Promise<any> => {
  return apiPut(`/photos/${photoId}/treatment`, { treatmentData });
};

