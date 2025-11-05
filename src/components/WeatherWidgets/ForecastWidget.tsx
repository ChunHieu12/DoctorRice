/**
 * Forecast Widget
 * Hiển thị dự báo 3 ngày tới (scroll ngang)
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { ForecastData, ForecastItem } from '@/types/weather.types';
import { formatHumidity, formatRain, formatTemp, getWeatherIcon } from '@/utils/weatherWarnings';

interface ForecastWidgetProps {
  forecast: ForecastData;
  onDayPress?: (day: DayForecast) => void;
}

export interface DayForecast {
  date: string;
  dayName: string;
  avgTemp: number;
  maxTemp: number;
  minTemp: number;
  humidity: number;
  rain: number;
  icon: string;
  description: string;
  items: ForecastItem[];
}

export const ForecastWidget: React.FC<ForecastWidgetProps> = ({ forecast, onDayPress }) => {
  const { t } = useTranslation();

  // Group forecast by day
  const dailyForecasts = React.useMemo(() => {
    const byDay: { [key: string]: ForecastItem[] } = {};
    
    forecast.list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toLocaleDateString('vi-VN');
      
      if (!byDay[dateKey]) {
        byDay[dateKey] = [];
      }
      byDay[dateKey].push(item);
    });

    // Calculate daily summaries
    return Object.entries(byDay)
      .slice(0, 3) // Only 3 days
      .map(([dateKey, items]): DayForecast => {
        const date = new Date(items[0].dt * 1000);
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const dayName = dayNames[date.getDay()];
        
        const temps = items.map(i => i.main.temp);
        const avgTemp = temps.reduce((sum, t) => sum + t, 0) / temps.length;
        const maxTemp = Math.max(...temps);
        const minTemp = Math.min(...temps);
        
        const humidity = items.reduce((sum, i) => sum + i.main.humidity, 0) / items.length;
        const rain = items.reduce((sum, i) => sum + (i.rain?.['3h'] || 0), 0);
        
        const mainWeather = items[0].weather[0];
        const icon = getWeatherIcon(mainWeather.icon, mainWeather.description);
        
        return {
          date: dateKey,
          dayName,
          avgTemp: Math.round(avgTemp),
          maxTemp: Math.round(maxTemp),
          minTemp: Math.round(minTemp),
          humidity: Math.round(humidity),
          rain: Math.round(rain * 10) / 10,
          icon,
          description: mainWeather.description,
          items,
        };
      });
  }, [forecast]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('weather.forecast3Days')}</Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dailyForecasts.map((day, index) => (
          <TouchableOpacity
            key={day.date}
            style={[styles.dayCard, index === 0 && styles.firstCard]}
            onPress={() => onDayPress?.(day)}
            activeOpacity={0.7}
          >
            {/* Day name */}
            <Text style={styles.dayName}>{day.dayName}</Text>
            <Text style={styles.dateText}>
              {new Date(day.items[0].dt * 1000).getDate()}/
              {new Date(day.items[0].dt * 1000).getMonth() + 1}
            </Text>

            {/* Weather icon */}
            <Text style={styles.weatherIcon}>{day.icon}</Text>

            {/* Temperature */}
            <Text style={styles.avgTemp}>{formatTemp(day.avgTemp)}</Text>
            <View style={styles.tempRange}>
              <Text style={styles.minTemp}>{day.minTemp}°</Text>
              <View style={styles.tempBar} />
              <Text style={styles.maxTemp}>{day.maxTemp}°</Text>
            </View>

            {/* Details */}
            <View style={styles.details}>
              <Text style={styles.detailText}>💧 {formatHumidity(day.humidity)}</Text>
              {day.rain > 0 && (
                <Text style={styles.detailText}>🌧️ {formatRain(day.rain)}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.hint}>{t('weather.swipeForMore')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  firstCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  dayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  weatherIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  avgTemp: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  tempRange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  minTemp: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  tempBar: {
    width: 40,
    height: 3,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 6,
    borderRadius: 2,
  },
  maxTemp: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
  },
  details: {
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    marginHorizontal: 16,
  },
});

