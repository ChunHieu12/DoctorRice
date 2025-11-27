/**
 * App Header Component
 * Global header with logo, language switcher, and settings icon
 * Features curved design around center logo
 */
import SimpleLanguageSwitcher from '@/components/ui/SimpleLanguageSwitcher';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface AppHeaderProps {
  showBackButton?: boolean;
  onBackPress?: () => void;
  title?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({ showBackButton = false, onBackPress, title }) => {
  const router = useRouter();
  const pathname = usePathname();

  // Determine if we should show back button based on current path
  const isHomePath = pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/';
  const shouldShowBack = showBackButton || !isHomePath;

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleSettingsPress = () => {
    router.push('/(tabs)/account');
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      <SafeAreaView style={styles.safeArea}>
        <View style={title ? styles.simpleHeaderWrapper : styles.headerWrapper}>
          {/* Main Header Background */}
          <View style={styles.headerBackground} />
          
          {/* Curved Center Background - only if no title */}
          {!title && (
            <View style={styles.curvedContainer}>
              <View style={styles.curvedBackground} />
            </View>
          )}

          {/* Content Layer */}
          <View style={styles.contentContainer}>
            {/* Left Section - Back Button or Empty Space */}
            <View style={styles.leftSection}>
              {shouldShowBack ? (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBackPress}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
              ) : (
                <View style={styles.placeholder} />
              )}
            </View>

            {/* Center Section - Title or Logo */}
            <View style={[styles.centerSection, title && styles.centerSectionTitle]}>
              {title ? (
                <Text
                  style={[styles.titleText, title && styles.titleTextWrap]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  ellipsizeMode="tail"
                >
                  {title}
                </Text>
              ) : (
                <Image
                  source={require('@/assets/images/text-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* Right Section - Language Switcher + Settings */}
            <View style={[styles.rightSection, title && styles.rightSectionCompact]}>
              {!title && <SimpleLanguageSwitcher />}
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={handleSettingsPress}
                activeOpacity={0.7}
              >
                <Ionicons name="settings-sharp" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#4CAF50',
  },
  headerWrapper: {
    position: 'relative',
    height: 70,
    ...Platform.select({
      android: {
        height: StatusBar.currentHeight ? StatusBar.currentHeight + 70 : 70,
      },
    }),
  },
  simpleHeaderWrapper: {
    position: 'relative',
    height: 60,
    ...Platform.select({
      android: {
        height: StatusBar.currentHeight ? StatusBar.currentHeight + 60 : 60,
      },
    }),
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  curvedContainer: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -80,
    width: 160,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  curvedBackground: {
    width: 180,
    height: 90,
    backgroundColor: '#4CAF50'
  },
  contentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight || 0,
      },
    }),
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centerSectionTitle: {
    flex: 3,
    paddingHorizontal: 12,
  },
  logo: {
    width: 90,
    height: 80,
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  rightSectionCompact: {
    flex: 1,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  titleTextWrap: {
    width: '100%',
    flexShrink: 1,
  },
});

export default AppHeader;

