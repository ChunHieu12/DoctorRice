/**
 * Test Custom Alert Screen
 * Demo tất cả loại custom alerts
 */
import { useCustomAlert } from '@/hooks/useCustomAlert';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TestCustomAlertScreen: React.FC = () => {
  const { showAlert } = useCustomAlert();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Custom Alert Demo</Text>

        {/* Success Alert */}
        <TouchableOpacity
          style={[styles.button, styles.buttonSuccess]}
          onPress={() =>
            showAlert({
              type: 'success',
              title: 'Language conversion successful',
              buttons: [{ text: 'Close', style: 'default' }],
            })
          }
        >
          <Text style={styles.buttonText}>Success Alert (English)</Text>
        </TouchableOpacity>

        {/* Error Alert */}
        <TouchableOpacity
          style={[styles.button, styles.buttonError]}
          onPress={() =>
            showAlert({
              type: 'error',
              title: 'Chuyển đổ ngôn ngữ thất bại',
              message: 'Vui lòng thử lại sau',
              buttons: [{ text: 'Đóng', style: 'default' }],
            })
          }
        >
          <Text style={styles.buttonText}>Error Alert (Tiếng Việt)</Text>
        </TouchableOpacity>

        {/* Info Alert */}
        <TouchableOpacity
          style={[styles.button, styles.buttonInfo]}
          onPress={() =>
            showAlert({
              type: 'info',
              title: 'Vui lòng liên hệ TSH TSM khuôn viên nếu không',
              buttons: [{ text: 'Đồng ý', style: 'default' }],
            })
          }
        >
          <Text style={styles.buttonText}>Info Alert</Text>
        </TouchableOpacity>

        {/* Warning Alert */}
        <TouchableOpacity
          style={[styles.button, styles.buttonWarning]}
          onPress={() =>
            showAlert({
              type: 'warning',
              title: 'Cảnh báo',
              message: 'Dữ liệu có thể bị mất nếu bạn tiếp tục',
              buttons: [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Tiếp tục', style: 'default' },
              ],
            })
          }
        >
          <Text style={styles.buttonText}>Warning Alert (2 buttons)</Text>
        </TouchableOpacity>

        {/* Confirm/Logout Alert */}
        <TouchableOpacity
          style={[styles.button, styles.buttonConfirm]}
          onPress={() =>
            showAlert({
              type: 'confirm',
              title: 'Bạn có muốn đăng xuất?',
              buttons: [
                { text: 'Đăng xuất', style: 'cancel' },
                { text: 'Hủy', style: 'default' },
              ],
            })
          }
        >
          <Text style={styles.buttonText}>Logout Confirmation</Text>
        </TouchableOpacity>

        {/* Destructive Button */}
        <TouchableOpacity
          style={[styles.button, styles.buttonDestructive]}
          onPress={() =>
            showAlert({
              type: 'confirm',
              title: 'Xóa tài khoản?',
              message: 'Hành động này không thể hoàn tác',
              buttons: [
                { text: 'Hủy', style: 'cancel' },
                { 
                  text: 'Xóa', 
                  style: 'destructive',
                  onPress: () => console.log('Deleted')
                },
              ],
            })
          }
        >
          <Text style={styles.buttonText}>Destructive Button (Red)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonSuccess: {
    backgroundColor: '#4CAF50',
  },
  buttonError: {
    backgroundColor: '#F44336',
  },
  buttonInfo: {
    backgroundColor: '#2196F3',
  },
  buttonWarning: {
    backgroundColor: '#FF9800',
  },
  buttonConfirm: {
    backgroundColor: '#9C27B0',
  },
  buttonDestructive: {
    backgroundColor: '#D32F2F',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default TestCustomAlertScreen;
