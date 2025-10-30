import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { styles } from './styles';

/**
 * HomeScreen - Màn hình chính của ứng dụng
 * Hiển thị welcome message và các actions chính
 */
export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const handleOpenCamera = () => {
    // TODO: Navigate to camera screen
    router.push('/camera' as any);
  };

  const handleViewGallery = () => {
    // TODO: Navigate to gallery screen
    router.push('/gallery' as any);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.title}>{t('home.welcome')}</Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleOpenCamera}>
          <Text style={styles.primaryButtonText}>📸 {t('camera.takePicture')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleViewGallery}>
          <Text style={styles.secondaryButtonText}>🖼️ {t('gallery.myPhotos')}</Text>
        </TouchableOpacity>
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

