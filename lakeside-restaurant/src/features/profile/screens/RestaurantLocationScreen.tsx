import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import RestaurantLocationPicker from '../../../shared/components/RestaurantLocationPicker';
import { Button } from '../../../components/ui';
import { Colors } from '../../../shared/theme/colors';
import { Typography } from '../../../shared/theme/typography';
import { Spacing } from '../../../shared/theme/spacing';
import LocationService, { LocationCoordinates } from '../../../shared/services/locationService';
import { apiService } from '../../../shared/services/api';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useAuth } from '../../auth/context/AuthContext';

type RestaurantLocationScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const RestaurantLocationScreen: React.FC = () => {
  const navigation = useNavigation<RestaurantLocationScreenNavigationProp>();
  const { restaurant } = useAuth();
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedCoordinates, setSelectedCoordinates] = useState<LocationCoordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    setLoading(true);
    
    try {
      // Check location permissions
      const hasPermission = await LocationService.requestLocationPermission();
      setHasLocationPermission(hasPermission);
      
      // Load current restaurant location if exists
      await loadRestaurantLocation();
    } catch (error) {
      console.error('Error initializing location:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRestaurantLocation = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        const { lat, lng, address } = response.data;
        
        if (lat && lng) {
          const coordinates = {
            latitude: parseFloat(lat.toString()),
            longitude: parseFloat(lng.toString()),
          };
          
          setSelectedCoordinates(coordinates);
          
          // If we have an address, use it, otherwise reverse geocode
          if (address) {
            setSelectedAddress(address);
          } else {
            const geocodedAddress = await LocationService.reverseGeocode(coordinates);
            if (geocodedAddress) {
              const fullAddress = geocodedAddress.formattedAddress || 
                `${geocodedAddress.address}, ${geocodedAddress.city}, ${geocodedAddress.region}`;
              setSelectedAddress(fullAddress);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading restaurant location:', error);
    }
  };

  const handleLocationSelect = (address: string, coordinates: LocationCoordinates) => {
    setSelectedAddress(address);
    setSelectedCoordinates(coordinates);
  };

  const handleUseCurrentLocation = async () => {
    if (!hasLocationPermission) {
      Alert.alert(
        'Location Permission Required',
        'Please enable location access to use your current location.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Enable', 
            onPress: async () => {
              const hasPermission = await LocationService.requestLocationPermission();
              setHasLocationPermission(hasPermission);
              if (hasPermission) {
                handleUseCurrentLocation();
              }
            }
          }
        ]
      );
      return;
    }

    setLoading(true);
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        const address = await LocationService.reverseGeocode(location);
        if (address) {
          const fullAddress = address.formattedAddress || 
            `${address.address}, ${address.city}, ${address.region}`;
          handleLocationSelect(fullAddress, location);
        } else {
          handleLocationSelect('Current Location', location);
        }
      } else {
        Alert.alert('Error', 'Could not get your current location. Please try again.');
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get your current location.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!selectedAddress || !selectedCoordinates) {
      Alert.alert('Location Required', 'Please select a location before saving.');
      return;
    }

    if (!LocationService.isValidCoordinates(selectedCoordinates)) {
      Alert.alert('Invalid Location', 'The selected location coordinates are invalid.');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        address: selectedAddress,
        lat: selectedCoordinates.latitude,
        lng: selectedCoordinates.longitude,
      };

      const response = await apiService.updateProfile(updateData);
      
      if (response.success) {
        Alert.alert(
          'Location Updated',
          'Your restaurant location has been successfully updated.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to update restaurant location.');
      }
    } catch (error) {
      console.error('Error saving restaurant location:', error);
      Alert.alert('Error', 'Failed to save restaurant location. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Location',
      'Are you sure you want to clear the selected location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSelectedAddress('');
            setSelectedCoordinates(null);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Loading restaurant location...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Restaurant Location</Text>
        <Text style={styles.subtitle}>
          Set your precise restaurant location to help customers and drivers find you easily.
        </Text>
      </View>

      {/* Location Picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Restaurant Address</Text>
        <Text style={styles.sectionDescription}>
          Tap to select your restaurant location on the map. This will be used for delivery calculations and customer navigation.
        </Text>
        
        <RestaurantLocationPicker
          onLocationSelect={handleLocationSelect}
          initialAddress={selectedAddress}
          initialCoordinates={selectedCoordinates}
          placeholder="Tap to set restaurant location"
        />
      </View>

      {/* Location Info */}
      {selectedCoordinates && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Details</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{selectedAddress}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Coordinates:</Text>
              <Text style={styles.infoValue}>
                {LocationService.formatCoordinates(selectedCoordinates)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Current Location Button */}
      <View style={styles.section}>
        <Button
          title={`${hasLocationPermission ? 'Use' : 'Enable'} Current Location`}
          onPress={handleUseCurrentLocation}
          variant="outline"
          disabled={loading}
          style={styles.currentLocationButton}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          title="Reset"
          onPress={handleReset}
          variant="outline"
          style={[styles.actionButton, styles.resetButton]}
          disabled={!selectedCoordinates || saving}
        />
        
        <Button
          title={saving ? 'Saving...' : 'Save Location'}
          onPress={handleSaveLocation}
          style={[styles.actionButton, styles.saveButton]}
          disabled={!selectedCoordinates || saving}
          loading={saving}
        />
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoSectionTitle}>Why is location important?</Text>
        <View style={styles.infoList}>
          <Text style={styles.infoListItem}>• Accurate delivery time estimates</Text>
          <Text style={styles.infoListItem}>• Precise driver navigation</Text>
          <Text style={styles.infoListItem}>• Correct delivery fee calculations</Text>
          <Text style={styles.infoListItem}>• Better customer experience</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  contentContainer: {
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  infoRow: {
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: Spacing.xs,
  },
  currentLocationButton: {
    marginHorizontal: Spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  resetButton: {
    borderColor: Colors.error.main,
  },
  saveButton: {
    backgroundColor: Colors.success.main,
  },
  infoSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.lg,
  },
  infoSectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  infoList: {
    paddingLeft: Spacing.sm,
  },
  infoListItem: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
});

export default RestaurantLocationScreen;
