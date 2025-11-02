/**
 * Biometric Enable Modal
 * Modal to ask user if they want to enable biometric login
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface BiometricEnableModalProps {
  visible: boolean;
  biometricType: string; // 'Fingerprint', 'Face ID', etc.
  onEnable: () => void;
  onSkip: () => void;
}

const BiometricEnableModal: React.FC<BiometricEnableModalProps> = ({
  visible,
  biometricType,
  onEnable,
  onSkip,
}) => {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const getBiometricIcon = () => {
    if (biometricType.toLowerCase().includes('face')) {
      return 'scan';
    }
    return 'finger-print';
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onSkip}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name={getBiometricIcon()} size={64} color="#4CAF50" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {t('biometric.enableTitle', { defaultValue: 'Bật đăng nhập nhanh?' })}
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            {t('biometric.enableDescription', {
              defaultValue: `Sử dụng ${biometricType} để đăng nhập nhanh chóng và bảo mật hơn trong các lần tới.`,
              biometricType,
            })}
          </Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>
                {t('biometric.feature1', { defaultValue: 'Đăng nhập nhanh chóng' })}
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>
                {t('biometric.feature2', { defaultValue: 'Bảo mật cao' })}
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>
                {t('biometric.feature3', { defaultValue: 'Không cần nhớ mật khẩu' })}
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Enable Button */}
            <TouchableOpacity
              style={styles.enableButton}
              onPress={onEnable}
              activeOpacity={0.8}
            >
              <Ionicons name={getBiometricIcon()} size={20} color="#fff" />
              <Text style={styles.enableButtonText}>
                {t('biometric.enable', { defaultValue: 'Bật ngay' })}
              </Text>
            </TouchableOpacity>

            {/* Skip Button */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={onSkip}
              activeOpacity={0.8}
            >
              <Text style={styles.skipButtonText}>
                {t('biometric.skip', { defaultValue: 'Để sau' })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info text */}
          <Text style={styles.infoText}>
            {t('biometric.infoText', {
              defaultValue: 'Bạn có thể bật/tắt tính năng này trong Cài đặt bất cứ lúc nào.',
            })}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 16,
  },
  enableButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default BiometricEnableModal;

