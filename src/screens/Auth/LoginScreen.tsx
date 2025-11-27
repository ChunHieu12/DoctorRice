/**
 * Login Screen
 * Main authentication screen with phone/password login
 */
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { LoadingModal } from '@/components/ui/LoadingModal';
import { useAuth } from '@/hooks/useAuth';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';
import * as authService from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
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

const LoginScreen: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { login, setAuthUser } = useAuth();
  const { showAlert } = useCustomAlert();
  const { signInWithGoogle, isLoading: isGoogleLoading } = useGoogleSignIn();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [loadingSavedCredentials, setLoadingSavedCredentials] = useState(true);

  const passwordInputRef = useRef<TextInput>(null);

  /**
   * Initialize: Load saved credentials
   */
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const saved = await authService.getSavedLoginCredentials();
      if (saved) {
        setPhone(saved.phone.replace('+84', ''));
        setPassword(saved.password);
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Failed to load saved credentials:', error);
    } finally {
      setLoadingSavedCredentials(false);
    }
  };

  /**
   * Validate phone number (Vietnamese format)
   */
  const isValidPhone = (phoneNumber: string): boolean => {
    const phoneRegex = /^[0-9]{9,10}$/;
    return phoneRegex.test(phoneNumber);
  };

  /**
   * Perform login
   */
  const performLogin = async (
    phoneNumber: string,
    pwd: string,
    remember: boolean = false
  ) => {
    try {
      setIsLoading(true);
      setLoadingMessage(t('auth.loggingIn') || 'Đang đăng nhập...');

      // Format phone - handle both 0xxx and xxx formats
      let formattedPhone = phoneNumber;
      if (!formattedPhone.startsWith('+')) {
        // Remove leading 0 if present, then add +84
        const cleanPhone = formattedPhone.startsWith('0')
          ? formattedPhone.substring(1)
          : formattedPhone;
        formattedPhone = `+84${cleanPhone}`;
      }

      // Login
      await login(formattedPhone, pwd, remember);

      setIsLoading(false);

      // Navigate to home
        router.replace('/(tabs)');
        
        // Show success message after navigation
        setTimeout(() => {
          showAlert({
            type: 'success',
            title: t('common.success'),
            message: t('auth.loginSuccess'),
            buttons: [{ text: t('common.ok'), style: 'default' }],
          });
        }, 500);
    } catch (error: any) {
      setIsLoading(false);
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: error.message || t('auth.invalidCredentials'),
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });
      throw error;
    }
  };

  /**
   * Handle login with password
   */
  const handleLogin = async () => {
    try {
      // Validation
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

      if (!password.trim()) {
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: t('auth.passwordRequired'),
          buttons: [{ text: t('common.ok'), style: 'default' }],
        });
        return;
      }

      if (!agreeTerms) {
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: t('auth.mustAgreeTerms'),
          buttons: [{ text: t('common.ok'), style: 'default' }],
        });
        return;
      }

      await performLogin(phone, password, rememberMe);
    } catch (error) {
      // Error already handled in performLogin
    }
  };

  /**
   * Handle Google Sign-In
   */
  const handleGoogleSignIn = async () => {
    try {
      if (!agreeTerms) {
        showAlert({
          type: 'warning',
          title: t('common.warning'),
          message: t('auth.pleaseAgreeTerms'),
          buttons: [{ text: t('common.ok'), style: 'default' }],
        });
        return;
      }

      setIsLoading(true);
      setLoadingMessage(t('auth.signingInWithGoogle') || 'Đang đăng nhập với Google...');

      // Sign in with Google
      const userCredential = await signInWithGoogle();

      setLoadingMessage(t('auth.verifying') || 'Đang xác thực...');

      // Get Firebase ID token
      const firebaseToken = await auth().currentUser?.getIdToken();

      if (!firebaseToken) {
        throw new Error('Failed to get Firebase token');
      }

      // Send token to backend
      const result = await authService.signInWithGoogle(firebaseToken);

      if (result.userExists && result.accessToken && result.refreshToken && result.user) {
        // Auto-login success - tokens already saved by authService
        console.log('✅ Google Sign-In successful, user:', result.user.name);
        
        // Update auth context with user data
        setAuthUser({
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          avatar: result.user.avatar,
        });
        
        setIsLoading(false);
        
        // Navigate immediately
        router.replace('/(tabs)');
          
          // Show success notification after navigation
          setTimeout(() => {
            showAlert({
              type: 'success',
              title: t('common.success'),
              message: `${t('auth.googleLoginSuccess')} ${result.user?.name || ''}`,
              buttons: [{ text: t('common.ok'), style: 'default' }],
            });
          }, 500);
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error('Google Sign-In Error:', error);
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: error.message || t('auth.googleLoginFailed'),
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });
    }
  };

  /**
   * Navigate to OTP login
   */
  const handleOTPLogin = () => {
    router.push('/auth/otp-login');
  };

  /**
   * Navigate to forgot password
   */
  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  /**
   * Navigate to privacy policy
   */
  const handlePrivacyPolicy = () => {
    router.push('/auth/privacy-policy');
  };

  /**
   * Navigate to terms
   */
  const handleTerms = () => {
    router.push('/auth/privacy-policy');
  };

  if (loadingSavedCredentials) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

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
          {/* Language Switcher */}
          <View style={styles.languageSwitcherContainer}>
            <LanguageSwitcher />
          </View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/logo-img.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>{t('auth.login')}</Text>

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
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                maxLength={10}
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
                returnKeyType="done"
                onSubmitEditing={handleLogin}
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

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.rememberForgotRow}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>{t('auth.rememberMe')}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
              </TouchableOpacity>
            </View>

            {/* Agree Terms Checkbox */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setAgreeTerms(!agreeTerms)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                  {agreeTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <View style={styles.termsTextContainer}>
                  <Text style={styles.termsText}>
                    {t('auth.agreeTerms')}{' '}
                    <Text style={styles.termsLink} onPress={handleTerms}>
                      {t('auth.termsAndConditions')}
                    </Text>
                    {' '}{t('auth.and')}{' '}
                    <Text style={styles.termsLink} onPress={handlePrivacyPolicy}>
                      {t('auth.privacyPolicy')}
                    </Text>
                    {' '}{t('auth.ofDoctorRice')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, (!agreeTerms || isLoading) && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={!agreeTerms || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('auth.orLoginWith')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialContainer}>
              {/* Google Login */}
              <TouchableOpacity 
                style={[
                  styles.socialButton,
                  (!agreeTerms || isGoogleLoading) && styles.socialButtonDisabled
                ]}
                disabled={!agreeTerms || isGoogleLoading}
                onPress={handleGoogleSignIn}
                activeOpacity={0.7}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator size="small" color="#DB4437" />
                ) : (
                  <Ionicons 
                    name="logo-google" 
                    size={24} 
                    color={!agreeTerms ? '#999' : '#DB4437'} 
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* OTP Login Link */}
            <View style={styles.otpLoginContainer}>
              <Text style={styles.notMemberText}>{t('auth.notMember')}</Text>
              <TouchableOpacity onPress={handleOTPLogin}>
                <Text style={styles.otpLoginText}>{t('auth.quickLoginOTP')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Modal */}
      <LoadingModal visible={isLoading} message={loadingMessage} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  languageSwitcherContainer: {
    alignItems: 'flex-end',
    marginTop: 30,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 5,
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
    marginBottom: 20,
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
  rememberForgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#666',
  },
  termsContainer: {
    marginBottom: 24,
  },
  termsTextContainer: {
    flex: 1,
  },
  termsText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  termsLink: {
    color: '#4CAF50',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  loginButton: {
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
  loginButtonDisabled: {
    backgroundColor: '#B0B0B0',
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    fontSize: 14,
    color: '#999',
    paddingHorizontal: 12,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  socialButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#E8E8E8',
  },
  otpLoginContainer: {
    alignItems: 'center',
  },
  notMemberText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  otpLoginText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});

export default LoginScreen;

