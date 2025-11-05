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
        // IMPORTANT: Force account selection every time
        forceCodeForRefreshToken: true,
        // Request idToken explicitly
        scopes: ['profile', 'email'],
      });
      setIsConfigured(true);
      console.log('✅ Google Sign-In configured with webClientId:', WEB_CLIENT_ID.substring(0, 20) + '...');
      console.log('✅ Force account picker enabled');
    } catch (error) {
      console.error('❌ Failed to configure Google Sign-In:', error);
    }
  }, []);

  /**
   * Sign in with Google
   * Always shows account picker (no cached account)
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

      // IMPORTANT: Always revoke and sign out to force account picker
      // This ensures user always sees account selection modal
      try {
        const currentUser = await GoogleSignin.getCurrentUser();
        if (currentUser) {
          console.log('🔄 User is signed in, revoking access and signing out...');
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
          console.log('✅ Revoked and signed out successfully');
        }
      } catch (signOutError) {
        // Ignore signOut errors - continue with sign in
        console.log('ℹ️ Sign out before sign in:', signOutError);
      }

      console.log('🚀 Starting Google Sign-In with account picker...');

      // Get user info and ID token
      // Version 16+ returns: { type: 'success', data: { idToken, user, ... } }
      const response = await GoogleSignin.signIn();
      
      console.log('📱 Google Sign-In response type:', response.type);
      
      // Extract idToken based on response structure
      let idToken: string | null = null;
      
      if (response.type === 'success') {
        // New structure (v16+)
        idToken = response.data.idToken;
        console.log('✅ Got idToken from response.data.idToken');
      } else if ('idToken' in response) {
        // Old structure fallback
        idToken = (response as any).idToken;
        console.log('✅ Got idToken from response.idToken');
      }

      if (!idToken) {
        console.error('❌ Response structure:', JSON.stringify(response, null, 2));
        throw new Error('No ID token received from Google');
      }

      console.log('🔑 Got idToken, length:', idToken.length);

      // Create Firebase credential with Google ID token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign in to Firebase with Google credential
      const userCredential = await auth().signInWithCredential(googleCredential);

      console.log('✅ Google Sign-In successful:', userCredential.user.uid);
      return userCredential;
    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error);

      // Handle specific error codes
      if (error.code === 'SIGN_IN_CANCELLED' || error.code === '-5') {
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

