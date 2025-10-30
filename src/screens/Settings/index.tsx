import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { changeLanguage } from '@/i18n';
import { styles } from './styles';

/**
 * SettingsScreen - Màn hình cài đặt
 */
export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const currentLanguage = i18n.language;

  const handleChangeLanguage = async (lang: 'vi' | 'en') => {
    await changeLanguage(lang);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        
        <TouchableOpacity
          style={[styles.option, currentLanguage === 'vi' && styles.optionActive]}
          onPress={() => handleChangeLanguage('vi')}
        >
          <Text style={styles.optionText}>🇻🇳 {t('settings.vietnamese')}</Text>
          {currentLanguage === 'vi' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, currentLanguage === 'en' && styles.optionActive]}
          onPress={() => handleChangeLanguage('en')}
        >
          <Text style={styles.optionText}>🇬🇧 {t('settings.english')}</Text>
          {currentLanguage === 'en' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>{t('common.appName')}</Text>
          <Text style={styles.infoValue}>Bác sĩ Lúa</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>{t('settings.version')}</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}

