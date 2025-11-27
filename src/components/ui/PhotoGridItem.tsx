/**
 * PhotoGridItem - Photo thumbnail with disease status badge
 * Used in photo history grid
 */
import type { Photo } from '@/services/photo.service';
import { Image } from 'expo-image';
import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface PhotoGridItemProps {
  photo: Photo;
  onPress: () => void;
  columns?: number; // Number of columns in grid (default: 3)
  fixedWidth?: number; // Fixed width for horizontal scroll (optional)
}

export default function PhotoGridItem({ photo, onPress, columns = 3, fixedWidth }: PhotoGridItemProps) {
  // Use fixed width if provided, otherwise calculate based on columns
  const itemWidth = fixedWidth || (width - 32 - (columns - 1) * 8) / columns; // 32 = padding, 8 = gap

  // Get disease status
  const diseaseClass = photo.prediction?.class || 'unknown';
  const diseaseVi = photo.prediction?.classVi || 'Đang xử lý';
  
  // Get status color
  const getStatusColor = () => {
    if (diseaseClass === 'healthy') return '#4CAF50';
    if (diseaseClass === 'unknown' || photo.status === 'processing') return '#999';
    return '#F44336';
  };

  // Get status icon
  const getStatusIcon = () => {
    if (diseaseClass === 'healthy') return '✓';
    if (diseaseClass === 'unknown' || photo.status === 'processing') return '⋯';
    return '!';
  };

  return (
    <TouchableOpacity
      style={[styles.container, { width: itemWidth, height: itemWidth }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: photo.thumbnailUrl || photo.watermarkedUrl }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.statusIcon}>{getStatusIcon()}</Text>
      </View>

      {/* Disease Label */}
      <View style={styles.labelContainer}>
        <Text style={styles.label} numberOfLines={1}>
          {diseaseVi}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  statusIcon: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  labelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});

