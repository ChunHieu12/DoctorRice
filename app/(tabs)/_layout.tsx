import { AppHeader } from '@/components/ui';
import CustomTabBar from '@/components/ui/CustomTabBar';
import { Tabs, usePathname } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function TabLayout() {
  const pathname = usePathname();
  
  // Hide header on account tab
  const shouldShowHeader = !pathname.includes('/account');
  
  return (
    <View style={{ flex: 1 }}>
      {/* Global App Header (hidden on account tab) */}
      {shouldShowHeader && <AppHeader />}
      
      {/* Tab Navigator */}
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Trang chủ',
          }}
        />
        <Tabs.Screen
          name="weather"
          options={{
            title: 'Thời tiết',
          }}
        />
        <Tabs.Screen
          name="camera"
          options={{
            title: 'Camera',
          }}
        />
        <Tabs.Screen
          name="mapFarm"
          options={{
            title: 'Bản đồ',
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'Tài khoản',
          }}
        />
        {/* Keep explore for backwards compatibility but hide it */}
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            href: null, // Hide from tab bar
          }}
        />
      </Tabs>
    </View>
  );
}
