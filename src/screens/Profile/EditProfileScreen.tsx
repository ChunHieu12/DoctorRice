/**
 * EditProfileScreen
 * Chỉnh sửa thông tin cá nhân: Avatar, Họ tên, Số điện thoại
 */
import { useTextSize } from '@/contexts/TextSizeContext';
import { useAuth } from '@/hooks/useAuth';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { useFirebasePhoneAuth } from '@/hooks/useFirebasePhoneAuth';
import { updateProfile, uploadAvatar } from '@/services/user.service';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, checkAuth } = useAuth();
  const { showAlert } = useCustomAlert();
  const { scale } = useTextSize();
  const { sendOTP, verifyOTP, isLoading: otpLoading } = useFirebasePhoneAuth();

  const [displayName, setDisplayName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isAddingPhone, setIsAddingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState(user?.avatar || '');

  /**
   * Pick and upload avatar
   */
  const handlePickAvatar = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert({
          type: 'warning',
          title: t('common.permission'),
          message: 'Cần quyền truy cập thư viện ảnh',
          buttons: [{ text: t('common.ok'), style: 'default' }],
        });
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        try {
          const newAvatarUrl = await uploadAvatar(result.assets[0].uri);
          setAvatarUri(newAvatarUrl);
          
          // Update auth context
          await checkAuth();
          
          showAlert({
            type: 'success',
            title: t('common.success'),
            message: t('profile.uploadAvatarSuccess'),
            buttons: [{ text: t('common.ok'), style: 'default' }],
          });
        } catch (error: any) {
          showAlert({
            type: 'error',
            title: t('common.error'),
            message: error.message || 'Không thể tải ảnh lên',
            buttons: [{ text: t('common.ok'), style: 'default' }],
          });
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: error.message || 'Lỗi khi chọn ảnh',
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });
    }
  };

  /**
   * Save profile changes (name only)
   */
  const handleSave = async () => {
    if (!displayName.trim()) {
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: 'Vui lòng nhập họ và tên',
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile({ displayName: displayName.trim() });
      await checkAuth();
      
      showAlert({
        type: 'success',
        title: t('common.success'),
        message: t('profile.updateSuccess'),
        buttons: [
          {
            text: t('common.ok'),
            style: 'default',
            onPress: () => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            },
          },
        ],
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: error.message || 'Không thể cập nhật thông tin',
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Start adding phone number
   */
  const handleAddPhone = () => {
    setIsAddingPhone(true);
  };

  /**
   * Send OTP to new phone number
   */
  const handleSendOTP = async () => {
    if (!newPhone.trim()) {
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: 'Vui lòng nhập số điện thoại',
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });
      return;
    }

    // Normalize phone to +84 format
    let formattedPhone = newPhone.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+84' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+84' + formattedPhone;
    }

    try {
      await sendOTP(formattedPhone);
      setOtpSent(true);
      showAlert({
        type: 'success',
        title: t('common.success'),
        message: 'Mã OTP đã được gửi đến số điện thoại của bạn',
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: error.message || 'Không thể gửi mã OTP',
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });
    }
  };

  /**
   * Verify OTP and update phone
   */
  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: 'Vui lòng nhập mã OTP 6 số',
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });
      return;
    }

    try {
      const result = await verifyOTP(otp);
      
      if (result.success) {
        // Update phone in backend
        let formattedPhone = newPhone.trim();
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+84' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('+')) {
          formattedPhone = '+84' + formattedPhone;
        }

        await updateProfile({ phone: formattedPhone });
        await checkAuth();
        
        setPhone(formattedPhone);
        setIsAddingPhone(false);
        setOtpSent(false);
        setNewPhone('');
        setOtp('');
        
        showAlert({
          type: 'success',
          title: t('common.success'),
          message: 'Số điện thoại đã được thêm thành công',
          buttons: [{ text: t('common.ok'), style: 'default' }],
        });
      } else {
        showAlert({
          type: 'error',
          title: t('common.error'),
          message: 'Mã OTP không đúng',
          buttons: [{ text: t('common.ok'), style: 'default' }],
        });
      }
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: t('common.error'),
        message: error.message || 'Xác thực OTP thất bại',
        buttons: [{ text: t('common.ok'), style: 'default' }],
      });
    }
  };

  /**
   * Cancel adding phone
   */
  const handleCancelAddPhone = () => {
    setIsAddingPhone(false);
    setOtpSent(false);
    setNewPhone('');
    setOtp('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section (Background #4CAF50) */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: 20 * scale }]}>
            {t('profile.title')}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickAvatar} disabled={isUploading}>
            <View style={styles.avatarContainer}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={60} color="#fff" />
                </View>
              )}
              
              {/* Camera Icon Overlay */}
              <View style={styles.cameraIconContainer}>
                {isUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={20} color="#fff" />
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Display Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { fontSize: 16 * scale }]}>
              {t('profile.fullName')}
            </Text>
            <TextInput
              style={[styles.input, { fontSize: 16 * scale }]}
              placeholder="Nhập họ và tên"
              placeholderTextColor="#999"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { fontSize: 16 * scale }]}>
              {t('profile.phoneNumber')}
            </Text>
            
            {!phone && !isAddingPhone ? (
              <TouchableOpacity style={styles.addPhoneButton} onPress={handleAddPhone}>
                <Ionicons name="add-circle-outline" size={20 * scale} color="#4CAF50" />
                <Text style={[styles.addPhoneText, { fontSize: 16 * scale }]}>
                  {t('account.addPhone')}
                </Text>
              </TouchableOpacity>
            ) : phone && !isAddingPhone ? (
              <TextInput
                style={[styles.input, styles.inputDisabled, { fontSize: 16 * scale }]}
                value={phone}
                editable={false}
                placeholderTextColor="#999"
              />
            ) : null}

            {/* Add Phone Flow */}
            {isAddingPhone && (
              <View style={styles.addPhoneFlow}>
                {!otpSent ? (
                  <>
                    <TextInput
                      style={[styles.input, { fontSize: 16 * scale }]}
                      placeholder="Nhập số điện thoại"
                      placeholderTextColor="#999"
                      value={newPhone}
                      onChangeText={setNewPhone}
                      keyboardType="phone-pad"
                      autoFocus
                    />
                    <View style={styles.flowButtons}>
                      <TouchableOpacity
                        style={[styles.flowButton, styles.cancelButton]}
                        onPress={handleCancelAddPhone}
                        disabled={otpLoading}
                      >
                        <Text style={[styles.cancelButtonText, { fontSize: 14 * scale }]}>
                          Hủy
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.flowButton, styles.sendOtpButton]}
                        onPress={handleSendOTP}
                        disabled={otpLoading}
                      >
                        {otpLoading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={[styles.sendOtpButtonText, { fontSize: 14 * scale }]}>
                            Gửi OTP
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <TextInput
                      style={[styles.input, { fontSize: 16 * scale }]}
                      placeholder="Nhập mã OTP 6 số"
                      placeholderTextColor="#999"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      autoFocus
                    />
                    <View style={styles.flowButtons}>
                      <TouchableOpacity
                        style={[styles.flowButton, styles.cancelButton]}
                        onPress={handleCancelAddPhone}
                        disabled={otpLoading}
                      >
                        <Text style={[styles.cancelButtonText, { fontSize: 14 * scale }]}>
                          Hủy
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.flowButton, styles.verifyButton]}
                        onPress={handleVerifyOTP}
                        disabled={otpLoading}
                      >
                        {otpLoading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={[styles.verifyButtonText, { fontSize: 14 * scale }]}>
                            Xác nhận
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>

          {/* Save Button */}
          {!isAddingPhone && (
            <>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.saveButtonText, { fontSize: 16 * scale }]}>
                    {t('profile.save')}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButtonBottom}
                onPress={() => router.back()}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                <Text style={[styles.backButtonText, { fontSize: 16 * scale }]}>
                  {t('profile.cancel')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Avatar Section
  avatarSection: {
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    paddingBottom: 60,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Form Section
  formSection: {
    backgroundColor: '#fefefe',
    marginTop: -40,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#999',
  },

  // Add Phone
  addPhoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  addPhoneText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
  addPhoneFlow: {
    marginTop: 10,
  },
  flowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  flowButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  sendOtpButton: {
    backgroundColor: '#4CAF50',
  },
  sendOtpButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  verifyButton: {
    backgroundColor: '#2196F3',
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Save Button
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButtonBottom: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

