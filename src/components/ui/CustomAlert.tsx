/**
 * Custom Alert Component
 * Replaces React Native Alert with custom styled modal
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export type AlertType = 'success' | 'error' | 'info' | 'warning' | 'confirm';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  type = 'info',
  title,
  message,
  buttons = [{ text: 'Đóng', style: 'default' }],
  onDismiss,
}) => {
  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle' as const, color: '#4CAF50' };
      case 'error':
        return { name: 'close-circle' as const, color: '#F44336' };
      case 'warning':
        return { name: 'warning' as const, color: '#FF9800' };
      case 'confirm':
        return { name: 'help-circle' as const, color: '#4CAF50' };
      default:
        return { name: 'information-circle' as const, color: '#2196F3' };
    }
  };

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name={iconConfig.name} size={48} color={iconConfig.color} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          {message && <Text style={styles.message}>{message}</Text>}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => {
              const isCancel = button.style === 'cancel';
              const isDestructive = button.style === 'destructive';

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isCancel && styles.buttonCancel,
                    isDestructive && styles.buttonDestructive,
                    buttons.length > 1 && index < buttons.length - 1 && styles.buttonSpacing,
                  ]}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isCancel && styles.buttonTextCancel,
                      isDestructive && styles.buttonTextDestructive,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#666',
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
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCancel: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  buttonDestructive: {
    backgroundColor: '#F44336',
  },
  buttonSpacing: {
    marginRight: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonTextCancel: {
    color: '#4CAF50',
  },
  buttonTextDestructive: {
    color: '#fff',
  },
});

export default CustomAlert;

