/**
 * IoTConnectionModal
 * Modal for connecting IoT device to a field using connection code
 */

import { colors } from '@/constants/colors';
import { useFieldManagement } from '@/hooks/useFieldManagement';
import { useIoTConnection } from '@/hooks/useIoTConnection';
import fieldService from '@/services/field.service';
import type { Field } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface IoTConnectionModalProps {
  preselectedField?: Field;
  onSuccess?: () => void;
  onCancel: () => void;
}

const IoTConnectionModal: React.FC<IoTConnectionModalProps> = ({
  preselectedField,
  onSuccess,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();
  const { fields, loading: fieldsLoading } = useFieldManagement();
  const { connectDevice, loading: connecting } = useIoTConnection();

  const [selectedField, setSelectedField] = useState<Field | null>(preselectedField || null);
  const [deviceId, setDeviceId] = useState('');
  const [connectionCode, setConnectionCode] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);

  /**
   * Auto-fetch IoT code when selected field changes
   * Triggers on both preselected field (initial) and user selection
   */
  useEffect(() => {
    const fetchIoTCode = async () => {
      // No field selected → do nothing
      if (!selectedField) {
        setConnectionCode('');
        return;
      }

      // Check if field already has IoT connection
      const isAlreadyConnected = !!(selectedField.hasIoTConnection || selectedField.iotConnection);
      
      if (isAlreadyConnected) {
        console.log('ℹ️ Field already has IoT connection, skipping code fetch');
        setConnectionCode(''); // Clear code if field is already connected
        return;
      }

      // Fetch code for selected field
      try {
        setLoadingCode(true);
        console.log('🔄 Fetching IoT code for field:', selectedField._id);
        
        const response = await fieldService.getFieldIoTCode(selectedField._id);
        
        console.log('📥 IoT Code Response:', response);
        
        if (response.success && response.data) {
          console.log('✅ Auto-filling code:', response.data.code);
          setConnectionCode(response.data.code);
        } else {
          console.warn('⚠️ Failed to get IoT code:', response.error);
          setConnectionCode(''); // Clear code on error
        }
      } catch (error) {
        console.error('❌ Failed to fetch IoT code:', error);
        setConnectionCode(''); // Clear code on error
      } finally {
        setLoadingCode(false);
      }
    };

    fetchIoTCode();
  }, [selectedField]); // ✅ Trigger on selectedField change, not preselectedField

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    if (!selectedField) {
      Alert.alert('Lỗi', 'Vui lòng chọn ruộng');
      return false;
    }

    // Check if field already has IoT connection
    if (selectedField.hasIoTConnection || selectedField.iotConnection) {
      Alert.alert(
        'Lỗi', 
        'Ruộng này đã kết nối thiết bị IoT. Vui lòng ngắt kết nối trước khi kết nối thiết bị mới.'
      );
      return false;
    }

    if (!deviceId.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập Device ID');
      return false;
    }

    if (!connectionCode.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã kết nối');
      return false;
    }

    return true;
  };

  /**
   * Handle connect
   */
  const handleConnect = async () => {
    if (!validateForm() || !selectedField) return;

    const success = await connectDevice(selectedField._id, deviceId.trim(), connectionCode.trim());

    if (success) {
      onSuccess?.();
    }
  };

  /**
   * Render field item
   */
  const renderField = ({ item }: { item: Field }) => {
    const isConnected = !!(item.hasIoTConnection || item.iotConnection);
    return (
      <TouchableOpacity
        style={[
          styles.fieldItem,
          selectedField?._id === item._id && styles.fieldItemSelected,
          isConnected && styles.fieldItemConnected,
        ]}
        onPress={() => setSelectedField(item)}
        disabled={isConnected}
      >
        <Ionicons
          name={selectedField?._id === item._id ? 'radio-button-on' : 'radio-button-off'}
          size={24}
          color={selectedField?._id === item._id ? colors.primary : colors.textSecondary}
        />
        <View style={styles.fieldInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.fieldName}>{item.name}</Text>
            {isConnected && (
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedBadgeText}>Đã kết nối</Text>
              </View>
            )}
          </View>
          <Text style={styles.fieldGps}>
            {item.gpsCenter.lat.toFixed(6)}, {item.gpsCenter.lng.toFixed(6)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with SafeArea */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Text style={styles.headerTitle}>Kết nối thiết bị IoT</Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Instructions */}
        <View style={styles.instructions}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.instructionText}>
            Nhập Device ID và mã kết nối để liên kết thiết bị IoT với ruộng của bạn
          </Text>
        </View>

        {/* Field Selection */}
        {!preselectedField && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chọn ruộng</Text>
            {fieldsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : fields.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có ruộng nào. Vui lòng tạo ruộng trước.</Text>
            ) : (
              <FlatList
                data={fields}
                renderItem={renderField}
                keyExtractor={(item) => item._id}
                style={styles.fieldList}
                scrollEnabled={false}
              />
            )}
          </View>
        )}

        {preselectedField && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ruộng</Text>
            <View style={styles.selectedFieldBadge}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={styles.selectedFieldName}>{preselectedField.name}</Text>
            </View>
          </View>
        )}

        {/* Device ID Input */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Device ID <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: jetson-001-00:00:00:00:00:01"
            value={deviceId}
            onChangeText={setDeviceId}
            autoCapitalize="none"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.hint}>
            💡 Nhập chính xác theo định dạng từ thiết bị (phân biệt chữ hoa/thường)
          </Text>
        </View>

        {/* Connection Code Input */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Mã kết nối <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, loadingCode && styles.inputDisabled]}
              placeholder={loadingCode ? "Đang tải mã..." : "Chọn ruộng để tự động điền mã"}
              value={connectionCode}
              onChangeText={setConnectionCode}
              autoCapitalize="characters"
              maxLength={20}
              placeholderTextColor={colors.textSecondary}
              editable={!loadingCode}
            />
            {loadingCode && (
              <View style={styles.inputLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </View>
          {!loadingCode && connectionCode && (
            <Text style={styles.successHint}>✓ Mã kết nối đã được tự động điền</Text>
          )}
          {!loadingCode && !connectionCode && selectedField && (
            <Text style={styles.hint}>
              {!!(selectedField.hasIoTConnection || selectedField.iotConnection)
                ? '⚠️ Ruộng này đã kết nối IoT. Vui lòng ngắt kết nối trước.'
                : 'Mã kết nối sẽ tự động điền khi chọn ruộng'}
            </Text>
          )}
        </View>
      </View>

      {/* Footer with SafeArea */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.connectButton,
            (connecting || loadingCode || !!(selectedField?.hasIoTConnection || selectedField?.iotConnection)) &&
              styles.connectButtonDisabled,
          ]}
          onPress={handleConnect}
          disabled={connecting || loadingCode || !!(selectedField?.hasIoTConnection || selectedField?.iotConnection)}
        >
          {connecting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.connectButtonText}>Kết nối</Text>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  instructions: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginBottom: 20,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  fieldList: {
    maxHeight: 200,
  },
  fieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
  },
  fieldItemSelected: {
    borderColor: colors.primary,
    backgroundColor: '#e3f2fd',
  },
  fieldItemConnected: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  fieldInfo: {
    flex: 1,
  },
  connectedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  connectedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  fieldName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  fieldGps: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 20,
  },
  selectedFieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  selectedFieldName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  successHint: {
    fontSize: 12,
    color: colors.success,
    marginTop: 4,
    fontWeight: '500',
  },
  inputContainer: {
    position: 'relative',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: colors.textSecondary,
  },
  inputLoader: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
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
  connectButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default IoTConnectionModal;

