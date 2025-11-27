/**
 * MapFarmScreen - Interactive map with rice field photo markers
 * Uses react-native-maps with OpenStreetMap tiles
 */
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { MapMarker, getPhotosForMap } from '../../services/photo.service';

const { width, height } = Dimensions.get('window');

const INITIAL_REGION = {
  latitude: 10.8231, // Vietnam center
  longitude: 106.6297,
  latitudeDelta: 10,
  longitudeDelta: 10,
};

export default function MapFarmScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  const mapRef = React.useRef<MapView>(null);

  useEffect(() => {
    loadMarkers();
  }, [user]); // Re-load when user changes

  const loadMarkers = async () => {
    // Only load markers if user is logged in
    if (!user) {
      setIsLoading(false);
      setMarkers([]);
      return;
    }

    try {
      setIsLoading(true);
      const mapData = await getPhotosForMap();
      setMarkers(mapData);

      // If there are markers, fit map to show all
      if (mapData.length > 0 && mapRef.current) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(
            mapData.map((m) => ({
              latitude: m.latitude,
              longitude: m.longitude,
            })),
            {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            }
          );
        }, 500);
      }
    } catch (error: any) {
      console.error('Load markers error:', error);
      setMarkers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkerPress = (marker: MapMarker) => {
    setSelectedMarker(marker);
  };

  const handleViewDetail = () => {
    if (selectedMarker) {
      router.push(`/photo-detail?id=${selectedMarker.id}`);
    }
  };

  const handleCloseDetail = () => {
    setSelectedMarker(null);
  };

  const handleCapturePhoto = () => {
    router.push('/camera-modal');
  };

  // Show alert if no photos
  if (!isLoading && markers.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={80} color="#BDBDBD" />
          <Text style={styles.emptyTitle}>
            {t('map.noPhotos', { defaultValue: 'Chưa có hình ảnh' })}
          </Text>
          <Text style={styles.emptyText}>
            {t('map.noPhotosDesc', {
              defaultValue: 'Hãy chụp hoặc upload ảnh cây lúa để xem vị trí trên bản đồ',
            })}
          </Text>
          <TouchableOpacity style={styles.captureButton} onPress={handleCapturePhoto}>
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.captureButtonText}>
              {t('map.captureNow', { defaultValue: 'Chụp ngay' })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>
            {t('map.loading', { defaultValue: 'Đang tải bản đồ...' })}
          </Text>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={INITIAL_REGION}
            showsUserLocation
            showsMyLocationButton
            showsCompass
          >
            {markers.map((marker) => (
              <Marker
                key={marker.id}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                onPress={() => handleMarkerPress(marker)}
              >
                {/* Custom Marker with Thumbnail */}
                <View style={styles.markerContainer}>
                  {marker.thumbnail ? (
                    <Image source={{ uri: marker.thumbnail }} style={styles.markerImage} />
                  ) : (
                    <View style={styles.markerPlaceholder}>
                      <Ionicons name="image" size={20} color="#4CAF50" />
                    </View>
                  )}
                  {/* Disease indicator */}
                  {marker.prediction && (
                    <View
                      style={[
                        styles.markerIndicator,
                        {
                          backgroundColor:
                            marker.prediction.class === 'healthy' ? '#4CAF50' : '#F44336',
                        },
                      ]}
                    />
                  )}
                </View>
              </Marker>
            ))}
          </MapView>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Ionicons name="location" size={20} color="#4CAF50" />
              <Text style={styles.statText}>
                {markers.length} {t('map.locations', { defaultValue: 'vị trí' })}
              </Text>
            </View>
          </View>

          {/* Floating Capture Button */}
          <TouchableOpacity style={styles.floatingButton} onPress={handleCapturePhoto}>
            <Ionicons name="camera" size={28} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {/* Marker Detail Card */}
      {selectedMarker && (
        <View style={styles.detailCard}>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseDetail}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          <Image source={{ uri: selectedMarker.image }} style={styles.detailImage} />

          {selectedMarker.prediction && (
            <View style={styles.detailInfo}>
              <Text
                style={[
                  styles.detailTitle,
                  {
                    color:
                      selectedMarker.prediction.class === 'healthy' ? '#4CAF50' : '#F44336',
                  },
                ]}
              >
                {selectedMarker.prediction.classVi}
              </Text>
              <Text style={styles.detailConfidence}>
                {t('map.confidence', { defaultValue: 'Độ tin cậy' })}:{' '}
                {selectedMarker.prediction.confidence.toFixed(1)}%
              </Text>
              <Text style={styles.detailDate}>
                {new Date(selectedMarker.createdAt).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.viewDetailButton} onPress={handleViewDetail}>
            <Text style={styles.viewDetailButtonText}>
              {t('map.viewDetail', { defaultValue: 'Xem chi tiết' })}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
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
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#4CAF50',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerImage: {
    width: '100%',
    height: '100%',
  },
  markerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
  },
  markerIndicator: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  statsBar: {
    position: 'absolute',
    top: 100,
    left: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  detailCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  detailImage: {
    width: '100%',
    height: 180,
  },
  detailInfo: {
    padding: 16,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailConfidence: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailDate: {
    fontSize: 12,
    color: '#999',
  },
  viewDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    gap: 8,
  },
  viewDetailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  captureButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

