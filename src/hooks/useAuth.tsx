/**
 * Authentication Hook and Context
 * Provides auth state and methods throughout the app
 */
import { clearTokens, getAccessToken } from '@/services/api';
import * as authService from '@/services/auth.service';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

/**
 * User interface
 */
export interface User {
  id: string;
  phone: string;
  name: string;
  createdAt?: string;
}

/**
 * Auth Context Type
 */
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithOTP: (phone: string, firebaseToken: string) => Promise<{ userExists: boolean; user?: User }>;
  completeRegistration: (phone: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

/**
 * Create Auth Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  /**
   * Check if user is authenticated on app start
   */
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      
      if (token) {
        // Token exists, fetch user profile
        // TODO: Implement getUserProfile API
        // For now, we'll just mark as authenticated
        // const userProfile = await getUserProfile();
        // setUser(userProfile);
        
        // Temporary: Set dummy authenticated state
        setUser({ id: 'temp', phone: '', name: '' });
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
      setUser(response.user);
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  /**
   * Check auth on mount
   */
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithOTP,
    completeRegistration,
    logout,
    checkAuth,
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

