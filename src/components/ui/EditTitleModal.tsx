/**
 * EditTitleModal - Modal to edit conversation title
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

interface EditTitleModalProps {
  visible: boolean;
  currentTitle: string;
  onSave: (newTitle: string) => Promise<void>;
  onCancel: () => void;
}

export default function EditTitleModal({
  visible,
  currentTitle,
  onSave,
  onCancel,
}: EditTitleModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(currentTitle);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle(currentTitle);
    }
  }, [visible, currentTitle]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    try {
      setIsSaving(true);
      await onSave(trimmedTitle);
      onCancel(); // Close modal after success
    } catch (error) {
      console.error('Failed to save title:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    onCancel();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleCancel}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.overlay}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Title */}
              <Text style={styles.modalTitle}>Chỉnh sửa tên cuộc trò chuyện</Text>

              {/* Input */}
              <TextInput
                style={styles.input}
                placeholder="Tên cuộc trò chuyện"
                placeholderTextColor="#999"
                value={title}
                onChangeText={setTitle}
                autoFocus
                maxLength={100}
              />

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.saveButton, !title.trim() && styles.buttonDisabled]}
                  onPress={handleSave}
                  disabled={!title.trim() || isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

