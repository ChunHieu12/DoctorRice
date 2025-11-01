import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';

import { styles } from './styles';

/**
 * GalleryScreen - Thư viện ảnh
 * TODO: Implement photo gallery với data từ API
 */
export default function GalleryScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('gallery.title')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🖼️</Text>
        <Text style={styles.emptyTitle}>{t('gallery.noPhotos')}</Text>
        <Text style={styles.emptySubtitle}>
          Chụp ảnh đầu tiên của bạn để xem tại đây
        </Text>
      </View>
    </View>
  );
}

