/**
 * Permissions Hook
 * Manages camera and location permissions
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

const PERMISSIONS_REQUESTED_KEY = 'permissions_requested';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface PermissionsState {
  camera: PermissionStatus;
  location: PermissionStatus;
  allGranted: boolean;
  hasRequestedBefore: boolean;
}

export const usePermissions = () => {
  const [permissionsState, setPermissionsState] = useState<PermissionsState>({
    camera: 'undetermined',
    location: 'undetermined',
    allGranted: false,
    hasRequestedBefore: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  /**
   * Check if permissions have been requested before
   */
  const checkHasRequestedBefore = async (): Promise<boolean> => {
    try {
      const requested = await AsyncStorage.getItem(PERMISSIONS_REQUESTED_KEY);
      return requested === 'true';
    } catch (error) {
      console.error('Failed to check permissions request status:', error);
      return false;
    }
  };

  /**
   * Mark permissions as requested
   */
  const markPermissionsAsRequested = async () => {
    try {
      await AsyncStorage.setItem(PERMISSIONS_REQUESTED_KEY, 'true');
    } catch (error) {
      console.error('Failed to mark permissions as requested:', error);
    }
  };

  /**
   * Check current permissions status
   */
  const checkPermissions = async () => {
    try {
      setIsLoading(true);

      // Check camera permission
      const { status: cameraStatus } = await Camera.getCameraPermissionsAsync();
      
      // Check location permission
      const { status: locationStatus } = await Location.getForegroundPermissionsAsync();

      const hasRequestedBefore = await checkHasRequestedBefore();

      const newState: PermissionsState = {
        camera: cameraStatus as PermissionStatus,
        location: locationStatus as PermissionStatus,
        allGranted: cameraStatus === 'granted' && locationStatus === 'granted',
        hasRequestedBefore,
      };

      setPermissionsState(newState);

      // Show modal if permissions not granted and not requested before
      if (!newState.allGranted && !hasRequestedBefore) {
        setShowPermissionModal(true);
      }

      return newState;
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return permissionsState;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Request camera permission
   */
  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const granted = status === 'granted';
      
      setPermissionsState(prev => ({
        ...prev,
        camera: status as PermissionStatus,
        allGranted: granted && prev.location === 'granted',
      }));

      return granted;
    } catch (error) {
      console.error('Failed to request camera permission:', error);
      return false;
    }
  };

  /**
   * Request location permission
   */
  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      
      setPermissionsState(prev => ({
        ...prev,
        location: status as PermissionStatus,
        allGranted: prev.camera === 'granted' && granted,
      }));

      return granted;
    } catch (error) {
      console.error('Failed to request location permission:', error);
      return false;
    }
  };

  /**
   * Request all permissions
   */
  const requestAllPermissions = async (): Promise<boolean> => {
    try {
      const cameraGranted = await requestCameraPermission();
      const locationGranted = await requestLocationPermission();
      
      await markPermissionsAsRequested();
      
      const allGranted = cameraGranted && locationGranted;
      
      if (allGranted) {
        setShowPermissionModal(false);
      }

      return allGranted;
    } catch (error) {
      console.error('Failed to request all permissions:', error);
      return false;
    }
  };

  /**
   * Dismiss permission modal (user chose to skip)
   */
  const dismissPermissionModal = async () => {
    await markPermissionsAsRequested();
    setShowPermissionModal(false);
  };

  /**
   * Check permissions on mount
   */
  useEffect(() => {
    checkPermissions();
  }, []);

  return {
    permissionsState,
    isLoading,
    showPermissionModal,
    checkPermissions,
    requestCameraPermission,
    requestLocationPermission,
    requestAllPermissions,
    dismissPermissionModal,
  };
};

