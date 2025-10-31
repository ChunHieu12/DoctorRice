/**
 * Facebook Authentication Service
 * Handle Facebook OAuth login flow
 */
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const FACEBOOK_APP_ID = Constants.expoConfig?.extra?.facebookAppId || '1071463597343527';

// Facebook OAuth discovery endpoints
const discovery = {
  authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
};

/**
 * Get Facebook Auth Request configuration
 */
export const useFacebookAuth = () => {
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

  return { request, response, promptAsync };
};

/**
 * Get Facebook user profile from access token
 */
export const getFacebookUserProfile = async (accessToken: string) => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture.type(large)`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Facebook profile');
    }

    const data = await response.json();
    
    return {
      id: data.id,
      name: data.name,
      email: data.email || null,
      picture: data.picture?.data?.url || null,
    };
  } catch (error) {
    console.error('Error fetching Facebook profile:', error);
    throw error;
  }
};

/**
 * Verify Facebook access token with Graph API
 */
export const verifyFacebookToken = async (accessToken: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${FACEBOOK_APP_ID}|${accessToken}`
    );

    const data = await response.json();
    return data.data?.is_valid === true;
  } catch (error) {
    console.error('Error verifying Facebook token:', error);
    return false;
  }
};

