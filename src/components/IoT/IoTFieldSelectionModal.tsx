/**
 * IoT Field Selection Modal
 * Select IoT field to view gallery
 */

import { colors } from '@/constants/colors';
import type { Field } from '@/types';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface IoTFieldSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  fields: Field[];
  loading?: boolean;
  onSelectField: (field: Field) => void;
}

const IoTFieldSelectionModal: React.FC<IoTFieldSelectionModalProps> = ({
  visible,
  onClose,
  fields,
  loading = false,
  onSelectField,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const renderFieldItem = ({ item }: { item: Field }) => (
    <TouchableOpacity
      style={styles.fieldItem}
      onPress={() => onSelectField(item)}
      activeOpacity={0.7}
    >
      <View style={styles.fieldIcon}>
        <Ionicons name="leaf" size={24} color={colors.primary} />
      </View>
      
      <View style={styles.fieldInfo}>
        <Text style={styles.fieldName}>{item.name}</Text>
        <View style={styles.fieldMeta}>
          <Ionicons name="navigate-circle" size={14} color={colors.textSecondary} />
          <Text style={styles.fieldMetaText}>
            {item.gpsCenter.lat.toFixed(6)}, {item.gpsCenter.lng.toFixed(6)}
          </Text>
        </View>
        
        {item.iotConnection && (
          <View style={styles.iotBadge}>
            <Ionicons name="hardware-chip" size={12} color="#4CAF50" />
            <Text style={styles.iotBadgeText}>
              {item.iotConnection.deviceId || t('iotFieldSelection.connected')}
            </Text>
          </View>
        )}
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t('iotFieldSelection.title')}</Text>
            <Text style={styles.headerSubtitle}>
              {t('iotFieldSelection.subtitle', { count: fields.length })}
            </Text>
          </View>
          
          <View style={{ width: 40 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>{t('iotFieldSelection.loading')}</Text>
            </View>
          ) : fields.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="leaf-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>{t('iotFieldSelection.emptyTitle')}</Text>
              <Text style={styles.emptySubtext}>
                {t('iotFieldSelection.emptySubtitle')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={fields}
              renderItem={renderFieldItem}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Info Footer */}
        <View style={styles.footer}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              {t('iotFieldSelection.info')}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
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
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  fieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  fieldIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  fieldMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  iotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  iotBadgeText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    marginLeft: 8,
  },
});

export default IoTFieldSelectionModal;

