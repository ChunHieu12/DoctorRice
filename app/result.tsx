/**
 * Result Screen - Display uploaded photo with AI prediction results
 * Shows watermarked image, disease prediction, and navigation options
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Photo, getPhotoById } from '../src/services/photo.service';

const { width } = Dimensions.get('window');

export default function ResultScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { photoId } = useLocalSearchParams<{ photoId: string }>();

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (photoId) {
      loadPhoto();
    }
  }, [photoId]);

  const loadPhoto = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const photoData = await getPhotoById(photoId);
      console.log('📸 Photo loaded:', {
        id: photoData._id,
        watermarkedUrl: photoData.watermarkedUrl,
        hasPrediction: !!photoData.prediction,
        predictionClass: photoData.prediction?.class,
      });
      setPhoto(photoData);
    } catch (err: any) {
      console.error('❌ Failed to load photo:', err);
      setError(err.message || 'Failed to load photo');
    } finally {
      setIsLoading(false);
    }
  };

  const getDiseaseIcon = (diseaseClass: string) => {
    if (diseaseClass === 'healthy') {
      return '🎉';
    }
    return '⚠️';
  };

  const getDiseaseColor = (diseaseClass: string) => {
    if (diseaseClass === 'healthy') {
      return '#4CAF50';
    }
    return '#FF5722';
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>
          {t('result.loading', { defaultValue: 'Đang tải kết quả...' })}
        </Text>
      </View>
    );
  }

  if (error || !photo) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error || 'Photo not found'}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>
            {t('common.back', { defaultValue: 'Quay lại' })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('result.title', { defaultValue: 'Kết quả phân tích' })}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: photo.watermarkedUrl || photo.originalUrl }}
            style={styles.image}
            contentFit="cover"
            transition={300}
            onError={(error) => {
              console.log('⚠️ Image failed to load:', error);
              console.log('Watermarked URL:', photo.watermarkedUrl);
              console.log('Original URL:', photo.originalUrl);
            }}
          />
          {!photo.watermarkedUrl && (
            <View style={styles.noWatermarkBadge}>
              <Text style={styles.noWatermarkText}>Original</Text>
            </View>
          )}
        </View>

        {/* Result Card */}
        {photo.prediction && photo.prediction.class && photo.prediction.classVi ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultIcon}>
                {getDiseaseIcon(photo.prediction.class)}
              </Text>
              <Text
                style={[
                  styles.diseaseName,
                  { color: getDiseaseColor(photo.prediction.class) },
                ]}
              >
                {photo.prediction.classVi}
              </Text>
            </View>

            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceLabel}>
                {t('result.confidence', { defaultValue: 'Độ tin cậy' })}:
              </Text>
              <Text style={styles.confidenceValue}>
                {photo.prediction.confidence?.toFixed(1) || '0.0'}%
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${photo.prediction.confidence || 0}%`,
                    backgroundColor: getDiseaseColor(photo.prediction.class),
                  },
                ]}
              />
            </View>

            {/* Location Info */}
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color="#4CAF50" />
              <Text style={styles.infoText}>
                {photo.metadata.lat.toFixed(6)}°N, {photo.metadata.lng.toFixed(6)}°E
              </Text>
            </View>

            {/* Date Info */}
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color="#666" />
              <Text style={styles.infoText}>
                {new Date(photo.createdAt).toLocaleString('vi-VN')}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.resultCard}>
            <Text style={styles.noPredictionText}>
              {t('result.noPrediction', {
                defaultValue: 'Không có kết quả phân tích',
              })}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.mapButton]}
            onPress={() => router.push('/(tabs)/mapFarm')}
          >
            <Ionicons name="map" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>
              {t('result.viewOnMap', { defaultValue: 'Xem trên bản đồ' })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.recaptureButton]}
            onPress={() => router.push('/camera-modal')}
          >
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>
              {t('result.recapture', { defaultValue: 'Chụp lại' })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* View Details Button (if disease detected) */}
        {photo.prediction && photo.prediction.class && photo.prediction.class !== 'healthy' && (
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => router.push(`/photo-detail?id=${photo._id}`)}
          >
            <Text style={styles.detailsButtonText}>
              {t('result.viewDetails', {
                defaultValue: 'Xem chi tiết về bệnh và cách điều trị',
              })}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#4CAF50" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingTop: 50,
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
  imageContainer: {
    width: width,
    height: width,
    backgroundColor: '#E0E0E0',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noWatermarkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  noWatermarkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  resultCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  resultIcon: {
    fontSize: 40,
  },
  diseaseName: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  confidenceLabel: {
    fontSize: 16,
    color: '#666',
  },
  confidenceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  noPredictionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  mapButton: {
    backgroundColor: '#4CAF50',
  },
  recaptureButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    gap: 8,
  },
  detailsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4CAF50',
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
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

