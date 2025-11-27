/**
 * IoTImageCardCompact Component
 * Compact version for horizontal scroll
 */

import { colors } from '@/constants/colors';
import type { IoTImage } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const DEFAULT_CARD_WIDTH = width * 0.4; // 40% màn hình cho horizontal scroll
const IMAGE_HEIGHT = 160;

export interface IoTImageCardCompactProps {
  image: IoTImage;
  onPress?: () => void;
  isGridView?: boolean; // Disable right margin for grid
}

const IoTImageCardCompact: React.FC<IoTImageCardCompactProps> = ({ 
  image, 
  onPress,
  isGridView = false,
}) => {
  const captureDate = new Date(image.timestamp);
  const formattedTime = captureDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Get top 2 sensor values
  const topSensors = image.sensors
    ? Object.entries(image.sensors)
        .slice(0, 2)
        .map(([key, value]) => {
          const icon = getSensorIcon(key);
          const label = getSensorLabel(key, value);
          return { icon, label };
        })
    : [];

  return (
    <TouchableOpacity
      style={[styles.card, isGridView && styles.cardGrid]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: image.imageUrl }} style={styles.image} resizeMode="cover" />

        {/* Time Badge - Bottom Left */}
        <View style={styles.timeBadge}>
          <Ionicons name="time-outline" size={12} color="#fff" />
          <Text style={styles.timeText}>{formattedTime}</Text>
        </View>

        {/* Geofence Badge - Top Right */}
        {image.isInsideGeofence !== undefined && (
          <View
            style={[
              styles.geofenceBadge,
              image.isInsideGeofence ? styles.insideGeofence : styles.outsideGeofence,
            ]}
          >
            <Ionicons
              name={image.isInsideGeofence ? 'checkmark-circle' : 'alert-circle'}
              size={12}
              color="#fff"
            />
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Device ID - Last 6 chars */}
        <View style={styles.deviceRow}>
          <Ionicons name="hardware-chip-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.deviceText} numberOfLines={1}>
            ...{image.deviceId.slice(-6)}
          </Text>
        </View>

        {/* Top 2 Sensors */}
        {topSensors.length > 0 && (
          <View style={styles.sensorsRow}>
            {topSensors.map((sensor, index) => (
              <View key={index} style={styles.sensorBadge}>
                <Text style={styles.sensorIcon}>{sensor.icon}</Text>
                <Text style={styles.sensorLabel} numberOfLines={1}>
                  {sensor.label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

/**
 * Get sensor icon emoji
 */
const getSensorIcon = (key: string): string => {
  const iconMap: Record<string, string> = {
    temperature: '🌡️',
    humidity: '💧',
    light: '☀️',
    soil_moisture: '🌱',
    ph: '⚗️',
    nitrogen: '🧪',
    phosphorus: '🧪',
    potassium: '🧪',
  };
  return iconMap[key.toLowerCase()] || '📊';
};

/**
 * Get sensor label with value
 */
const getSensorLabel = (key: string, value: any): string => {
  const labelMap: Record<string, string> = {
    temperature: `${value}°C`,
    humidity: `${value}%`,
    light: `${value} lux`,
    soil_moisture: `${value}%`,
    ph: `pH ${value}`,
    nitrogen: `N ${value}`,
    phosphorus: `P ${value}`,
    potassium: `K ${value}`,
  };
  return labelMap[key.toLowerCase()] || `${value}`;
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardGrid: {
    marginRight: 0,
  },

  // Image
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
  },

  // Time Badge - Bottom Left
  timeBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Geofence Badge - Top Right
  geofenceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  insideGeofence: {
    backgroundColor: colors.success,
  },
  outsideGeofence: {
    backgroundColor: colors.warning,
  },

  // Footer
  footer: {
    padding: 10,
    gap: 8,
  },

  // Device
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deviceText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },

  // Sensors
  sensorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sensorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '48%',
  },
  sensorIcon: {
    fontSize: 10,
  },
  sensorLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
});

export default IoTImageCardCompact;

