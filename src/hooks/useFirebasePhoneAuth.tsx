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
      
      // Set expiration time with safety buffer (58s instead of 60s to account for network delays)
      const expireTime = Date.now() + 58000;
      setOtpExpireTime(expireTime);
      
      console.log('✅ OTP sent successfully via Firebase to:', phoneNumber);
      console.log('⏰ OTP will expire at:', new Date(expireTime).toLocaleTimeString());
      console.log('⏰ Current time:', new Date().toLocaleTimeString());
      console.log('⏰ Safety buffer: 58 seconds (instead of 60)');
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
   * @param code - 6-digit OTP code
   * @returns Firebase User Credential
   */
  const verifyOTP = async (code: string): Promise<FirebaseAuthTypes.UserCredential> => {
    try {
      console.log('🔐 Starting OTP verification...');
      console.log('📋 Current time:', new Date().toLocaleTimeString());
      console.log('📋 OTP expire time:', otpExpireTime ? new Date(otpExpireTime).toLocaleTimeString() : 'Not set');
      console.log('📋 Time remaining:', otpExpireTime ? Math.max(0, Math.floor((otpExpireTime - Date.now()) / 1000)) + 's' : 'N/A');
      
      if (!confirmation) {
        console.error('❌ No confirmation object!');
        throw new Error('No confirmation result. Please request OTP first.');
      }

      console.log('✅ Confirmation exists:', {
        hasVerificationId: !!confirmation.verificationId,
        storedVerificationId: verificationId?.substring(0, 20) + '...',
        hasConfirmFunction: typeof confirmation.confirm === 'function',
        confirmationAge: otpExpireTime ? `${Math.floor((60000 - (otpExpireTime - Date.now())) / 1000)}s old` : 'unknown',
      });

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
      
      console.log('📤 Calling confirmation.confirm() with code...');
      const confirmStartTime = Date.now();

      // Confirm the OTP code
      const userCredential = await confirmation.confirm(code);
      
      console.log('✅ confirmation.confirm() returned in', Date.now() - confirmStartTime + 'ms');
      
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
   * @returns Firebase ID Token
   */
  const getFirebaseToken = async (): Promise<string> => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const token = await currentUser.getIdToken();
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

