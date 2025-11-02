/**
 * Biometric Authentication Hook
 * Manages fingerprint/face ID authentication
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

export interface BiometricCredentials {
  phone: string;
  password: string;
}

export const useBiometricAuth = () => {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricEnrolled, setIsBiometricEnrolled] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check if device supports biometric authentication
   */
  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);

      if (compatible) {
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricEnrolled(enrolled);
      }

      return compatible;
    } catch (error) {
      console.error('Error checking biometric support:', error);
      return false;
    }
  };

  /**
   * Check if biometric is enabled for this app
   */
  const checkBiometricEnabled = async () => {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      const isEnabled = enabled === 'true';
      setIsBiometricEnabled(isEnabled);
      return isEnabled;
    } catch (error) {
      console.error('Error checking biometric enabled status:', error);
      return false;
    }
  };

  /**
   * Get biometric type name (for display)
   */
  const getBiometricType = async (): Promise<string> => {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Fingerprint';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'Iris';
      }
      
      return 'Biometric';
    } catch (error) {
      return 'Biometric';
    }
  };

  /**
   * Authenticate with biometric
   */
  const authenticateBiometric = async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Xác thực để đăng nhập',
        cancelLabel: 'Hủy',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  };

  /**
   * Save credentials securely for biometric login
   */
  const saveBiometricCredentials = async (credentials: BiometricCredentials): Promise<boolean> => {
    try {
      await SecureStore.setItemAsync(
        BIOMETRIC_CREDENTIALS_KEY,
        JSON.stringify(credentials)
      );
      return true;
    } catch (error) {
      console.error('Error saving biometric credentials:', error);
      return false;
    }
  };

  /**
   * Get saved credentials (after biometric authentication)
   */
  const getBiometricCredentials = async (): Promise<BiometricCredentials | null> => {
    try {
      const credentials = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      if (credentials) {
        return JSON.parse(credentials);
      }
      return null;
    } catch (error) {
      console.error('Error getting biometric credentials:', error);
      return null;
    }
  };

  /**
   * Enable biometric authentication
   */
  const enableBiometric = async (credentials: BiometricCredentials): Promise<boolean> => {
    try {
      // Save credentials securely
      const saved = await saveBiometricCredentials(credentials);
      if (!saved) {
        return false;
      }

      // Mark as enabled
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      setIsBiometricEnabled(true);
      return true;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      return false;
    }
  };

  /**
   * Disable biometric authentication
   */
  const disableBiometric = async (): Promise<boolean> => {
    try {
      // Remove credentials
      await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      
      // Mark as disabled
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
      setIsBiometricEnabled(false);
      return true;
    } catch (error) {
      console.error('Error disabling biometric:', error);
      return false;
    }
  };

  /**
   * Biometric login flow
   */
  const biometricLogin = async (): Promise<BiometricCredentials | null> => {
    try {
      // Check if enabled
      if (!isBiometricEnabled) {
        return null;
      }

      // Authenticate
      const authenticated = await authenticateBiometric();
      if (!authenticated) {
        return null;
      }

      // Get credentials
      const credentials = await getBiometricCredentials();
      return credentials;
    } catch (error) {
      console.error('Biometric login error:', error);
      return null;
    }
  };

  /**
   * Initialize on mount
   */
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await checkBiometricSupport();
      await checkBiometricEnabled();
      setIsLoading(false);
    };

    init();
  }, []);

  return {
    // States
    isBiometricSupported,
    isBiometricEnrolled,
    isBiometricEnabled,
    isLoading,

    // Methods
    checkBiometricSupport,
    checkBiometricEnabled,
    getBiometricType,
    authenticateBiometric,
    enableBiometric,
    disableBiometric,
    biometricLogin,
    saveBiometricCredentials,
    getBiometricCredentials,
  };
};

