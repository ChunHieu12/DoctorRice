/**
 * SensorBadges Component
 * Displays all 6 sensor readings with color-coded status
 */

import { colors } from '@/constants/colors';
import { formatSensorValue, getSensorStatus } from '@/services/firebase-iot.service';
import type { SensorData } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface SensorBadgesProps {
  sensors: SensorData;
  compact?: boolean;
}

const SensorBadges: React.FC<SensorBadgesProps> = ({ sensors, compact = false }) => {
  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <SensorBadge
        icon="thermometer"
        label="Nhiệt độ"
        value={formatSensorValue('temperature', sensors.temperature)}
        status={getSensorStatus('temperature', sensors.temperature)}
        compact={compact}
      />
      <SensorBadge
        icon="water"
        label="Độ ẩm KK"
        value={formatSensorValue('humidity', sensors.humidity)}
        status={getSensorStatus('humidity', sensors.humidity)}
        compact={compact}
      />
      <SensorBadge
        icon="flask"
        label="pH"
        value={formatSensorValue('ph', sensors.ph)}
        status={getSensorStatus('ph', sensors.ph)}
        compact={compact}
      />
      <SensorBadge
        icon="leaf"
        label="Độ ẩm đất"
        value={formatSensorValue('soilMoisture', sensors.soilMoisture)}
        status={getSensorStatus('soilMoisture', sensors.soilMoisture)}
        compact={compact}
      />
      <SensorBadge
        icon="sunny"
        label="Ánh sáng"
        value={formatSensorValue('lux', sensors.lux)}
        status="good"
        compact={compact}
      />
      <SensorBadge
        icon="speedometer"
        label="Gió"
        value={formatSensorValue('windSpeed', sensors.windSpeed)}
        status="good"
        compact={compact}
      />
    </View>
  );
};

/**
 * SensorBadge Sub-component
 */
interface SensorBadgeProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  status: 'good' | 'warning' | 'danger';
  compact: boolean;
}

const SensorBadge: React.FC<SensorBadgeProps> = ({ icon, label, value, status, compact }) => {
  const statusColor =
    status === 'danger' ? colors.error : status === 'warning' ? colors.warning : colors.success;

  const backgroundColor =
    status === 'danger'
      ? '#ffebee'
      : status === 'warning'
        ? '#fff3e0'
        : '#e8f5e9';

  return (
    <View style={[styles.badge, { backgroundColor }, compact && styles.badgeCompact]}>
      <View style={styles.badgeHeader}>
        <Ionicons name={icon} size={compact ? 14 : 16} color={statusColor} />
        {!compact && <Text style={styles.badgeLabel}>{label}</Text>}
      </View>
      <Text style={[styles.badgeValue, { color: statusColor }, compact && styles.valueCompact]}>
        {value}
      </Text>
      {compact && <Text style={styles.labelCompact}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compactContainer: {
    gap: 6,
  },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 110,
  },
  badgeCompact: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 0,
    alignItems: 'center',
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  badgeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  badgeValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  valueCompact: {
    fontSize: 12,
    marginTop: 2,
  },
  labelCompact: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default SensorBadges;

