/**
 * TextSizeModal
 * Modal to select text size for the app
 */
import { TextSize, useTextSize } from '@/contexts/TextSizeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TextSizeModalProps {
  visible: boolean;
  onClose: () => void;
}

const TextSizeModal: React.FC<TextSizeModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const { textSize, setTextSize } = useTextSize();

  const handleSelectSize = async (size: TextSize) => {
    await setTextSize(size);
    onClose();
  };

  const sizes: { value: TextSize; label: string; example: number }[] = [
    { value: 'small', label: t('settings.textSize.small'), example: 14 },
    { value: 'medium', label: t('settings.textSize.medium'), example: 16 },
    { value: 'large', label: t('settings.textSize.large'), example: 18 },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('settings.textSizeLabel')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.options}>
            {sizes.map((size) => (
              <TouchableOpacity
                key={size.value}
                style={[styles.option, textSize === size.value && styles.optionActive]}
                onPress={() => handleSelectSize(size.value)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionLabel, { fontSize: size.example }]}>
                    {size.label}
                  </Text>
                  <Text style={[styles.optionExample, { fontSize: size.example }]}>
                    {t('settings.textSize.example')}
                  </Text>
                </View>
                {textSize === size.value && (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
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
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  optionActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionExample: {
    color: '#666',
  },
});

export default TextSizeModal;

