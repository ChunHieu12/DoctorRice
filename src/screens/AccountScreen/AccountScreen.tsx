import { useAuth } from '@/hooks/useAuth';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import * as authService from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { changeLanguage } from '@/i18n';
import { styles } from './styles';

/**
 * AccountScreen - Màn hình cài đặt tài khoản
 */
export default function AccountScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { logout, user } = useAuth();
  const { showAlert } = useCustomAlert();
  const currentLanguage = i18n.language;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleChangeLanguage = async (lang: 'vi' | 'en') => {
    await changeLanguage(lang);
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    showAlert({
      type: 'warning',
      title: t('auth.logout'),
      message: t('settings.logoutConfirm'),
      buttons: [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              showAlert({
                type: 'success',
                title: t('common.success'),
                message: t('auth.logoutSuccess'),
                buttons: [
                  {
                    text: t('common.ok'),
                    style: 'default',
                    onPress: () => router.replace('/auth/login'),
                  },
                ],
              });
            } catch (error: any) {
              showAlert({
                type: 'error',
                title: t('common.error'),
                message: error.message || 'Logout failed',
                buttons: [{ text: t('common.ok'), style: 'default' }],
              });
            }
          },
        },
      ],
    });
  };

  /**
   * Handle delete account
   */
  const handleDeleteAccount = async () => {
    showAlert({
      type: 'error',
      title: t('settings.deleteAccount'),
      message: t('settings.deleteAccountConfirm'),
      buttons: [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await authService.deleteAccount();
              
              showAlert({
                type: 'success',
                title: t('common.success'),
                message: t('settings.deleteAccountSuccess'),
                buttons: [
                  {
                    text: t('common.ok'),
                    style: 'default',
                    onPress: () => {
                      logout();
                      router.replace('/auth/login');
                    },
                  },
                ],
              });
            } catch (error: any) {
              showAlert({
                type: 'error',
                title: t('common.error'),
                message: error.message || 'Failed to delete account',
                buttons: [{ text: t('common.ok'), style: 'default' }],
              });
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Info Section */}
      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.userInfo')}</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>{t('auth.name')}</Text>
            <Text style={styles.infoValue}>{user.name || 'N/A'}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>{t('auth.email')}</Text>
            <Text style={styles.infoValue}>{user.email || 'N/A'}</Text>
          </View>
        </View>
      )}

      {/* Language Section */}
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

      {/* About Section */}
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

      {/* Account Actions Section */}
      <View style={styles.accountActionsSection}>
        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>{t('auth.logout')}</Text>
        </TouchableOpacity>

        {/* Delete Account Button */}
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          activeOpacity={0.8}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>{t('settings.deleteAccount')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

