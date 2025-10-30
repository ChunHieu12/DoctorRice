import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';

import { styles } from './styles';

/**
 * CameraScreen - Màn hình chụp ảnh
 * TODO: Implement camera functionality với expo-camera
 */
export default function CameraScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.placeholderContainer}>
        <Text style={styles.icon}>📸</Text>
        <Text style={styles.title}>{t('camera.title')}</Text>
        <Text style={styles.subtitle}>Camera feature coming soon...</Text>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

