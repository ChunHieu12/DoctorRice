import { useTextSize } from '@/contexts/TextSizeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ReopenRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason?: string) => Promise<void>;
  type: 'request' | 'approve'; // request = farmer asking, approve = expert responding
  expertName?: string;
  farmerName?: string;
}

export default function ReopenRequestModal({
  visible,
  onClose,
  onSubmit,
  type,
  expertName = 'chuyên gia',
  farmerName = 'nhà nông',
}: ReopenRequestModalProps) {
  const { scale } = useTextSize();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (approved?: boolean) => {
    try {
      setIsSubmitting(true);
      if (type === 'request') {
        await onSubmit(reason.trim() || undefined);
      } else {
        // For approve type, we don't need reason
        await onSubmit();
      }
      setReason('');
      onClose();
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons
              name={type === 'request' ? 'chatbox-outline' : 'help-circle-outline'}
              size={24 * scale}
              color="#4CAF50"
            />
            <Text style={[styles.title, { fontSize: 20 * scale }]}>
              {type === 'request' ? 'Yêu cầu mở lại cuộc trò chuyện' : 'Yêu cầu mở lại'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24 * scale} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {type === 'request' ? (
              <>
                <Text style={[styles.description, { fontSize: 15 * scale }]}>
                  Bạn muốn tiếp tục trò chuyện với {expertName}?
                </Text>
                <Text style={[styles.subdescription, { fontSize: 13 * scale }]}>
                  Cuộc trò chuyện sẽ được gửi yêu cầu mở lại đến chuyên gia. Họ có thể chấp nhận
                  hoặc từ chối yêu cầu của bạn.
                </Text>

                {/* Reason Input (optional) */}
                <TextInput
                  style={[styles.reasonInput, { fontSize: 15 * scale }]}
                  placeholder="Lý do muốn mở lại (không bắt buộc)"
                  placeholderTextColor="#999"
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  maxLength={300}
                  numberOfLines={3}
                />
              </>
            ) : (
              <>
                <Text style={[styles.description, { fontSize: 15 * scale }]}>
                  {farmerName} muốn mở lại cuộc trò chuyện với bạn.
                </Text>
                <Text style={[styles.subdescription, { fontSize: 13 * scale }]}>
                  Bạn có muốn chấp nhận yêu cầu này không?
                </Text>
              </>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {type === 'request' ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleClose}
                  activeOpacity={0.7}
                  disabled={isSubmitting}
                >
                  <Text
                    style={[styles.buttonText, styles.cancelButtonText, { fontSize: 15 * scale }]}
                  >
                    Hủy
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={() => handleSubmit()}
                  activeOpacity={0.7}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text
                      style={[styles.buttonText, styles.submitButtonText, { fontSize: 15 * scale }]}
                    >
                      Gửi yêu cầu
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.rejectButton]}
                  onPress={handleClose}
                  activeOpacity={0.7}
                  disabled={isSubmitting}
                >
                  <Text
                    style={[styles.buttonText, styles.rejectButtonText, { fontSize: 15 * scale }]}
                  >
                    Từ chối
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.approveButton]}
                  onPress={() => handleSubmit()}
                  activeOpacity={0.7}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text
                      style={[styles.buttonText, styles.approveButtonText, { fontSize: 15 * scale }]}
                    >
                      Chấp nhận
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 10,
  },
  title: {
    flex: 1,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  description: {
    color: '#333',
    marginBottom: 10,
    lineHeight: 22,
  },
  subdescription: {
    color: '#999',
    marginBottom: 20,
    lineHeight: 20,
  },
  reasonInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F5F5F5',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#666',
  },
  submitButtonText: {
    color: '#fff',
  },
  rejectButtonText: {
    color: '#666',
  },
  approveButtonText: {
    color: '#fff',
  },
});

