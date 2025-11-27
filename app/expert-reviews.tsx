/**
 * Expert Reviews Screen
 * Hiển thị tất cả đánh giá của chuyên gia với filter theo số sao
 */

import { AppHeader } from '@/components/ui';
import { useTextSize } from '@/contexts/TextSizeContext';
import { getExpertDetail, type ExpertReview } from '@/services/expert.service';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function ExpertReviewsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ expertId: string }>();
  const insets = useSafeAreaInsets();
  const { scale } = useTextSize();
  const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';

  const [reviews, setReviews] = useState<ExpertReview[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<ExpertReview[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [params.expertId]);

  useEffect(() => {
    filterReviews();
  }, [selectedRating, reviews]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const data = await getExpertDetail(params.expertId);
      const allReviews = data.expert.reviews || [];
      setReviews(allReviews);
      setFilteredReviews(allReviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterReviews = () => {
    if (selectedRating === null) {
      setFilteredReviews(reviews);
    } else {
      const filtered = reviews.filter((review) => review.rating === selectedRating);
      setFilteredReviews(filtered);
    }
  };

  const handleFilterPress = (rating: number | null) => {
    setSelectedRating(rating);
  };

  const renderReviewItem = ({ item }: { item: ExpertReview }) => {
    const reviewDate = item.completedAt || item.createdAt;
    const formattedDate = reviewDate
      ? new Date(reviewDate).toLocaleDateString(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';

    return (
      <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewAvatar}>
            {item.farmer?.avatar ? (
              <Image source={{ uri: item.farmer.avatar }} style={styles.reviewAvatarImage} />
            ) : (
              <View style={styles.reviewAvatarPlaceholder}>
                <Ionicons name="person" size={20 * scale} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.reviewInfo}>
            <Text style={[styles.reviewName, { fontSize: 15 * scale }]}>
              {item.farmer?.displayName || t('experts.reviews.anonymousFarmer')}
            </Text>
            <Text style={[styles.reviewDate, { fontSize: 12 * scale }]}>{formattedDate}</Text>
          </View>
          <View style={styles.reviewRating}>
            <Ionicons name="star" size={16 * scale} color="#FFC107" />
            <Text style={[styles.reviewRatingText, { fontSize: 15 * scale }]}>
              {item.rating?.toFixed(1)}
            </Text>
          </View>
        </View>
        {item.comment && (
          <Text style={[styles.reviewComment, { fontSize: 14 * scale }]}>{item.comment}</Text>
        )}
      </View>
    );
  };

  const ratingFilters = [
    { rating: null, label: t('experts.reviews.filterAll') },
    { rating: 5, label: t('experts.reviews.filterStars', { count: 5 }) },
    { rating: 4, label: t('experts.reviews.filterStars', { count: 4 }) },
    { rating: 3, label: t('experts.reviews.filterStars', { count: 3 }) },
    { rating: 2, label: t('experts.reviews.filterStars', { count: 2 }) },
    { rating: 1, label: t('experts.reviews.filterStars', { count: 1 }) },
  ];

  return (
    <View style={styles.container}>
      <AppHeader title={t('experts.reviews.title')} showBackButton />

      {/* Filter Section */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {ratingFilters.map((filter) => (
            <TouchableOpacity
              key={filter.rating ?? 'all'}
              style={[
                styles.filterButton,
                selectedRating === filter.rating && styles.filterButtonActive,
              ]}
              onPress={() => handleFilterPress(filter.rating)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  { fontSize: 13 * scale },
                  selectedRating === filter.rating && styles.filterButtonTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Reviews List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : filteredReviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-outline" size={80 * scale} color="#ccc" />
          <Text style={[styles.emptyText, { fontSize: 16 * scale }]}>
            {t('experts.reviews.noReviews')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredReviews}
          renderItem={renderReviewItem}
          keyExtractor={(item, index) => `${item.farmer?._id || 'review'}-${index}`}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
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
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
  },
  filterScrollContent: {
    paddingHorizontal: 15,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
    backgroundColor: '#fff',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#999',
    marginTop: 15,
    textAlign: 'center',
  },
  listContent: {
    padding: 15,
  },
  reviewItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewAvatar: {
    marginRight: 12,
  },
  reviewAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  reviewAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewDate: {
    color: '#999',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRatingText: {
    color: '#333',
    fontWeight: '600',
  },
  reviewComment: {
    color: '#555',
    lineHeight: 20,
    marginTop: 8,
  },
});

