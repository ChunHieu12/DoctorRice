/**
 * Location Picker Modal
 * Cho phép user chọn vị trí khác hoặc sử dụng GPS hiện tại
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { SavedLocation, WeatherCoordinates } from '@/types/weather.types';

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lon: number, name: string) => void;
  currentLocation?: { name: string; coords: WeatherCoordinates } | null;
}

const SAVED_LOCATIONS_KEY = '@weather_saved_locations';

// 63 Tỉnh/Thành phố Việt Nam (sắp xếp theo vùng miền)
const POPULAR_CITIES = [
  // MIỀN BẮC
  { id: 'hanoi', name: 'Hà Nội', lat: 21.0285, lon: 105.8542 },
  { id: 'haiphong', name: 'Hải Phòng', lat: 20.8449, lon: 106.6881 },
  { id: 'quangninh', name: 'Quảng Ninh', lat: 21.0064, lon: 107.2925 },
  { id: 'bacninh', name: 'Bắc Ninh', lat: 21.1861, lon: 106.0763 },
  { id: 'hanam', name: 'Hà Nam', lat: 20.5835, lon: 105.9230 },
  { id: 'haiduong', name: 'Hải Dương', lat: 20.9373, lon: 106.3145 },
  { id: 'hungyen', name: 'Hưng Yên', lat: 20.6464, lon: 106.0511 },
  { id: 'namdinh', name: 'Nam Định', lat: 20.4388, lon: 106.1621 },
  { id: 'thaibinh', name: 'Thái Bình', lat: 20.4464, lon: 106.3365 },
  { id: 'ninhbinh', name: 'Ninh Bình', lat: 20.2506, lon: 105.9745 },
  { id: 'vinhphuc', name: 'Vĩnh Phúc', lat: 21.3609, lon: 105.5474 },
  { id: 'bacgiang', name: 'Bắc Giang', lat: 21.2819, lon: 106.1975 },
  { id: 'phutho', name: 'Phú Thọ', lat: 21.2681, lon: 105.2045 },
  { id: 'thainguyen', name: 'Thái Nguyên', lat: 21.5671, lon: 105.8252 },
  { id: 'langson', name: 'Lạng Sơn', lat: 21.8537, lon: 106.7610 },
  { id: 'caobang', name: 'Cao Bằng', lat: 22.6356, lon: 106.2522 },
  { id: 'bakan', name: 'Bắc Kạn', lat: 22.1474, lon: 105.8348 },
  { id: 'tuyenquang', name: 'Tuyên Quang', lat: 21.7767, lon: 105.2280 },
  { id: 'laocai', name: 'Lào Cai', lat: 22.4809, lon: 103.9755 },
  { id: 'yenbai', name: 'Yên Bái', lat: 21.7168, lon: 104.8986 },
  { id: 'dienbien', name: 'Điện Biên', lat: 21.3887, lon: 103.0165 },
  { id: 'laichau', name: 'Lai Châu', lat: 22.3864, lon: 103.4702 },
  { id: 'sonla', name: 'Sơn La', lat: 21.3256, lon: 103.9088 },
  { id: 'hoabinh', name: 'Hòa Bình', lat: 20.8142, lon: 105.3382 },
  
  // MIỀN TRUNG
  { id: 'thanhhoa', name: 'Thanh Hóa', lat: 19.8067, lon: 105.7851 },
  { id: 'nghean', name: 'Nghệ An', lat: 18.6792, lon: 105.6819 },
  { id: 'hatinh', name: 'Hà Tĩnh', lat: 18.3559, lon: 105.8879 },
  { id: 'quangbinh', name: 'Quảng Bình', lat: 17.4676, lon: 106.6220 },
  { id: 'quangtri', name: 'Quảng Trị', lat: 16.7404, lon: 107.1854 },
  { id: 'thuathienhue', name: 'Thừa Thiên Huế', lat: 16.4637, lon: 107.5909 },
  { id: 'danang', name: 'Đà Nẵng', lat: 16.0544, lon: 108.2022 },
  { id: 'quangnam', name: 'Quảng Nam', lat: 15.5394, lon: 108.0191 },
  { id: 'quangngai', name: 'Quảng Ngãi', lat: 15.1214, lon: 108.8044 },
  { id: 'binhdinh', name: 'Bình Định', lat: 13.7830, lon: 109.2196 },
  { id: 'phuyen', name: 'Phú Yên', lat: 13.0882, lon: 109.0929 },
  { id: 'khanhhoa', name: 'Khánh Hòa', lat: 12.2388, lon: 109.1967 },
  { id: 'ninhthuan', name: 'Ninh Thuận', lat: 11.6739, lon: 108.8629 },
  { id: 'binhthuan', name: 'Bình Thuận', lat: 10.9291, lon: 108.1067 },
  { id: 'kontum', name: 'Kon Tum', lat: 14.3497, lon: 108.0005 },
  { id: 'gialai', name: 'Gia Lai', lat: 13.9830, lon: 108.0003 },
  { id: 'daklak', name: 'Đắk Lắk', lat: 12.6667, lon: 108.0500 },
  { id: 'daknong', name: 'Đắk Nông', lat: 12.2646, lon: 107.6098 },
  { id: 'lamdong', name: 'Lâm Đồng', lat: 11.9465, lon: 108.4419 },
  
  // MIỀN NAM
  { id: 'hcm', name: 'TP. Hồ Chí Minh', lat: 10.8231, lon: 106.6297 },
  { id: 'binhduong', name: 'Bình Dương', lat: 11.3254, lon: 106.4770 },
  { id: 'dongnai', name: 'Đồng Nai', lat: 10.9468, lon: 106.8369 },
  { id: 'bariavungtau', name: 'Bà Rịa - Vũng Tàu', lat: 10.4113, lon: 107.1362 },
  { id: 'tayninh', name: 'Tây Ninh', lat: 11.3351, lon: 106.0988 },
  { id: 'binhphuoc', name: 'Bình Phước', lat: 11.7511, lon: 106.7234 },
  { id: 'longan', name: 'Long An', lat: 10.6959, lon: 106.4093 },
  { id: 'tiengiang', name: 'Tiền Giang', lat: 10.4493, lon: 106.3420 },
  { id: 'bentre', name: 'Bến Tre', lat: 10.2433, lon: 106.3758 },
  { id: 'travinh', name: 'Trà Vinh', lat: 9.8128, lon: 106.2992 },
  { id: 'vinhlong', name: 'Vĩnh Long', lat: 10.2395, lon: 105.9572 },
  { id: 'dongthap', name: 'Đồng Tháp', lat: 10.4938, lon: 105.6881 },
  { id: 'angiang', name: 'An Giang', lat: 10.5215, lon: 105.1258 },
  { id: 'kiengiang', name: 'Kiên Giang', lat: 10.0125, lon: 105.0808 },
  { id: 'cantho', name: 'Cần Thơ', lat: 10.0452, lon: 105.7469 },
  { id: 'haugiang', name: 'Hậu Giang', lat: 9.7577, lon: 105.6412 },
  { id: 'socrang', name: 'Sóc Trăng', lat: 9.6025, lon: 105.9739 },
  { id: 'baclieu', name: 'Bạc Liêu', lat: 9.2515, lon: 105.7244 },
  { id: 'camau', name: 'Cà Mau', lat: 9.1526, lon: 105.1960 },
];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
  onSelectLocation,
  currentLocation,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Load saved locations from storage
   */
  const loadSavedLocations = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(SAVED_LOCATIONS_KEY);
      if (stored) {
        setSavedLocations(JSON.parse(stored));
      }
    } catch (error) {
      console.error('❌ Failed to load saved locations:', error);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadSavedLocations();
    }
  }, [visible, loadSavedLocations]);

  /**
   * Save location to storage
   */
  const saveLocation = async (location: SavedLocation) => {
    try {
      const newLocations = [location, ...savedLocations.filter(l => l.id !== location.id)];
      await AsyncStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(newLocations));
      setSavedLocations(newLocations);
    } catch (error) {
      console.error('❌ Failed to save location:', error);
    }
  };

  /**
   * Delete saved location
   */
  const deleteLocation = async (id: string) => {
    Alert.alert(
      t('weather.deleteLocation'),
      t('weather.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const newLocations = savedLocations.filter(l => l.id !== id);
            await AsyncStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(newLocations));
            setSavedLocations(newLocations);
          },
        },
      ]
    );
  };

  /**
   * Use current GPS location
   */
  const useCurrentLocation = async () => {
    try {
      setLoading(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('weather.locationPermission'), t('weather.locationPermissionDesc'));
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const locationName = address.city || address.region || address.country || 'Current Location';
      
      onSelectLocation(location.coords.latitude, location.coords.longitude, locationName);
      onClose();
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Select a location
   */
  const handleSelectLocation = (lat: number, lon: number, name: string, shouldSave = false) => {
    if (shouldSave) {
      const newLocation: SavedLocation = {
        id: `${lat}_${lon}`,
        name,
        coords: { lat, lon },
        isDefault: false,
        createdAt: Date.now(),
      };
      saveLocation(newLocation);
    }
    
    onSelectLocation(lat, lon, name);
    onClose();
  };

  /**
   * Filter locations by search query
   */
  const filteredPopularCities = POPULAR_CITIES.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('weather.selectLocation')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={t('weather.searchLocation')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>

          {/* Current Location Button */}
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={useCurrentLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.currentLocationIcon}>📍</Text>
                <Text style={styles.currentLocationText}>
                  {t('weather.useCurrentLocation')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Current Location Info */}
          {currentLocation && (
            <View style={styles.currentInfo}>
              <Text style={styles.currentInfoLabel}>{t('weather.currentlyViewing')}:</Text>
              <Text style={styles.currentInfoValue}>{currentLocation.name}</Text>
            </View>
          )}

          {/* Saved Locations */}
          {savedLocations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('weather.savedLocations')}</Text>
              {savedLocations.map(location => (
                <View key={location.id} style={styles.locationItem}>
                  <TouchableOpacity
                    style={styles.locationButton}
                    onPress={() =>
                      handleSelectLocation(location.coords.lat, location.coords.lon, location.name)
                    }
                  >
                    <Text style={styles.locationIcon}>⭐</Text>
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationName}>{location.name}</Text>
                      <Text style={styles.locationCoords}>
                        {location.coords.lat.toFixed(4)}, {location.coords.lon.toFixed(4)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteLocation(location.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Popular Cities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('weather.popularCities')}</Text>
            <FlatList
              data={filteredPopularCities}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.locationItem}
                  onPress={() => handleSelectLocation(item.lat, item.lon, item.name, true)}
                >
                  <Text style={styles.locationIcon}>📍</Text>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>{item.name}</Text>
                    <Text style={styles.locationCoords}>
                      {item.lat.toFixed(4)}, {item.lon.toFixed(4)}
                    </Text>
                  </View>
                  <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>
              )}
              style={styles.list}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#999',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
  },
  currentLocationIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  currentInfo: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 12,
  },
  currentInfoLabel: {
    fontSize: 12,
    color: '#2E7D32',
    marginBottom: 4,
  },
  currentInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E20',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  list: {
    maxHeight: 200,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: '#999',
  },
  arrow: {
    fontSize: 20,
    color: '#4CAF50',
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 20,
  },
});

