import { useAuth } from '@/hooks/useAuth';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import * as authService from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { styles } from './styles';

/**
 * HomeScreen - Màn hình chính của ứng dụng
 * Hiển thị welcome message và các actions chính
 */
export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { logout, user } = useAuth();
  const { showAlert } = useCustomAlert();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCamera = () => {
    // TODO: Navigate to camera screen
    router.push('/camera' as any);
  };

  const handleViewGallery = () => {
    // TODO: Navigate to gallery screen
    router.push('/gallery' as any);
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

      {/* Temporary Account Actions */}
      <View style={styles.accountActionsContainer}>
        <Text style={styles.accountActionsTitle}>Tài khoản (Tạm thời)</Text>
        
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

