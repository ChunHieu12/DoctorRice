/**
 * News Service
 * NewsData API integration for agriculture news
 */
import type { NewsResponse } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

const NEWS_API_KEY = Constants.expoConfig?.extra?.newsApiKey || 'pub_54537774947c144e503348a438976e301046f';
const NEWS_BASE_URL = 'https://newsdata.io/api/1';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const CACHE_KEY_PREFIX = 'news_cache_';

export type NewsCategory = 'agriculture' | 'environment' | 'economy' | 'market';

interface CachedNews {
  data: NewsResponse;
  timestamp: number;
}

/**
 * Get news by category
 * @param category - News category (agriculture, weather, economy)
 * @param page - Pagination page (nextPage token)
 * @param language - Language code (vi or en)
 */
export const getNewsByCategory = async (
  category: NewsCategory = 'agriculture',
  page?: string,
  language: 'vi' | 'en' = 'vi'
): Promise<NewsResponse> => {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${category}_${language}_${page || 'latest'}`;
    
    // Check cache first (only for first page)
    if (!page) {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const cachedData: CachedNews = JSON.parse(cached);
        const isValid = Date.now() - cachedData.timestamp < CACHE_DURATION;
        
        if (isValid) {
          console.log(`📰 Using cached news data for ${category}`);
          return cachedData.data;
        }
      }
    }

    console.log(`📰 Fetching ${category} news (${language})...`);

    // Define search query for each type
    const categoryConfig = {
      agriculture: {
        q: 'nông nghiệp',
      },
      environment: {
        q: 'môi trường',
      },
      economy: {
        q: 'kinh tế',
      },
      market: {
        q: 'thị trường',
      },
    };

    const config = categoryConfig[category];

    const params: any = {
      apikey: NEWS_API_KEY,
      q: encodeURIComponent(config.q), // Explicitly encode the query
      language: language === 'vi' ? 'vi' : 'en',
      size: 10,
    };

    if (page) {
      params.page = page;
    }

    console.log(`📰 Request params:`, JSON.stringify(params));
    console.log(`📰 Query encoded:`, params.q);

    const response = await axios.get<NewsResponse>(`${NEWS_BASE_URL}/latest`, {
      params,
      timeout: 15000,
      paramsSerializer: (params) => {
        // Use custom serializer to prevent double encoding
        return Object.keys(params)
          .map(key => {
            const value = params[key];
            // q is already encoded, don't encode again
            if (key === 'q') {
              return `${key}=${value}`;
            }
            return `${key}=${encodeURIComponent(value)}`;
          })
          .join('&');
      },
    });

    const newsData = response.data;

    // Cache the result (only for first page)
    if (!page) {
      const cacheData: CachedNews = {
        data: newsData,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    }

    console.log(`✅ Fetched ${newsData.results.length} ${category} news articles`);
    return newsData;

  } catch (error: any) {
    console.error('❌ News API error:', error.response?.data || error.message);
    
    // Return empty results on error
    return {
      status: 'error',
      totalResults: 0,
      results: [],
    };
  }
};

/**
 * Get latest agriculture news (backward compatibility)
 * @param page - Pagination page (nextPage token)
 * @param language - Language code (vi or en)
 */
export const getAgricultureNews = async (
  page?: string,
  language: 'vi' | 'en' = 'vi'
): Promise<NewsResponse> => {
  return getNewsByCategory('agriculture', page, language);
};

/**
 * Search news by keyword
 * @param keyword - Search keyword
 * @param language - Language code
 */
export const searchNews = async (
  keyword: string,
  language: 'vi' | 'en' = 'vi'
): Promise<NewsResponse> => {
  try {
    console.log(`📰 Searching news: "${keyword}" (${language})...`);

    const response = await axios.get<NewsResponse>(`${NEWS_BASE_URL}/latest`, {
      params: {
        apikey: NEWS_API_KEY,
        q: keyword,
        language: language === 'vi' ? 'vi' : 'en',
        size: 20,
      },
      timeout: 15000,
    });

    console.log(`✅ Found ${response.data.results.length} articles`);
    return response.data;

  } catch (error: any) {
    console.error('❌ News search error:', error.response?.data || error.message);
    return {
      status: 'error',
      totalResults: 0,
      results: [],
    };
  }
};

/**
 * Clear news cache
 */
export const clearNewsCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const newsKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    await AsyncStorage.multiRemove(newsKeys);
    console.log('🗑️ News cache cleared');
  } catch (error) {
    console.error('❌ Failed to clear news cache:', error);
  }
};

