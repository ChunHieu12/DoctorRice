import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { Modal } from './Modal';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  visible: boolean;
  onClose: () => void;
  type?: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
}

/**
 * Alert component - Modal thông báo với các type khác nhau
 */
export function Alert({
  visible,
  onClose,
  type = 'info',
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  showCancel = false,
}: AlertProps) {
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success':
        return COLORS.success;
      case 'error':
        return COLORS.error;
      case 'warning':
        return COLORS.warning;
      case 'info':
      default:
        return COLORS.info;
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} showCloseButton={false}>
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: getColor() + '20' }]}>
          <Text style={styles.icon}>{getIcon()}</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.buttonContainer}>
          {showCancel && (
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>{cancelText || t('common.cancel')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.confirmButton, { backgroundColor: getColor() }]}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>{confirmText || t('common.ok')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/**
 * useAlert hook - Hook để sử dụng Alert dễ dàng hơn
 */
export function useAlert() {
  const [alertConfig, setAlertConfig] = React.useState<AlertProps | null>(null);

  const showAlert = (config: Omit<AlertProps, 'visible' | 'onClose'>) => {
    setAlertConfig({ ...config, visible: true, onClose: () => setAlertConfig(null) });
  };

  const hideAlert = () => {
    setAlertConfig(null);
  };

  const AlertComponent = alertConfig ? <Alert {...alertConfig} /> : null;

  return {
    showAlert,
    hideAlert,
    AlertComponent,
  };
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.grayLight,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  confirmButton: {
    // backgroundColor set dynamically
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

