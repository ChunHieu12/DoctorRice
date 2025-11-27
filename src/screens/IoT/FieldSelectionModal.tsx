/**
 * FieldSelectionModal
 * Simple modal for selecting a field (used before IoT Gallery)
 */

import { colors } from '@/constants/colors';
import { useFieldManagement } from '@/hooks/useFieldManagement';
import type { Field } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface FieldSelectionModalProps {
  onFieldSelected: (field: Field) => void;
  onCancel: () => void;
}

const FieldSelectionModal: React.FC<FieldSelectionModalProps> = ({
  onFieldSelected,
  onCancel,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { fields, loading: fieldsLoading } = useFieldManagement();
  const [selectedField, setSelectedField] = useState<Field | null>(null);

  /**
   * Handle field selection
   */
  const handleSelect = (field: Field) => {
    setSelectedField(field);
  };

  /**
   * Handle confirm
   */
  const handleConfirm = () => {
    if (selectedField) {
      onFieldSelected(selectedField);
    }
  };

  /**
   * Render field item
   */
  const renderField = ({ item }: { item: Field }) => {
    const isConnected = !!(item.hasIoTConnection || item.iotConnection);
    const isSelected = selectedField?._id === item._id;

    return (
      <TouchableOpacity
        style={[
          styles.fieldItem,
          isSelected && styles.fieldItemSelected,
          !isConnected && styles.fieldItemDisabled,
        ]}
        onPress={() => handleSelect(item)}
        disabled={!isConnected}
      >
        <Ionicons
          name={isSelected ? 'radio-button-on' : 'radio-button-off'}
          size={24}
          color={isSelected ? colors.primary : colors.textSecondary}
        />
        <View style={styles.fieldInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.fieldName}>{item.name}</Text>
            {isConnected && (
              <View style={styles.connectedBadge}>
                <Ionicons name="link" size={12} color="#fff" />
              </View>
            )}
          </View>
          {item.gpsCenter && (
            <Text style={styles.fieldGps}>
              📍 {item.gpsCenter.lat.toFixed(7)}, {item.gpsCenter.lng.toFixed(7)}
            </Text>
          )}
          {!isConnected && (
            <Text style={styles.notConnectedText}>{t('fieldSelection.notConnected')}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with SafeArea */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Text style={styles.headerTitle}>{t('fieldSelection.title')}</Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Instructions */}
        <View style={styles.instructions}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.instructionText}>
            {t('fieldSelection.instruction')}
          </Text>
        </View>

        {/* Field List */}
        {fieldsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('fieldSelection.loading')}</Text>
          </View>
        ) : fields.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>{t('fieldSelection.noFields')}</Text>
            <Text style={styles.emptyText}>
              {t('fieldSelection.noFieldsDesc')}
            </Text>
          </View>
        ) : fields.filter((f) => f.hasIoTConnection || f.iotConnection).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="unlink-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>{t('fieldSelection.noIoTFields')}</Text>
            <Text style={styles.emptyText}>
              {t('fieldSelection.noIoTFieldsDesc')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={fields}
            renderItem={renderField}
            keyExtractor={(item) => item._id}
            style={styles.fieldList}
            contentContainerStyle={styles.fieldListContent}
          />
        )}
      </View>

      {/* Footer with SafeArea */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>{t('fieldSelection.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmButton, !selectedField && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={!selectedField}
        >
          <Text style={styles.confirmButtonText}>{t('fieldSelection.viewIoTImages')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomWidth: 0,
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fieldList: {
    flex: 1,
  },
  fieldListContent: {
    paddingBottom: 20,
  },
  fieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  fieldItemSelected: {
    borderColor: colors.primary,
    borderWidth: 3,
    backgroundColor: '#e8f5e9',
    shadowOpacity: 0.15,
    elevation: 4,
  },
  fieldItemDisabled: {
    opacity: 0.5,
    backgroundColor: '#f9f9f9',
  },
  fieldInfo: {
    flex: 1,
    gap: 6,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.3,
  },
  fieldGps: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  connectedBadge: {
    backgroundColor: colors.success,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  notConnectedText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '600',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 0,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 5,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
});

export default FieldSelectionModal;

