import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing } from '../theme/spacing';
import LocationService, { LocationCoordinates, LocationAddress } from '../services/locationService';

const { width, height } = Dimensions.get('window');

interface RestaurantLocationPickerProps {
  onLocationSelect: (address: string, coordinates: LocationCoordinates) => void;
  initialAddress?: string;
  initialCoordinates?: LocationCoordinates;
  placeholder?: string;
  disabled?: boolean;
}

const RestaurantLocationPicker: React.FC<RestaurantLocationPickerProps> = ({
  onLocationSelect,
  initialAddress = '',
  initialCoordinates,
  placeholder = 'Set restaurant location',
  disabled = false,
}) => {
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(initialAddress);
  const [selectedCoordinates, setSelectedCoordinates] = useState<LocationCoordinates | null>(
    initialCoordinates || null
  );
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: initialCoordinates?.latitude || 9.03, // Addis Ababa default
    longitude: initialCoordinates?.longitude || 38.74, // Addis Ababa default
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [markerCoordinate, setMarkerCoordinate] = useState<LocationCoordinates | null>(
    initialCoordinates || null
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  const mapRef = useRef<MapView>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const hasPermission = await LocationService.requestLocationPermission();
    setHasLocationPermission(hasPermission);
  };

  const handleUseCurrentLocation = async () => {
    setIsLoadingLocation(true);
    
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        const address = await LocationService.reverseGeocode(location);
        if (address) {
          const fullAddress = address.formattedAddress || `${address.address}, ${address.city}, ${address.region}`;
          setSelectedAddress(fullAddress);
          setSelectedCoordinates(location);
          setMarkerCoordinate(location);
          setMapRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          
          // Animate map to location
          mapRef.current?.animateToRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      } else {
        Alert.alert(
          'Location Access Required',
          'Please enable location services to use this feature.'
        );
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get your current location. Please try again.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    setMarkerCoordinate(coordinate);
    setIsLoadingLocation(true);

    try {
      const address = await LocationService.reverseGeocode(coordinate);
      if (address) {
        const fullAddress = address.formattedAddress || `${address.address}, ${address.city}, ${address.region}`;
        setSelectedAddress(fullAddress);
        setSelectedCoordinates(coordinate);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const coordinates = await LocationService.geocodeAddress(query);
      if (coordinates) {
        setSelectedAddress(query);
        setSelectedCoordinates(coordinates);
        setMarkerCoordinate(coordinates);
        setMapRegion({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        
        mapRef.current?.animateToRegion({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } else {
        Alert.alert('Address Not Found', 'Could not find the specified address.');
      }
    } catch (error) {
      console.error('Error searching address:', error);
      Alert.alert('Search Error', 'Failed to search for the address.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (text: string) => {
    setSearchQuery(text);
    
    // Debounce search
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      if (text.length > 3) {
        handleSearch(text);
      }
    }, 1000);
  };

  const handleConfirmLocation = () => {
    if (selectedAddress && selectedCoordinates) {
      onLocationSelect(selectedAddress, selectedCoordinates);
      setIsMapVisible(false);
    } else {
      Alert.alert('No Location Selected', 'Please select a location before confirming.');
    }
  };

  const openLocationPicker = () => {
    if (disabled) return;
    setIsMapVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Location Input */}
      <TouchableOpacity
        style={[
          styles.locationInput,
          disabled && styles.locationInputDisabled
        ]}
        onPress={openLocationPicker}
        disabled={disabled}
      >
        <View style={styles.locationIconContainer}>
          <Ionicons 
            name="location" 
            size={20} 
            color={selectedCoordinates ? Colors.success.main : Colors.text.secondary} 
          />
        </View>
        <View style={styles.locationTextContainer}>
          <Text style={[
            styles.locationText,
            !selectedAddress && styles.placeholderText,
            disabled && styles.disabledText
          ]}>
            {selectedAddress || placeholder}
          </Text>
          {selectedCoordinates && (
            <Text style={styles.coordinatesText}>
              {LocationService.formatCoordinates(selectedCoordinates)}
            </Text>
          )}
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={disabled ? Colors.text.disabled : Colors.text.secondary} 
        />
      </TouchableOpacity>

      {/* Map Modal */}
      <Modal
        visible={isMapVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.mapContainer}>
          {/* Header */}
          <View style={styles.mapHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsMapVisible(false)}
            >
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.mapTitle}>Set Restaurant Location</Text>
            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={handleUseCurrentLocation}
              disabled={isLoadingLocation || !hasLocationPermission}
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color={Colors.primary.main} />
              ) : (
                <Ionicons 
                  name="locate" 
                  size={20} 
                  color={hasLocationPermission ? Colors.primary.main : Colors.text.disabled} 
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for restaurant address..."
              value={searchQuery}
              onChangeText={handleSearchInputChange}
              placeholderTextColor={Colors.text.placeholder}
            />
            {isSearching && <ActivityIndicator size="small" color={Colors.primary.main} />}
          </View>

          {/* Map */}
          <MapView
            ref={mapRef}
            style={styles.map}
            region={mapRegion}
            onPress={handleMapPress}
            showsUserLocation={hasLocationPermission}
            showsMyLocationButton={false}
          >
            {markerCoordinate && (
              <Marker
                coordinate={markerCoordinate}
                title="Restaurant Location"
                description={selectedAddress}
              >
                <View style={styles.customMarker}>
                  <Ionicons name="restaurant" size={24} color={Colors.text.white} />
                </View>
              </Marker>
            )}
          </MapView>

          {/* Selected Location Display */}
          <View style={styles.selectedLocationContainer}>
            <View style={styles.selectedLocationInfo}>
              <Ionicons name="restaurant" size={20} color={Colors.primary.main} />
              <View style={styles.selectedLocationTextContainer}>
                <Text style={styles.selectedLocationText}>
                  {selectedAddress || 'Tap on map to select restaurant location'}
                </Text>
                {selectedCoordinates && (
                  <Text style={styles.selectedCoordinatesText}>
                    Coordinates: {LocationService.formatCoordinates(selectedCoordinates)}
                  </Text>
                )}
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!selectedAddress || !selectedCoordinates) && styles.confirmButtonDisabled
              ]}
              onPress={handleConfirmLocation}
              disabled={!selectedAddress || !selectedCoordinates}
            >
              <Text style={styles.confirmButtonText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationInputDisabled: {
    backgroundColor: Colors.background.secondary,
    opacity: 0.6,
  },
  locationIconContainer: {
    marginRight: Spacing.sm,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  placeholderText: {
    color: Colors.text.placeholder,
  },
  disabledText: {
    color: Colors.text.disabled,
  },
  coordinatesText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  mapTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  currentLocationButton: {
    padding: Spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    backgroundColor: Colors.primary.main,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: Colors.text.white,
  },
  selectedLocationContainer: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  selectedLocationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  selectedLocationTextContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  selectedLocationText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  selectedCoordinatesText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  confirmButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: 8,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.text.placeholder,
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text.white,
  },
});

export default RestaurantLocationPicker;
