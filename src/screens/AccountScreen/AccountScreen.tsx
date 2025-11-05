import { useAuth } from '@/hooks/useAuth';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import * as authService from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';

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

  // Biometric auth
  const {
    isBiometricSupported,
    isBiometricEnrolled,
    isBiometricEnabled,
    getBiometricType,
    enableBiometric: enableBio,
    disableBiometric,
    checkBiometricEnabled,
  } = useBiometricAuth();

  const [biometricType, setBiometricType] = useState('Biometric');
  const [isBiometricSwitching, setIsBiometricSwitching] = useState(false);

  /**
   * Initialize biometric type on mount
   */
  useEffect(() => {
    const init = async () => {
      const type = await getBiometricType();
      setBiometricType(type);
    };
    init();
  }, []);

  const handleChangeLanguage = async (lang: 'vi' | 'en') => {
    await changeLanguage(lang);
  };

  /**
   * Handle toggle biometric
   */
  const handleToggleBiometric = async (value: boolean) => {
    try {
      setIsBiometricSwitching(true);

      if (value) {
        // Enable biometric - need credentials
        showAlert({
          type: 'info',
          title: t('biometric.setupRequired', { defaultValue: 'Cần xác thực' }),
          message: t('biometric.setupMessage', {
            defaultValue: 'Để bật đăng nhập sinh trắc học, bạn cần đăng nhập lại để lưu thông tin xác thực.',
          }),
          buttons: [
            {
              text: t('common.cancel'),
              style: 'cancel',
            },
            {
              text: t('common.ok'),
              style: 'default',
              onPress: async () => {
                // Logout and redirect to login
                await logout();
                router.replace('/auth/login');
              },
            },
          ],
        });
      } else {
        // Disable biometric
        const success = await disableBiometric();
        if (success) {
          await checkBiometricEnabled(); // Refresh state
          showAlert({
            type: 'success',
            title: t('common.success'),
            message: t('biometric.disabled', {
              defaultValue: 'Đã tắt đăng nhập sinh trắc học.',
            }),
            buttons: [{ text: t('common.ok'), style: 'default' }],
          });
        } else {
          showAlert({
            type: 'error',
            title: t('common.error'),
            message: t('biometric.disableFailed', {
              defaultValue: 'Không thể tắt đăng nhập sinh trắc học.',
            }),
            buttons: [{ text: t('common.ok'), style: 'default' }],
          });
        }
      }
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: error.message || 'Failed to toggle biometric',
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });
    } finally {
      setIsBiometricSwitching(false);
    }
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

      {/* Biometric Section */}
      {isBiometricSupported && isBiometricEnrolled && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('settings.security', { defaultValue: 'Bảo mật' })}
          </Text>
          
          <View style={styles.biometricOption}>
            <View style={styles.biometricInfo}>
              <View style={styles.biometricHeader}>
                <Ionicons 
                  name={biometricType.toLowerCase().includes('face') ? 'scan' : 'finger-print'} 
                  size={24} 
                  color="#4CAF50" 
                />
                <Text style={styles.biometricTitle}>
                  {t('biometric.loginWith', { defaultValue: 'Đăng nhập bằng' })} {biometricType}
                </Text>
              </View>
              <Text style={styles.biometricDescription}>
                {t('biometric.description', {
                  defaultValue: 'Đăng nhập nhanh chóng và bảo mật với sinh trắc học.',
                })}
              </Text>
            </View>
            <Switch
              value={isBiometricEnabled}
              onValueChange={handleToggleBiometric}
              disabled={isBiometricSwitching}
              trackColor={{ false: '#D0D0D0', true: '#81C784' }}
              thumbColor={isBiometricEnabled ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
        </View>
      )}

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

