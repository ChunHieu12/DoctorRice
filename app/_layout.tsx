import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import FullScreenSplash from '@/components/FullScreenSplash';
import ChatbotModal from '@/components/ChatbotModal';
import FloatingChatButton from '@/components/FloatingChatButton';
import { PermissionRequestModal } from '@/components/ui';
import { ChatbotProvider, useChatbot } from '@/contexts/ChatbotContext';
import { TextSizeProvider } from '@/contexts/TextSizeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { CustomAlertProvider } from '@/hooks/useCustomAlert';
import { usePermissions } from '@/hooks/usePermissions';
import { useSocket } from '@/hooks/useSocket';
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
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const {
    showPermissionModal,
    requestAllPermissions,
    dismissPermissionModal,
  } = usePermissions();
  
  // Auto-connect Socket.io when user is authenticated
  useSocket();
  
  const { isChatbotVisible, openChatbot, closeChatbot } = useChatbot();
  
  // Hide floating chat button on expert chat screens
  const shouldHideFloatingButton = pathname?.includes('expert-chat') || 
                                   pathname?.includes('expert-detail') ||
                                   pathname?.includes('expert-list');

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
          <Stack.Screen 
            name="camera-modal" 
            options={{ 
              presentation: 'fullScreenModal',
              headerShown: false,
              animation: 'fade',
            }} 
          />
          <Stack.Screen 
            name="result" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }} 
          />
          <Stack.Screen 
            name="photo-detail" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }} 
          />
          <Stack.Screen 
            name="photo-history" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }} 
          />
          <Stack.Screen 
            name="storm-tracking" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }} 
          />
          <Stack.Screen 
            name="news" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }} 
          />
          <Stack.Screen 
            name="news-detail" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }} 
          />
          <Stack.Screen 
            name="weather-detail" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }} 
          />
          
          {/* Account related routes */}
          <Stack.Screen 
            name="edit-profile" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }} 
          />
          <Stack.Screen 
            name="change-password" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }} 
          />
          <Stack.Screen 
            name="faq" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }} 
          />
          <Stack.Screen 
            name="expert-conversations" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }} 
          />
          <Stack.Screen 
            name="expert-list" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }} 
          />
          <Stack.Screen 
            name="expert-detail" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }} 
          />
          <Stack.Screen 
            name="expert-chat" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }} 
          />
          <Stack.Screen 
            name="ai-chat-history" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }} 
          />
        </Stack>
      </AuthGuard>
      <StatusBar style="auto" />
      
      {/* Floating Chat Button - Only show when authenticated and not on expert chat screens */}
      {isAuthenticated && !shouldHideFloatingButton && (
        <FloatingChatButton onPress={openChatbot} />
      )}
      
      {/* Chatbot Modal */}
      <ChatbotModal
        visible={isChatbotVisible}
        onClose={closeChatbot}
      />
      
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
  const [hasHiddenNativeSplash, setHasHiddenNativeSplash] = useState(false);

  useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    // Initialize i18n
    initI18n().then(() => {
      setIsI18nInitialized(true);
    });
  }, []);

  useEffect(() => {
    if (isI18nInitialized && !hasHiddenNativeSplash) {
      SplashScreen.hideAsync()
        .catch(() => undefined)
        .finally(() => setHasHiddenNativeSplash(true));
    }
  }, [hasHiddenNativeSplash, isI18nInitialized]);

  // Wait for i18n to initialize
  if (!isI18nInitialized || !hasHiddenNativeSplash) {
    return <FullScreenSplash />;
  }

  return (
    <SafeAreaProvider>
      <TextSizeProvider>
        <CustomAlertProvider>
          <AuthProvider>
            <ChatbotProvider>
              <RootLayoutNav />
            </ChatbotProvider>
          </AuthProvider>
        </CustomAlertProvider>
      </TextSizeProvider>
    </SafeAreaProvider>
  );
}
