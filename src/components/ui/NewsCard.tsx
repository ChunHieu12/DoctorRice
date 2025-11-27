/**
 * NewsCard - News article card component
 * Used in news list and home screen
 */
import type { NewsArticle } from '@/types';
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

interface NewsCardProps {
  article: NewsArticle;
  onPress: () => void;
  variant?: 'horizontal' | 'grid'; // horizontal for home, grid for news list
  columns?: number; // Number of columns in grid (for grid variant)
}

export default function NewsCard({
  article,
  onPress,
  variant = 'horizontal',
  columns = 2,
}: NewsCardProps) {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Horizontal variant (for home screen)
  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        style={styles.horizontalContainer}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {article.image_url && (
          <Image
            source={{ uri: article.image_url }}
            style={styles.horizontalImage}
            contentFit="cover"
            transition={200}
          />
        )}
        <View style={styles.horizontalContent}>
          <Text style={styles.horizontalTitle} numberOfLines={2}>
            {article.title}
          </Text>
          <Text style={styles.horizontalMeta}>
            {article.source_id} • {formatDate(article.pubDate)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Grid variant (for news list)
  const itemWidth = (width - 32 - (columns - 1) * 12) / columns;

  return (
    <TouchableOpacity
      style={[styles.gridContainer, { width: itemWidth }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {article.image_url ? (
        <Image
          source={{ uri: article.image_url }}
          style={styles.gridImage}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderIcon}>📰</Text>
        </View>
      )}
      
      <View style={styles.gridContent}>
        <Text style={styles.gridTitle} numberOfLines={3}>
          {article.title}
        </Text>
        <Text style={styles.gridMeta} numberOfLines={1}>
          {article.source_id}
        </Text>
        <Text style={styles.gridDate}>{formatDate(article.pubDate)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Horizontal variant styles
  horizontalContainer: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  horizontalImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#E0E0E0',
  },
  horizontalContent: {
    padding: 12,
  },
  horizontalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  horizontalMeta: {
    fontSize: 12,
    color: '#999',
  },

  // Grid variant styles
  gridContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E0E0E0',
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
  },
  gridContent: {
    padding: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    lineHeight: 18,
    marginBottom: 8,
  },
  gridMeta: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 4,
  },
  gridDate: {
    fontSize: 11,
    color: '#999',
  },
});

