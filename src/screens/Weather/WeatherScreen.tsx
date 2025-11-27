import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { LocationPickerModal } from '@/components/LocationPickerModal';
import type { DayForecast } from '@/components/WeatherWidgets';
import { CurrentWeatherWidget, ForecastWidget, WarningCard } from '@/components/WeatherWidgets';
import { useWeather } from '@/hooks/useWeather';

/**
 * WeatherScreen - Màn hình thời tiết
 * Hiển thị thông tin thời tiết cho nông nghiệp
 */
export default function WeatherScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    current,
    forecast,
    warnings,
    loading,
    error,
    location,
    lastUpdate,
    refreshWeather,
    loadWeatherForLocation,
  } = useWeather();

  const [refreshing, setRefreshing] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshWeather();
    setRefreshing(false);
  };

  /**
   * Navigate to detail screen
   */
  const handleNavigateToDetail = () => {
    if (current && forecast) {
      router.push({
        pathname: '/weather-detail',
        params: {
          locationName: location?.name || 'Unknown',
          lat: location?.coords.lat || 0,
          lon: location?.coords.lon || 0,
        },
      });
    }
  };

  /**
   * Handle day press
   */
  const handleDayPress = (day: DayForecast) => {
    handleNavigateToDetail();
  };

  /**
   * Handle warning press
   */
  const handleWarningPress = () => {
    handleNavigateToDetail();
  };

  /**
   * Handle change location
   */
  const handleChangeLocation = () => {
    setShowLocationPicker(true);
  };

  /**
   * Handle select location from picker
   */
  const handleSelectLocation = async (lat: number, lon: number, name: string) => {
    await loadWeatherForLocation(lat, lon, name);
  };

  // Loading state
  if (loading && !current) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>{t('weather.loading')}</Text>
      </View>
    );
  }

  // Error state
  if (error && !current) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshWeather}>
          <Text style={styles.retryButtonText}>{t('weather.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main content
  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
      >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🌤️ {t('weather.title')}</Text>
          <Text style={styles.subtitle}>{t('weather.subtitle')}</Text>
        </View>
        <TouchableOpacity style={styles.locationButton} onPress={handleChangeLocation}>
          <Text style={styles.locationButtonText}>📍</Text>
        </TouchableOpacity>
      </View>

      {/* Last update time */}
      {lastUpdate && (
        <Text style={styles.lastUpdate}>
          {t('weather.lastUpdate')}: {new Date(lastUpdate).toLocaleTimeString('vi-VN')}
        </Text>
      )}

      {/* Current Weather Widget */}
      {current && location && (
        <CurrentWeatherWidget
          weather={current}
          locationName={location.name}
          onPress={handleNavigateToDetail}
        />
      )}

      {/* 3-Day Forecast Widget */}
      {forecast && (
        <ForecastWidget forecast={forecast} onDayPress={handleDayPress} />
      )}

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <View style={styles.warningsSection}>
          <Text style={styles.sectionTitle}>{t('weather.warnings')}</Text>
          {warnings.map((warning) => (
            <WarningCard
              key={warning.id}
              warning={warning}
              onPress={handleWarningPress}
            />
          ))}
        </View>
      )}

      {/* Bottom spacing */}
      <View style={{ height: 32 }} />
    </ScrollView>

      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelectLocation={handleSelectLocation}
        currentLocation={location}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  locationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationButtonText: {
    fontSize: 24,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  warningsSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 12,
  },
});

