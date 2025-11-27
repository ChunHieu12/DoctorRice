/**
 * IoTImageDetailModal Component
 * Full screen modal with swipe to navigate between images
 */

import { colors } from '@/constants/colors';
import type { IoTImage } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import SensorBadges from './SensorBadges';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3;

export interface IoTImageDetailModalProps {
  visible: boolean;
  images: IoTImage[];
  initialIndex: number;
  onClose: () => void;
  onAnalyze?: (image: IoTImage) => void;
}

const IoTImageDetailModal: React.FC<IoTImageDetailModalProps> = ({
  visible,
  images,
  initialIndex,
  onClose,
  onAnalyze,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const translateX = useRef(new Animated.Value(0)).current;

  const currentImage = images[currentIndex];
  const canSwipeLeft = currentIndex < images.length - 1;
  const canSwipeRight = currentIndex > 0;

  /**
   * Pan responder for swipe gesture
   */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow swipe if there are images in that direction
        if ((gestureState.dx < 0 && canSwipeLeft) || (gestureState.dx > 0 && canSwipeRight)) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
          // Swipe left = next image (higher index)
          if (gestureState.dx < 0 && canSwipeLeft) {
            handleSwipeLeft();
          }
          // Swipe right = previous image (lower index)
          else if (gestureState.dx > 0 && canSwipeRight) {
            handleSwipeRight();
          } else {
            resetPosition();
          }
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  /**
   * Handle swipe left (next image)
   */
  const handleSwipeLeft = () => {
    Animated.timing(translateX, {
      toValue: -width,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex((prev) => Math.min(prev + 1, images.length - 1));
      translateX.setValue(0);
    });
  };

  /**
   * Handle swipe right (previous image)
   */
  const handleSwipeRight = () => {
    Animated.timing(translateX, {
      toValue: width,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
      translateX.setValue(0);
    });
  };

  /**
   * Reset position
   */
  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Navigate to next/previous image via buttons
   */
  const goToNext = () => {
    if (canSwipeLeft) {
      handleSwipeLeft();
    }
  };

  const goToPrevious = () => {
    if (canSwipeRight) {
      handleSwipeRight();
    }
  };

  /**
   * Handle analyze
   */
  const handleAnalyze = () => {
    if (!currentImage.isInsideGeofence) {
      Alert.alert(
        'Cảnh báo',
        'Ảnh này nằm ngoài vùng geofence. Bạn vẫn muốn phân tích?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Tiếp tục',
            onPress: () => navigateToAnalysis(),
          },
        ]
      );
    } else {
      navigateToAnalysis();
    }
  };

  /**
   * Navigate to analysis screen
   */
  const navigateToAnalysis = () => {
    onClose();
    
    // Encode imageUrl to prevent router from decoding it
    // Firebase Storage requires exact URL with %2F, not /
    const encodedImageUrl = encodeURIComponent(currentImage.imageUrl);
    
    router.push({
      pathname: '/result',
      params: {
        source: 'iot',
        captureId: currentImage.captureId,
        imageUrl: encodedImageUrl, // Send encoded URL
        gps: JSON.stringify(currentImage.location),
        sensors: JSON.stringify(currentImage.sensors),
        deviceId: currentImage.deviceId,
      },
    });
  };

  /**
   * Format date and time
   */
  const captureDate = currentImage ? new Date(currentImage.timestamp) : new Date();
  
  // Debug timestamp parsing
  if (currentImage) {
    console.log('🕐 IoTImageDetailModal - Timestamp parsing:', {
      rawTimestamp: currentImage.timestamp,
      parsedDate: captureDate.toISOString(),
      localTime: captureDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      utcTime: captureDate.toUTCString(),
      timezoneOffset: captureDate.getTimezoneOffset(),
    });
  }
  
  const formattedDate = captureDate.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = captureDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  if (!currentImage) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {currentIndex + 1} / {images.length}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Image Container with Swipe */}
        <View style={styles.imageSection} {...panResponder.panHandlers}>
          <Animated.Image
            source={{ uri: currentImage.imageUrl }}
            style={[styles.image, { transform: [{ translateX }] }]}
            resizeMode="contain"
          />

          {/* Swipe Indicators */}
          {canSwipeRight && (
            <TouchableOpacity style={styles.navButtonLeft} onPress={goToPrevious}>
              <Ionicons name="chevron-back" size={32} color="#fff" />
            </TouchableOpacity>
          )}
          {canSwipeLeft && (
            <TouchableOpacity style={styles.navButtonRight} onPress={goToNext}>
              <Ionicons name="chevron-forward" size={32} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Geofence Badge */}
          {currentImage.isInsideGeofence !== undefined && (
            <View
              style={[
                styles.geofenceBadge,
                currentImage.isInsideGeofence ? styles.insideGeofence : styles.outsideGeofence,
              ]}
            >
              <Ionicons
                name={currentImage.isInsideGeofence ? 'checkmark-circle' : 'alert-circle'}
                size={16}
                color="#fff"
              />
              <Text style={styles.geofenceText}>
                {currentImage.isInsideGeofence ? 'Trong vùng' : 'Ngoài vùng'}
              </Text>
            </View>
          )}
        </View>

        {/* Metadata Section */}
        <ScrollView style={styles.metadataSection} contentContainerStyle={styles.metadataContent}>
          {/* Date & Time */}
          <View style={styles.metadataCard}>
            <View style={styles.metadataRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <View style={styles.metadataTextContainer}>
                <Text style={styles.metadataLabel}>Thời gian chụp</Text>
                <Text style={styles.metadataValue}>
                  {formattedDate} - {formattedTime}
                </Text>
              </View>
            </View>
          </View>

          {/* Device ID */}
          <View style={styles.metadataCard}>
            <View style={styles.metadataRow}>
              <Ionicons name="hardware-chip" size={20} color={colors.primary} />
              <View style={styles.metadataTextContainer}>
                <Text style={styles.metadataLabel}>Thiết bị IoT</Text>
                <Text style={styles.metadataValue}>{currentImage.deviceId}</Text>
              </View>
            </View>
          </View>

          {/* GPS Location */}
          {currentImage.location && (
            <View style={styles.metadataCard}>
              <View style={styles.metadataRow}>
                <Ionicons name="navigate-circle" size={20} color={colors.primary} />
                <View style={styles.metadataTextContainer}>
                  <Text style={styles.metadataLabel}>Tọa độ GPS</Text>
                  <Text style={styles.metadataValue}>
                    Lat: {currentImage.location.lat.toFixed(7)}
                  </Text>
                  <Text style={styles.metadataValue}>
                    Lng: {currentImage.location.lng.toFixed(7)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Sensors */}
          {currentImage.sensors && (
            <View style={styles.metadataCard}>
              <View style={styles.sensorHeader}>
                <Ionicons name="analytics" size={20} color={colors.primary} />
                <Text style={styles.metadataLabel}>Dữ liệu cảm biến</Text>
              </View>
              <View style={styles.sensorsContainer}>
                <SensorBadges sensors={currentImage.sensors} compact={false} />
              </View>
            </View>
          )}

          {/* Analyze Button */}
          <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
            <Ionicons name="medical" size={20} color="#fff" />
            <Text style={styles.analyzeButtonText}>Chuẩn đoán bệnh</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  closeButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },

  // Image Section
  imageSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: width,
    height: height * 0.5,
  },

  // Navigation Buttons
  navButtonLeft: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonRight: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Geofence Badge
  geofenceBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  insideGeofence: {
    backgroundColor: colors.success,
  },
  outsideGeofence: {
    backgroundColor: colors.warning,
  },
  geofenceText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Metadata Section
  metadataSection: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.5,
  },
  metadataContent: {
    padding: 20,
    paddingBottom: Platform.OS === 'android' ? 100 : 80,
    gap: 16,
  },

  // Metadata Cards
  metadataCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  metadataTextContainer: {
    flex: 1,
    gap: 4,
  },
  metadataLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metadataValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'monospace',
  },

  // Sensors
  sensorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sensorsContainer: {
    marginTop: 8,
  },

  // Analyze Button
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default IoTImageDetailModal;

