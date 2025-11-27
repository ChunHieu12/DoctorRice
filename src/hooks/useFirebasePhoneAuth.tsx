/**
 * Firebase Phone Authentication Hook
 * Uses React Native Firebase for phone authentication
 * No WebView or reCAPTCHA needed!
 */
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useState } from 'react';

export const useFirebasePhoneAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [otpExpireTime, setOtpExpireTime] = useState<number | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);

  /**
   * Send OTP to phone number
   * @param phoneNumber - Phone number in E.164 format (e.g., +84987654321)
   */
  const sendOTP = async (phoneNumber: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // CRITICAL FIX: Sign out any existing user to prevent session-expired errors
      try {
        const currentUser = auth().currentUser;
        if (currentUser) {
          console.log('🔓 Signing out existing user before OTP...');
          await auth().signOut();
          // Wait for Firebase to clean up state
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (signOutError) {
        console.warn('⚠️  Sign out error (non-critical):', signOutError);
      }
      
      // Clear any existing confirmation before sending new OTP
      if (confirmation) {
        console.log('⚠️  Clearing existing confirmation before new OTP request');
        clearConfirmation();
      }
      
      console.log('📤 Sending OTP to:', phoneNumber);
      const sentTime = Date.now();
      
      // Sign in with phone number - Firebase handles reCAPTCHA natively
      // forceResend: true forces a new SMS even if one was recently sent
      const confirmationResult = await auth().signInWithPhoneNumber(phoneNumber, true);
      
      console.log('📱 Confirmation received:', {
        verificationId: confirmationResult.verificationId?.substring(0, 20) + '...',
        hasConfirm: typeof confirmationResult.confirm === 'function',
        timeTaken: Date.now() - sentTime + 'ms'
      });
      
      setConfirmation(confirmationResult);
      
      // Store verificationId for debugging
      if (confirmationResult.verificationId) {
        setVerificationId(confirmationResult.verificationId);
        console.log('🔑 Verification ID stored:', confirmationResult.verificationId.substring(0, 20) + '...');
      }
      
      // Set expiration time with realistic buffer
      // Firebase Phone Auth typically expires after ~120s (SMS validity)
      // But we'll use 90s as safety buffer for better UX
      const expireTime = Date.now() + 90000;
      setOtpExpireTime(expireTime);
      
      console.log('✅ OTP sent successfully via Firebase to:', phoneNumber);
      console.log('⏰ OTP will expire at:', new Date(expireTime).toLocaleTimeString());
      console.log('⏰ Current time:', new Date().toLocaleTimeString());
      console.log('⏰ Expire buffer: 90 seconds');
    } catch (error: any) {
      console.error('❌ Firebase sendOTP error:', error);
      throw new Error(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if OTP is expired
   */
  const isOTPExpired = (): boolean => {
    if (!otpExpireTime) return false;
    return Date.now() > otpExpireTime;
  };

  /**
   * Clear confirmation state
   */
  const clearConfirmation = (): void => {
    setConfirmation(null);
    setOtpExpireTime(null);
    setVerificationId(null);
  };

  /**
   * Verify OTP code
   * Uses PhoneAuthProvider.credential() for better stability
   * @param code - 6-digit OTP code
   * @returns Firebase User Credential
   */
  const verifyOTP = async (code: string): Promise<FirebaseAuthTypes.UserCredential> => {
    try {
      console.log('🔐 Starting OTP verification...');
      console.log('📋 Current time:', new Date().toLocaleTimeString());
      console.log('📋 OTP expire time:', otpExpireTime ? new Date(otpExpireTime).toLocaleTimeString() : 'Not set');
      console.log('📋 Time remaining:', otpExpireTime ? Math.max(0, Math.floor((otpExpireTime - Date.now()) / 1000)) + 's' : 'N/A');
      
      // Check if we have verificationId (more reliable than confirmation object)
      if (!verificationId) {
        console.error('❌ No verification ID!');
        throw new Error('No verification ID found. Please request OTP first.');
      }

      console.log('✅ Verification ID exists:', verificationId.substring(0, 20) + '...');

      // Check if OTP expired before attempting verification
      const expired = isOTPExpired();
      console.log('⏰ OTP expired check:', expired);
      
      if (expired) {
        console.warn('⚠️ OTP has expired locally. Clearing confirmation state.');
        clearConfirmation();
        const error: any = new Error('OTP code has expired. Please request a new code.');
        error.code = 'auth/session-expired';
        throw error;
      }

      setIsLoading(true);
      
      console.log('📤 Creating credential with verificationId and code...');
      const confirmStartTime = Date.now();

      // Create credential using PhoneAuthProvider (more stable than confirmation.confirm())
      const credential = auth.PhoneAuthProvider.credential(verificationId, code);
      
      console.log('✅ Credential created in', Date.now() - confirmStartTime + 'ms');
      console.log('📤 Signing in with credential...');
      
      // Sign in with the credential
      const userCredential = await auth().signInWithCredential(credential);
      
      console.log('✅ signInWithCredential() completed in', Date.now() - confirmStartTime + 'ms');
      
      // Verify we got a valid credential
      if (!userCredential) {
        console.error('❌ No user credential received!');
        throw new Error('Failed to verify OTP: No user credential received');
      }
      
      // Clear confirmation after successful verification
      clearConfirmation();
      
      console.log('✅ OTP verified successfully!');
      console.log('👤 User UID:', userCredential.user.uid);
      console.log('📧 User phone:', userCredential.user.phoneNumber);
      
      // IMPORTANT: Get fresh ID token immediately after verification
      // This ensures token is valid when sent to backend
      try {
        const freshToken = await userCredential.user.getIdToken(true); // true = force refresh
        console.log('🔑 Fresh token obtained immediately after verification');
      } catch (tokenError) {
        console.warn('⚠️ Failed to get fresh token (non-critical):', tokenError);
      }
      
      return userCredential;
    } catch (error: any) {
      console.error('❌ Firebase verifyOTP error:', {
        code: error.code,
        message: error.message,
        name: error.name,
      });
      
      // Handle specific error codes
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid OTP code. Please try again.');
      } else if (error.code === 'auth/session-expired' || error.code === 'auth/code-expired') {
        // Clear expired confirmation
        console.warn('⚠️ Session expired from Firebase. Clearing confirmation.');
        clearConfirmation();
        throw new Error('OTP code has expired. Please request a new code.');
      }
      
      throw new Error(error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get Firebase ID Token (for backend verification)
   * Always gets a fresh token to avoid expiration issues
   * @returns Firebase ID Token
   */
  const getFirebaseToken = async (): Promise<string> => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      // Force refresh token to get the most recent one (avoid expiration)
      // This is critical for backend verification
      console.log('🔄 Getting fresh Firebase token (force refresh)...');
      const token = await currentUser.getIdToken(true); // true = force refresh
      console.log('✅ Fresh token obtained, length:', token.length);
      
      return token;
    } catch (error: any) {
      console.error('❌ Firebase getToken error:', error);
      throw new Error(error.message || 'Failed to get Firebase token');
    }
  };

  /**
   * Sign out current user
   */
  const signOut = async (): Promise<void> => {
    try {
      await auth().signOut();
      clearConfirmation();
      console.log('✅ User signed out successfully');
    } catch (error: any) {
      console.error('❌ Firebase signOut error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  return {
    sendOTP,
    verifyOTP,
    getFirebaseToken,
    signOut,
    isLoading,
    confirmation,
    isOTPExpired,
    clearConfirmation,
    otpExpireTime,
    verificationId,
  };
};

