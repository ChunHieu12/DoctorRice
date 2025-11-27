/**
 * NewsScreen - News list with 2-column grid
 * Agriculture news from NewsData API
 */
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NewsCard from '../src/components/ui/NewsCard';
import { getNewsByCategory, NewsCategory } from '../src/services/news.service';
import type { NewsArticle } from '../src/types';

export default function NewsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string }>();

  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>(
    (params.category as NewsCategory) || 'agriculture'
  );
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadNews();
  }, [selectedCategory]);

  const loadNews = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getNewsByCategory(selectedCategory);
      
      if (response.status === 'error') {
        throw new Error('Failed to fetch news');
      }

      setArticles(response.results);
      setNextPage(response.nextPage);
      
    } catch (err: any) {
      setError(err.message || 'Failed to load news');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNews();
    setIsRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (!nextPage || isLoading) return;

    try {
      const response = await getNewsByCategory(selectedCategory, nextPage);
      
      if (response.status !== 'error') {
        setArticles(prev => [...prev, ...response.results]);
        setNextPage(response.nextPage);
      }
    } catch (err) {
      console.error('Failed to load more news:', err);
    }
  };

  const newsCategories: { id: NewsCategory; label: string }[] = [
    { id: 'agriculture', label: t('home.news.categories.agriculture', { defaultValue: 'Nông nghiệp' }) },
    { id: 'environment', label: t('home.news.categories.environment', { defaultValue: 'Môi trường' }) },
    { id: 'economy', label: t('home.news.categories.economy', { defaultValue: 'Kinh tế' }) },
    { id: 'market', label: t('home.news.categories.market', { defaultValue: 'Thị trường' }) },
  ];

  const handleArticlePress = (article: NewsArticle) => {
    router.push({
      pathname: '/news-detail',
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

  const renderArticle = ({ item, index }: { item: NewsArticle; index: number }) => (
    <View style={{ paddingHorizontal: index % 2 === 0 ? 0 : 6, marginBottom: 12 }}>
      <NewsCard
        article={item}
        onPress={() => handleArticlePress(item)}
        variant="grid"
        columns={2}
      />
    </View>
  );

  const renderFooter = () => {
    if (!nextPage) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#4CAF50" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('news.title', { defaultValue: 'Tin tức' })}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {newsCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.tab,
                selectedCategory === category.id && styles.tabActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedCategory === category.id && styles.tabTextActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {isLoading && articles.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>
            {t('news.loading', { defaultValue: 'Đang tải tin tức...' })}
          </Text>
        </View>
      ) : error && articles.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={64} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadNews}>
            <Text style={styles.retryButtonText}>
              {t('common.retry', { defaultValue: 'Thử lại' })}
            </Text>
          </TouchableOpacity>
        </View>
      ) : articles.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📰</Text>
          <Text style={styles.emptyText}>
            {t('news.empty', { defaultValue: 'Không có tin tức' })}
          </Text>
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => item.article_id}
          renderItem={renderArticle}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
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
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tabActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    gap: 12,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

