/**
 * Authentication Hook and Context
 * Provides auth state and methods throughout the app
 */
import { clearTokens, getAccessToken } from '@/services/api';
import * as authService from '@/services/auth.service';
import { getProfile } from '@/services/user.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';

/**
 * User interface
 */
export interface User {
  id: string;
  phone?: string;
  email?: string;
  name: string;
  avatar?: string;
  roles?: string[]; // ['user', 'admin', 'expert']
  expertise?: string; // For experts
  provider?: 'phone' | 'email' | 'google' | 'facebook'; // Login provider
  createdAt?: string;
}

/**
 * Auth Context Type
 */
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  blockAutoNavigation: boolean; // Block AuthGuard auto-navigation (e.g., when showing biometric modal)
  setBlockAutoNavigation: (block: boolean) => void;
  login: (phone: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithOTP: (phone: string, firebaseToken: string) => Promise<{ userExists: boolean; user?: User }>;
  completeRegistration: (phone: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setAuthUser: (user: User) => void;
}

/**
 * Create Auth Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Constants for auto-logout
 */
const LAST_ACTIVE_TIME_KEY = '@last_active_time';
const AUTO_LOGOUT_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [blockAutoNavigation, setBlockAutoNavigation] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  /**
   * Check if user is authenticated on app start
   */
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      
      if (token) {
        // Token exists, fetch user profile
        try {
          const userProfile = await getProfile();
          setUser({
            id: userProfile._id,
            name: userProfile.displayName,
            phone: userProfile.phone,
            email: userProfile.email,
            avatar: userProfile.avatar,
            roles: userProfile.roles,
            expertise: userProfile.expertise,
            createdAt: userProfile.createdAt,
          });
        } catch (profileError) {
          console.error('Failed to fetch user profile:', profileError);
          // Token might be invalid, clear it
          setUser(null);
          await clearTokens();
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      await clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login with phone and password
   */
  const login = async (phone: string, password: string, rememberMe: boolean = false) => {
    try {
      const response = await authService.loginWithPassword(phone, password);
      
      // Save credentials if remember me is checked
      if (rememberMe) {
        await authService.saveLoginCredentials(phone, password);
      } else {
        await authService.clearSavedCredentials();
      }
      
      // Update last active time to prevent immediate logout
      await AsyncStorage.setItem(LAST_ACTIVE_TIME_KEY, Date.now().toString());
      
      setUser(response.user);
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  /**
   * Login with OTP (Twilio phone auth)
   */
  const loginWithOTP = async (
    phone: string,
    firebaseToken: string
  ): Promise<{ userExists: boolean; user?: User }> => {
    try {
      const response = await authService.verifyFirebaseOTP(phone, firebaseToken);
      
      if (response.userExists && response.user) {
        // Update last active time to prevent immediate logout
        await AsyncStorage.setItem(LAST_ACTIVE_TIME_KEY, Date.now().toString());
        
        setUser(response.user);
        return { userExists: true, user: response.user };
      }
      
      return { userExists: false };
    } catch (error: any) {
      throw new Error(error.message || 'OTP verification failed');
    }
  };

  /**
   * Complete registration after OTP verification
   */
  const completeRegistration = async (
    phone: string,
    name: string,
    password: string
  ) => {
    try {
      const response = await authService.completeRegistration(phone, name, password);
      
      // Update last active time to prevent immediate logout
      await AsyncStorage.setItem(LAST_ACTIVE_TIME_KEY, Date.now().toString());
      
      setUser(response.user);
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  /**
   * Logout user
   * Clears JWT tokens, Firebase session, and Google session
   */
  const logout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      
      // Clear JWT tokens and saved credentials
      await authService.logout();
      console.log('✅ JWT tokens cleared');
      
      // Sign out from Firebase Auth
      try {
        const firebaseUser = auth().currentUser;
        if (firebaseUser) {
          await auth().signOut();
          console.log('✅ Firebase signed out');
        }
      } catch (firebaseError) {
        console.log('ℹ️ Firebase sign out (expected if not logged in):', firebaseError);
      }
      
      // IMPORTANT: Revoke and sign out from Google to force account picker next time
      try {
        const currentUser = await GoogleSignin.getCurrentUser();
        if (currentUser) {
          console.log('🔄 Revoking Google access...');
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
          console.log('✅ Google access revoked and signed out');
        }
      } catch (googleError) {
        console.log('ℹ️ Google sign out (expected if not logged in):', googleError);
      }
      
      // Clear user state
      setUser(null);
      
      // Clear chat history for logged out user (optional - can keep for next login)
      // Note: Chat history is already user-specific, so no need to clear on logout
      // If you want to clear on logout, uncomment below:
      // const { clearAllConversations } = await import('@/services/chat-history.service');
      // await clearAllConversations(null);
      
      console.log('✅ Logout complete');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Still clear user state even if logout partially fails
      setUser(null);
      throw error;
    }
  };

  /**
   * Set authenticated user (for Google Sign-In, etc.)
   */
  const setAuthUser = (userData: User) => {
    // Update last active time to prevent immediate logout (fire and forget)
    AsyncStorage.setItem(LAST_ACTIVE_TIME_KEY, Date.now().toString()).catch(err =>
      console.error('Failed to update last active time:', err)
    );
    
    setUser(userData);
    console.log('✅ Auth user set:', userData.name);
  };

  /**
   * Check auth on mount
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Auto-logout after 5 minutes of inactivity
   * Tracks when app goes to background and checks timeout when returning to foreground
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      // App going to background (inactive or background)
      if (
        appState.current === 'active' &&
        (nextAppState === 'inactive' || nextAppState === 'background')
      ) {
        console.log('📱 App going to background, saving last active time...');
        // Save timestamp when app goes to background
        await AsyncStorage.setItem(LAST_ACTIVE_TIME_KEY, Date.now().toString());
      }

      // App coming back to foreground
      if (
        (appState.current === 'inactive' || appState.current === 'background') &&
        nextAppState === 'active'
      ) {
        console.log('📱 App returning to foreground, checking timeout...');
        
        // Only check timeout if user is authenticated
        if (user) {
          const lastActiveTimeStr = await AsyncStorage.getItem(LAST_ACTIVE_TIME_KEY);
          
          if (lastActiveTimeStr) {
            const lastActiveTime = parseInt(lastActiveTimeStr, 10);
            const now = Date.now();
            const timeDiff = now - lastActiveTime;
            
            console.log(`⏱️ Time inactive: ${Math.round(timeDiff / 1000)}s (max: ${AUTO_LOGOUT_TIMEOUT / 1000}s)`);
            
            // Check if more than 5 minutes have passed
            if (timeDiff > AUTO_LOGOUT_TIMEOUT) {
              console.log('⏰ Auto-logout: Session expired after 5 minutes of inactivity');
              
              // Show alert to user
              Alert.alert(
                'Phiên đăng nhập đã hết hạn',
                'Bạn đã không hoạt động quá 5 phút. Vui lòng đăng nhập lại.',
                [{ text: 'OK', onPress: () => {} }]
              );
              
              // Logout user
              await logout();
            } else {
              console.log('✅ Session still valid');
            }
          }
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user]); // Re-run when user changes

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    blockAutoNavigation,
    setBlockAutoNavigation,
    login,
    loginWithOTP,
    completeRegistration,
    logout,
    checkAuth,
    setAuthUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
};

export default useAuth;

