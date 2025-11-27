/**
 * ChangePasswordScreen
 * Đổi mật khẩu với 3 inputs: Current, New, Confirm
 */
import { useTextSize } from '@/contexts/TextSizeContext';
import { useAuth } from '@/hooks/useAuth';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { changePassword } from '@/services/user.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { logout } = useAuth();
  const { showAlert } = useCustomAlert();
  const { scale } = useTextSize();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: t('auth.passwordRequired'),
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: t('changePassword.passwordMismatch'),
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });
      return;
    }

    if (newPassword.length < 6) {
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: t('auth.passwordTooShort'),
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });
      return;
    }

    try {
      setIsLoading(true);
      await changePassword(currentPassword, newPassword);
      
      // Auto logout after successful password change
      showAlert({
        type: 'success',
        title: t('common.success'),
        message: t('changePassword.successAndLogout'),
        buttons: [
          {
            text: t('common.ok'),
            style: 'default',
            onPress: async () => {
              await logout();
              router.replace('/auth/login');
            },
          },
        ],
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: error.message || t('changePassword.currentPasswordIncorrect'),
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: 20 * scale }]}>{t('changePassword.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { fontSize: 16 * scale }]}>{t('changePassword.currentPassword')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t('changePassword.currentPassword')}
                placeholderTextColor="#999"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrent}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                <Ionicons
                  name={showCurrent ? 'eye-off' : 'eye'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { fontSize: 16 * scale }]}>{t('changePassword.newPassword')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t('changePassword.newPassword')}
                placeholderTextColor="#999"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                <Ionicons
                  name={showNew ? 'eye-off' : 'eye'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { fontSize: 16 * scale }]}>{t('changePassword.confirmNewPassword')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t('changePassword.confirmNewPassword')}
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Ionicons
                  name={showConfirm ? 'eye-off' : 'eye'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.saveButtonText, { fontSize: 16 * scale }]}>{t('changePassword.save')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={[styles.cancelButtonText, { fontSize: 16 * scale }]}>{t('changePassword.cancel')}</Text>
          </TouchableOpacity>

          {/* Forgot Password Link
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={() => router.push('/auth/forgot-password')}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={[styles.forgotPasswordText, { fontSize: 15 * scale }]}>{t('changePassword.forgotPassword')}</Text>
          </TouchableOpacity> */}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Form
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 14,
  },

  // Buttons
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  forgotPasswordButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
});

