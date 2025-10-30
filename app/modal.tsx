import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { COLORS } from '@/constants/colors';

/**
 * Modal Screen - Demo modal presentation
 */
export default function ModalScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🎉</Text>
      <Text style={styles.title}>Demo Modal</Text>
      <Text style={styles.message}>
        This is a modal screen presented from the bottom.
      </Text>

      <Button onPress={() => router.back()} fullWidth>
        {t('common.close')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
});
