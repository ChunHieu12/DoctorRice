import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { PermissionRequestModal } from '@/components/ui';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { CustomAlertProvider } from '@/hooks/useCustomAlert';
import { usePermissions } from '@/hooks/usePermissions';
import { initI18n } from '@/i18n';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * Auth Guard Component
 * Handles navigation based on auth state
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, blockAutoNavigation } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Don't auto-navigate if blocked (e.g., showing biometric modal)
    if (blockAutoNavigation) {
      console.log('🚫 Auto-navigation blocked (biometric modal may be showing)');
      return;
    }

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      // User not authenticated and trying to access protected route
      // Redirect to login
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      // User authenticated but still in auth routes
      // Redirect to home
      console.log('✅ AuthGuard: Auto-navigating to home');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, blockAutoNavigation]);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * Root Layout Component
 */
function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const {
    showPermissionModal,
    requestAllPermissions,
    dismissPermissionModal,
  } = usePermissions();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthGuard>
        <Stack>
          {/* Auth routes */}
          <Stack.Screen name="auth/login" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="auth/otp-login" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="auth/complete-registration" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="auth/forgot-password" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="auth/privacy-policy" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          
          {/* Protected routes */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
      </AuthGuard>
      <StatusBar style="auto" />
      
      {/* Permission Request Modal */}
      <PermissionRequestModal
        visible={showPermissionModal}
        onRequestPermissions={requestAllPermissions}
        onDismiss={dismissPermissionModal}
      />
    </ThemeProvider>
  );
}

/**
 * Root Layout with Providers
 */
export default function RootLayout() {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);

  useEffect(() => {
    // Initialize i18n
    initI18n().then(() => {
      setIsI18nInitialized(true);
    });
  }, []);

  // Wait for i18n to initialize
  if (!isI18nInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <CustomAlertProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </CustomAlertProvider>
  );
}
