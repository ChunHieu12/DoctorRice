/**
 * IoTImageCard Component
 * Displays IoT image with sensors and metadata
 */

import { colors } from '@/constants/colors';
import type { IoTImage } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SensorBadges from './SensorBadges';

export interface IoTImageCardProps {
  image: IoTImage;
  onPress?: () => void;
  onAnalyze?: () => void;
  showFullSensors?: boolean;
}

const IoTImageCard: React.FC<IoTImageCardProps> = ({
  image,
  onPress,
  onAnalyze,
  showFullSensors = false,
}) => {
  const captureDate = new Date(image.timestamp);
  const formattedDate = captureDate.toLocaleDateString('vi-VN');
  const formattedTime = captureDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={!onPress}
    >
      {/* Image */}
      <Image source={{ uri: image.imageUrl }} style={styles.image} resizeMode="cover" />

      {/* Geofence Badge */}
      {image.isInsideGeofence !== undefined && (
        <View
          style={[
            styles.geofenceBadge,
            image.isInsideGeofence ? styles.insideGeofence : styles.outsideGeofence,
          ]}
        >
          <Ionicons
            name={image.isInsideGeofence ? 'checkmark-circle' : 'alert-circle'}
            size={14}
            color="#fff"
          />
          <Text style={styles.geofenceText}>
            {image.isInsideGeofence ? 'Trong vùng' : 'Ngoài vùng'}
          </Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.deviceInfo}>
            <Ionicons name="hardware-chip" size={16} color={colors.primary} />
            <Text style={styles.deviceId}>{image.deviceId}</Text>
          </View>
          <Text style={styles.timestamp}>
            {formattedDate} {formattedTime}
          </Text>
        </View>

        {/* GPS */}
        {image.location && (
          <View style={styles.locationRow}>
            <Ionicons name="navigate-circle-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.locationText}>
              {image.location.lat.toFixed(7)}, {image.location.lng.toFixed(7)}
            </Text>
          </View>
        )}

        {/* Sensors */}
        <View style={styles.sensorsContainer}>
          <SensorBadges sensors={image.sensors} compact={!showFullSensors} />
        </View>

        {/* Analyze Button */}
        {onAnalyze && (
          <TouchableOpacity style={styles.analyzeButton} onPress={onAnalyze}>
            <Ionicons name="medical" size={16} color="#fff" />
            <Text style={styles.analyzeButtonText}>Chuẩn đoán bệnh</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 240, // Taller image for better preview
    backgroundColor: '#f5f5f5',
  },
  geofenceBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  insideGeofence: {
    backgroundColor: colors.success,
  },
  outsideGeofence: {
    backgroundColor: colors.warning,
  },
  geofenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deviceId: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    flex: 1,
  },
  sensorsContainer: {
    marginBottom: 14,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default IoTImageCard;

