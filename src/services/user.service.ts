/**
 * User Service
 * Handle user profile, avatar, password operations
 */
import api from './api';

export interface UserProfile {
  _id: string;
  id?: string;
  phone?: string;
  email?: string;
  displayName: string;
  avatar?: string;
  roles: string[];
  expertise?: string;
  provider?: 'phone' | 'email' | 'google' | 'facebook';
  isPhoneVerified: boolean;
  createdAt: string;
}

/**
 * Get current user profile
 */
export const getProfile = async (): Promise<UserProfile> => {
  const response = await api.get('/user/profile');
  return response.data.data.user;
};

/**
 * Update user profile
 */
export const updateProfile = async (data: {
  displayName?: string;
  phone?: string;
}): Promise<UserProfile> => {
  const response = await api.put('/user/profile', data);
  return response.data.data.user;
};

/**
 * Upload avatar
 */
export const uploadAvatar = async (fileUri: string): Promise<string> => {
  const formData = new FormData();
  
  // Extract filename from URI
  const filename = fileUri.split('/').pop() || 'avatar.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('avatar', {
    uri: fileUri,
    name: filename,
    type,
  } as any);

  const response = await api.post('/user/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data.avatar;
};

/**
 * Change password
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  await api.post('/user/change-password', {
    currentPassword,
    newPassword,
  });
};

/**
 * Get list of experts
 */
export interface Expert {
  id: string;
  displayName: string;
  avatar?: string;
  expertise?: string;
}

export const getExperts = async (): Promise<Expert[]> => {
  const response = await api.get('/user/experts');
  return response.data.data.experts;
};

