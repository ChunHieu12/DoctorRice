/**
 * IoTDailyGalleryScreen
 * Full grid view (2 columns) for all images of a specific date
 */

import IoTImageCardCompact from '@/components/IoT/IoTImageCardCompact';
import IoTImageDetailModal from '@/components/IoT/IoTImageDetailModal';
import { colors } from '@/constants/colors';
import { useIoTImages } from '@/hooks/useIoTImages';
import type { IoTImage } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2; // 2 columns with 16px padding on sides + 8px gap

const IoTDailyGalleryScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const { fieldId, fieldName, dateKey } = params;

  const {
    images,
    loading,
    refreshing,
    error,
    refresh,
  } = useIoTImages({
    fieldId: (fieldId as string) || null,
    limit: 100,
    autoFetch: true,
  });

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  /**
   * Filter images by date
   */
  const filteredImages = useMemo(() => {
    if (!dateKey || !Array.isArray(images)) return [];

    return images
      .filter((image) => {
        const imageDate = new Date(image.timestamp).toISOString().split('T')[0];
        return imageDate === dateKey;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [images, dateKey]);

  /**
   * Format date title
   */
  const dateTitle = useMemo(() => {
    if (!dateKey) return '';

    const date = new Date(dateKey as string);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  }, [dateKey]);

  /**
   * Handle image press
   */
  const handleImagePress = (image: IoTImage) => {
    const imageIndex = filteredImages.findIndex((img) => img.id === image.id);
    setSelectedImageIndex(imageIndex >= 0 ? imageIndex : 0);
    setShowDetailModal(true);
  };

  /**
   * Navigate to analysis
   */
  const handleAnalyze = (image: IoTImage) => {
    router.push({
      pathname: '/result',
      params: {
        source: 'iot',
        captureId: image.captureId,
        imageUrl: image.imageUrl,
        gps: JSON.stringify(image.location),
        sensors: JSON.stringify(image.sensors),
        deviceId: image.deviceId,
      },
    });
  };

  /**
   * Render grid item
   */
  const renderItem = ({ item }: { item: IoTImage }) => (
    <IoTImageCardCompact
      image={item}
      onPress={() => handleImagePress(item)}
      isGridView={true}
    />
  );

  /**
   * Render empty state
   */
  const renderEmpty = () => {
    if (loading) return null;

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.emptyTitle}>Có lỗi xảy ra</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.emptyTitle}>Không có ảnh</Text>
        <Text style={styles.emptyText}>Không tìm thấy ảnh nào trong ngày này</Text>
      </View>
    );
  };

  return (
    <>
      {/* Hide default Expo Router header */}
      <Stack.Screen options={{ headerShown: false }} />
      
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{dateTitle}</Text>
          <Text style={styles.headerSubtitle}>
            {fieldName || 'Tất cả ruộng'} • {filteredImages.length} ảnh
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải ảnh...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredImages}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
        />
      )}

      {/* Detail Modal */}
      {filteredImages.length > 0 && (
        <IoTImageDetailModal
          visible={showDetailModal}
          images={filteredImages}
          initialIndex={selectedImageIndex}
          onClose={() => setShowDetailModal(false)}
        />
      )}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    marginTop: StatusBar.currentHeight || 0,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // Grid
  gridContent: {
    padding: 12,
    paddingBottom: Platform.OS === 'android' ? 100 : 80,
  },
  gridRow: {
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default IoTDailyGalleryScreen;

