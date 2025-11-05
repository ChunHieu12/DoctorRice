/**
 * Permission Request Modal
 * Beautiful modal to request camera and location permissions
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface PermissionRequestModalProps {
  visible: boolean;
  onRequestPermissions: () => Promise<boolean>;
  onDismiss: () => void;
  onOpenSettings?: () => void;
}

const PermissionRequestModal: React.FC<PermissionRequestModalProps> = ({
  visible,
  onRequestPermissions,
  onDismiss,
  onOpenSettings,
}) => {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [isRequesting, setIsRequesting] = React.useState(false);

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

  const handleRequestPermissions = async () => {
    setIsRequesting(true);
    try {
      await onRequestPermissions();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOpenSettings = () => {
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      Linking.openSettings();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* App Icon/Logo */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="shield-checkmark" size={64} color="#4CAF50" />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {t('permissions.title', { defaultValue: 'Yêu cầu quyền truy cập' })}
            </Text>

            {/* Description */}
            <Text style={styles.description}>
              {t('permissions.description', {
                defaultValue: 'Bác sĩ Lúa cần các quyền sau để hoạt động tốt nhất:',
              })}
            </Text>

            {/* Permission Items */}
            <View style={styles.permissionsContainer}>
              {/* Camera Permission */}
              <View style={styles.permissionItem}>
                <View style={styles.permissionIconContainer}>
                  <Ionicons name="camera" size={32} color="#4CAF50" />
                </View>
                <View style={styles.permissionTextContainer}>
                  <Text style={styles.permissionTitle}>
                    {t('permissions.camera.title', { defaultValue: 'Camera' })}
                  </Text>
                  <Text style={styles.permissionDescription}>
                    {t('permissions.camera.description', {
                      defaultValue: 'Chụp ảnh cây lúa để phát hiện bệnh và gán watermark',
                    })}
                  </Text>
                </View>
              </View>

              {/* Location Permission */}
              <View style={styles.permissionItem}>
                <View style={styles.permissionIconContainer}>
                  <Ionicons name="location" size={32} color="#4CAF50" />
                </View>
                <View style={styles.permissionTextContainer}>
                  <Text style={styles.permissionTitle}>
                    {t('permissions.location.title', { defaultValue: 'Vị trí' })}
                  </Text>
                  <Text style={styles.permissionDescription}>
                    {t('permissions.location.description', {
                      defaultValue: 'Xác định vị trí để gán thông tin địa lý vào ảnh',
                    })}
                  </Text>
                </View>
              </View>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#4CAF50" />
              <Text style={styles.infoText}>
                {t('permissions.infoText', {
                  defaultValue:
                    'Chúng tôi tôn trọng quyền riêng tư của bạn. Thông tin chỉ được sử dụng khi bạn chụp ảnh.',
                })}
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {/* Allow Button */}
              <TouchableOpacity
                style={[styles.button, styles.allowButton, isRequesting && styles.buttonDisabled]}
                onPress={handleRequestPermissions}
                disabled={isRequesting}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.buttonText}>
                  {isRequesting
                    ? t('permissions.requesting', { defaultValue: 'Đang yêu cầu...' })
                    : t('permissions.allow', { defaultValue: 'Cho phép' })}
                </Text>
              </TouchableOpacity>

              {/* Skip Button */}
              <TouchableOpacity
                style={[styles.button, styles.skipButton]}
                onPress={onDismiss}
                disabled={isRequesting}
                activeOpacity={0.8}
              >
                <Text style={styles.skipButtonText}>
                  {t('permissions.skip', { defaultValue: 'Bỏ qua' })}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Settings Link */}
            <TouchableOpacity style={styles.settingsLink} onPress={handleOpenSettings}>
              <Ionicons name="settings-outline" size={16} color="#666" />
              <Text style={styles.settingsLinkText}>
                {t('permissions.openSettings', { defaultValue: 'Mở cài đặt hệ thống' })}
              </Text>
            </TouchableOpacity>
          </ScrollView>
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
    maxHeight: height * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  scrollContent: {
    padding: 24,
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
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionsContainer: {
    marginBottom: 20,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  permissionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#2E7D32',
    marginLeft: 10,
    lineHeight: 18,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  allowButton: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#B0B0B0',
    shadowOpacity: 0.1,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  skipButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#666',
  },
  settingsLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  settingsLinkText: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline',
  },
});

export default PermissionRequestModal;

