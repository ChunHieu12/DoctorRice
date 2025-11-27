/**
 * Complete Registration Screen
 * For new users after OTP verification
 */
import { useAuth } from '@/hooks/useAuth';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const CompleteRegistrationScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { completeRegistration } = useAuth();
  const { showAlert } = useCustomAlert();
  const params = useLocalSearchParams();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  const phone = params.phone as string;

  /**
   * Validate password strength
   * Requirements: >6 chars, uppercase, lowercase, number
   */
  const isPasswordStrong = (pwd: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (pwd.length <= 6) {
      errors.push(t('auth.passwordTooShort'));
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push(t('auth.passwordNeedsUppercase'));
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push(t('auth.passwordNeedsLowercase'));
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push(t('auth.passwordNeedsNumber'));
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  /**
   * Handle complete registration
   */
  const handleComplete = async () => {
    try {
      // Validation
      if (!name.trim()) {
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: t('auth.nameRequired'),
          buttons: [{ text: t('common.ok'), style: 'default' }],
        });
        return;
      }

      if (!password.trim()) {
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: t('auth.passwordRequired'),
          buttons: [{ text: t('common.ok'), style: 'default' }],
        });
        return;
      }

      // Check password strength
      const passwordCheck = isPasswordStrong(password);
      if (!passwordCheck.valid) {
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: passwordCheck.errors.join('\n'),
          buttons: [{ text: t('common.ok'), style: 'default' }],
        });
        return;
      }

      if (password !== confirmPassword) {
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: t('auth.passwordsNotMatch'),
          buttons: [{ text: t('common.ok'), style: 'default' }],
        });
        return;
      }

      if (!phone) {
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: 'Invalid session. Please try again.',
          buttons: [
            {
              text: t('common.ok'),
              style: 'default',
              onPress: () => router.back(),
            },
          ],
        });
        return;
      }

      setIsLoading(true);

      // Complete registration
      await completeRegistration(phone, name, password);
      
      setIsLoading(false);

      // Navigate to home
      router.replace('/(tabs)');
      
      // Show success message after navigation
      setTimeout(() => {
        showAlert({
          type: 'success',
          title: t('common.success'),
          message: t('auth.registerSuccess'),
          buttons: [{ text: t('common.ok'), style: 'default' }],
        });
      }, 500);
    } catch (error: any) {
      setIsLoading(false);
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: error.message || 'Registration failed',
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });
    }
  };

  return (
    <ImageBackground
      source={require('@/assets/images/splash-img-1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2E7D32" />
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/logo-img.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>{t('auth.completeRegistration')}</Text>
            <Text style={styles.subtitle}>
              Hoàn tất thông tin để tạo tài khoản
            </Text>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.enterName')}
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                autoCapitalize="words"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                ref={passwordInputRef}
                style={styles.input}
                placeholder={t('auth.enterPassword')}
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                ref={confirmPasswordInputRef}
                style={styles.input}
                placeholder={t('auth.confirmPassword')}
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                returnKeyType="done"
                onSubmitEditing={handleComplete}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Yêu cầu mật khẩu:</Text>
              <View style={styles.requirementRow}>
                <Ionicons
                  name={password.length > 6 ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={password.length > 6 ? '#4CAF50' : '#999'}
                />
                <Text style={[styles.requirement, password.length > 6 && styles.requirementMet]}>
                  Trên 6 ký tự
                </Text>
              </View>
              <View style={styles.requirementRow}>
                <Ionicons
                  name={/[A-Z]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={/[A-Z]/.test(password) ? '#4CAF50' : '#999'}
                />
                <Text style={[styles.requirement, /[A-Z]/.test(password) && styles.requirementMet]}>
                  Ít nhất 1 chữ HOA (A-Z)
                </Text>
              </View>
              <View style={styles.requirementRow}>
                <Ionicons
                  name={/[a-z]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={/[a-z]/.test(password) ? '#4CAF50' : '#999'}
                />
                <Text style={[styles.requirement, /[a-z]/.test(password) && styles.requirementMet]}>
                  Ít nhất 1 chữ thường (a-z)
                </Text>
              </View>
              <View style={styles.requirementRow}>
                <Ionicons
                  name={/[0-9]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={/[0-9]/.test(password) ? '#4CAF50' : '#999'}
                />
                <Text style={[styles.requirement, /[0-9]/.test(password) && styles.requirementMet]}>
                  Ít nhất 1 chữ số (0-9)
                </Text>
              </View>
            </View>

            {/* Complete Button */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleComplete}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('common.done')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 8,
  },
  requirementsContainer: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#F5F9F5',
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirement: {
    fontSize: 13,
    color: '#999',
    marginLeft: 8,
  },
  requirementMet: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#B0B0B0',
    shadowOpacity: 0.1,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default CompleteRegistrationScreen;

