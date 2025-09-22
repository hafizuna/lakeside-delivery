import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationAddress {
  address: string;
  city: string;
  country: string;
  postalCode: string;
  region: string;
  coordinates: LocationCoordinates;
}

class LocationService {
  private static instance: LocationService;
  private permissionRequested = false;

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions from the user
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      if (this.permissionRequested) {
        const { status } = await Location.getForegroundPermissionsAsync();
        return status === 'granted';
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      this.permissionRequested = true;

      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to show nearby restaurants and calculate delivery distances. Please grant location permission in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Get current user location
   */
  async getCurrentLocation(): Promise<LocationCoordinates | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 100,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Watch user location changes
   */
  async watchLocation(
    callback: (location: LocationCoordinates) => void,
    errorCallback?: (error: Error) => void
  ): Promise<Location.LocationSubscription | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        return null;
      }

      return await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 100,
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
    } catch (error) {
      console.error('Error watching location:', error);
      if (errorCallback) {
        errorCallback(error as Error);
      }
      return null;
    }
  }

  /**
   * Reverse geocoding - get address from coordinates
   */
  async reverseGeocode(coordinates: LocationCoordinates): Promise<LocationAddress | null> {
    try {
      const results = await Location.reverseGeocodeAsync(coordinates);
      
      if (results.length === 0) {
        return null;
      }

      const result = results[0];
      return {
        address: `${result.streetNumber || ''} ${result.street || ''}`.trim(),
        city: result.city || '',
        country: result.country || '',
        postalCode: result.postalCode || '',
        region: result.region || '',
        coordinates,
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Forward geocoding - get coordinates from address
   */
  async geocodeAddress(address: string): Promise<LocationCoordinates | null> {
    try {
      const results = await Location.geocodeAsync(address);
      
      if (results.length === 0) {
        return null;
      }

      const result = results[0];
      return {
        latitude: result.latitude,
        longitude: result.longitude,
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  calculateDistance(
    from: LocationCoordinates,
    to: LocationCoordinates
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(to.latitude - from.latitude);
    const dLng = this.toRadians(to.longitude - from.longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(from.latitude)) *
        Math.cos(this.toRadians(to.latitude)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Check if location services are enabled
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export default LocationService.getInstance();
