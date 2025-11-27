/**
 * CreateFieldModal Screen
 * Modal for creating/editing rice fields with GPS location picker
 */

import { colors } from '@/constants/colors';
import type { CreateFieldData, Field } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface CreateFieldModalProps {
  field?: Field; // If provided, edit mode
  onSubmit: (data: CreateFieldData) => Promise<void>;
  onCancel: () => void;
}

const CreateFieldModal: React.FC<CreateFieldModalProps> = ({
  field,
  onSubmit,
  onCancel,
}) => {
  const isEditMode = !!field;
  const insets = useSafeAreaInsets();

  // Form state
  const [name, setName] = useState(field?.name || '');
  const [latitude, setLatitude] = useState(field?.gpsCenter.lat.toString() || '');
  const [longitude, setLongitude] = useState(field?.gpsCenter.lng.toString() || '');
  const [radius, setRadius] = useState(field?.radius.toString() || '100');
  const [cropType, setCropType] = useState(field?.metadata?.cropType || '');
  const [notes, setNotes] = useState(field?.metadata?.notes || '');

  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  /**
   * Get current location
   */
  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);

      // Check permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập vị trí để sử dụng tính năng này');
        return;
      }

      // Get location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Use 8 decimal places for GPS precision (~1.1mm accuracy)
      setLatitude(location.coords.latitude.toFixed(8));
      setLongitude(location.coords.longitude.toFixed(8));
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại');
    } finally {
      setGettingLocation(false);
    }
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên ruộng');
      return false;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseFloat(radius);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      Alert.alert('Lỗi', 'Vĩ độ không hợp lệ (phải từ -90 đến 90)');
      return false;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      Alert.alert('Lỗi', 'Kinh độ không hợp lệ (phải từ -180 đến 180)');
      return false;
    }

    if (isNaN(rad) || rad <= 0) {
      Alert.alert('Lỗi', 'Bán kính phải lớn hơn 0');
      return false;
    }

    return true;
  };

  /**
   * Handle submit
   */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const data: CreateFieldData = {
        name: name.trim(),
        gpsCenter: {
          lat: parseFloat(latitude),
          lng: parseFloat(longitude),
        },
        radius: parseFloat(radius),
        metadata: {
          cropType: cropType.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      };

      // Debug: Log actual GPS precision being sent
      console.log('📍 Creating field with GPS:', {
        lat: data.gpsCenter.lat,
        lng: data.gpsCenter.lng,
        latString: latitude,
        lngString: longitude,
        latPrecision: latitude.split('.')[1]?.length || 0,
        lngPrecision: longitude.split('.')[1]?.length || 0,
      });

      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting field:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with SafeArea */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Text style={styles.headerTitle}>{isEditMode ? 'Chỉnh sửa ruộng' : 'Tạo ruộng mới'}</Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Form */}
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Tên ruộng <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ví dụ: Ruộng A, Ruộng nhà"
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* GPS Location */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              Vị trí GPS <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={gettingLocation}
            >
              {gettingLocation ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="navigate-circle" size={16} color={colors.primary} />
                  <Text style={styles.locationButtonText}>Vị trí hiện tại</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.gpsRow}>
            <View style={styles.gpsInput}>
              <Text style={styles.gpsLabel}>Vĩ độ</Text>
              <TextInput
                style={styles.input}
                placeholder="10.762622"
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            <View style={styles.gpsInput}>
              <Text style={styles.gpsLabel}>Kinh độ</Text>
              <TextInput
                style={styles.input}
                placeholder="106.660172"
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Radius */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Bán kính (m) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="100"
            value={radius}
            onChangeText={setRadius}
            keyboardType="numeric"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.hint}>
            Ảnh từ IoT nằm trong bán kính này sẽ được tự động lọc
          </Text>
        </View>

        {/* Crop Type */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Loại cây trồng</Text>
          <TextInput
            style={styles.input}
            placeholder="Lúa, Ngô, ..."
            value={cropType}
            onChangeText={setCropType}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Notes */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Ghi chú</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ghi chú về ruộng..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </ScrollView>

      {/* Footer with SafeArea */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{isEditMode ? 'Lưu' : 'Tạo ruộng'}</Text>
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
  form: {
    flex: 1,
    padding: 16,
  },
  fieldGroup: {
    marginBottom: 20,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  locationButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  gpsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gpsInput: {
    flex: 1,
  },
  gpsLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
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
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CreateFieldModal;

