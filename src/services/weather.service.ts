/**
 * Weather Service
 * OpenWeatherMap API integration for 3-day forecast
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

import type { ForecastData, WeatherData } from '@/types/weather.types';

const OPENWEATHER_API_KEY = Constants.expoConfig?.extra?.openWeatherApiKey || '510dd9ff566e47c94dc28da2fc76bbf1';
const OPENWEATHER_BASE_URL = Constants.expoConfig?.extra?.openWeatherBaseUrl || 'https://api.openweathermap.org/data/2.5';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CachedWeather {
  current: WeatherData;
  forecast: ForecastData;
  timestamp: number;
  location: string;
}

export interface WeatherResponse {
  current: WeatherData;
  forecast: ForecastData;
}

/**
 * Get weather forecast for location (3 days)
 * Returns both current weather and 3-day forecast
 */
export const getWeatherForecast = async (
  lat: number,
  lng: number
): Promise<WeatherResponse> => {
  try {
    const cacheKey = `weather_${lat.toFixed(4)}_${lng.toFixed(4)}`;
    
    // Check cache first
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const cachedData: CachedWeather = JSON.parse(cached);
      const isValid = Date.now() - cachedData.timestamp < CACHE_DURATION;
      
      if (isValid) {
        console.log('☁️ Using cached weather data');
        return {
          current: cachedData.current,
          forecast: cachedData.forecast,
        };
      }
    }

    console.log(`☁️ Fetching weather for: ${lat}, ${lng}`);

    // Fetch current weather
    const currentResponse = await axios.get<WeatherData>(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        lat,
        lon: lng,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
        lang: 'vi',
      },
      timeout: 10000,
    });

    // Fetch 3-day forecast
    const forecastResponse = await axios.get<ForecastData>(`${OPENWEATHER_BASE_URL}/forecast`, {
      params: {
        lat,
        lon: lng,
        appid: OPENWEATHER_API_KEY,
        units: 'metric',
        lang: 'vi',
        cnt: 24, // 3 days (8 items per day for 3-hour intervals)
      },
      timeout: 10000,
    });

    const current: WeatherData = currentResponse.data;
    const forecast: ForecastData = forecastResponse.data;

    // Cache the result
    const cacheData: CachedWeather = {
      current,
      forecast,
      timestamp: Date.now(),
      location: `${lat},${lng}`,
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));

    console.log('✅ Weather data fetched successfully');
    return { current, forecast };

  } catch (error: any) {
    console.error('❌ Weather API error:', error.message);
    throw new Error(`Failed to fetch weather: ${error.message}`);
  }
};

/**
 * Clear weather cache
 */
export const clearWeatherCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const weatherKeys = keys.filter(key => key.startsWith('weather_'));
    await AsyncStorage.multiRemove(weatherKeys);
    console.log('🗑️ Weather cache cleared');
  } catch (error) {
    console.error('❌ Failed to clear weather cache:', error);
  }
};

