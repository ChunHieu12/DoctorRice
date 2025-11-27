/**
 * Field Management Screen Route
 * Wrapper for FieldManagementScreen from /src/screens
 */
import FieldManagementScreen from '@/screens/Field/FieldManagementScreen';
import { Stack } from 'expo-router';

export default function FieldManagementRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Quản lý ruộng',
          headerShown: true,
          headerBackVisible: true,
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <FieldManagementScreen />
    </>
  );
}

