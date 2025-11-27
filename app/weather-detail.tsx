/**
 * Weather Detail Screen
 * Chi tiết thời tiết 3 ngày + cảnh báo mùa vụ + Chatbot integration
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ChatbotModal from '@/components/ChatbotModal';
import { WarningCard } from '@/components/WeatherWidgets';
import { getWeatherForecast } from '@/services/weather.service';
import type { ForecastData, ForecastItem, WeatherData, WeatherWarning } from '@/types/weather.types';
import { calculateWeatherWarnings, formatHumidity, formatTemp, getWeatherIcon } from '@/utils/weatherWarnings';

// Hide system header (we have custom header)
export const options = {
  headerShown: false,
};

export default function WeatherDetailScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    locationName: string;
    lat: string;
    lon: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
  const dayNames = useMemo(
    () => [
      t('weather.dayNames.sunday'),
      t('weather.dayNames.monday'),
      t('weather.dayNames.tuesday'),
      t('weather.dayNames.wednesday'),
      t('weather.dayNames.thursday'),
      t('weather.dayNames.friday'),
      t('weather.dayNames.saturday'),
    ],
    [t]
  );

  /**
   * Fetch weather data
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const lat = parseFloat(params.lat);
        const lon = parseFloat(params.lon);

        const { current: currentData, forecast: forecastData } = await getWeatherForecast(lat, lon);
        
        setCurrent(currentData);
        setForecast(forecastData);
      } catch (error) {
        console.error('❌ Failed to fetch weather:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.lat, params.lon]);

  /**
   * Open chatbot with weather context
   */
  const handleOpenChatbot = () => {
    setIsChatbotVisible(true);
  };

  /**
   * Calculate daily summaries for 3 days
   */
  const dailySummaries = useMemo(() => {
    if (!forecast) return [];

    const byDay: Record<string, ForecastItem[]> = {};
    
    forecast.list.forEach((item) => {
      const dateKey = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!byDay[dateKey]) {
        byDay[dateKey] = [];
      }
      byDay[dateKey].push(item);
    });

    return Object.entries(byDay)
      .slice(0, 3)
      .map(([dateKey, items]) => {
        const referenceDate = new Date(items[0].dt * 1000);
        const temps = items.map((i) => i.main.temp);
        const avgTemp = temps.reduce((sum, value) => sum + value, 0) / temps.length;
        const maxTemp = Math.max(...temps);
        const minTemp = Math.min(...temps);
        
        const avgHumidity =
          items.reduce((sum, i) => sum + i.main.humidity, 0) / items.length;
        const totalRain = items.reduce((sum, i) => sum + (i.rain?.['3h'] || 0), 0);
        
        const mainWeather = items[0].weather[0];
        const icon = getWeatherIcon(mainWeather.icon, mainWeather.description);
        
        return {
          dateKey,
          dayName: dayNames[referenceDate.getDay()],
          dateLabel: referenceDate.toLocaleDateString(locale, {
            day: 'numeric',
            month: 'numeric',
          }),
          avgTemp: Math.round(avgTemp),
          maxTemp: Math.round(maxTemp),
          minTemp: Math.round(minTemp),
          humidity: Math.round(avgHumidity),
          rain: Math.round(totalRain * 10) / 10,
          icon,
          description: mainWeather.description,
          wind: items[0].wind.speed,
          pressure: items[0].main.pressure,
        };
      });
  }, [forecast, dayNames, locale]);

  const warnings = useMemo<WeatherWarning[]>(() => {
    if (!current || !forecast) {
      return [];
    }
    return calculateWeatherWarnings(current, forecast, t);
  }, [current, forecast, t]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>{t('weather.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Generate weather context for chatbot
  const weatherContext = current && forecast ? `
Thông tin thời tiết hiện tại tại ${params.locationName}:
- Nhiệt độ: ${formatTemp(current.main.temp)}
- Độ ẩm: ${formatHumidity(current.main.humidity)}
- Thời tiết: ${current.weather[0].description}

Dự báo 3 ngày tới:
${dailySummaries.map((day, idx) => `
${idx + 1}. ${day.dayName} (${day.dateLabel}):
   - Nhiệt độ: ${day.minTemp}°C - ${day.maxTemp}°C (TB: ${day.avgTemp}°C)
   - Độ ẩm: ${day.humidity}%
   - Lượng mưa: ${day.rain}mm
`).join('\n')}

Cảnh báo hiện tại:
${warnings.map((w, idx) => `${idx + 1}. ${w.title}: ${w.description}`).join('\n')}
` : '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('weather.detail')}</Text>
          <Text style={styles.headerLocation}>📍 {params.locationName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Current Weather Summary */}
        {current && (
          <View style={styles.currentSummary}>
            <Text style={styles.currentIcon}>{getWeatherIcon(current.weather[0].icon, current.weather[0].description)}</Text>
            <Text style={styles.currentTemp}>{formatTemp(current.main.temp)}</Text>
            <Text style={styles.currentDescription}>{current.weather[0].description}</Text>
            <Text style={styles.currentHumidity}>💧 {formatHumidity(current.main.humidity)}</Text>
          </View>
        )}

        {/* Daily Forecasts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('weather.forecast3Days')}</Text>
          {dailySummaries.map((day, index) => (
            <View key={day.dateKey} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <View>
                  <Text style={styles.dayName}>{day.dayName}</Text>
                <Text style={styles.dayDate}>{day.dateLabel}</Text>
                </View>
                <Text style={styles.dayIcon}>{day.icon}</Text>
              </View>

              <View style={styles.dayDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>🌡️ {t('weather.temperature')}:</Text>
                  <Text style={styles.detailValue}>
                    {day.minTemp}°C - {day.maxTemp}°C (TB: {day.avgTemp}°C)
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>💧 {t('weather.humidity')}:</Text>
                  <Text style={styles.detailValue}>{day.humidity}%</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>🌧️ {t('weather.rain')}:</Text>
                  <Text style={styles.detailValue}>{day.rain} mm</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>💨 {t('weather.wind')}:</Text>
                  <Text style={styles.detailValue}>{day.wind.toFixed(1)} m/s</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>🔽 {t('weather.pressure')}:</Text>
                  <Text style={styles.detailValue}>{day.pressure} hPa</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Warnings */}
        {warnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('weather.warnings')}</Text>
            {warnings.map((warning) => (
              <WarningCard key={warning.id} warning={warning} />
            ))}
          </View>
        )}

        {/* Chatbot Button */}
        <TouchableOpacity style={styles.chatbotButton} onPress={handleOpenChatbot}>
          <Text style={styles.chatbotButtonText}>💬 {t('weather.askDoctorRice')}</Text>
          <Text style={styles.chatbotButtonSubtext}>{t('weather.weatherAdvice')}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Chatbot Modal */}
      <ChatbotModal
        visible={isChatbotVisible}
        onClose={() => setIsChatbotVisible(false)}
        weatherContext={weatherContext}
        prefillQuestion={t('weather.prefillQuestion')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#4CAF50',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  currentSummary: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  currentIcon: {
    fontSize: 72,
    marginBottom: 16,
  },
  currentTemp: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  currentDescription: {
    fontSize: 20,
    color: '#333',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  currentHumidity: {
    fontSize: 18,
    color: '#666',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dayDate: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  dayIcon: {
    fontSize: 48,
  },
  dayDetails: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  chatbotButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  chatbotButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  chatbotButtonSubtext: {
    fontSize: 14,
    color: '#E8F5E9',
  },
});

