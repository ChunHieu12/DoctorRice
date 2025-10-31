/**
 * Complete Registration Screen
 * For new users after OTP verification
 */
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
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
   * Handle complete registration
   */
  const handleComplete = async () => {
    try {
      // Validation
      if (!name.trim()) {
        Alert.alert(t('common.error'), t('auth.nameRequired'));
        return;
      }

      if (!password.trim()) {
        Alert.alert(t('common.error'), t('auth.passwordRequired'));
        return;
      }

      if (password.length < 6) {
        Alert.alert(t('common.error'), t('auth.passwordTooShort'));
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert(t('common.error'), t('auth.passwordsNotMatch'));
        return;
      }

      if (!phone) {
        Alert.alert(t('common.error'), 'Invalid session. Please try again.');
        router.back();
        return;
      }

      setIsLoading(true);

      // Complete registration
      await completeRegistration(phone, name, password);

      Alert.alert(t('common.success'), t('auth.registerSuccess'));

      // Navigate to home
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
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
              source={require('@/assets/images/logo2.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>{t('common.appName')}</Text>
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
              <Text style={[styles.requirement, password.length >= 6 && styles.requirementMet]}>
                • Ít nhất 6 ký tự
              </Text>
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
  requirement: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  requirementMet: {
    color: '#4CAF50',
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

