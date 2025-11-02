/**
 * useCameraFlow Hook
 * Manages camera permissions, location, capture, and photo upload
 */
import { CameraView } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { PhotoMetadata, uploadPhoto, UploadPhotoResponse } from '../services/photo.service';

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface CameraFlowState {
  // Permissions
  hasCameraPermission: boolean;
  hasLocationPermission: boolean;
  hasMediaLibraryPermission: boolean;
  isRequestingPermissions: boolean;

  // Location
  currentLocation: LocationData | null;
  isLoadingLocation: boolean;

  // Camera
  cameraRef: React.RefObject<CameraView>;
  flashMode: 'on' | 'off';

  // Upload
  isUploading: boolean;
  uploadProgress: number;
  uploadedPhoto: UploadPhotoResponse | null;
  uploadError: string | null;
}

export const useCameraFlow = () => {
  const cameraRef = useRef<CameraView>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState(false);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const [flashMode, setFlashMode] = useState<'on' | 'off'>('off');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedPhoto, setUploadedPhoto] = useState<UploadPhotoResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  /**
   * Check all permissions on mount
   */
  useEffect(() => {
    checkPermissions();
  }, []);

  /**
   * Get location when permissions are granted
   */
  useEffect(() => {
    if (hasLocationPermission && !currentLocation && !isLoadingLocation) {
      getCurrentLocation();
    }
  }, [hasLocationPermission]);

  /**
   * Check existing permissions
   */
  const checkPermissions = async () => {
    try {
      const [cameraStatus, locationStatus, mediaLibraryStatus] = await Promise.all([
        ImagePicker.getCameraPermissionsAsync(),
        Location.getForegroundPermissionsAsync(),
        MediaLibrary.getPermissionsAsync(),
      ]);

      setHasCameraPermission(cameraStatus.granted);
      setHasLocationPermission(locationStatus.granted);
      setHasMediaLibraryPermission(mediaLibraryStatus.granted);
    } catch (error) {
      console.error('Check permissions error:', error);
    }
  };

  /**
   * Request all necessary permissions
   */
  const requestPermissions = async (): Promise<boolean> => {
    try {
      setIsRequestingPermissions(true);

      const [cameraResult, locationResult] = await Promise.all([
        ImagePicker.requestCameraPermissionsAsync(),
        Location.requestForegroundPermissionsAsync(),
      ]);

      const cameraGranted = cameraResult.granted;
      const locationGranted = locationResult.granted;

      setHasCameraPermission(cameraGranted);
      setHasLocationPermission(locationGranted);

      // If location is granted, get current location immediately
      if (locationGranted) {
        await getCurrentLocation();
      }

      return cameraGranted && locationGranted;
    } catch (error) {
      console.error('Request permissions error:', error);
      return false;
    } finally {
      setIsRequestingPermissions(false);
    }
  };

  /**
   * Request media library permission (for saving photos)
   */
  const requestMediaLibraryPermission = async (): Promise<boolean> => {
    try {
      const result = await MediaLibrary.requestPermissionsAsync();
      setHasMediaLibraryPermission(result.granted);
      return result.granted;
    } catch (error) {
      console.error('Request media library permission error:', error);
      return false;
    }
  };

  /**
   * Get current GPS location
   */
  const getCurrentLocation = async (): Promise<LocationData | null> => {
    try {
      setIsLoadingLocation(true);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: location.coords.accuracy || undefined,
      };

      setCurrentLocation(locationData);
      return locationData;
    } catch (error) {
      console.error('Get location error:', error);
      return null;
    } finally {
      setIsLoadingLocation(false);
    }
  };

  /**
   * Toggle flash mode
   */
  const toggleFlash = () => {
    setFlashMode((prev) => (prev === 'off' ? 'on' : 'off'));
  };

  /**
   * Resize image to optimize upload
   */
  const resizeImage = async (uri: string): Promise<string> => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1280 } }], // Max width 1280px, maintain aspect ratio
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      return manipResult.uri;
    } catch (error) {
      console.error('Resize image error:', error);
      return uri; // Return original if resize fails
    }
  };

  /**
   * Capture photo from camera
   */
  const capturePhoto = async (): Promise<string | null> => {
    try {
      if (!cameraRef.current) {
        throw new Error('Camera ref not available');
      }

      if (!currentLocation) {
        throw new Error('Location not available. Please wait...');
      }

      // Take picture
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (!photo || !photo.uri) {
        throw new Error('Failed to capture photo');
      }

      // Resize image
      const resizedUri = await resizeImage(photo.uri);

      return resizedUri;
    } catch (error: any) {
      console.error('Capture photo error:', error);
      setUploadError(error.message || 'Failed to capture photo');
      return null;
    }
  };

  /**
   * Pick image from gallery
   */
  const pickImageFromGallery = async (): Promise<string | null> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      // Resize image
      const resizedUri = await resizeImage(result.assets[0].uri);

      return resizedUri;
    } catch (error: any) {
      console.error('Pick image error:', error);
      setUploadError(error.message || 'Failed to pick image');
      return null;
    }
  };

  /**
   * Upload photo to server
   */
  const uploadPhotoToServer = async (imageUri: string): Promise<UploadPhotoResponse | null> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      setUploadedPhoto(null);

      // Ensure we have current location
      let location = currentLocation;
      if (!location) {
        location = await getCurrentLocation();
      }

      if (!location) {
        throw new Error('Location not available. Please enable location services.');
      }

      // Prepare metadata
      const metadata: PhotoMetadata = {
        lat: location.latitude,
        lng: location.longitude,
        timestamp: Date.now(),
        device: `${Platform.OS} ${Platform.Version}`,
        orientation: 'portrait', // TODO: Detect actual orientation
      };

      // Upload photo
      const result = await uploadPhoto(imageUri, metadata, (progress) => {
        setUploadProgress(progress);
      });

      setUploadedPhoto(result);
      return result;
    } catch (error: any) {
      console.error('Upload photo error:', error);
      setUploadError(error.message || 'Failed to upload photo');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Complete flow: capture and upload
   */
  const captureAndUpload = async (): Promise<UploadPhotoResponse | null> => {
    const photoUri = await capturePhoto();
    if (!photoUri) {
      return null;
    }

    return await uploadPhotoToServer(photoUri);
  };

  /**
   * Complete flow: pick from gallery and upload
   */
  const pickAndUpload = async (): Promise<UploadPhotoResponse | null> => {
    const photoUri = await pickImageFromGallery();
    if (!photoUri) {
      return null;
    }

    return await uploadPhotoToServer(photoUri);
  };

  /**
   * Reset upload state
   */
  const resetUpload = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadedPhoto(null);
    setUploadError(null);
  };

  return {
    // Permissions
    hasCameraPermission,
    hasLocationPermission,
    hasMediaLibraryPermission,
    isRequestingPermissions,
    requestPermissions,
    requestMediaLibraryPermission,
    checkPermissions,

    // Location
    currentLocation,
    isLoadingLocation,
    getCurrentLocation,

    // Camera
    cameraRef,
    flashMode,
    toggleFlash,

    // Capture & Upload
    capturePhoto,
    pickImageFromGallery,
    uploadPhotoToServer,
    captureAndUpload,
    pickAndUpload,

    // Upload state
    isUploading,
    uploadProgress,
    uploadedPhoto,
    uploadError,
    resetUpload,
  };
};

