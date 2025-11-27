/**
 * IoTGalleryScreen - IMPROVED VERSION
 * Collapsible sections with horizontal scroll, date filter
 */

import IoTImageCardCompact from '@/components/IoT/IoTImageCardCompact';
import IoTImageDetailModal from '@/components/IoT/IoTImageDetailModal';
import { colors } from '@/constants/colors';
import { useFieldManagement } from '@/hooks/useFieldManagement';
import { useIoTImages } from '@/hooks/useIoTImages';
import type { Field, IoTImage } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import IoTConnectionModal from './IoTConnectionModal';

export interface IoTGalleryScreenProps {
  preselectedField?: Field;
}

interface ImagesByDate {
  title: string;
  data: IoTImage[];
  dateKey: string;
  isExpanded: boolean;
}

const IoTGalleryScreen: React.FC<IoTGalleryScreenProps> = ({ preselectedField }) => {
  const { t, i18n } = useTranslation();
  const { fields, loading: fieldsLoading } = useFieldManagement();
  const [selectedField, setSelectedField] = useState<Field | null>(preselectedField || null);

  const {
    images,
    loading: imagesLoading,
    refreshing,
    error,
    refresh,
  } = useIoTImages({
    fieldId: selectedField?._id || null,
    limit: 50,
    autoFetch: true,
  });

  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showFieldDropdown, setShowFieldDropdown] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');
  
  // Detail Modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedDateImages, setSelectedDateImages] = useState<IoTImage[]>([]);

  /**
   * Toggle section expansion
   */
  const toggleSection = (dateKey: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  /**
   * Group images by date
   */
  const imagesByDate = useMemo((): ImagesByDate[] => {
    if (!Array.isArray(images) || images.length === 0) {
      return [];
    }

    // Apply date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const filteredImages = images.filter((image) => {
      if (dateFilter === 'all') return true;
      
      const imageDate = new Date(image.timestamp);
      const imageDateOnly = new Date(imageDate.getFullYear(), imageDate.getMonth(), imageDate.getDate());
      
      switch (dateFilter) {
        case 'today':
          return imageDateOnly.getTime() === today.getTime();
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return imageDateOnly.getTime() === yesterday.getTime();
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return imageDateOnly >= weekAgo;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return imageDateOnly >= monthAgo;
        default:
          return true;
      }
    });

    // Group by date
    const grouped = filteredImages.reduce((acc, image) => {
      const date = new Date(image.timestamp);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(image);
      return acc;
    }, {} as Record<string, IoTImage[]>);

    // Convert to array and sort
    return Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .map((dateKey) => {
        const date = new Date(dateKey);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let title = '';
        const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
        if (date.toDateString() === today.toDateString()) {
          title = t('iotGallery.today');
        } else if (date.toDateString() === yesterday.toDateString()) {
          title = t('iotGallery.yesterday');
        } else {
          title = date.toLocaleDateString(locale, {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
        }

        return {
          title,
          data: grouped[dateKey].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          ),
          dateKey,
          isExpanded: expandedSections.has(dateKey),
        };
      });
  }, [images, dateFilter, expandedSections]);

  /**
   * Handle field selection
   */
  const handleFieldSelect = (field: Field | null) => {
    setSelectedField(field);
    setShowFieldDropdown(false);
  };

  /**
   * Handle image press - open detail modal
   */
  const handleImagePress = (image: IoTImage, allImages: IoTImage[]) => {
    const imageIndex = allImages.findIndex((img) => img.id === image.id);
    setSelectedImageIndex(imageIndex >= 0 ? imageIndex : 0);
    setSelectedDateImages(allImages);
    setShowDetailModal(true);
  };

  /**
   * Handle view all for a date
   */
  const handleViewAll = (dateKey: string, allImages: IoTImage[]) => {
    router.push({
      pathname: '/iot-daily-gallery',
      params: {
        fieldId: selectedField?._id || '',
        fieldName: selectedField?.name || '',
        dateKey,
        date: dateKey,
      },
    });
  };

  /**
   * Render field dropdown
   */
  const renderFieldDropdown = () => {
    const iotFields = (Array.isArray(fields) ? fields : []).filter(
      (f) => f.hasIoTConnection || f.iotConnection
    );

    return (
      <View style={styles.fieldDropdownContainer}>
        <TouchableOpacity
          style={styles.fieldDropdown}
          onPress={() => setShowFieldDropdown(!showFieldDropdown)}
        >
          <View style={styles.fieldDropdownLeft}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={styles.fieldDropdownText}>
              {selectedField ? selectedField.name : 'Chọn ruộng'}
            </Text>
          </View>
          <Ionicons
            name={showFieldDropdown ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {showFieldDropdown && (
          <View style={styles.dropdownList}>
            {iotFields.map((field) => (
              <TouchableOpacity
                key={field._id}
                style={[
                  styles.dropdownItem,
                  selectedField?._id === field._id && styles.dropdownItemSelected,
                ]}
                onPress={() => handleFieldSelect(field)}
              >
                <Ionicons
                  name={selectedField?._id === field._id ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedField?._id === field._id ? colors.primary : colors.textSecondary}
                />
                <Text style={styles.dropdownItemText}>{field.name}</Text>
                {(field.hasIoTConnection || field.iotConnection) && (
                  <View style={styles.connectedBadge}>
                    <Ionicons name="link" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  /**
   * Render date filter
   */
  const renderDateFilter = () => {
    const filters: Array<{ key: 'all' | 'today' | 'yesterday' | 'week' | 'month'; label: string }> = [
      { key: 'all', label: t('iotGallery.all') },
      { key: 'today', label: t('iotGallery.today') },
      { key: 'yesterday', label: t('iotGallery.yesterday') },
      { key: 'week', label: t('iotGallery.week') },
      { key: 'month', label: t('iotGallery.month') },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateFilterContainer}
        contentContainerStyle={styles.dateFilterContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              dateFilter === filter.key && styles.filterChipActive,
            ]}
            onPress={() => setDateFilter(filter.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                dateFilter === filter.key && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  /**
   * Render horizontal scroll section
   */
  const renderSection = (section: ImagesByDate) => {
    // Sort images: newest (left) to oldest (right)
    const sortedImages = [...section.data].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
      <View key={section.dateKey} style={styles.section}>
        {/* Section Header - Always visible */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(section.dateKey)}
        >
          <View style={styles.sectionHeaderLeft}>
            <Ionicons
              name={section.isExpanded ? 'chevron-down' : 'chevron-forward'}
              size={24}
              color={colors.primary}
            />
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
          <View style={styles.sectionHeaderBadge}>
            <Text style={styles.sectionHeaderBadgeText}>
              {section.data.length} {t('iotGallery.images')}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Section Content - Horizontal Scroll */}
        {section.isExpanded && (
          <View style={styles.sectionContent}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {sortedImages.map((image, index) => (
                <IoTImageCardCompact
                  key={`${image.id}-${index}`}
                  image={image}
                  onPress={() => handleImagePress(image, sortedImages)}
                />
              ))}
            </ScrollView>

            {/* View All Button */}
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => handleViewAll(section.dateKey, sortedImages)}
            >
              <Ionicons name="images" size={18} color={colors.primary} />
              <Text style={styles.viewAllButtonText}>{t('iotGallery.viewAll')}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  /**
   * Render empty state
   */
  const renderEmpty = () => {
    if (!selectedField) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>{t('iotGallery.selectField')}</Text>
          <Text style={styles.emptyText}>{t('iotGallery.selectFieldDesc')}</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.emptyTitle}>{t('iotGallery.error')}</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>{t('iotGallery.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.emptyTitle}>{t('iotGallery.noImages')}</Text>
        <Text style={styles.emptyText}>
          {t('iotGallery.noImagesDesc')}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('iotGallery.title')}</Text>
        <TouchableOpacity
          onPress={() => {
            // Navigate back or close
            router.back();
          }}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Field Dropdown */}
      {renderFieldDropdown()}

      {/* Date Filter */}
      {selectedField && renderDateFilter()}

      {/* Images List */}
      {selectedField ? (
        imagesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('iotGallery.loading')}</Text>
          </View>
        ) : imagesByDate.length > 0 ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={refresh} />
            }
          >
            {imagesByDate.map(renderSection)}
          </ScrollView>
        ) : (
          renderEmpty()
        )
      ) : (
        renderEmpty()
      )}

      {/* Connection Modal */}
      <Modal
        visible={showConnectionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowConnectionModal(false)}
      >
        <IoTConnectionModal
          preselectedField={selectedField || undefined}
          onSuccess={() => {
            setShowConnectionModal(false);
            refresh();
          }}
          onCancel={() => setShowConnectionModal(false)}
        />
      </Modal>

      {/* Image Detail Modal with Swipe */}
      {selectedDateImages.length > 0 && (
        <IoTImageDetailModal
          visible={showDetailModal}
          images={selectedDateImages}
          initialIndex={selectedImageIndex}
          onClose={() => setShowDetailModal(false)}
        />
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: StatusBar.currentHeight || 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  
  // Field Dropdown
  fieldDropdownContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  fieldDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 44,
  },
  fieldDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldDropdownText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  dropdownList: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#e8f5e9',
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  connectedBadge: {
    backgroundColor: colors.success,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Date Filter
  dateFilterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    maxHeight: 50,
  },
  dateFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 8,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 16,
  },
  filterChipTextActive: {
    color: '#fff',
  },

  // Sections
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sectionHeaderBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 14,
  },

  // Section Content - Horizontal Scroll
  sectionContent: {
    paddingVertical: 12,
  },
  horizontalScroll: {
    paddingHorizontal: 16,
    paddingRight: 4, // Account for last card margin
  },

  // View All Button
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    minHeight: 40,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },

  // Loading & Empty
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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

export default IoTGalleryScreen;

