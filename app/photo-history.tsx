/**
 * PhotoHistoryScreen - Full photo history with filters
 * Grid 3 columns, grouped by date, filter by date range and disease
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomDatePicker from '../src/components/CustomDatePicker';
import PhotoGridItem from '../src/components/ui/PhotoGridItem';
import type { Photo } from '../src/services/photo.service';
import { getPhotosByDate, groupPhotosByDate } from '../src/services/photo.service';

export default function PhotoHistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [groupedPhotos, setGroupedPhotos] = useState<{ date: string; photos: Photo[] }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const filters = [
    { id: 'all', label: t('photoHistory.filters.all', { defaultValue: 'Tất cả' }), diseaseClass: undefined },
    { id: 'healthy', label: t('photoHistory.filters.healthy', { defaultValue: 'Lúa khỏe' }), diseaseClass: 'healthy' },
    { id: 'bacterial_leaf_blight', label: t('photoHistory.filters.bacterial', { defaultValue: 'Bạc lá' }), diseaseClass: 'bacterial_leaf_blight' },
    { id: 'blast', label: t('photoHistory.filters.blast', { defaultValue: 'Đạo ôn' }), diseaseClass: 'blast' },
    { id: 'brown_spot', label: t('photoHistory.filters.brownSpot', { defaultValue: 'Đốm nâu' }), diseaseClass: 'brown_spot' },
  ];

  useEffect(() => {
    loadPhotos();
  }, [selectedFilter, selectedDate]);

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all photos first
      const response = await getPhotosByDate(1, 100);
      let fetchedPhotos = response.photos;
      
      // Apply date filter if selected
      if (selectedDate) {
        const targetDate = selectedDate.toLocaleDateString('vi-VN');
        fetchedPhotos = fetchedPhotos.filter(photo => {
          const photoDate = new Date(photo.createdAt).toLocaleDateString('vi-VN');
          return photoDate === targetDate;
        });
      }
      
      // Apply disease class filter if needed
      const currentFilter = filters.find(f => f.id === selectedFilter);
      if (currentFilter?.diseaseClass) {
        fetchedPhotos = fetchedPhotos.filter(photo => 
          photo.prediction?.class === currentFilter.diseaseClass
        );
      }
      
      setPhotos(fetchedPhotos);
      const grouped = groupPhotosByDate(fetchedPhotos);
      setGroupedPhotos(grouped);
      
    } catch (err: any) {
      setError(err.message || 'Failed to load photos');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoPress = (photoId: string) => {
    router.push(`/photo-detail?id=${photoId}`);
  };

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  const handleClearDate = () => {
    setSelectedDate(null);
    setShowDatePicker(false);
  };

  const renderDateSection = ({ item }: { item: { date: string; photos: Photo[] } }) => (
    <View style={styles.dateSection}>
      <Text style={styles.dateHeader}>{item.date}</Text>
      <View style={styles.grid}>
        {item.photos.map((photo) => (
          <PhotoGridItem
            key={photo._id}
            photo={photo}
            onPress={() => handlePhotoPress(photo._id)}
            columns={3}
          />
        ))}
      </View>
    </View>
  );

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('photoHistory.title', { defaultValue: 'Lịch sử nhận diện' })}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Menu - Always visible */}
      <View style={styles.filterMenu}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {/* Date Filter Button */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              styles.dateFilterChip,
              selectedDate && styles.filterChipActive,
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons 
              name="calendar-outline" 
              size={16} 
              color={selectedDate ? '#fff' : '#4CAF50'} 
              style={{ marginRight: 6 }} 
            />
            <Text
              style={[
                styles.filterChipText,
                selectedDate && styles.filterChipTextActive,
              ]}
            >
              {selectedDate 
                ? selectedDate.toLocaleDateString('vi-VN') 
                : t('photoHistory.filters.selectDate', { defaultValue: 'Chọn ngày' })
              }
            </Text>
            {selectedDate && (
              <TouchableOpacity onPress={handleClearDate} style={{ marginLeft: 6 }}>
                <Ionicons name="close-circle" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Disease Class Filters */}
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                selectedFilter === filter.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === filter.id && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Custom Date Picker */}
      <CustomDatePicker
        visible={showDatePicker}
        value={selectedDate || new Date()}
        maximumDate={new Date()}
        onConfirm={handleDateConfirm}
        onCancel={handleDateCancel}
      />

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>
            {t('photoHistory.loading', { defaultValue: 'Đang tải...' })}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={64} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPhotos}>
            <Text style={styles.retryButtonText}>
              {t('common.retry', { defaultValue: 'Thử lại' })}
            </Text>
          </TouchableOpacity>
        </View>
      ) : groupedPhotos.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📷</Text>
          <Text style={styles.emptyText}>
            {t('photoHistory.empty', { defaultValue: 'Chưa có ảnh nào' })}
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedPhotos}
          keyExtractor={(item) => item.date}
          renderItem={renderDateSection}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterMenu: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  dateFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  listContent: {
    paddingBottom: 20,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
});

