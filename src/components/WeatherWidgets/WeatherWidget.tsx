/**
 * WeatherWidget - Compact weather widget for HomeScreen
 * Displays current weather + warnings
 */
import type { WeatherData } from '@/types/weather.types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface WeatherWidgetProps {
  current: WeatherData | null;
  location?: { name: string };
  warnings: any[];
  onPress: () => void;
  onWarningPress: () => void;
}

export default function WeatherWidget({
  current,
  location,
  warnings,
  onPress,
  onWarningPress,
}: WeatherWidgetProps) {
  const { t } = useTranslation();

  if (!current) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {t('weather.loading', { defaultValue: 'Đang tải thời tiết...' })}
          </Text>
        </View>
      </View>
    );
  }

  const temp = Math.round(current.main.temp);
  const description = current.weather[0]?.description || '';
  const humidity = current.main.humidity;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.mainCard} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.leftSection}>
          <Text style={styles.tempLarge}>{temp}°</Text>
          <Text style={styles.location}>{location?.name || 'Unknown'}</Text>
        </View>
        
        <View style={styles.rightSection}>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailText}>💧 {humidity}%</Text>
            <Text style={styles.detailText}>
              🌡️ {Math.round(current.main.temp_min)}° - {Math.round(current.main.temp_max)}°
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <TouchableOpacity
          style={styles.warningCard}
          onPress={onWarningPress}
          activeOpacity={0.8}
        >
          <View style={styles.warningHeader}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>
                {t('home.weather.warning', { defaultValue: 'Khuyến cáo nông vụ' })}
              </Text>
              <Text style={styles.warningText} numberOfLines={1}>
                {warnings[0].message}
              </Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  mainCard: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  leftSection: {
    flex: 1,
    justifyContent: 'center',
  },
  tempLarge: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 64,
  },
  location: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  rightSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  detailRow: {
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'right',
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningIcon: {
    fontSize: 28,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: '#E65100',
  },
  arrowIcon: {
    fontSize: 24,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  loadingContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#4CAF50',
  },
});

