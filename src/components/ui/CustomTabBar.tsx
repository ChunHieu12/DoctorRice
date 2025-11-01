/**
 * Custom Tab Bar Component
 * 5-tab navigation with floating camera button in the center
 */
import PermissionRequestModal from '@/components/ui/PermissionRequestModal';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { permissionsState, requestCameraPermission } = usePermissions();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const insets = useSafeAreaInsets();

  const tabs = [
    {
      name: 'index',
      label: t('tabs.home', { defaultValue: 'Trang chủ' }),
      icon: 'home-icon',
      isImage: true,
    },
    {
      name: 'weather',
      label: t('tabs.weather', { defaultValue: 'Thời tiết' }),
      icon: 'partly-sunny',
      isImage: false,
    },
    {
      name: 'camera',
      label: '',
      icon: 'camera',
      isImage: false,
      isCenter: true,
    },
    {
      name: 'farming',
      label: t('tabs.farming', { defaultValue: 'Nông vụ' }),
      icon: 'leaf',
      isImage: false,
    },
    {
      name: 'account',
      label: t('tabs.account', { defaultValue: 'Tài khoản' }),
      icon: 'person',
      isImage: false,
      showAvatar: true,
    },
  ];

  const handleCameraPress = async () => {
    // Check camera permission
    if (permissionsState.camera === 'granted') {
      // TODO: Open camera modal directly
      console.log('Opening camera...');
      // navigation.navigate('camera');
    } else {
      // Show permission request modal
      setShowPermissionModal(true);
    }
  };

  const handleRequestPermissions = async () => {
    const granted = await requestCameraPermission();
    if (granted) {
      setShowPermissionModal(false);
      // TODO: Open camera modal
      console.log('Permission granted, opening camera...');
    }
    return granted;
  };

  const renderIcon = (tab: any, isFocused: boolean, index: number) => {
    const iconColor = isFocused ? '#4CAF50' : '#999';
    const iconSize = 24;

    // Camera button (center)
    if (tab.isCenter) {
      return (
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={handleCameraPress}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={28} color="#fff" />
        </TouchableOpacity>
      );
    }

    // Home icon (image)
    if (tab.isImage && tab.icon === 'home-icon') {
      return (
        <Image
          source={require('@/assets/images/home-icon.png')}
          style={[
            styles.homeIcon
          ]}
          resizeMode="contain"
        />
      );
    }

    // Account icon (avatar or user icon)
    if (tab.showAvatar && user?.avatar) {
      return (
        <Image
          source={{ uri: user.avatar }}
          style={styles.avatar}
          resizeMode="cover"
        />
      );
    }

    // Regular Ionicon
    return <Ionicons name={tab.icon as any} size={iconSize} color={iconColor} />;
  };

  return (
    <>
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {tabs.map((tab, index) => {
          const route = state.routes.find((r) => r.name === tab.name);
          if (!route) return null;

          const routeIndex = state.routes.indexOf(route);
          const isFocused = state.index === routeIndex;

          const onPress = () => {
            if (tab.name === 'camera') {
              handleCameraPress();
              return;
            }

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Camera tab (center, floating)
          if (tab.isCenter) {
            return (
              <View key={tab.name} style={styles.centerTabContainer}>
                {renderIcon(tab, isFocused, index)}
              </View>
            );
          }

          // Regular tabs
          return (
            <TouchableOpacity
              key={tab.name}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              {renderIcon(tab, isFocused, index)}
              {tab.label && (
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? '#4CAF50' : '#999' },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Permission Request Modal */}
      <PermissionRequestModal
        visible={showPermissionModal}
        onRequestPermissions={handleRequestPermissions}
        onDismiss={() => setShowPermissionModal(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  centerTabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30, // Float above tab bar
  },
  cameraButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#fff',
  },
  homeIcon: {
    width: 24,
    height: 24,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
});

export default CustomTabBar;

