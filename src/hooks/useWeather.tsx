/**
 * useWeather Hook
 * Quản lý dữ liệu thời tiết: GPS location + OpenWeatherMap API
 */

import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getWeatherForecast } from '@/services/weather.service';
import type { WeatherState } from '@/types/weather.types';
import { calculateWeatherWarnings } from '@/utils/weatherWarnings';

export const useWeather = () => {
  const { t } = useTranslation();
  const [state, setState] = useState<WeatherState>({
    current: null,
    forecast: null,
    warnings: [],
    loading: true,
    error: null,
    lastUpdate: null,
    location: null,
  });

  /**
   * Get current GPS location
   */
  const getCurrentLocation = useCallback(async () => {
    try {
      // Check permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get location name
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const locationName = address.city || address.region || address.country || 'Unknown';

      return {
        name: locationName,
        coords: {
          lat: location.coords.latitude,
          lon: location.coords.longitude,
        },
      };
    } catch (error: any) {
      console.error('❌ Location error:', error);
      throw new Error(`Failed to get location: ${error.message}`);
    }
  }, []);

  /**
   * Fetch weather data for specific coordinates
   */
  const fetchWeather = useCallback(async (lat: number, lon: number, locationName?: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      console.log(`🌤️ Fetching weather for ${locationName || 'location'}: ${lat}, ${lon}`);

      // Fetch weather data
      const { current, forecast } = await getWeatherForecast(lat, lon);

      // Calculate warnings
      const warnings = calculateWeatherWarnings(current, forecast, t);

      setState({
        current,
        forecast,
        warnings,
        loading: false,
        error: null,
        lastUpdate: Date.now(),
        location: {
          name: locationName || 'Unknown',
          coords: { lat, lon },
        },
      });

      console.log(`✅ Weather loaded: ${warnings.length} warnings`);
    } catch (error: any) {
      console.error('❌ Weather fetch error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  }, []);

  /**
   * Refresh weather with current GPS location
   */
  const refreshWeather = useCallback(async () => {
    try {
      const location = await getCurrentLocation();
      await fetchWeather(location.coords.lat, location.coords.lon, location.name);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  }, [getCurrentLocation, fetchWeather]);

  /**
   * Load weather for specific location (user selected)
   */
  const loadWeatherForLocation = useCallback(
    async (lat: number, lon: number, name: string) => {
      await fetchWeather(lat, lon, name);
    },
    [fetchWeather]
  );

  /**
   * Initial load on mount
   */
  useEffect(() => {
    refreshWeather();
  }, []);

  return {
    // State
    current: state.current,
    forecast: state.forecast,
    warnings: state.warnings,
    loading: state.loading,
    error: state.error,
    lastUpdate: state.lastUpdate,
    location: state.location,
    
    // Actions
    refreshWeather,
    loadWeatherForLocation,
    getCurrentLocation,
  };
};

