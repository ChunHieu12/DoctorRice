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

  /**
   * Send OTP to phone number
   * @param phoneNumber - Phone number in E.164 format (e.g., +84987654321)
   */
  const sendOTP = async (phoneNumber: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Sign in with phone number - Firebase handles reCAPTCHA natively
      const confirmationResult = await auth().signInWithPhoneNumber(phoneNumber);
      
      setConfirmation(confirmationResult);
      console.log('✅ OTP sent successfully via Firebase to:', phoneNumber);
    } catch (error: any) {
      console.error('❌ Firebase sendOTP error:', error);
      throw new Error(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify OTP code
   * @param code - 6-digit OTP code
   * @returns Firebase User Credential
   */
  const verifyOTP = async (code: string): Promise<FirebaseAuthTypes.UserCredential> => {
    try {
      if (!confirmation) {
        throw new Error('No confirmation result. Please request OTP first.');
      }

      setIsLoading(true);

      // Confirm the OTP code
      const userCredential = await confirmation.confirm(code);
      
      console.log('✅ OTP verified successfully, User:', userCredential.user.uid);
      return userCredential;
    } catch (error: any) {
      console.error('❌ Firebase verifyOTP error:', error);
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Invalid OTP code. Please try again.');
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
      setConfirmation(null);
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
  };
};

