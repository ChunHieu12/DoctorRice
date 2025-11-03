/**
 * Camera Modal - Full screen camera interface
 * Accessed via tab bar camera button
 */
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CameraModal() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [flashMode, setFlashMode] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Get location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }
    })();
  }, []);

  // Request camera permission if needed
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const handleClose = () => {
    router.back();
  };

  // Upload image to backend
  const uploadImage = async (imageUri: string) => {
    try {
      if (!location) {
        Alert.alert('Lỗi', 'Không lấy được vị trí GPS');
        return;
      }

      setLoadingMessage('Đang tối ưu ảnh...');
      
      // Resize image to max width 1280px
      const resizedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1280 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      setLoadingMessage('Đang upload...');

      // Get auth token
      const { getAccessToken } = await import('../src/services/api');
      const token = await getAccessToken();

      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
        router.replace('/auth/login' as any);
        return;
      }

      // Create form data
      const formData = new FormData();
      const filename = resizedImage.uri.split('/').pop() || 'photo.jpg';
      
      formData.append('photo', {
        uri: resizedImage.uri,
        type: 'image/jpeg',
        name: filename,
      } as any);
      
      formData.append('latitude', location.coords.latitude.toString());
      formData.append('longitude', location.coords.longitude.toString());
      formData.append('device', 'Android'); // or detect device

      // Upload to backend
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.114:5001';
      console.log('📤 Uploading to:', `${API_URL}/api/photos/upload`);
      console.log('📍 GPS:', location.coords.latitude, location.coords.longitude);
      
      const response = await fetch(`${API_URL}/api/photos/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        const errorMsg = data.error?.message || data.message || 'Upload failed';
        console.error('❌ Upload failed:', response.status, errorMsg);
        throw new Error(errorMsg);
      }

      console.log('✅ Upload success! Photo ID:', data.data?.photo?._id);

      // Navigate to result screen
      if (data.data?.photo?._id) {
        router.push({
          pathname: '/result',
          params: { photoId: data.data.photo._id },
        } as any);
      } else {
        throw new Error('No photo ID in response');
      }

    } catch (error: any) {
      console.error('❌ Upload error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      Alert.alert(
        'Lỗi upload', 
        error.message || 'Không thể upload ảnh. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Capture photo
  const handleCapture = async () => {
    try {
      if (!cameraRef.current) {
        Alert.alert('Lỗi', 'Camera chưa sẵn sàng');
        return;
      }

      if (!location) {
        Alert.alert('Lỗi', 'Đang lấy vị trí GPS, vui lòng đợi...');
        return;
      }

      setIsLoading(true);
      setLoadingMessage('Đang chụp ảnh...');

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      console.log('📸 Photo captured:', photo.uri);
      await uploadImage(photo.uri);

    } catch (error: any) {
      console.error('❌ Capture error:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Pick image from gallery
  const handlePickImage = async () => {
    try {
      // Request media library permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Cần quyền truy cập',
          'Vui lòng cấp quyền truy cập thư viện ảnh để chọn ảnh'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Updated from deprecated MediaTypeOptions
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsLoading(true);
        setLoadingMessage('Đang xử lý ảnh...');
        await uploadImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('❌ Pick image error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          {t('camera.permissionRequired', { defaultValue: 'Cần quyền truy cập camera' })}
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>
            {t('camera.grantPermission', { defaultValue: 'Cấp quyền' })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={flashMode ? 'on' : 'off'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.flashButton}
            onPress={() => setFlashMode(!flashMode)}
          >
            <Ionicons
              name={flashMode ? 'flash' : 'flash-off'}
              size={28}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {/* Camera frame with corners */}
        <View style={styles.frameContainer}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
          <Text style={styles.instructionText}>
            {t('camera.instruction', {
              defaultValue: 'Đặt cây của bạn vào giữa khung hình',
            })}
          </Text>
        </View>

        {/* Location display */}
        {location && (
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>
              📍 {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        {/* Bottom controls */}
        <View style={[styles.bottomControls, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity 
            style={styles.galleryButton}
            onPress={handlePickImage}
            disabled={isLoading}
          >
            <Ionicons name="images" size={32} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.captureButton}
            onPress={handleCapture}
            disabled={isLoading || !location}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.tipsButton}
            onPress={() => Alert.alert('Mẹo chụp', 'Đặt lá lúa vào giữa khung hình\nĐảm bảo ánh sáng đủ\nGiữ máy thật vững')}
            disabled={isLoading}
          >
            <Ionicons name="bulb" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </CameraView>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>
            {loadingMessage || t('camera.processing', { defaultValue: 'Đang xử lý...' })}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
  },
  flashButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
  },
  frameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 30,
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 100,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#fff',
    borderTopLeftRadius: 20,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 100,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#fff',
    borderTopRightRadius: 20,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#fff',
    borderBottomLeftRadius: 20,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 100,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#fff',
    borderBottomRightRadius: 20,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 200,
  },
  locationContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    backgroundColor: '#4CAF50',
    // paddingBottom is set dynamically using useSafeAreaInsets
  },
  galleryButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  tipsButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
});

