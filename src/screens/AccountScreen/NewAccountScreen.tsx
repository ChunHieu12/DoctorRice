/**
 * AccountScreen - Màn hình tài khoản với 4 sections
 * 1. Header (avatar, name, role)
 * 2. Quản lý cá nhân
 * 3. Cài đặt tài khoản
 * 4. Hỗ trợ
 */
import TextSizeModal from '@/components/ui/TextSizeModal';
import { useTextSize } from '@/contexts/TextSizeContext';
import { useAuth } from '@/hooks/useAuth';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import * as authService from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function NewAccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { logout, user } = useAuth();
  const { showAlert } = useCustomAlert();
  const { scale } = useTextSize();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTextSizeModal, setShowTextSizeModal] = useState(false);

  // Get user role display
  const getRoleText = () => {
    if (user?.roles?.includes('expert')) {
      return t('account.role.expert');
    }
    return t('account.role.user');
  };

  /**
   * Navigate to edit profile
   */
  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  /**
   * Navigate to expert conversations
   */
  const handleExpertConversations = () => {
    router.push('/expert-conversations');
  };

  /**
   * Navigate to photo history
   */
  const handlePhotoHistory = () => {
    router.push('/photo-history');
  };

  /**
   * Navigate to AI chat history
   */
  const handleAIChatHistory = () => {
    router.push('/ai-chat-history');
  };

  /**
   * Navigate to field management (IoT)
   */
  const handleFieldManagement = () => {
    router.push('/field-management');
  };

  /**
   * Navigate to change password
   */
  const handleChangePassword = () => {
    router.push('/change-password');
  };

  /**
   * Show text size modal
   */
  const handleTextSize = () => {
    setShowTextSizeModal(true);
  };

  /**
   * Navigate to FAQ
   */
  const handleFAQ = () => {
    router.push('/faq');
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    showAlert({
      type: 'warning',
      title: t('auth.logout'),
      message: t('settings.logoutConfirm'),
      buttons: [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              showAlert({
                type: 'success',
                title: t('common.success'),
                message: t('auth.logoutSuccess'),
                buttons: [
                  {
                    text: t('common.ok'),
                    style: 'default',
                    onPress: () => router.replace('/auth/login'),
                  },
                ],
              });
            } catch (error: any) {
              showAlert({
                type: 'error',
                title: t('common.error'),
                message: error.message || 'Logout failed',
                buttons: [{ text: t('common.ok'), style: 'default' }],
              });
            }
          },
        },
      ],
    });
  };

  /**
   * Handle delete account
   */
  const handleDeleteAccount = async () => {
    showAlert({
      type: 'error',
      title: t('settings.deleteAccount'),
      message: t('settings.deleteAccountConfirm'),
      buttons: [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await authService.deleteAccount();
              
              showAlert({
                type: 'success',
                title: t('common.success'),
                message: t('settings.deleteAccountSuccess'),
                buttons: [
                  {
                    text: t('common.ok'),
                    style: 'default',
                    onPress: () => {
                      logout();
                      router.replace('/auth/login');
                    },
                  },
                ],
              });
            } catch (error: any) {
              showAlert({
                type: 'error',
                title: t('common.error'),
                message: error.message || 'Failed to delete account',
                buttons: [{ text: t('common.ok'), style: 'default' }],
              });
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    });
  };

  /**
   * Menu item component
   */
  const MenuItem = ({ 
    icon, 
    label, 
    onPress, 
    iconColor = '#666' 
  }: { 
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    iconColor?: string;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={22 * scale} color={iconColor} />
        <Text style={[styles.menuItemText, { fontSize: 16 * scale }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20 * scale} color="#999" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ===== SECTION 1: HEADER (Background #4CAF50) ===== */}
      <View style={styles.headerSection}>
        <View style={styles.avatarContainer}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color="#fff" />
            </View>
          )}
          
          {/* Edit icon */}
          <TouchableOpacity style={styles.editAvatarButton} onPress={handleEditProfile}>
            <Ionicons name="pencil" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.userInfoContainer}>
          <Text style={[styles.userName, { fontSize: 20 * scale }]}>{user?.name || 'User'}</Text>
          <View style={styles.roleContainer}>
            <Text style={[styles.roleText, { fontSize: 14 * scale }]}>{getRoleText()}</Text>
          </View>
        </View>
      </View>

      {/* ===== SECTION 2: QUẢN LÝ CÁ NHÂN ===== */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: 18 * scale }]}>{t('settings.personalManagement')}</Text>
        
        <MenuItem
          icon="location"
          label={t('settings.IOT')}
          onPress={handleFieldManagement}
          iconColor="#4CAF50"
        />
        
        <MenuItem
          icon="people-outline"
          label={
            user?.roles?.includes('expert')
              ? t('home.features.chatWithFarmers')
              : t('settings.expertConversations')
          }
          onPress={handleExpertConversations}
          iconColor="#FF5722"
        />
        
        <MenuItem
          icon="images-outline"
          label={t('settings.recognitionHistory')}
          onPress={handlePhotoHistory}
          iconColor="#FF9800"
        />
        
        <MenuItem
          icon="chatbox-ellipses-outline"
          label={t('settings.aiChatHistory')}
          onPress={handleAIChatHistory}
          iconColor="#2196F3"
        />
      </View>

      {/* ===== SECTION 3: CÀI ĐẶT TÀI KHOẢN ===== */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: 18 * scale }]}>{t('settings.accountSettings')}</Text>
        
        {/* Only show change password if user logged in with phone/email */}
        {user?.provider !== 'google' && user?.provider !== 'facebook' && (
          <MenuItem
            icon="lock-closed-outline"
            label={t('settings.changePassword')}
            onPress={handleChangePassword}
            iconColor="#F44336"
          />
        )}
        
        <MenuItem
          icon="text-outline"
          label={t('settings.textSizeLabel')}
          onPress={handleTextSize}
          iconColor="#9C27B0"
        />
      </View>

      {/* ===== SECTION 4: HỖ TRỢ ===== */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: 18 * scale }]}>{t('settings.support')}</Text>
        
        <MenuItem
          icon="help-circle-outline"
          label={t('settings.faq')}
          onPress={handleFAQ}
          iconColor="#607D8B"
        />
      </View>

      {/* ===== FOOTER: LOGOUT & DELETE BUTTONS ===== */}
      <View style={styles.footerSection}>
        <TouchableOpacity 
          style={[styles.footerButton, styles.logoutButton]} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20 * scale} color="#fff" />
          <Text style={[styles.footerButtonText, { fontSize: 16 * scale }]}>{t('auth.logout')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.footerButton, styles.deleteButton]} 
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          activeOpacity={0.8}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20 * scale} color="#fff" />
              <Text style={[styles.footerButtonText, { fontSize: 16 * scale }]}>{t('settings.deleteAccount')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom padding */}
      <View style={{ height: 40 }} />

      {/* Text Size Modal */}
      <TextSizeModal
        visible={showTextSizeModal}
        onClose={() => setShowTextSizeModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // ===== HEADER SECTION =====
  headerSection: {
    backgroundColor: '#4CAF50',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfoContainer: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  roleContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // ===== SECTIONS =====
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  // ===== MENU ITEMS =====
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },

  // ===== FOOTER =====
  footerSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutButton: {
    backgroundColor: '#FF9800',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

