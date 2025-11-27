/**
 * IoT Gallery Route
 * Wrapper for IoTGalleryScreen with navigation params
 */
import IoTGalleryScreen from '@/screens/IoT/IoTGalleryScreen';
import { getFields } from '@/services/field.service';
import type { Field } from '@/types';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

export default function IoTGalleryRoute() {
  const params = useLocalSearchParams<{ fieldId?: string; fieldName?: string }>();
  const [preselectedField, setPreselectedField] = useState<Field | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadField = async () => {
      if (params.fieldId) {
        try {
          const response = await getFields();
          if (response.success && response.data) {
            const field = response.data.find((f: Field) => f._id === params.fieldId);
            setPreselectedField(field);
          }
        } catch (error) {
          console.error('❌ Error loading field:', error);
        }
      }
      setLoading(false);
    };

    loadField();
  }, [params.fieldId]);

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <>
      {/* Hide default Expo Router header */}
      <Stack.Screen options={{ headerShown: false }} />
      <IoTGalleryScreen preselectedField={preselectedField} />
    </>
  );
}

