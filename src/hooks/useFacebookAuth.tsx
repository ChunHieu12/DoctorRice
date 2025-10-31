/**
 * Facebook Authentication Hook
 * Handle Facebook login flow and integration with backend
 */
import * as authService from '@/services/auth.service';
import { getFacebookUserProfile } from '@/services/facebook.service';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

WebBrowser.maybeCompleteAuthSession();

const FACEBOOK_APP_ID = Constants.expoConfig?.extra?.facebookAppId || '1071463597343527';

const discovery = {
  authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
};

export interface FacebookAuthResult {
  success: boolean;
  accessToken?: string;
  profile?: {
    id: string;
    name: string;
    email: string | null;
    picture: string | null;
  };
  error?: string;
}

export const useFacebookAuth = () => {
  const { setUser, setTokens } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'doctorrice',
    path: 'auth/callback',
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: FACEBOOK_APP_ID,
      scopes: ['public_profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
      extraParams: {
        display: 'popup',
      },
    },
    discovery
  );

  /**
   * Handle Facebook OAuth response
   */
  useEffect(() => {
    if (response?.type === 'success') {
      handleFacebookResponse(response);
    } else if (response?.type === 'error') {
      setError(response.error?.message || 'Facebook login failed');
      setIsLoading(false);
    } else if (response?.type === 'cancel') {
      setIsLoading(false);
    }
  }, [response]);

  /**
   * Process successful Facebook OAuth response
   */
  const handleFacebookResponse = async (response: AuthSession.AuthSessionResult) => {
    try {
      setIsLoading(true);
      setError(null);

      if (response.type !== 'success') {
        throw new Error('Facebook authentication failed');
      }

      const { access_token } = response.params;

      if (!access_token) {
        throw new Error('No access token received from Facebook');
      }

      // Get Facebook user profile
      const profile = await getFacebookUserProfile(access_token);

      // Send to backend for verification and login/register
      const result = await authService.loginWithFacebook(access_token);

      // Save tokens and user data
      setTokens(result.accessToken, result.refreshToken);
      setUser(result.user);

      setIsLoading(false);
      return {
        success: true,
        accessToken: access_token,
        profile,
      };
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Failed to login with Facebook');
      throw err;
    }
  };

  /**
   * Initiate Facebook login
   */
  const loginWithFacebook = async (): Promise<FacebookAuthResult> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!request) {
        throw new Error('Facebook auth request not ready');
      }

      const result = await promptAsync();

      if (result.type === 'success') {
        const { access_token } = result.params;
        const profile = await getFacebookUserProfile(access_token);

        // Send to backend
        const authResult = await authService.loginWithFacebook(access_token);

        // Save tokens and user
        setTokens(authResult.accessToken, authResult.refreshToken);
        setUser(authResult.user);

        return {
          success: true,
          accessToken: access_token,
          profile,
        };
      } else if (result.type === 'cancel') {
        setIsLoading(false);
        return {
          success: false,
          error: 'User cancelled Facebook login',
        };
      } else {
        throw new Error('Facebook login failed');
      }
    } catch (err: any) {
      setIsLoading(false);
      const errorMessage = err.message || 'Failed to login with Facebook';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return {
    loginWithFacebook,
    isLoading,
    error,
    request,
  };
};

