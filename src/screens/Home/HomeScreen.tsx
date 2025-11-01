import { useAuth } from '@/hooks/useAuth';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { styles } from './styles';

/**
 * HomeScreen - Màn hình chính của ứng dụng
 * Hiển thị welcome message
 */
export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.title}>{t('home.welcome')}</Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
        {user && (
          <Text style={styles.userInfo}>
            {t('home.hello')}, {user.name || user.email}!
          </Text>
        )}
      </View>

      {/* Recent Photos Section - Placeholder */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>{t('home.recentPhotos')}</Text>
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>{t('gallery.noPhotos')}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

