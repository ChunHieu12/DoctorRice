/**
 * Current Weather Widget
 * Hiển thị thông tin thời tiết hiện tại
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { WeatherData } from '@/types/weather.types';
import { formatHumidity, formatTemp, getWeatherIcon } from '@/utils/weatherWarnings';

interface CurrentWeatherWidgetProps {
  weather: WeatherData;
  locationName: string;
  onPress?: () => void;
}

export const CurrentWeatherWidget: React.FC<CurrentWeatherWidgetProps> = ({
  weather,
  locationName,
  onPress,
}) => {
  const { t } = useTranslation();

  const temp = weather.main.temp;
  const humidity = weather.main.humidity;
  const description = weather.weather[0].description;
  const iconCode = weather.weather[0].icon;
  const icon = getWeatherIcon(iconCode, description);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>{t('weather.current')}</Text>
          <Text style={styles.location}>📍 {locationName}</Text>
        </View>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      {/* Temperature */}
      <View style={styles.tempContainer}>
        <Text style={styles.temp}>{formatTemp(temp)}</Text>
        <View style={styles.details}>
          <Text style={styles.description}>{description}</Text>
          <Text style={styles.humidity}>💧 {formatHumidity(humidity)}</Text>
        </View>
      </View>

      {/* Additional Info */}
      <View style={styles.footer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>{t('weather.feelsLike')}</Text>
          <Text style={styles.infoValue}>{formatTemp(weather.main.feels_like)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>{t('weather.wind')}</Text>
          <Text style={styles.infoValue}>{weather.wind.speed.toFixed(1)} m/s</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>{t('weather.pressure')}</Text>
          <Text style={styles.infoValue}>{weather.main.pressure} hPa</Text>
        </View>
      </View>

      {/* Tap hint */}
      <Text style={styles.tapHint}>{t('weather.tapForDetails')}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  icon: {
    fontSize: 48,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  temp: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 16,
  },
  details: {
    flex: 1,
  },
  description: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  humidity: {
    fontSize: 16,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  divider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  tapHint: {
    fontSize: 12,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
});

