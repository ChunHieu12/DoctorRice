/**
 * Google Sign-In Hook
 * Uses @react-native-google-signin/google-signin with Firebase
 */
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useEffect, useState } from 'react';

// Web Client ID from google-services.json
const WEB_CLIENT_ID = '95898980634-1qa3o4aj2lf4f4sr2q50l1u6c9l102i2.apps.googleusercontent.com';

export const useGoogleSignIn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  // Configure Google Sign-In on mount
  useEffect(() => {
    try {
      GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,
        offlineAccess: true,
      });
      setIsConfigured(true);
    } catch (error) {
      console.error('❌ Failed to configure Google Sign-In:', error);
    }
  }, []);

  /**
   * Sign in with Google
   * @returns Firebase User Credential
   */
  const signInWithGoogle = async () => {
    try {
      if (!isConfigured) {
        throw new Error('Google Sign-In not configured yet');
      }

      setIsLoading(true);

      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Get user info and ID token
      const { idToken } = await GoogleSignin.signIn();

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Create Firebase credential with Google ID token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign in to Firebase with Google credential
      const userCredential = await auth().signInWithCredential(googleCredential);

      console.log('✅ Google Sign-In successful:', userCredential.user.uid);
      return userCredential;
    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error);

      // Handle specific error codes
      if (error.code === 'SIGN_IN_CANCELLED') {
        throw new Error('Sign in was cancelled');
      } else if (error.code === 'IN_PROGRESS') {
        throw new Error('Sign in already in progress');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw new Error('Google Play Services not available');
      }

      throw new Error(error.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign out from Google
   */
  const signOutGoogle = async () => {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      await auth().signOut();
      console.log('✅ Google Sign-Out successful');
    } catch (error: any) {
      console.error('❌ Google Sign-Out error:', error);
      throw new Error(error.message || 'Failed to sign out from Google');
    }
  };

  /**
   * Get current Google user info
   */
  const getCurrentUser = async () => {
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      return currentUser;
    } catch (error: any) {
      console.error('❌ Failed to get current user:', error);
      return null;
    }
  };

  return {
    signInWithGoogle,
    signOutGoogle,
    getCurrentUser,
    isLoading,
    isConfigured,
  };
};

