/**
 * MapFarmScreen - OpenStreetMap with Leaflet (No API key required)
 * Uses WebView to display interactive map with photo markers
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MapMarker, getPhotosForMap } from '../../services/photo.service';

const { width, height } = Dimensions.get('window');

export default function MapFarmScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const webViewRef = useRef<WebView>(null);

  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  useEffect(() => {
    loadMarkers();
  }, []);

  const loadMarkers = async () => {
    try {
      setIsLoading(true);
      const mapData = await getPhotosForMap();
      setMarkers(mapData);
    } catch (error: any) {
      console.error('Load markers error:', error);
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

  // Generate HTML for Leaflet map
  const generateMapHTML = () => {
    const markersJSON = JSON.stringify(markers);
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #map { width: 100vw; height: 100vh; }
    .marker-popup {
      text-align: center;
      min-width: 150px;
    }
    .marker-popup img {
      width: 120px;
      height: 120px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .marker-popup-title {
      font-weight: bold;
      color: #4CAF50;
      margin-bottom: 4px;
    }
    .marker-popup-date {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
    }
    .marker-popup-button {
      background: #4CAF50;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const markers = ${markersJSON};
    
    // Initialize map
    const map = L.map('map').setView([10.8231, 106.6297], 6);
    
    // Add OpenStreetMap tiles (free, no API key needed)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    
    // Add markers
    const markerLayer = L.layerGroup().addTo(map);
    const bounds = [];
    
    markers.forEach((marker) => {
      const lat = marker.latitude;
      const lng = marker.longitude;
      bounds.push([lat, lng]);
      
      // Custom icon with thumbnail
      const icon = L.divIcon({
        html: \`
          <div style="
            width: 40px; 
            height: 40px; 
            border-radius: 20px; 
            border: 3px solid #4CAF50;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            <img src="\${marker.thumbnail}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        \`,
        className: 'custom-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
      
      const leafletMarker = L.marker([lat, lng], { icon }).addTo(markerLayer);
      
      // Popup with photo info
      const date = new Date(marker.createdAt).toLocaleDateString('vi-VN');
      const popupContent = \`
        <div class="marker-popup">
          <img src="\${marker.image}" />
          <div class="marker-popup-title">\${marker.prediction?.classVi || 'Đang phân tích...'}</div>
          <div class="marker-popup-date">\${date}</div>
          <button class="marker-popup-button" onclick="viewDetail('\${marker.id}')">
            Xem chi tiết
          </button>
        </div>
      \`;
      
      leafletMarker.bindPopup(popupContent, {
        maxWidth: 200,
        className: 'custom-popup'
      });
    });
    
    // Fit map to show all markers
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    
    // Handle marker detail view
    function viewDetail(markerId) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'markerClick',
        markerId: markerId
      }));
    }
  </script>
</body>
</html>
    `;
  };

  // Handle messages from WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick') {
        const marker = markers.find((m) => m.id === data.markerId);
        if (marker) {
          handleMarkerPress(marker);
        }
      }
    } catch (error) {
      console.error('WebView message error:', error);
    }
  };

  // Show alert if no photos
  if (!isLoading && markers.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t('map.title', { defaultValue: 'Bản đồ nông trại' })}
          </Text>
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={80} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>
            {t('map.noPhotos', { defaultValue: 'Chưa có ảnh nào' })}
          </Text>
          <Text style={styles.emptySubtitle}>
            {t('map.noPhotosDesc', {
              defaultValue: 'Hãy chụp ảnh lá lúa để xem vị trí trên bản đồ',
            })}
          </Text>
          <TouchableOpacity style={styles.captureButton} onPress={handleCapturePhoto}>
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.captureButtonText}>
              {t('map.capture', { defaultValue: 'Chụp ngay' })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t('map.title', { defaultValue: 'Bản đồ nông trại' })}
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadMarkers}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>
            {t('map.loading', { defaultValue: 'Đang tải bản đồ...' })}
          </Text>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ html: generateMapHTML() }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
            </View>
          )}
        />
      )}

      {/* Marker Detail Overlay */}
      {selectedMarker && (
        <View style={styles.overlay}>
          <View style={styles.detailCard}>
            {/* Image */}
            <Image source={{ uri: selectedMarker.image }} style={styles.detailImage} />

            {/* Info */}
            <View style={styles.detailInfo}>
              <Text style={styles.detailTitle}>
                {selectedMarker.prediction?.classVi || t('map.analyzing', { defaultValue: 'Đang phân tích...' })}
              </Text>
              <View style={styles.detailRow}>
                <Ionicons name="location" size={16} color="#4CAF50" />
                <Text style={styles.detailText}>
                  {selectedMarker.latitude.toFixed(6)}°N, {selectedMarker.longitude.toFixed(6)}°E
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={16} color="#666" />
                <Text style={styles.detailText}>
                  {new Date(selectedMarker.createdAt).toLocaleString('vi-VN')}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.detailActions}>
              <TouchableOpacity style={styles.closeButton} onPress={handleCloseDetail}>
                <Text style={styles.closeButtonText}>
                  {t('common.close', { defaultValue: 'Đóng' })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.viewButton} onPress={handleViewDetail}>
                <Text style={styles.viewButtonText}>
                  {t('map.viewDetail', { defaultValue: 'Xem chi tiết' })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Floating Capture Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleCapturePhoto}>
        <Ionicons name="camera" size={28} color="#fff" />
      </TouchableOpacity>
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
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  detailImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailInfo: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
});

