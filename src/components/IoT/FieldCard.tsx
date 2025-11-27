/**
 * FieldCard Component
 * Displays a rice field card with geofence info and connection status
 */

import { colors } from '@/constants/colors';
import { formatFieldArea } from '@/services/field.service';
import type { Field, IoTConnection } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface FieldCardProps {
  field: Field;
  connection?: IoTConnection | null;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

const FieldCard: React.FC<FieldCardProps> = ({
  field,
  connection,
  onPress,
  onEdit,
  onDelete,
  onConnect,
  onDisconnect,
}) => {
  // Check if connected - connection object exists and has deviceId
  const isConnected = !!(connection && connection.deviceId);
  const areaDisplay = field.metadata?.area
    ? formatFieldArea(field.metadata.area)
    : formatFieldArea(Math.PI * Math.pow(field.radius, 2));

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="location" size={24} color={colors.primary} />
          <Text style={styles.title}>{field.name}</Text>
        </View>
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.iconButton}>
              <Ionicons name="create-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.iconButton}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoRow}>
        <InfoItem
          icon="resize"
          label="Bán kính"
          value={`${field.radius} m`}
          color={colors.primary}
        />
        <InfoItem icon="expand" label="Diện tích" value={areaDisplay} color={colors.success} />
      </View>

      {/* GPS */}
      {field.gpsCenter && (
        <View style={styles.gpsRow}>
          <Ionicons name="navigate-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.gpsText}>
            {field.gpsCenter.lat.toFixed(7)}, {field.gpsCenter.lng.toFixed(7)}
          </Text>
        </View>
      )}

      {/* Metadata */}
      {field.metadata?.cropType && (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Loại cây:</Text>
          <Text style={styles.metaValue}>{field.metadata.cropType}</Text>
        </View>
      )}

      {/* Connection Status */}
      <View style={styles.footer}>
        <View style={styles.statusRow}>
        <View style={[styles.statusBadge, isConnected ? styles.connected : styles.disconnected]}>
          <Ionicons
            name={isConnected ? 'wifi' : 'wifi-outline'}
            size={14}
            color={isConnected ? colors.success : colors.textSecondary}
          />
            <Text 
              style={[styles.statusText, isConnected && styles.connectedText]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
            {isConnected ? `IoT: ${connection.deviceId}` : 'Chưa kết nối IoT'}
          </Text>
          </View>
        </View>

        {/* Action Buttons - Stack layout to prevent overflow */}
        <View style={styles.actionButtonsContainer}>
        {!isConnected && onConnect && (
          <TouchableOpacity onPress={onConnect} style={styles.connectButton}>
            <Text style={styles.connectButtonText}>Kết nối</Text>
          </TouchableOpacity>
        )}

        {isConnected && onDisconnect && (
          <TouchableOpacity onPress={onDisconnect} style={styles.disconnectButton}>
            <Ionicons name="unlink" size={14} color="#fff" />
            <Text style={styles.disconnectButtonText}>Ngắt kết nối</Text>
          </TouchableOpacity>
        )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

/**
 * InfoItem Sub-component
 */
interface InfoItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value, color }) => (
  <View style={styles.infoItem}>
    <Ionicons name={icon} size={16} color={color} />
    <View style={styles.infoTextContainer}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoTextContainer: {
    gap: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  gpsText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 6,
  },
  metaValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  footer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    flex: 1,
    minWidth: 0, // Allow text truncation
  },
  connected: {
    backgroundColor: '#e8f5e9',
  },
  disconnected: {
    backgroundColor: '#f5f5f5',
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  connectedText: {
    color: colors.success,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.error,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  disconnectButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default FieldCard;

