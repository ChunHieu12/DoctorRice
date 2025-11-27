/**
 * HomeScreen - Main home screen with all sections
 * 1. Weather Widget
 * 2. Feature Grid (7 features, 4 columns)
 * 3. Photo History (horizontal scroll, max 6 photos)
 * 4. News Section (horizontal scroll with tabs)
 */
import { useTextSize } from '@/contexts/TextSizeContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import FeatureGrid from '@/components/ui/FeatureGrid';
import NewsCard from '@/components/ui/NewsCard';
import PhotoGridItem from '@/components/ui/PhotoGridItem';
import { CurrentWeatherWidget } from '@/components/WeatherWidgets';
import { useAuth } from '@/hooks/useAuth';
import { useWeather } from '@/hooks/useWeather';
import { getNewsByCategory, NewsCategory } from '@/services/news.service';
import type { Photo } from '@/services/photo.service';
import { getRecentPhotos } from '@/services/photo.service';
import type { NewsArticle } from '@/types';

import { styles } from './styles';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { scale } = useTextSize();
  const router = useRouter();

  const {
    current,
    loading: weatherLoading,
    location,
    refreshWeather,
  } = useWeather();

  const [recentPhotos, setRecentPhotos] = useState<Photo[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<NewsCategory>('agriculture');

  useEffect(() => {
    loadData();
  }, [user]); // Re-load when user changes (login/logout)

  useEffect(() => {
    loadNews();
  }, [selectedNewsCategory]);

  const loadData = async () => {
    await Promise.all([
      loadRecentPhotos(),
      loadNews(),
    ]);
  };

  const loadRecentPhotos = async () => {
    // Only load photos if user is logged in
    if (!user) {
      setPhotosLoading(false);
      setRecentPhotos([]);
      return;
    }

    try {
      setPhotosLoading(true);
      const photos = await getRecentPhotos(6);
      setRecentPhotos(photos);
    } catch (error) {
      console.error('Failed to load recent photos:', error);
      setRecentPhotos([]);
    } finally {
      setPhotosLoading(false);
    }
  };

  const loadNews = async () => {
    try {
      setNewsLoading(true);
      const response = await getNewsByCategory(selectedNewsCategory);
      if (response.status !== 'error') {
        setNewsArticles(response.results.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to load news:', error);
      setNewsArticles([]);
    } finally {
      setNewsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshWeather(),
      loadRecentPhotos(),
      loadNews(),
    ]);
    setRefreshing(false);
  };

  const handleWeatherPress = () => {
    router.push('/(tabs)/weather');
  };

  const handlePhotoPress = (photoId: string) => {
    router.push(`/photo-detail?id=${photoId}`);
  };

  const handleViewAllPhotos = () => {
    router.push('/photo-history' as any);
  };

  const handleNewsPress = (article: NewsArticle) => {
    router.push({
      pathname: '/news-detail' as any,
      params: {
        id: article.article_id,
        title: article.title,
        link: article.link,
        image: article.image_url || '',
        date: article.pubDate,
        source: article.source_id,
        description: article.description || '',
      },
    });
  };

  const handleViewAllNews = () => {
    router.push(`/news?category=${selectedNewsCategory}` as any);
  };

  const newsCategories: { id: NewsCategory; label: string }[] = [
    { id: 'agriculture', label: t('home.news.categories.agriculture', { defaultValue: 'Nông nghiệp' }) },
    { id: 'environment', label: t('home.news.categories.environment', { defaultValue: 'Môi trường' }) },
    { id: 'economy', label: t('home.news.categories.economy', { defaultValue: 'Kinh tế' }) },
    { id: 'market', label: t('home.news.categories.market', { defaultValue: 'Thị trường' }) },
  ];

  return (
    <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
      >
        {/* 1. Weather Widget Section */}
        {current && location && (
          <CurrentWeatherWidget
            weather={current}
            locationName={location.name}
            onPress={handleWeatherPress}
          />
        )}

        {/* 2. Feature Grid Section */}
        <FeatureGrid />

        {/* 3. Photo History Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: 20 * scale }]}>
              {t('home.photoHistory.title', { defaultValue: 'Lịch sử nhận diện' })}
            </Text>
            {recentPhotos.length > 0 && (
              <TouchableOpacity onPress={handleViewAllPhotos}>
                <Text style={styles.viewAllText}>
                  {t('home.viewAll', { defaultValue: 'Xem thêm' })} →
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {photosLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4CAF50" />
            </View>
          ) : recentPhotos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📷</Text>
              <Text style={styles.emptyText}>
                {t('home.photoHistory.empty', { defaultValue: 'Chưa có ảnh nào' })}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/camera-modal')}
              >
                <Text style={styles.emptyButtonText}>
                  {t('home.photoHistory.takePhoto', { defaultValue: 'Chụp ảnh ngay' })}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoScroll}
            >
              {recentPhotos.map((photo) => (
                <PhotoGridItem
                  key={photo._id}
                  photo={photo}
                  onPress={() => handlePhotoPress(photo._id)}
                  fixedWidth={140}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* 4. News Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: 20 * scale }]}>
              {t('home.news.title', { defaultValue: 'Tin tức' })}
            </Text>
            {newsArticles.length > 0 && (
              <TouchableOpacity onPress={handleViewAllNews}>
                <Text style={styles.viewAllText}>
                  {t('home.viewAll', { defaultValue: 'Xem thêm' })} →
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* News Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.newsTabs}
          >
            {newsCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.newsTab,
                  selectedNewsCategory === category.id && styles.newsTabActive,
                ]}
                onPress={() => setSelectedNewsCategory(category.id)}
              >
                <Text
                  style={[
                    styles.newsTabText,
                    selectedNewsCategory === category.id && styles.newsTabTextActive,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {newsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4CAF50" />
            </View>
          ) : newsArticles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📰</Text>
              <Text style={styles.emptyText}>
                {t('home.news.empty', { defaultValue: 'Không có tin tức' })}
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.newsScroll}
            >
              {newsArticles.map((article) => (
                <NewsCard
                  key={article.article_id}
                  article={article}
                  onPress={() => handleNewsPress(article)}
                  variant="horizontal"
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
  );
}
