import { useTextSize } from '@/contexts/TextSizeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface RatingModalProps {
  visible: boolean;
  expertName: string;
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  expertName,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const { scale } = useTextSize();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating === 0) {
      return;
    }
    onSubmit(rating, comment.trim() || undefined);
    // Reset
    setRating(0);
    setComment('');
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { padding: 20 * scale }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { fontSize: 18 * scale }]}>
              {t('expertChat.rateExpert', { defaultValue: 'Đánh giá chuyên gia' })}
            </Text>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24 * scale} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Expert Name */}
          <Text style={[styles.expertName, { fontSize: 16 * scale, marginBottom: 20 * scale }]}>
            {expertName}
          </Text>

          {/* Star Rating */}
          <View style={[styles.starsContainer, { marginBottom: 20 * scale }]}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={{ padding: 5 * scale }}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={40 * scale}
                  color={star <= rating ? '#FFD700' : '#DDD'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Rating Text */}
          {rating > 0 && (
            <Text style={[styles.ratingText, { fontSize: 14 * scale, marginBottom: 15 * scale }]}>
              {rating === 1 && t('expertChat.rating1', { defaultValue: 'Rất tệ' })}
              {rating === 2 && t('expertChat.rating2', { defaultValue: 'Tệ' })}
              {rating === 3 && t('expertChat.rating3', { defaultValue: 'Bình thường' })}
              {rating === 4 && t('expertChat.rating4', { defaultValue: 'Tốt' })}
              {rating === 5 && t('expertChat.rating5', { defaultValue: 'Xuất sắc' })}
            </Text>
          )}

          {/* Comment Input */}
          <TextInput
            style={[
              styles.commentInput,
              {
                fontSize: 14 * scale,
                padding: 12 * scale,
                marginBottom: 20 * scale,
                minHeight: 100 * scale,
              },
            ]}
            placeholder={t('expertChat.commentPlaceholder', {
              defaultValue: 'Nhận xét của bạn (tùy chọn)',
            })}
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { padding: 12 * scale }]}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { fontSize: 15 * scale }]}>
                {t('common.cancel', { defaultValue: 'Hủy' })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                { padding: 12 * scale },
                rating === 0 && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={rating === 0}
              activeOpacity={0.7}
            >
              <Text style={[styles.submitButtonText, { fontSize: 15 * scale }]}>
                {t('common.submit', { defaultValue: 'Gửi đánh giá' })}
              </Text>
            </TouchableOpacity>
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
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '85%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
  },
  expertName: {
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: '500',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

