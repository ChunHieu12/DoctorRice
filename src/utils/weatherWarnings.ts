/**
 * Weather Warnings Logic
 * Tính toán cảnh báo nông nghiệp dựa trên thời tiết
 */

import type {
    ForecastData,
    ForecastItem,
    WarningLevel,
    WeatherData,
    WeatherWarning,
} from '@/types/weather.types';
import type { TFunction } from 'i18next';

interface DailyWeatherSummary {
  date: string;
  avgTemp: number;
  avgHumidity: number;
  totalRain: number;
  maxTemp: number;
  minTemp: number;
  description: string;
}

/**
 * Tính toán cảnh báo nông nghiệp từ dữ liệu thời tiết
 */
export const calculateWeatherWarnings = (
  current: WeatherData,
  forecast: ForecastData,
  t: TFunction<'translation'>
): WeatherWarning[] => {
  const warnings: WeatherWarning[] = [];

  // Tính toán summary cho 3 ngày tới
  const dailySummaries = calculateDailySummaries(forecast);
  
  // Current weather analysis
  const currentHumidity = current.main.humidity;
  const currentTemp = current.main.temp;
  const currentRain = current.rain?.['1h'] || 0;

  // Check 1: High humidity + rain = Bệnh đạo ôn risk
  if (currentHumidity > 85 && currentRain > 5) {
    warnings.push({
      id: 'blast-critical',
      level: 'critical',
      title: t('weather.warningMessages.blastCritical.title'),
      description: t('weather.warningMessages.blastCritical.description', {
        humidity: currentHumidity,
        rain: currentRain.toFixed(1),
      }),
      recommendation: t('weather.warningMessages.blastCritical.recommendation'),
      icon: '⚠️',
      color: '#D32F2F',
      diseases: [t('diseases.blast')],
    });
  } else if (currentHumidity > 80) {
    warnings.push({
      id: 'blast-high',
      level: 'high',
      title: t('weather.warningMessages.blastHigh.title'),
      description: t('weather.warningMessages.blastHigh.description', {
        humidity: currentHumidity,
      }),
      recommendation: t('weather.warningMessages.blastHigh.recommendation'),
      icon: '⚠️',
      color: '#F57C00',
      diseases: [t('diseases.blast')],
    });
  }

  // Check 2: High humidity + moderate rain = Bệnh đốm nâu risk
  const next3DaysRain = dailySummaries.reduce((sum, day) => sum + day.totalRain, 0);
  const avgHumidity3Days = dailySummaries.reduce((sum, day) => sum + day.avgHumidity, 0) / 3;

  if (avgHumidity3Days > 80 && next3DaysRain > 30) {
    warnings.push({
      id: 'brownspot-high',
      level: 'high',
      title: t('weather.warningMessages.brownspotHigh.title'),
      description: t('weather.warningMessages.brownspotHigh.description', {
        humidity: avgHumidity3Days.toFixed(0),
        rain: next3DaysRain.toFixed(1),
      }),
      recommendation: t('weather.warningMessages.brownspotHigh.recommendation'),
      icon: '🟤',
      color: '#F57C00',
      diseases: [t('diseases.brown_spot')],
    });
  } else if (avgHumidity3Days > 75) {
    warnings.push({
      id: 'brownspot-medium',
      level: 'medium',
      title: t('weather.warningMessages.brownspotMedium.title'),
      description: t('weather.warningMessages.brownspotMedium.description', {
        humidity: avgHumidity3Days.toFixed(0),
      }),
      recommendation: t('weather.warningMessages.brownspotMedium.recommendation'),
      icon: '🟠',
      color: '#FFA726',
      diseases: [t('diseases.brown_spot')],
    });
  }

  // Check 3: Continuous rain = Bệnh bạc lá risk
  const continuousRainDays = dailySummaries.filter(day => day.totalRain > 10).length;
  
  if (continuousRainDays >= 2 && avgHumidity3Days > 85) {
    warnings.push({
      id: 'bacterialleaf-high',
      level: 'high',
      title: t('weather.warningMessages.bacterialLeafHigh.title'),
      description: t('weather.warningMessages.bacterialLeafHigh.description', {
        days: continuousRainDays,
      }),
      recommendation: t('weather.warningMessages.bacterialLeafHigh.recommendation'),
      icon: '🍃',
      color: '#F57C00',
      diseases: [t('diseases.bacterial_leaf_blight')],
    });
  }

  // Check 4: High temperature = Heat stress
  const maxTemp3Days = Math.max(...dailySummaries.map(day => day.maxTemp));
  
  if (maxTemp3Days > 36) {
    warnings.push({
      id: 'heatstress-high',
      level: 'high',
      title: t('weather.warningMessages.heatHigh.title'),
      description: t('weather.warningMessages.heatHigh.description', {
        temperature: maxTemp3Days.toFixed(1),
      }),
      recommendation: t('weather.warningMessages.heatHigh.recommendation'),
      icon: '☀️',
      color: '#D32F2F',
      diseases: [],
    });
  } else if (maxTemp3Days > 34) {
    warnings.push({
      id: 'heatstress-medium',
      level: 'medium',
      title: t('weather.warningMessages.heatMedium.title'),
      description: t('weather.warningMessages.heatMedium.description', {
        temperature: maxTemp3Days.toFixed(1),
      }),
      recommendation: t('weather.warningMessages.heatMedium.recommendation'),
      icon: '🌤️',
      color: '#FFA726',
      diseases: [],
    });
  }

  // Check 5: Heavy rain = Flooding risk
  const heavyRainDay = dailySummaries.find(day => day.totalRain > 50);
  
  if (heavyRainDay) {
    warnings.push({
      id: 'flooding-critical',
      level: 'critical',
      title: t('weather.warningMessages.floodingCritical.title'),
      description: t('weather.warningMessages.floodingCritical.description', {
        rain: heavyRainDay.totalRain.toFixed(1),
      }),
      recommendation: t('weather.warningMessages.floodingCritical.recommendation'),
      icon: '🌧️',
      color: '#D32F2F',
      diseases: [],
    });
  } else if (next3DaysRain > 80) {
    warnings.push({
      id: 'flooding-high',
      level: 'high',
      title: t('weather.warningMessages.floodingHigh.title'),
      description: t('weather.warningMessages.floodingHigh.description', {
        rain: next3DaysRain.toFixed(1),
      }),
      recommendation: t('weather.warningMessages.floodingHigh.recommendation'),
      icon: '🌧️',
      color: '#F57C00',
      diseases: [],
    });
  }

  // Check 6: Low risk - Good conditions
  if (warnings.length === 0) {
    warnings.push({
      id: 'good-conditions',
      level: 'low',
      title: t('weather.warningMessages.goodConditions.title'),
      description: t('weather.warningMessages.goodConditions.description', {
        temperature: currentTemp.toFixed(1),
        humidity: currentHumidity,
      }),
      recommendation: t('weather.warningMessages.goodConditions.recommendation'),
      icon: '✅',
      color: '#4CAF50',
      diseases: [],
    });
  }

  // Sort by severity
  const severityOrder: { [key in WarningLevel]: number } = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return warnings.sort((a, b) => severityOrder[a.level] - severityOrder[b.level]);
};

