import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { styles } from './styles';

/**
 * WeatherScreen - Màn hình thời tiết
 * Hiển thị thông tin thời tiết cho nông nghiệp
 */
export default function WeatherScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.icon}>🌤️</Text>
        <Text style={styles.title}>{t('weather.title')}</Text>
        <Text style={styles.subtitle}>{t('weather.subtitle')}</Text>
      </View>

      {/* Placeholder */}
      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderText}>
          {t('weather.comingSoon', { defaultValue: 'Thông tin thời tiết đang được cập nhật...' })}
        </Text>
      </View>
    </ScrollView>
  );
}

