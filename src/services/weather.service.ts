/**
 * Weather Service
 * OpenWeatherMap API integration for 3-day forecast
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

const OPENWEATHER_API_KEY = Constants.expoConfig?.extra?.openWeatherApiKey || '510dd9ff566e47c94dc28da2fc76bbf1';
const OPENWEATHER_BASE_URL = Constants.expoConfig?.extra?.openWeatherBaseUrl || 'https://api.openweathermap.org/data/2.5';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export interface WeatherData {
  current: {
    temp: number;
    humidity: number;
    description: string;
    icon: string;
  };
  forecast: Array<{
    date: string;
    temp: number;
    humidity: number;
    rain: number; // mm
    description: string;
  }>;
}

interface CachedWeather {
  data: WeatherData;
  timestamp: number;
  location: string;
}

/**
 * Get weather forecast for location (3 days)
 */
export const getWeatherForecast = async (
  lat: number,
  lng: number
): Promise<WeatherData> => {
  try {
    const cacheKey = `weather_${lat.toFixed(4)}_${lng.toFixed(4)}`;
    
    // Check cache first
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const cachedData: CachedWeather = JSON.parse(cached);
      const isValid = Date.now() - cachedData.timestamp < CACHE_DURATION;
      
      if (isValid) {
        console.log('☁️ Using cached weather data');
        return cachedData.data;
      }
    }

    console.log(`☁️ Fetching weather for: ${lat}, ${lng}`);

    // Fetch current weather
    const currentResponse = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
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
    const forecastResponse = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
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

    // Process current weather
    const current = {
      temp: currentResponse.data.main.temp,
      humidity: currentResponse.data.main.humidity,
      description: currentResponse.data.weather[0].description,
      icon: currentResponse.data.weather[0].icon,
    };

    // Process forecast - group by day and calculate daily averages
    const forecastByDay: { [key: string]: any[] } = {};
    
    forecastResponse.data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toLocaleDateString('vi-VN');
      if (!forecastByDay[date]) {
        forecastByDay[date] = [];
      }
      forecastByDay[date].push(item);
    });

    const forecast = Object.entries(forecastByDay)
      .slice(0, 3) // Only take 3 days
      .map(([date, items]: [string, any[]]) => {
        const avgTemp = items.reduce((sum, item) => sum + item.main.temp, 0) / items.length;
        const avgHumidity = items.reduce((sum, item) => sum + item.main.humidity, 0) / items.length;
        const totalRain = items.reduce((sum, item) => sum + (item.rain?.['3h'] || 0), 0);
        const mainDescription = items[0].weather[0].description;

        return {
          date,
          temp: Math.round(avgTemp),
          humidity: Math.round(avgHumidity),
          rain: Math.round(totalRain * 10) / 10, // Round to 1 decimal
          description: mainDescription,
        };
      });

    const weatherData: WeatherData = {
      current,
      forecast,
    };

    // Cache the result
    const cacheData: CachedWeather = {
      data: weatherData,
      timestamp: Date.now(),
      location: `${lat},${lng}`,
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));

    console.log('✅ Weather data fetched successfully');
    return weatherData;

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

