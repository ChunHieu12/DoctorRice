/**
 * MapFarmScreen - OpenStreetMap with Leaflet (No API key required)
 * Uses WebView to display interactive map with photo markers
 */
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
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
  const { user } = useAuth();
  const webViewRef = useRef<WebView>(null);

  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [nearbyMarkers, setNearbyMarkers] = useState<MapMarker[]>([]);
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

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
    
    // Disease severity ranking (higher = more dangerous)
    const diseaseSeverity = {
      'bacterial_leaf_blight': 3,  // Bệnh bạc lá vi khuẩn - Nghiêm trọng nhất
      'blast': 2,                   // Bệnh đạo ôn - Trung bình
      'brown_spot': 1,              // Bệnh đốm nâu - Nhẹ nhất
      'healthy': 0
    };
    
    const diseaseColors = {
      'bacterial_leaf_blight': '#D32F2F',  // Dark Red
      'blast': '#FF5722',                   // Orange Red
      'brown_spot': '#FF9800',              // Orange
    };
    
    const diseaseNames = {
      'bacterial_leaf_blight': 'Bệnh bạc lá vi khuẩn',
      'blast': 'Bệnh đạo ôn',
      'brown_spot': 'Bệnh đốm nâu',
    };
    
    // Calculate distance between two coordinates (meters)
    function getDistance(lat1, lng1, lat2, lng2) {
      const R = 6371e3; // Earth radius in meters
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lng2 - lng1) * Math.PI / 180;
      
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      
      return R * c; // meters
    }
    
    // Analyze disease zone and determine dominant disease
    function analyzeDiseaseZone(centerMarker, allMarkers) {
      // Find all diseased markers within 50m
      const nearbyDiseased = allMarkers.filter(m => {
        if (!m.prediction || m.prediction.class === 'healthy') return false;
        const distance = getDistance(
          centerMarker.latitude, 
          centerMarker.longitude,
          m.latitude, 
          m.longitude
        );
        return distance <= 50; // 50m radius
      });
      
      if (nearbyDiseased.length === 0) return null;
      
      // Count each disease type
      const diseaseCounts = {};
      nearbyDiseased.forEach(m => {
        const disease = m.prediction.class;
        diseaseCounts[disease] = (diseaseCounts[disease] || 0) + 1;
      });
      
      // Find dominant disease
      let dominantDisease = null;
      let maxCount = 0;
      let maxSeverity = 0;
      
      for (const [disease, count] of Object.entries(diseaseCounts)) {
        const severity = diseaseSeverity[disease] || 0;
        
        // Priority logic:
        // 1. Higher count wins
        // 2. If same count, higher severity wins
        if (count > maxCount || (count === maxCount && severity > maxSeverity)) {
          dominantDisease = disease;
          maxCount = count;
          maxSeverity = severity;
        }
      }
      
      return {
        disease: dominantDisease,
        count: maxCount,
        total: nearbyDiseased.length,
        diseaseCounts: diseaseCounts,
        markers: nearbyDiseased
      };
    }
    
    // Add markers and disease areas
    const markerLayer = L.layerGroup().addTo(map);
    const diseaseAreaLayer = L.layerGroup().addTo(map);
    const bounds = [];
    const diseasedMarkers = []; // Track diseased markers for connecting lines
    const processedZones = []; // Track processed disease zones to avoid duplicates
    
    markers.forEach((marker) => {
      const lat = marker.latitude;
      const lng = marker.longitude;
      bounds.push([lat, lng]);
      
      const isDiseased = marker.prediction && marker.prediction.class !== 'healthy';
      
      // If diseased, analyze zone and draw boundary circle
      if (isDiseased) {
        diseasedMarkers.push({ lat, lng, marker });
        
        // Check if this zone was already processed
        const alreadyProcessed = processedZones.some(zone => {
          const distance = getDistance(zone.lat, zone.lng, lat, lng);
          return distance < 50; // Same zone if < 50m
        });
        
        if (!alreadyProcessed) {
          // Analyze this disease zone
          const zoneAnalysis = analyzeDiseaseZone(marker, markers);
          
          if (zoneAnalysis) {
            const dominantDisease = zoneAnalysis.disease;
            const zoneColor = diseaseColors[dominantDisease] || '#FFA500';
            const zoneName = diseaseNames[dominantDisease] || marker.prediction.classVi;
            
            // Draw boundary circle with dominant disease color
            const circle = L.circle([lat, lng], {
              color: zoneColor,          // Color based on dominant disease
              fillColor: zoneColor,      // Fill color
              fillOpacity: 0.15,         // Semi-transparent
              weight: 3,                 // Border width
              radius: 30,                // 30 meters radius (field size)
            }).addTo(diseaseAreaLayer);
            
            // Build detailed popup content
            let diseaseBreakdown = '';
            for (const [disease, count] of Object.entries(zoneAnalysis.diseaseCounts)) {
              const name = diseaseNames[disease] || disease;
              diseaseBreakdown += \`<div style="font-size: 11px; color: #999;">\${name}: \${count} điểm</div>\`;
            }
            
            // Add popup with zone analysis
            circle.bindPopup(\`
              <div style="text-align: center; min-width: 140px;">
                <strong style="color: \${zoneColor};">⚠️ Vùng nguy cơ bệnh</strong><br/>
                <div style="margin: 8px 0; padding: 6px; background: #f5f5f5; border-radius: 4px;">
                  <strong style="color: #333; font-size: 14px;">\${zoneName}</strong><br/>
                  <span style="color: #666; font-size: 12px;">\${zoneAnalysis.count}/\${zoneAnalysis.total} điểm</span>
                </div>
                \${diseaseBreakdown}
                <span style="color: #999; font-size: 11px; margin-top: 4px; display: block;">Bán kính: 30m</span>
              </div>
            \`, {
              maxWidth: 200
            });
            
            // Mark this zone as processed
            processedZones.push({ lat, lng });
          }
        }
      }
      
      // Custom icon with thumbnail (color based on disease type)
      let borderColor = '#4CAF50'; // Default green for healthy
      if (isDiseased && marker.prediction) {
        borderColor = diseaseColors[marker.prediction.class] || '#FF5722';
      }
      
      const icon = L.divIcon({
        html: \`
          <div style="
            width: 40px; 
            height: 40px; 
            border-radius: 20px; 
            border: 3px solid \${borderColor};
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            background: white;
          ">
            <img src="\${marker.thumbnail}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        \`,
        className: 'custom-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });
      
      const leafletMarker = L.marker([lat, lng], { icon }).addTo(markerLayer);
      
      // Add click event to marker (auto zoom when clicked)
      leafletMarker.on('click', function(e) {
        // Auto zoom to marker
        map.setView([lat, lng], 16, {
          animate: true,
          duration: 0.5
        });
      });
      
      // Popup with photo info
      const date = new Date(marker.createdAt).toLocaleDateString('vi-VN');
      const statusIcon = isDiseased ? '⚠️' : '✅';
      const titleColor = isDiseased ? borderColor : '#4CAF50';
      const popupContent = \`
        <div class="marker-popup">
          <img src="\${marker.image}" />
          <div class="marker-popup-title" style="color: \${titleColor};">\${statusIcon} \${marker.prediction?.classVi || 'Đang phân tích...'}</div>
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
    
    // Draw red connecting lines between diseased areas
    if (diseasedMarkers.length > 1) {
      const diseaseCoords = diseasedMarkers.map(dm => [dm.lat, dm.lng]);
      
      // Draw lines connecting each diseased marker to its nearest neighbors
      diseasedMarkers.forEach((marker1, i) => {
        // Find closest diseased marker
        let closestDistance = Infinity;
        let closestMarker = null;
        
        diseasedMarkers.forEach((marker2, j) => {
          if (i !== j) {
            const distance = Math.sqrt(
              Math.pow(marker1.lat - marker2.lat, 2) + 
              Math.pow(marker1.lng - marker2.lng, 2)
            );
            if (distance < closestDistance) {
              closestDistance = distance;
              closestMarker = marker2;
            }
          }
        });
        
        // Draw line to closest neighbor (if within reasonable distance)
        if (closestMarker && closestDistance < 0.01) { // ~1km max
          L.polyline(
            [[marker1.lat, marker1.lng], [closestMarker.lat, closestMarker.lng]], 
            {
              color: '#FF0000',
              weight: 2,
              opacity: 0.6,
              dashArray: '5, 10',
            }
          ).addTo(diseaseAreaLayer);
        }
      });
      
      // Also draw a polygon connecting all diseased areas (optional)
      if (diseasedMarkers.length >= 3) {
        L.polygon(diseaseCoords, {
          color: '#FF0000',
          fillColor: '#FF5722',
          fillOpacity: 0.05,
          weight: 1,
          dashArray: '10, 10',
        }).addTo(diseaseAreaLayer);
      }
    }
    
    // Fit map to show all markers
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    
    // Handle marker detail view
    function viewDetail(markerId) {
      const marker = markers.find(m => m.id === markerId);
      if (marker) {
        // Zoom to marker
        map.setView([marker.latitude, marker.longitude], 16, {
          animate: true,
          duration: 0.5
        });
        
        // Send message to React Native
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'markerClick',
          markerId: markerId,
          latitude: marker.latitude,
          longitude: marker.longitude
        }));
      }
    }
    
    // Expose zoomToLocation function for external control
    window.zoomToLocation = function(lat, lng, zoom = 16) {
      map.setView([lat, lng], zoom, {
        animate: true,
        duration: 0.5
      });
    };
  </script>
</body>
</html>
    `;
  };

  // Calculate distance between two coordinates (in meters)
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Handle messages from WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick') {
        const clickedMarker = markers.find((m) => m.id === data.markerId);
        if (!clickedMarker) return;

        // Find nearby markers (within 50 meters)
        const nearby = markers.filter((m) => {
          const distance = getDistance(
            clickedMarker.latitude,
            clickedMarker.longitude,
            m.latitude,
            m.longitude
          );
          return distance < 50; // 50 meters threshold
        });

        if (nearby.length > 1) {
          // Multiple markers nearby → show cluster modal
          setNearbyMarkers(nearby);
          setShowClusterModal(true);
        } else {
          // Single marker → show detail directly
          handleMarkerPress(clickedMarker);
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

      {/* Cluster Modal - Multiple markers in same location */}
      {showClusterModal && (
        <View style={styles.overlay}>
          <View style={styles.clusterModal}>
            <View style={styles.clusterHeader}>
              <Text style={styles.clusterTitle}>
                {nearbyMarkers.length} {t('map.photosAtLocation', { defaultValue: 'ảnh tại vị trí này' })}
              </Text>
              <TouchableOpacity onPress={() => setShowClusterModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.clusterList}>
              {nearbyMarkers.map((marker, index) => (
                <TouchableOpacity
                  key={marker.id}
                  style={styles.clusterItem}
                  onPress={() => {
                    setShowClusterModal(false);
                    handleMarkerPress(marker);
                  }}
                >
                  <Image source={{ uri: marker.thumbnail }} style={styles.clusterThumbnail} />
                  <View style={styles.clusterInfo}>
                    <Text style={styles.clusterItemTitle}>
                      {marker.prediction?.classVi || t('map.analyzing', { defaultValue: 'Đang phân tích...' })}
                    </Text>
                    <Text style={styles.clusterItemDate}>
                      {new Date(marker.createdAt).toLocaleString('vi-VN')}
                    </Text>
                    <Text style={styles.clusterItemCoords}>
                      📍 {marker.latitude.toFixed(6)}°N, {marker.longitude.toFixed(6)}°E
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.clusterCloseButton}
              onPress={() => setShowClusterModal(false)}
            >
              <Text style={styles.clusterCloseText}>
                {t('common.close', { defaultValue: 'Đóng' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Floating Action Buttons */}
      <View style={styles.floatingButtons}>
        {/* My Location Button */}
        <TouchableOpacity 
          style={styles.myLocationButton} 
          onPress={async () => {
            if (isLocating) return; // Prevent double tap
            
            try {
              setIsLocating(true);
              
              // Get current location from React Native (not WebView)
              const { status } = await Location.requestForegroundPermissionsAsync();
              
              if (status !== 'granted') {
                Alert.alert(
                  'Cần quyền truy cập',
                  'Vui lòng cấp quyền truy cập vị trí để sử dụng tính năng này'
                );
                setIsLocating(false);
                return;
              }

              // Get current position with high accuracy
              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              });

              const { latitude, longitude } = location.coords;
              console.log('📍 Current location:', latitude, longitude);

              // Zoom to current location via WebView with higher zoom level
              if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                  if (typeof zoomToLocation === 'function') {
                    zoomToLocation(${latitude}, ${longitude}, 17);
                  }
                `);
              }
            } catch (error) {
              console.error('❌ Get location error:', error);
              Alert.alert(
                'Lỗi',
                'Không thể lấy vị trí hiện tại. Vui lòng thử lại.'
              );
            } finally {
              setIsLocating(false);
            }
          }}
          disabled={isLocating}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="locate" size={24} color="#fff" />
          )}
        </TouchableOpacity>

        {/* Capture Photo Button */}
        <TouchableOpacity style={styles.capturePhotoButton} onPress={handleCapturePhoto}>
          <Ionicons name="camera" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
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
    zIndex: 1000,
    elevation: 10,
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
  floatingButtons: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    gap: 16,
    zIndex: 100,
    elevation: 8,
  },
  myLocationButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  capturePhotoButton: {
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
  // Cluster Modal Styles
  clusterModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  clusterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  clusterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  clusterList: {
    maxHeight: 400,
  },
  clusterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    gap: 12,
  },
  clusterThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  clusterInfo: {
    flex: 1,
  },
  clusterItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  clusterItemDate: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  clusterItemCoords: {
    fontSize: 12,
    color: '#4CAF50',
  },
  clusterCloseButton: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#E0E0E0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  clusterCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

