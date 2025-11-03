/**
 * CameraScreen - Advanced camera interface with GPS watermarking
 * Features: Full camera view, flash control, gallery picker, real-time location
 */
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import PermissionRequestModal from '../../components/ui/PermissionRequestModal';
import { useCameraFlow } from '../../hooks/useCameraFlow';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const {
    // Permissions
    hasCameraPermission,
    hasLocationPermission,
    requestPermissions,

    // Camera
    cameraRef,
    flashMode,
    toggleFlash,

    // Location
    currentLocation,
    isLoadingLocation,

    // Actions
    captureAndUpload,
    pickAndUpload,

    // Upload state
    isUploading,
    uploadProgress,
  } = useCameraFlow();

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);

  /**
   * Check permissions on mount
   */
  useEffect(() => {
    if (!hasCameraPermission || !hasLocationPermission) {
      setShowPermissionModal(true);
    }
  }, [hasCameraPermission, hasLocationPermission]);

  /**
   * Handle permission request
   */
  const handleRequestPermissions = async (): Promise<boolean> => {
    const granted = await requestPermissions();
    if (granted) {
      setShowPermissionModal(false);
    }
    return granted;
  };

  /**
   * Handle capture button press
   */
  const handleCapture = async () => {
    if (!currentLocation) {
      alert(t('camera.locationRequired', { defaultValue: 'Đang lấy vị trí GPS...' }));
      return;
    }

    if (isUploading) return;

    const result = await captureAndUpload();

    if (result) {
      // Navigate to result screen
      router.push({
        pathname: '/result',
        params: { photoId: result.photoId },
      } as any);
    }
  };

  /**
   * Handle gallery pick
   */
  const handleGalleryPick = async () => {
    if (!currentLocation) {
      alert(t('camera.locationRequired', { defaultValue: 'Đang lấy vị trí GPS...' }));
      return;
    }

    if (isUploading) return;

    const result = await pickAndUpload();

    if (result) {
      router.push({
        pathname: '/result',
        params: { photoId: result.photoId },
      } as any);
    }
  };

  /**
   * Handle close button
   */
  const handleClose = () => {
    router.back();
  };

  /**
   * Show permission modal if not granted
   */
  if (!hasCameraPermission || !hasLocationPermission) {
    return (
      <View style={styles.container}>
        <PermissionRequestModal
          visible={showPermissionModal}
          onRequestPermissions={handleRequestPermissions}
          onDismiss={() => {
            setShowPermissionModal(false);
            handleClose();
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={flashMode}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>

          {/* Flash Button */}
          <TouchableOpacity
            style={styles.flashButton}
            onPress={toggleFlash}
            activeOpacity={0.8}
          >
            <Ionicons
              name={flashMode === 'on' ? 'flash' : 'flash-off'}
              size={28}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {/* Camera Frame with Corner Borders */}
        <View style={styles.frameContainer}>
          {/* Instruction Text */}
          <Text style={styles.instructionText}>
            {t('camera.instruction', {
              defaultValue: 'Đặt cây của bạn vào giữa khung hình',
            })}
          </Text>

          {/* Frame with Corner Borders */}
          <View style={styles.frame}>
            {/* Top Left Corner */}
            <View style={[styles.corner, styles.topLeft]} />

            {/* Top Right Corner */}
            <View style={[styles.corner, styles.topRight]} />

            {/* Bottom Left Corner */}
            <View style={[styles.corner, styles.bottomLeft]} />

            {/* Bottom Right Corner */}
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          {/* GPS Coordinates Display */}
          {currentLocation ? (
            <View style={styles.gpsContainer}>
              <Ionicons name="location" size={16} color="#4CAF50" />
              <Text style={styles.gpsText}>
                {currentLocation.latitude.toFixed(6)}°N, {currentLocation.longitude.toFixed(6)}°E
              </Text>
            </View>
          ) : (
            <View style={styles.gpsContainer}>
              <ActivityIndicator size="small" color="#4CAF50" />
              <Text style={styles.gpsText}>
                {t('camera.loadingLocation', { defaultValue: 'Đang lấy vị trí...' })}
              </Text>
            </View>
          )}

          {/* GPS Loading Overlay Warning */}
          {!currentLocation && (
            <View style={styles.gpsWarningContainer}>
              <Ionicons name="location-outline" size={32} color="#FF9800" />
              <Text style={styles.gpsWarningTitle}>
                {t('camera.waitingGPS', { defaultValue: 'Đang lấy thông tin vị trí' })}
              </Text>
              <Text style={styles.gpsWarningText}>
                {t('camera.waitingGPSDesc', {
                  defaultValue: 'Vui lòng đợi để có tọa độ chính xác',
                })}
              </Text>
            </View>
          )}
        </View>
      </CameraView>

      {/* Bottom Control Bar */}
      <View style={styles.bottomBar}>
        {/* Gallery Button */}
        <TouchableOpacity
          style={[
            styles.galleryButton,
            (!currentLocation || isUploading) && styles.galleryButtonDisabled,
          ]}
          onPress={handleGalleryPick}
          disabled={isUploading || !currentLocation}
          activeOpacity={0.8}
        >
          <Ionicons
            name="images"
            size={28}
            color={!currentLocation || isUploading ? '#999' : '#fff'}
          />
        </TouchableOpacity>

        {/* Capture Button */}
        <TouchableOpacity
          style={[
            styles.captureButton,
            (isUploading || !currentLocation) && styles.captureButtonDisabled,
          ]}
          onPress={handleCapture}
          disabled={isUploading || !currentLocation}
          activeOpacity={0.8}
        >
          {isUploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.uploadProgressText}>{uploadProgress}%</Text>
            </View>
          ) : !currentLocation ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#999" />
            </View>
          ) : (
            <View style={styles.captureButtonInner} />
          )}
        </TouchableOpacity>

        {/* Tips Button */}
        <TouchableOpacity 
          style={styles.tipsButton}
          onPress={() => setShowTipsModal(true)}
          disabled={isUploading}
          activeOpacity={0.8}
        >
          <Ionicons name="help-circle" size={24} color="#fff" />
          <Text style={styles.tipsText}>
            {t('camera.tips', { defaultValue: 'Mẹo chụp' })}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tips Modal (Placeholder - will be updated later) */}
      {showTipsModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {t('camera.tipsTitle', { defaultValue: 'Mẹo chụp ảnh hiệu quả' })}
            </Text>
            <Text style={styles.modalText}>
              {t('camera.tipsContent', {
                defaultValue:
                  '• Chụp ảnh trong điều kiện ánh sáng tốt\n• Đặt lá lúa ở trung tâm khung hình\n• Tránh bóng mờ và phản chiếu\n• Chụp cận cảnh các vết bệnh nếu có',
              })}
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTipsModal(false)}
            >
              <Text style={styles.modalCloseText}>
                {t('common.close', { defaultValue: 'Đóng' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  frame: {
    width: width - 80,
    height: width - 80,
    borderRadius: 20,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#fff',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
  },
  gpsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 30,
    gap: 8,
  },
  gpsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  gpsWarningContainer: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 152, 0, 0.3)',
    maxWidth: '90%',
  },
  gpsWarningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  gpsWarningText: {
    fontSize: 13,
    color: '#FF9800',
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 30,
    paddingBottom: 40,
  },
  galleryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryButtonDisabled: {
    opacity: 0.4,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#4CAF50',
  },
  uploadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadProgressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 4,
  },
  tipsButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tipsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalCloseButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
