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

import type { SavedLocation, WeatherCoordinates } from '@/types/weather.types';

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lon: number, name: string) => void;
  currentLocation?: { name: string; coords: WeatherCoordinates } | null;
}

const SAVED_LOCATIONS_KEY = '@weather_saved_locations';

// Các thành phố lớn tại Việt Nam (mặc định)
const POPULAR_CITIES = [
  { id: 'hcm', name: 'TP. Hồ Chí Minh', lat: 10.8231, lon: 106.6297 },
  { id: 'hanoi', name: 'Hà Nội', lat: 21.0285, lon: 105.8542 },
  { id: 'danang', name: 'Đà Nẵng', lat: 16.0544, lon: 108.2022 },
  { id: 'cantho', name: 'Cần Thơ', lat: 10.0452, lon: 105.7469 },
  { id: 'haiphong', name: 'Hải Phòng', lat: 20.8449, lon: 106.6881 },
  { id: 'nhatrang', name: 'Nha Trang', lat: 12.2388, lon: 109.1967 },
  { id: 'dalat', name: 'Đà Lạt', lat: 11.9465, lon: 108.4419 },
  { id: 'vungtau', name: 'Vũng Tàu', lat: 10.4113, lon: 107.1362 },
];

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
  onSelectLocation,
  currentLocation,
}) => {
  const { t } = useTranslation();
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
        <View style={styles.container}>
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

