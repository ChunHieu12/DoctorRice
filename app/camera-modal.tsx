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
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://doctorrice.onrender.com/api';
      console.log('📤 Uploading to:', `${API_URL}/photos/upload`);
      console.log('📍 GPS:', location.coords.latitude, location.coords.longitude);
      console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      
      // Wake up backend if sleeping (Render free tier cold start fix)
      setLoadingMessage('Đang kết nối server...');
      const wakeStartTime = Date.now();
      
      try {
        // Parallel wake-up calls to both backend and AI service
        const baseUrl = API_URL.replace('/api', '');
        await Promise.all([
          fetch(`${API_URL}/health`, { 
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          }).catch(e => console.warn('Backend health check failed:', e)),
          
          fetch('https://doctorrice-ai-service.onrender.com/health', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          }).catch(e => console.warn('AI service health check failed:', e)),
        ]);
        
        const wakeTime = Date.now() - wakeStartTime;
        console.log(`⏱️ Services warmed up in ${wakeTime}ms`);
      } catch (wakeError) {
        console.warn('⚠️ Wake-up failed (continuing anyway):', wakeError);
      }
      
      setLoadingMessage('Đang upload...');
      
      // Create abort controller for timeout (3 minutes for cold start + AI processing)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 180s = 3 minutes
      
      try {
        const uploadStartTime = Date.now();
        
        const response = await fetch(`${API_URL}/photos/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: formData,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const uploadDuration = Date.now() - uploadStartTime;
        console.log(`⏱️ Upload completed in ${(uploadDuration / 1000).toFixed(1)}s`);
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));

        if (!response.ok) {
          const errorMsg = data.error?.message || data.message || 'Upload failed';
          console.error('❌ Upload failed:', response.status, errorMsg);
          throw new Error(`${response.status}: ${errorMsg}`);
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
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        throw fetchError;
      }

    } catch (error: any) {
      console.error('❌ Upload error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      
      // More specific error messages
      let errorMessage = 'Không thể upload ảnh. Vui lòng thử lại.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Upload timeout. Vui lòng kiểm tra kết nối mạng.';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Lỗi upload', errorMessage);
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
        aspect: [6, 9],
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
        {location ? (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#4CAF50" />
            <Text style={styles.locationText}>
              {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
            </Text>
          </View>
        ) : (
          <View style={styles.locationLoadingContainer}>
            <ActivityIndicator size="small" color="#FF9800" />
            <Text style={styles.locationLoadingText}>
              Đang lấy vị trí GPS...
            </Text>
          </View>
        )}

        {/* GPS Warning Overlay */}
        {!location && (
          <View style={styles.gpsWarningOverlay}>
            <Ionicons name="location-outline" size={48} color="#FF9800" />
            <Text style={styles.gpsWarningTitle}>Đang lấy thông tin vị trí</Text>
            <Text style={styles.gpsWarningText}>
              Vui lòng đợi để có tọa độ GPS chính xác
            </Text>
            <ActivityIndicator size="large" color="#FF9800" style={{ marginTop: 16 }} />
          </View>
        )}

        {/* Bottom controls */}
        <View style={[styles.bottomControls, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity 
            style={[
              styles.galleryButton,
              (isLoading || !location) && styles.buttonDisabled,
            ]}
            onPress={handlePickImage}
            disabled={isLoading || !location}
          >
            <Ionicons
              name="images"
              size={32}
              color={isLoading || !location ? '#999' : '#fff'}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.captureButton,
              (isLoading || !location) && styles.captureButtonDisabled,
            ]}
            onPress={handleCapture}
            disabled={isLoading || !location}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color="#4CAF50" />
            ) : !location ? (
              <ActivityIndicator size="large" color="#999" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.tipsButton,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={() => Alert.alert('Mẹo chụp', 'Đặt lá lúa vào giữa khung hình\nĐảm bảo ánh sáng đủ\nGiữ máy thật vững')}
            disabled={isLoading}
          >
            <Ionicons name="bulb" size={32} color={isLoading ? '#999' : '#fff'} />
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
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  locationLoadingContainer: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  locationLoadingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  gpsWarningOverlay: {
    position: 'absolute',
    top: '40%',
    left: 40,
    right: 40,
    backgroundColor: 'rgba(255, 152, 0, 0.95)',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF9800',
  },
  gpsWarningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  gpsWarningText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
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
  captureButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#E0E0E0',
  },
  buttonDisabled: {
    opacity: 0.4,
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

