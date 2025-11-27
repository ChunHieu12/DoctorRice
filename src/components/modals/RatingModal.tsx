import { useTextSize } from '@/contexts/TextSizeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => void;
  expertName?: string;
}

export default function RatingModal({
  visible,
  onClose,
  onSubmit,
  expertName = 'chuyên gia',
}: RatingModalProps) {
  const { scale } = useTextSize();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating === 0) {
      alert('Vui lòng chọn số sao đánh giá');
      return;
    }
    onSubmit(rating, comment.trim() || undefined);
    setRating(0);
    setComment('');
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { fontSize: 20 * scale }]}>Đánh giá chuyên gia</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24 * scale} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.subtitle, { fontSize: 15 * scale }]}>
              Đánh giá của bạn về {expertName}
            </Text>

            {/* Star Rating */}
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={40 * scale}
                    color={star <= rating ? '#FFC107' : '#E0E0E0'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {rating > 0 && (
              <Text style={[styles.ratingText, { fontSize: 14 * scale }]}>
                {rating === 1 && 'Rất không hài lòng'}
                {rating === 2 && 'Không hài lòng'}
                {rating === 3 && 'Bình thường'}
                {rating === 4 && 'Hài lòng'}
                {rating === 5 && 'Rất hài lòng'}
              </Text>
            )}

            {/* Comment Input */}
            <TextInput
              style={[styles.commentInput, { fontSize: 15 * scale }]}
              placeholder="Nhận xét thêm (không bắt buộc)"
              placeholderTextColor="#999"
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
              numberOfLines={4}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText, { fontSize: 15 * scale }]}>
                Hủy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, rating === 0 && styles.disabledButton]}
              onPress={handleSubmit}
              activeOpacity={0.7}
              disabled={rating === 0}
            >
              <Text style={[styles.buttonText, styles.submitButtonText, { fontSize: 15 * scale }]}>
                Gửi đánh giá
              </Text>
            </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 15,
  },
  starButton: {
    padding: 5,
  },
  ratingText: {
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 20,
  },
  commentInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 100,
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
  disabledButton: {
    backgroundColor: '#E0E0E0',
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
});

