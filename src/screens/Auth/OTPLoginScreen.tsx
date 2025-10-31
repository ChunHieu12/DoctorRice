/**
 * OTP Login Screen
 * Quick login with phone OTP verification via Twilio SMS
 */
import { useAuth } from '@/hooks/useAuth';
import * as authService from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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

const OTPLoginScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { loginWithOTP } = useAuth();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpInputRef = useRef<TextInput>(null);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  /**
   * Validate phone number
   */
  const isValidPhone = (phoneNumber: string): boolean => {
    const phoneRegex = /^[0-9]{9,10}$/;
    return phoneRegex.test(phoneNumber);
  };

  /**
   * Send OTP to phone
   */
  const handleSendOTP = async () => {
    try {
      if (!phone.trim()) {
        Alert.alert(t('common.error'), t('auth.phoneRequired'));
        return;
      }

      if (!isValidPhone(phone)) {
        Alert.alert(t('common.error'), t('auth.invalidPhone'));
        return;
      }

      setIsLoading(true);

      const fullPhone = `+84${phone}`;

      // Send OTP via backend (Twilio)
      await authService.sendOTP(fullPhone);

      setOtpSent(true);
      setCountdown(60); // 60 seconds cooldown

      Alert.alert(t('common.success'), t('auth.otpSent', { phone: fullPhone }));

      // Focus OTP input
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 500);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify OTP and login/register
   */
  const handleVerifyOTP = async () => {
    try {
      if (!otp.trim()) {
        Alert.alert(t('common.error'), t('auth.otpRequired'));
        return;
      }

      if (otp.length !== 6) {
        Alert.alert(t('common.error'), t('auth.invalidOTP'));
        return;
      }

      setIsLoading(true);

      const fullPhone = `+84${phone}`;

      // Verify OTP with backend (Twilio)
      const result = await loginWithOTP(fullPhone, otp);

      if (result.userExists) {
        // User exists - login successful
        Alert.alert(t('common.success'), t('auth.loginSuccess'));
        router.replace('/(tabs)');
      } else {
        // User doesn't exist - navigate to complete registration
        router.push({
          pathname: '/auth/complete-registration',
          params: { phone: fullPhone },
        });
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('auth.invalidOTP'));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resend OTP
   */
  const handleResendOTP = () => {
    setOtp('');
    setOtpSent(false);
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
            <Text style={styles.title}>{t('auth.quickLoginOTP')}</Text>
            <Text style={styles.subtitle}>
              {otpSent ? t('auth.enterOTP') : 'Nhập số điện thoại để nhận mã xác thực'}
            </Text>

            {!otpSent ? (
              <>
                {/* Phone Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.phonePrefix}>
                    <Text style={styles.phonePrefixText}>+84</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder={t('auth.enterPhone')}
                    placeholderTextColor="#999"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    returnKeyType="done"
                    onSubmitEditing={handleSendOTP}
                    maxLength={10}
                    editable={!isLoading}
                  />
                </View>

                {/* Send OTP Button */}
                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleSendOTP}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>{t('auth.sendOTP')}</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* OTP Input */}
                <View style={styles.otpContainer}>
                  <TextInput
                    ref={otpInputRef}
                    style={styles.otpInput}
                    placeholder="000000"
                    placeholderTextColor="#999"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyOTP}
                    editable={!isLoading}
                  />
                </View>

                {/* Countdown / Resend */}
                <View style={styles.resendContainer}>
                  {countdown > 0 ? (
                    <Text style={styles.countdownText}>
                      Gửi lại mã sau {countdown}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendOTP}>
                      <Text style={styles.resendText}>{t('auth.resendOTP')}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>{t('auth.verifyOTP')}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Back to login */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backToLogin}>
              <Text style={styles.backToLoginText}>
                {t('auth.alreadyHaveAccount')} <Text style={styles.loginLink}>{t('auth.login')}</Text>
              </Text>
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
    marginBottom: 24,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  phonePrefix: {
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  phonePrefixText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingLeft: 12,
  },
  otpContainer: {
    marginBottom: 16,
  },
  otpInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  countdownText: {
    fontSize: 14,
    color: '#999',
  },
  resendText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  backToLogin: {
    alignItems: 'center',
    marginTop: 8,
  },
  backToLoginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default OTPLoginScreen;

