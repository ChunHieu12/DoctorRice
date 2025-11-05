/**
 * Forgot Password Screen
 * Reset password with phone OTP verification via Firebase
 */
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { useFirebasePhoneAuth } from '@/hooks/useFirebasePhoneAuth';
import * as authService from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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

const ForgotPasswordScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { showAlert } = useCustomAlert();
  const { sendOTP, verifyOTP, getFirebaseToken, isLoading: otpLoading } = useFirebasePhoneAuth();

  const [step, setStep] = useState<'phone' | 'otp' | 'password'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

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
   * Send OTP to phone via Backend
   */
  const handleSendOTP = async () => {
    try {
      if (!phone.trim()) {
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: t('auth.phoneRequired'),
          buttons: [{ text: t('common.ok'), style: 'default' }],
        });
        return;
      }

      if (!isValidPhone(phone)) {
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: t('auth.invalidPhone'),
          buttons: [{ text: t('common.ok'), style: 'default' }],
        });
        return;
      }

      setIsLoading(true);

      const fullPhone = `+84${phone}`;

      // Check if phone exists
      const phoneExists = await authService.checkPhoneExists(fullPhone);
      
      if (!phoneExists) {
        setIsLoading(false);
        // Phone not registered - ask user if they want to register
        showAlert({
          type: 'info',
          title: t('auth.phoneNotRegistered'),
          message: t('auth.phoneNotRegisteredMessage'),
          buttons: [
            {
              text: t('common.cancel'),
              style: 'cancel',
              onPress: () => {
                // Do nothing, just close alert
              },
            },
            {
              text: t('auth.register'),
              style: 'default',
              onPress: () => {
                // Navigate to OTP login for registration
                router.push('/auth/otp-login');
              },
            },
          ],
        });
        return;
      }

      // Phone exists - send OTP via Firebase
      await sendOTP(fullPhone);

      setStep('otp');
      setCountdown(60);

      showAlert({
        type: 'success',
        title: t('common.success'),
        message: t('auth.otpSent', { phone: fullPhone }),
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });

      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 500);
    } catch (error: any) {
      console.error('OTP Send Error:', error);
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: error.message || 'Failed to send OTP',
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify OTP with Backend
   */
  const handleVerifyOTP = async () => {
    try {
      if (!otp.trim()) {
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: t('auth.otpRequired'),
          buttons: [{ text: t('common.ok'), style: 'default' }],
        });
        return;
      }

      if (otp.length !== 6) {
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: t('auth.invalidOTP'),
          buttons: [{ text: t('common.ok'), style: 'default' }],
        });
        return;
      }

      setIsLoading(true);

      const fullPhone = `+84${phone}`;

      // Step 1: Verify OTP with Firebase
      await verifyOTP(otp);

      // Step 2: Get Firebase ID Token
      const firebaseToken = await getFirebaseToken();

      // Step 3: Verify with Backend
      const verifyResult = await authService.verifyFirebaseOTP(fullPhone, firebaseToken);

      if (!verifyResult.userExists) {
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: 'Phone number not registered',
          buttons: [
            {
              text: t('common.ok'),
              style: 'default',
              onPress: () => setStep('phone'),
            },
          ],
        });
        setIsLoading(false);
        return;
      }

      // OTP verified successfully, proceed to password reset
      setVerifiedPhone(fullPhone);
      setStep('password');

      showAlert({
        type: 'success',
        title: t('common.success'),
        message: t('auth.otpVerifySuccess'),
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });

      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 500);
    } catch (error: any) {
      console.error('OTP Verify Error:', error);
      
      // Check if error is session-expired
      const isExpiredError = 
        error.message?.includes('expired') || 
        error.code === 'auth/session-expired' ||
        error.code === 'auth/code-expired';

      if (isExpiredError) {
        // OTP expired - offer to resend
        showAlert({
          type: 'warning',
          title: t('auth.otpExpired'),
          message: t('auth.otpExpiredMessage'),
          buttons: [
            {
              text: t('common.cancel'),
              style: 'cancel',
            },
            {
              text: t('auth.resendOTP'),
              style: 'default',
              onPress: () => {
                setOtp('');
                setStep('phone');
                setCountdown(0);
              },
            },
          ],
        });
      } else {
        // Other errors
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: error.message || t('auth.invalidOTP'),
          buttons: [{ text: t('common.ok'), style: 'default' }],
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset password
   */
  const handleResetPassword = async () => {
    try {
      if (!password.trim()) {
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: t('auth.passwordRequired'),
          buttons: [{ text: t('common.ok'), style: 'default' }],
        });
        return;
      }

      if (password.length < 6) {
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: t('auth.passwordTooShort'),
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

      setIsLoading(true);

      // Reset password
      await authService.resetPassword(verifiedPhone, password);

      showAlert({
        type: 'success',
        title: t('common.success'),
        message: t('auth.passwordResetSuccess'),
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
        message: error.message || 'Password reset failed',
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resend OTP
   */
  const handleResendOTP = () => {
    setOtp('');
    setStep('phone');
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
            <Text style={styles.title}>{t('auth.resetPassword')}</Text>
            <Text style={styles.subtitle}>
              {step === 'phone' && 'Nhập số điện thoại để nhận mã xác thực'}
              {step === 'otp' && 'Nhập mã xác thực đã được gửi tới số điện thoại của bạn'}
              {step === 'password' && 'Nhập mật khẩu mới của bạn'}
            </Text>

            {step === 'phone' && (
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

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleSendOTP}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>{t('auth.sendOTP')}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {step === 'otp' && (
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

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>{t('auth.verifyOTP')}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {step === 'password' && (
              <>
                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.input}
                    placeholder={t('auth.newPassword')}
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
                    onSubmitEditing={handleResetPassword}
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
                  <Text style={[styles.requirement, password.length >= 6 && styles.requirementMet]}>
                    • Ít nhất 6 ký tự
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>{t('common.done')}</Text>
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
    marginBottom: 16,
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
  requirementsContainer: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#F5F9F5',
    borderRadius: 8,
  },
  requirement: {
    fontSize: 13,
    color: '#999',
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

export default ForgotPasswordScreen;

