/**
 * FieldManagementScreen
 * Screen for managing rice fields (list, create, edit, delete, connect IoT)
 */

import FieldCard from '@/components/IoT/FieldCard';
import { colors } from '@/constants/colors';
import { useFieldManagement } from '@/hooks/useFieldManagement';
import useIoTConnection from '@/hooks/useIoTConnection';
import type { CreateFieldData, Field } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import IoTConnectionModal from '../IoT/IoTConnectionModal';
import CreateFieldModal from './CreateFieldModal';

const FieldManagementScreen: React.FC = () => {
  const {
    fields,
    loading,
    refreshing,
    error,
    createField,
    updateField,
    deleteField,
    refresh,
  } = useFieldManagement();
  const { disconnectDevice, loading: disconnecting } = useIoTConnection();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [showIoTModal, setShowIoTModal] = useState(false);
  const [connectingField, setConnectingField] = useState<Field | null>(null);

  /**
   * Handle create field
   */
  const handleCreateField = async (data: CreateFieldData) => {
    const newField = await createField(data);
    if (newField) {
      setShowCreateModal(false);
      Alert.alert('Thành công', `Ruộng "${newField.name}" đã được tạo!`);
    }
  };

  /**
   * Handle edit field
   */
  const handleEditField = (field: Field) => {
    // Check if field has active IoT connection
    if (field.hasIoTConnection || field.iotConnection) {
      Alert.alert(
        'Không thể chỉnh sửa',
        `Ruộng "${field.name}" đang có thiết bị IoT kết nối (${field.iotConnection?.deviceId}).\n\nVui lòng ngắt kết nối thiết bị trước khi chỉnh sửa ruộng.`,
        [
          { text: 'OK', style: 'default' }
        ]
      );
      return;
    }

    // No connection - allow edit
    setEditingField(field);
  };

  /**
   * Handle update field
   */
  const handleUpdateField = async (data: CreateFieldData) => {
    if (!editingField) return;

    const updated = await updateField(editingField._id, data);
    if (updated) {
      setEditingField(null);
      // Refresh fields to get latest data from backend
      // This ensures IoT connection info is cleared if device was disconnected
      await refresh();
      Alert.alert('Thành công', 'Cập nhật ruộng thành công!');
    }
  };

  /**
   * Handle delete field
   */
  const handleDeleteField = (field: Field) => {
    // Check if field has active IoT connection
    if (field.hasIoTConnection || field.iotConnection) {
      Alert.alert(
        'Không thể xóa',
        `Ruộng "${field.name}" đang có thiết bị IoT kết nối (${field.iotConnection?.deviceId}).\n\nVui lòng ngắt kết nối thiết bị trước khi xóa ruộng.`,
        [
          { text: 'OK', style: 'default' }
        ]
      );
      return;
    }

    // Normal delete flow if no connection
    Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa ruộng "${field.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          const success = await deleteField(field._id);
          if (success) {
            Alert.alert('Thành công', 'Đã xóa ruộng');
          }
        },
      },
    ]);
  };

  /**
   * Handle connect IoT
   */
  const handleConnectIoT = (field: Field) => {
    setConnectingField(field);
    setShowIoTModal(true);
  };

  /**
   * Handle disconnect IoT
   */
  const handleDisconnectIoT = (field: Field) => {
    Alert.alert(
      'Xác nhận ngắt kết nối',
      `Bạn có chắc muốn ngắt kết nối thiết bị IoT "${field.iotConnection?.deviceId}" khỏi ruộng "${field.name}"?\n\nSau khi ngắt kết nối, bạn sẽ không nhận được dữ liệu từ thiết bị này nữa.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Ngắt kết nối',
          style: 'destructive',
          onPress: async () => {
            const success = await disconnectDevice(field._id);
            if (success) {
              // Reload fields to update connection status
              await refresh();
            }
          },
        },
      ]
    );
  };

  /**
   * Handle IoT connection success
   */
  const handleIoTConnectSuccess = () => {
    setShowIoTModal(false);
    setConnectingField(null);
    // Refresh fields to update connection status
    refresh();
    Alert.alert('Thành công', 'Đã kết nối thiết bị IoT!');
  };

  /**
   * Render field item
   */
  const renderField = ({ item }: { item: Field }) => (
    <FieldCard
      field={item}
      connection={item.iotConnection || undefined} // Use connection from listFields API
      onPress={() => {
        // TODO: Navigate to field detail
      }}
      onEdit={() => handleEditField(item)}
      onDelete={() => handleDeleteField(item)}
      onConnect={() => handleConnectIoT(item)}
      onDisconnect={() => handleDisconnectIoT(item)}
    />
  );

  /**
   * Render empty state
   */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="location-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>Chưa có ruộng nào</Text>
      <Text style={styles.emptyText}>Tạo ruộng đầu tiên để bắt đầu quản lý</Text>
      <TouchableOpacity style={styles.emptyButton} onPress={() => setShowCreateModal(true)}>
        <Text style={styles.emptyButtonText}>Tạo ruộng</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Add Button (Floating) */}
      <TouchableOpacity
        style={styles.floatingAddButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Fields List */}
      <FlatList
        data={fields}
        renderItem={renderField}
        keyExtractor={(item, index) => item._id || `field-${index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!loading ? renderEmpty : null}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      />

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <CreateFieldModal
            onSubmit={handleCreateField}
            onCancel={() => setShowCreateModal(false)}
          />
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={!!editingField}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setEditingField(null)}
      >
        <View style={styles.modalContainer}>
          {editingField && (
            <CreateFieldModal
              field={editingField}
              onSubmit={handleUpdateField}
              onCancel={() => setEditingField(null)}
            />
          )}
        </View>
      </Modal>

      {/* IoT Connection Modal */}
      <Modal
        visible={showIoTModal}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => {
          setShowIoTModal(false);
          setConnectingField(null);
        }}
      >
        <View style={styles.modalContainer}>
          {connectingField && (
            <IoTConnectionModal
              preselectedField={connectingField}
              onSuccess={handleIoTConnectSuccess}
              onCancel={() => {
                setShowIoTModal(false);
                setConnectingField(null);
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default FieldManagementScreen;

