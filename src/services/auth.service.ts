/**
 * Authentication Service
 * Handles all auth-related API calls
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { apiDelete, apiPost, clearTokens, saveTokens } from './api';

/**
 * Storage Keys
 */
const KEYS = {
  REMEMBER_ME: 'rememberMe',
  SAVED_PHONE: 'savedPhone',
  SAVED_PASSWORD: 'savedPassword',
};

/**
 * Login Response
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone?: string;
    email?: string;
    name: string;
    avatar?: string;
    roles?: string[];
    expertise?: string;
    createdAt: string;
  };
}

/**
 * Verify Phone OTP Response
 */
export interface VerifyPhoneResponse {
  userExists: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    phone?: string;
    email?: string;
    name: string;
    avatar?: string;
    roles?: string[];
    expertise?: string;
  };
}

/**
 * Login with phone and password
 */
export const loginWithPassword = async (
  phone: string,
  password: string
): Promise<LoginResponse> => {
  console.log('📤 Sending login request:', {
    phone,
    passwordLength: password?.length,
  });

  const response = await apiPost<LoginResponse>('/auth/login', {
    phone,
    password,
  });

  console.log('📥 Login response:', {
    success: response.success,
    hasData: !!response.data,
    error: response.error?.message,
  });

  if (response.success && response.data) {
    // Save tokens
    await saveTokens(response.data.accessToken, response.data.refreshToken);
    console.log('✅ Login successful, tokens saved');
    return response.data;
  } else {
    console.log('❌ Login failed:', response.error?.message);
    throw new Error(response.error?.message || 'Login failed');
  }
};

/**
 * Send OTP to phone number
 */
export const sendOTP = async (phone: string): Promise<void> => {
  const response = await apiPost('/auth/send-otp', { phone });

  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to send OTP');
  }
};

/**
 * Verify Firebase OTP Token
 * Backend will verify the Firebase ID token and return JWT tokens if user exists
 */
export const verifyFirebaseOTP = async (
  phone: string,
  firebaseToken: string
): Promise<VerifyPhoneResponse> => {
  const response = await apiPost<VerifyPhoneResponse>('/auth/verify-otp', {
    firebaseToken,
  });

  if (response.success && response.data) {
    // If user exists, save tokens
    if (response.data.userExists && response.data.accessToken && response.data.refreshToken) {
      await saveTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response.data;
  } else {
    throw new Error(response.error?.message || 'OTP verification failed');
  }
};

/**
 * Google Sign-In Response
 */
export interface GoogleSignInResponse {
  userExists: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
}

/**
 * Sign in with Google
 * Backend will verify the Firebase token and return JWT tokens
 */
export const signInWithGoogle = async (
  firebaseToken: string
): Promise<GoogleSignInResponse> => {
  const response = await apiPost<GoogleSignInResponse>('/auth/google', {
    firebaseToken,
  });

  if (response.success && response.data) {
    // If user exists, save tokens
    if (response.data.userExists && response.data.accessToken && response.data.refreshToken) {
      await saveTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response.data;
  } else {
    throw new Error(response.error?.message || 'Google sign-in failed');
  }
};

/**
 * Complete registration after OTP verification
 */
export const completeRegistration = async (
  phone: string,
  name: string,
  password: string
): Promise<LoginResponse> => {
  const response = await apiPost<LoginResponse>('/auth/complete-registration', {
    phone,
    name,
    password,
  });

  if (response.success && response.data) {
    // Save tokens
    await saveTokens(response.data.accessToken, response.data.refreshToken);
    return response.data;
  } else {
    throw new Error(response.error?.message || 'Registration failed');
  }
};

/**
 * Check if phone number is registered
 */
export const checkPhoneExists = async (phone: string): Promise<boolean> => {
  const response = await apiPost<{ exists: boolean }>('/auth/check-phone', {
    phone,
  });

  if (response.success && response.data) {
    return response.data.exists;
  } else {
    throw new Error(response.error?.message || 'Failed to check phone');
  }
};

/**
 * Reset password after OTP verification
 */
export const resetPassword = async (
  phone: string,
  newPassword: string
): Promise<void> => {
  const response = await apiPost('/auth/reset-password', {
    phone,
    newPassword,
  });

  if (!response.success) {
    throw new Error(response.error?.message || 'Password reset failed');
  }
};

/**
 * Delete user account
 */
export const deleteAccount = async (): Promise<void> => {
  const response = await apiDelete('/auth/delete-account');

  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to delete account');
  }
  
  // Clear tokens and saved data
  await clearTokens();
  await AsyncStorage.removeItem(KEYS.SAVED_PASSWORD);
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  await clearTokens();
  // Clear remember me data if exists
  await AsyncStorage.removeItem(KEYS.SAVED_PASSWORD);
};

/**
 * Save login credentials for "Remember Me" feature
 */
export const saveLoginCredentials = async (
  phone: string,
  password: string
): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.REMEMBER_ME, 'true');
    await AsyncStorage.setItem(KEYS.SAVED_PHONE, phone);
    // Store password securely
    await SecureStore.setItemAsync(KEYS.SAVED_PASSWORD, password);
  } catch (error) {
    console.error('Failed to save login credentials:', error);
  }
};

/**
 * Get saved login credentials
 */
export const getSavedLoginCredentials = async (): Promise<{
  phone: string;
  password: string;
} | null> => {
  try {
    const rememberMe = await AsyncStorage.getItem(KEYS.REMEMBER_ME);
    
    if (rememberMe === 'true') {
      const phone = await AsyncStorage.getItem(KEYS.SAVED_PHONE);
      const password = await SecureStore.getItemAsync(KEYS.SAVED_PASSWORD);
      
      if (phone && password) {
        return { phone, password };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get saved credentials:', error);
    return null;
  }
};

/**
 * Clear saved login credentials
 */
export const clearSavedCredentials = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(KEYS.REMEMBER_ME);
    await AsyncStorage.removeItem(KEYS.SAVED_PHONE);
    await SecureStore.deleteItemAsync(KEYS.SAVED_PASSWORD);
  } catch (error) {
    console.error('Failed to clear saved credentials:', error);
  }
};

export default {
  loginWithPassword,
  sendOTP,
  verifyFirebaseOTP,
  completeRegistration,
  resetPassword,
  logout,
  saveLoginCredentials,
  getSavedLoginCredentials,
  clearSavedCredentials,
};