/**
 * Tính toán summary cho từng ngày
 */
const calculateDailySummaries = (forecast: ForecastData): DailyWeatherSummary[] => {
  const forecastByDay: { [key: string]: ForecastItem[] } = {};
  
  // Group by day
  forecast.list.forEach((item) => {
    const dateKey = new Date(item.dt * 1000).toISOString().split('T')[0];
    if (!forecastByDay[dateKey]) {
      forecastByDay[dateKey] = [];
    }
    forecastByDay[dateKey].push(item);
  });

  // Calculate daily summaries
  return Object.entries(forecastByDay)
    .slice(0, 3) // Only take 3 days
    .map(([date, items]) => {
      const temps = items.map(item => item.main.temp);
      const avgTemp = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
      const maxTemp = Math.max(...temps);
      const minTemp = Math.min(...temps);
      
      const avgHumidity = items.reduce((sum, item) => sum + item.main.humidity, 0) / items.length;
      const totalRain = items.reduce((sum, item) => sum + (item.rain?.['3h'] || 0), 0);
      const description = items[0].weather[0].description;

      return {
        date,
        avgTemp: Math.round(avgTemp * 10) / 10,
        avgHumidity: Math.round(avgHumidity),
        totalRain: Math.round(totalRain * 10) / 10,
        maxTemp: Math.round(maxTemp * 10) / 10,
        minTemp: Math.round(minTemp * 10) / 10,
        description,
      };
    });
};

/**
 * Get weather icon emoji
 */
export const getWeatherIcon = (iconCode: string, description: string): string => {
  // OpenWeatherMap icon codes
  if (iconCode.startsWith('01')) return '☀️'; // Clear sky
  if (iconCode.startsWith('02')) return '🌤️'; // Few clouds
  if (iconCode.startsWith('03')) return '⛅'; // Scattered clouds
  if (iconCode.startsWith('04')) return '☁️'; // Broken clouds
  if (iconCode.startsWith('09')) return '🌧️'; // Shower rain
  if (iconCode.startsWith('10')) return '🌦️'; // Rain
  if (iconCode.startsWith('11')) return '⛈️'; // Thunderstorm
  if (iconCode.startsWith('13')) return '❄️'; // Snow
  if (iconCode.startsWith('50')) return '🌫️'; // Mist
  
  // Fallback based on description
  const desc = description.toLowerCase();
  if (desc.includes('rain') || desc.includes('mưa')) return '🌧️';
  if (desc.includes('cloud') || desc.includes('mây')) return '☁️';
  if (desc.includes('clear') || desc.includes('quang')) return '☀️';
  if (desc.includes('storm') || desc.includes('giông')) return '⛈️';
  
  return '🌤️'; // Default
};

/**
 * Format temperature
 */
export const formatTemp = (temp: number): string => {
  return `${Math.round(temp)}°C`;
};

/**
 * Format humidity
 */
export const formatHumidity = (humidity: number): string => {
  return `${Math.round(humidity)}%`;
};

/**
 * Format rain
 */
export const formatRain = (rain: number): string => {
  if (rain === 0) return '0mm';
  return `${rain.toFixed(1)}mm`;
};

