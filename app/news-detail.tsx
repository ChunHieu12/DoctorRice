/**
 * NewsDetailScreen - News article detail view
 * Opens article link in WebView
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Dimensions,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

export default function NewsDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id: string;
    title: string;
    link: string;
    image?: string;
    date: string;
    source: string;
    description?: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [showWebView, setShowWebView] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpenInBrowser = async () => {
    try {
      const supported = await Linking.canOpenURL(params.link);
      if (supported) {
        await Linking.openURL(params.link);
      }
    } catch (err) {
      console.error('Failed to open link:', err);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t('newsDetail.title', { defaultValue: 'Chi tiết tin tức' })}
        </Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleOpenInBrowser}>
          <Ionicons name="open-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {!showWebView ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Image */}
          {params.image && (
            <Image
              source={{ uri: params.image }}
              style={styles.image}
              contentFit="cover"
              transition={300}
            />
          )}

          {/* Article Info */}
          <View style={styles.infoContainer}>
            {/* Title */}
            <Text style={styles.title}>{params.title}</Text>

            {/* Meta */}
            <View style={styles.metaContainer}>
              <View style={styles.metaRow}>
                <Ionicons name="newspaper-outline" size={16} color="#4CAF50" />
                <Text style={styles.metaText}>{params.source}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={16} color="#999" />
                <Text style={styles.metaText}>{formatDate(params.date)}</Text>
              </View>
            </View>

            {/* Description */}
            {params.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.description}>{params.description}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.webViewButton}
                onPress={() => setShowWebView(true)}
              >
                <Ionicons name="reader-outline" size={20} color="#fff" />
                <Text style={styles.webViewButtonText}>
                  {t('newsDetail.readFull', { defaultValue: 'Đọc bài viết đầy đủ' })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.browserButton}
                onPress={handleOpenInBrowser}
              >
                <Ionicons name="globe-outline" size={20} color="#4CAF50" />
                <Text style={styles.browserButtonText}>
                  {t('newsDetail.openBrowser', { defaultValue: 'Mở trong trình duyệt' })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.webViewContainer}>
          {/* WebView Controls */}
          <View style={styles.webViewControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowWebView(false)}
            >
              <Ionicons name="close-circle" size={24} color="#F44336" />
              <Text style={styles.controlText}>
                {t('newsDetail.closeWebView', { defaultValue: 'Đóng' })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Loading */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>
                {t('newsDetail.loading', { defaultValue: 'Đang tải...' })}
              </Text>
            </View>
          )}

          {/* WebView */}
          <WebView
            source={{ uri: params.link }}
            style={styles.webView}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
          />
        </View>
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
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 12,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  image: {
    width: width,
    height: width * 0.6,
    backgroundColor: '#E0E0E0',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 30,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  description: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
  },
  actionButtons: {
    gap: 12,
  },
  webViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  webViewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  browserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    gap: 8,
  },
  browserButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  webViewContainer: {
    flex: 1,
  },
  webViewControls: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  webView: {
    flex: 1,
  },
});

