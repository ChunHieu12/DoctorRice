/**
 * TreatmentSendModal
 * Modal for sending treatment information to IoT device via Firebase
 */

import { colors } from '@/constants/colors';
import * as treatmentService from '@/services/treatment.service';
import { formatTreatmentForDisplay } from '@/services/treatment.service';
import type { TreatmentData } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export interface TreatmentSendModalProps {
  photoId: string;
  treatmentData: TreatmentData;
  onSuccess?: () => void;
  onCancel: () => void;
}

const TreatmentSendModal: React.FC<TreatmentSendModalProps> = ({
  photoId,
  treatmentData,
  onSuccess,
  onCancel,
}) => {
  const [sending, setSending] = useState(false);

  /**
   * Handle send treatment
   */
  const handleSend = async () => {
    try {
      setSending(true);

      const response = await treatmentService.sendTreatmentToIoT({
        photoId,
        treatmentData,
      });

      if (response.success) {
        Alert.alert(
          'Thành công',
          'Đã gửi thông tin điều trị đến thiết bị IoT. Bạn có thể xem chi tiết trên giao diện web của thiết bị.',
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess?.();
              },
            },
          ]
        );
      } else {
        throw new Error(response.error?.message || 'Failed to send treatment');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Lỗi', `Không thể gửi thông tin điều trị: ${errorMessage}`);
      console.error('Error sending treatment:', error);
    } finally {
      setSending(false);
    }
  };

  /**
   * Render treatment section
   */
  const renderTreatmentSection = () => {
    const formattedText = formatTreatmentForDisplay(treatmentData);
    const sections = formattedText.split('\n\n');

    return (
      <View style={styles.treatmentContainer}>
        {sections.map((section, index) => {
          const lines = section.split('\n');
          const title = lines[0];
          const content = lines.slice(1);

          return (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{title}</Text>
              {content.map((line, lineIndex) => (
                <Text key={lineIndex} style={styles.sectionContent}>
                  {line}
                </Text>
              ))}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gửi thông tin điều trị cho IoT</Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.infoBannerText}>
            Thông tin điều trị sẽ được gửi đến thiết bị IoT qua Firebase và hiển thị trên giao
            diện web của thiết bị.
          </Text>
        </View>

        {/* Treatment Details */}
        <Text style={styles.subtitle}>Chi tiết phương án điều trị:</Text>
        {renderTreatmentSection()}

        {/* Warning */}
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={20} color={colors.warning} />
          <Text style={styles.warningText}>
            Vui lòng kiểm tra kỹ thông tin trước khi gửi. Thiết bị IoT sẽ nhận được thông tin
            ngay lập tức.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={16} color="#fff" />
              <Text style={styles.sendButtonText}>Gửi đến IoT</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginBottom: 20,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  treatmentContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginLeft: 8,
  },
  warningBanner: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  sendButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default TreatmentSendModal;

