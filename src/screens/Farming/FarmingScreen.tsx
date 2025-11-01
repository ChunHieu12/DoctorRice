import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { styles } from './styles';

/**
 * FarmingScreen - Màn hình nông vụ
 * Hiển thị thông tin nông vụ và quản lý lúa
 */
export default function FarmingScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.icon}>🌾</Text>
        <Text style={styles.title}>{t('farming.title')}</Text>
        <Text style={styles.subtitle}>{t('farming.subtitle')}</Text>
      </View>

      {/* Placeholder */}
      <View style={styles.placeholderBox}>
        <Text style={styles.placeholderText}>
          {t('farming.comingSoon', { defaultValue: 'Thông tin nông vụ đang được cập nhật...' })}
        </Text>
      </View>
    </ScrollView>
  );
}

