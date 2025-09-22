import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing } from '../theme/spacing';
import { useLocation } from '../context/LocationContext';
import { LocationCoordinates } from '../services/locationService';

const { width, height } = Dimensions.get('window');

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  coordinates: LocationCoordinates;
  isDefault?: boolean;
}

interface MapAddressPickerProps {
  onAddressSelect: (address: string, coordinates: LocationCoordinates) => void;
  initialAddress?: string;
  initialCoordinates?: LocationCoordinates;
  placeholder?: string;
  showSavedAddresses?: boolean;
}

const MapAddressPicker: React.FC<MapAddressPickerProps> = ({
  onAddressSelect,
  initialAddress = '',
  initialCoordinates,
  placeholder = 'Enter delivery address',
  showSavedAddresses = true,
}) => {
  const { 
    state, 
    getCurrentLocation, 
    reverseGeocodeLocation,
    geocodeAddress,
  } = useLocation();

  const [isMapVisible, setIsMapVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(initialAddress);
  const [selectedCoordinates, setSelectedCoordinates] = useState<LocationCoordinates | null>(
    initialCoordinates || null
  );
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: initialCoordinates?.latitude || 9.03,
    longitude: initialCoordinates?.longitude || 38.74,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [markerCoordinate, setMarkerCoordinate] = useState<LocationCoordinates | null>(
    initialCoordinates || null
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSavedAddressList, setShowSavedAddressList] = useState(false);

  const mapRef = useRef<MapView>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (state.currentLocation && !selectedCoordinates) {
      setMapRegion({
        latitude: state.currentLocation.latitude,
        longitude: state.currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [state.currentLocation]);

  const handleUseCurrentLocation = async () => {
    setIsLoadingLocation(true);
    
    try {
      const location = await getCurrentLocation();
      if (location) {
        const address = await reverseGeocodeLocation(location);
        if (address) {
          const fullAddress = `${address.address}, ${address.city}, ${address.region}`;
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
      const address = await reverseGeocodeLocation(coordinate);
      if (address) {
        const fullAddress = `${address.address}, ${address.city}, ${address.region}`;
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
      const coordinates = await geocodeAddress(query);
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

  const handleSavedAddressSelect = (address: SavedAddress) => {
    setSelectedAddress(address.address);
    setSelectedCoordinates(address.coordinates);
    setMarkerCoordinate(address.coordinates);
    setMapRegion({
      latitude: address.coordinates.latitude,
      longitude: address.coordinates.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    setShowSavedAddressList(false);
  };

  const handleConfirmAddress = () => {
    if (selectedAddress && selectedCoordinates) {
      onAddressSelect(selectedAddress, selectedCoordinates);
      setIsMapVisible(false);
    } else {
      Alert.alert('No Address Selected', 'Please select an address before confirming.');
    }
  };

  const renderSavedAddressItem = ({ item }: { item: SavedAddress }) => (
    <TouchableOpacity
      style={styles.savedAddressItem}
      onPress={() => handleSavedAddressSelect(item)}
    >
      <View style={styles.savedAddressIcon}>
        <Ionicons 
          name={item.label === 'Home' ? 'home' : item.label === 'Work' ? 'business' : 'location'}
          size={20} 
          color={Colors.primary.main} 
        />
      </View>
      <View style={styles.savedAddressInfo}>
        <Text style={styles.savedAddressLabel}>{item.label}</Text>
        <Text style={styles.savedAddressText}>{item.address}</Text>
      </View>
      {item.isDefault && (
        <View style={styles.defaultBadge}>
          <Text style={styles.defaultBadgeText}>Default</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Address Input */}
      <TouchableOpacity
        style={styles.addressInput}
        onPress={() => setIsMapVisible(true)}
      >
        <Ionicons name="location-outline" size={20} color={Colors.text.secondary} />
        <Text style={[
          styles.addressText,
          !selectedAddress && styles.placeholderText
        ]}>
          {selectedAddress || placeholder}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.text.secondary} />
      </TouchableOpacity>

      {/* Saved Addresses Quick Access */}
      {showSavedAddresses && state.savedAddresses.length > 0 && (
        <TouchableOpacity
          style={styles.savedAddressesButton}
          onPress={() => setShowSavedAddressList(true)}
        >
          <Ionicons name="bookmark-outline" size={16} color={Colors.primary.main} />
          <Text style={styles.savedAddressesButtonText}>Saved Addresses</Text>
        </TouchableOpacity>
      )}

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
            <Text style={styles.mapTitle}>Select Delivery Address</Text>
            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={handleUseCurrentLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color={Colors.primary.main} />
              ) : (
                <Ionicons name="locate" size={20} color={Colors.primary.main} />
              )}
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for address..."
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
            showsUserLocation={state.hasLocationPermission}
            showsMyLocationButton={false}
          >
            {markerCoordinate && (
              <Marker
                coordinate={markerCoordinate}
                title="Delivery Location"
                description={selectedAddress}
              />
            )}
          </MapView>

          {/* Selected Address Display */}
          <View style={styles.selectedAddressContainer}>
            <View style={styles.selectedAddressInfo}>
              <Ionicons name="location" size={20} color={Colors.primary.main} />
              <Text style={styles.selectedAddressText}>
                {selectedAddress || 'Tap on map to select location'}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!selectedAddress || !selectedCoordinates) && styles.confirmButtonDisabled
              ]}
              onPress={handleConfirmAddress}
              disabled={!selectedAddress || !selectedCoordinates}
            >
              <Text style={styles.confirmButtonText}>Confirm Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Saved Addresses Modal */}
      <Modal
        visible={showSavedAddressList}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.savedAddressModal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSavedAddressList(false)}
            >
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Saved Addresses</Text>
          </View>

          <FlatList
            data={state.savedAddresses}
            renderItem={renderSavedAddressItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.savedAddressList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  addressInput: {
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
  addressText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  placeholderText: {
    color: Colors.text.placeholder,
  },
  savedAddressesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  savedAddressesButtonText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontWeight: '500',
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
  selectedAddressContainer: {
    backgroundColor: Colors.background.primary,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  selectedAddressInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  selectedAddressText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    lineHeight: 20,
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
  savedAddressModal: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  savedAddressList: {
    padding: Spacing.lg,
  },
  savedAddressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  savedAddressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedAddressInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  savedAddressLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  savedAddressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  defaultBadge: {
    backgroundColor: Colors.primary.main,
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.white,
    fontWeight: '500',
  },
});

export default MapAddressPicker;
