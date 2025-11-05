/**
 * PhotoDetailScreen - Detailed view of photo with disease information tabs
 * Tabs: Thông tin bệnh | Cách trị bệnh
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
<<<<<<< HEAD
=======
import ChatbotModal from '../src/components/ChatbotModal';
>>>>>>> 402e1502f34c040c2732167004a56a11f9fcca71
import { Photo, getPhotoById } from '../src/services/photo.service';

const { width } = Dimensions.get('window');

type TabKey = 'info' | 'treatment';

export default function PhotoDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('info');
<<<<<<< HEAD
=======
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
>>>>>>> 402e1502f34c040c2732167004a56a11f9fcca71

  useEffect(() => {
    if (id) {
      loadPhoto();
    }
  }, [id]);

  const loadPhoto = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const photoData = await getPhotoById(id);
      setPhoto(photoData);
    } catch (err: any) {
      setError(err.message || 'Failed to load photo');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>
          {t('photoDetail.loading', { defaultValue: 'Đang tải...' })}
        </Text>
      </View>
    );
  }

  if (error || !photo || !photo.prediction) {
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

  const diseaseClass = photo.prediction.class;
  
  // Get disease info and treatment from i18n
  const getDiseaseInfo = () => {
    return t(`photoDetail.diseases.${diseaseClass}.info`, {
      defaultValue: 'Disease information not available',
    });
  };

  const getDiseaseTreatment = () => {
    return t(`photoDetail.diseases.${diseaseClass}.treatment`, {
      defaultValue: 'Treatment information not available',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('photoDetail.title', { defaultValue: 'Chi tiết phân tích' })}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: photo.watermarkedUrl }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        </View>

        {/* Disease Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusIcon}>
              {diseaseClass === 'healthy' ? '🎉' : '⚠️'}
            </Text>
            <View style={styles.statusInfo}>
              <Text
                style={[
                  styles.diseaseName,
                  { color: diseaseClass === 'healthy' ? '#4CAF50' : '#F44336' },
                ]}
              >
                {photo.prediction.classVi}
              </Text>
              <Text style={styles.confidenceText}>
                {t('photoDetail.confidence', { defaultValue: 'Độ tin cậy' })}:{' '}
                {photo.prediction.confidence.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs - Only show for diseased plants */}
        {diseaseClass !== 'healthy' && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'info' && styles.activeTab]}
              onPress={() => setActiveTab('info')}
            >
              <Ionicons
                name="information-circle"
                size={20}
                color={activeTab === 'info' ? '#4CAF50' : '#999'}
              />
              <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
                {t('photoDetail.diseaseInfo', { defaultValue: 'Thông tin bệnh' })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'treatment' && styles.activeTab]}
              onPress={() => setActiveTab('treatment')}
            >
              <Ionicons
                name="medical"
                size={20}
                color={activeTab === 'treatment' ? '#4CAF50' : '#999'}
              />
              <Text style={[styles.tabText, activeTab === 'treatment' && styles.activeTabText]}>
                {t('photoDetail.treatment', { defaultValue: 'Cách trị bệnh' })}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.contentText}>
            {activeTab === 'info' ? getDiseaseInfo() : getDiseaseTreatment()}
          </Text>
        </View>

<<<<<<< HEAD
=======
        {/* Chat with Doctor Rice Button */}
        {diseaseClass !== 'healthy' && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => setIsChatbotVisible(true)}
          >
            <Image
              source={require('../src/assets/images/text-logo.png')}
              style={styles.chatButtonIcon}
              resizeMode="contain"
            />
            <Text style={styles.chatButtonText}>
              {t('photoDetail.chatWithDoctor', { defaultValue: 'Chat với Bác sĩ Lúa' })}
            </Text>
          </TouchableOpacity>
        )}

>>>>>>> 402e1502f34c040c2732167004a56a11f9fcca71
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.mapButton]}
            onPress={() => router.push('/(tabs)/mapFarm')}
          >
            <Ionicons name="map" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>
              {t('photoDetail.viewOnMap', { defaultValue: 'Xem bản đồ' })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.recaptureButton]}
            onPress={() => router.push('/camera-modal')}
          >
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>
              {t('photoDetail.newPhoto', { defaultValue: 'Chụp mới' })}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
<<<<<<< HEAD
=======

      {/* Chatbot Modal */}
      <ChatbotModal
        visible={isChatbotVisible}
        onClose={() => setIsChatbotVisible(false)}
        diseaseContext={{
          diseaseClass: photo.prediction.class,
          diseaseVi: photo.prediction.classVi,
          confidence: photo.prediction.confidence,
          location: {
            lat: photo.metadata.lat,
            lng: photo.metadata.lng,
          },
          timestamp: new Date(photo.createdAt).getTime(),
        }}
      />
>>>>>>> 402e1502f34c040c2732167004a56a11f9fcca71
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
    height: width * 0.75,
    backgroundColor: '#E0E0E0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    fontSize: 48,
  },
  statusInfo: {
    flex: 1,
  },
  diseaseName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#E8F5E9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#4CAF50',
  },
  contentContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
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
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  mapButton: {
    backgroundColor: '#4CAF50',
  },
  recaptureButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
<<<<<<< HEAD
=======
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatButtonIcon: {
    width: 28,
    height: 28,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
>>>>>>> 402e1502f34c040c2732167004a56a11f9fcca71
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

