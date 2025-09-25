import * as Location from 'expo-location';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationAddress {
  address: string;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
  formattedAddress?: string;
}

class LocationService {
  /**
   * Request location permissions from the user
   */
  static async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Check if location services are enabled on the device
   */
  static async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  /**
   * Get the current GPS location
   */
  static async getCurrentLocation(): Promise<LocationCoordinates | null> {
    try {
      // Check permissions first
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        console.log('Location permission denied');
        return null;
      }

      // Check if location services are enabled
      const isEnabled = await this.isLocationEnabled();
      if (!isEnabled) {
        console.log('Location services are disabled');
        return null;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
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
   * Convert coordinates to human-readable address
   */
  static async reverseGeocode(coordinates: LocationCoordinates): Promise<LocationAddress | null> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

      if (results.length > 0) {
        const result = results[0];
        const address = result.name || result.street || '';
        const city = result.city || result.subregion || '';
        const region = result.region || '';
        const country = result.country || '';
        const postalCode = result.postalCode || '';

        const formattedAddress = [address, city, region].filter(Boolean).join(', ');

        return {
          address,
          city,
          region,
          country,
          postalCode,
          formattedAddress,
        };
      }

      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Convert address string to coordinates
   */
  static async geocodeAddress(address: string): Promise<LocationCoordinates | null> {
    try {
      const results = await Location.geocodeAsync(address);

      if (results.length > 0) {
        const result = results[0];
        return {
          latitude: result.latitude,
          longitude: result.longitude,
        };
      }

      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  static calculateDistance(from: LocationCoordinates, to: LocationCoordinates): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(to.latitude - from.latitude);
    const dLon = this.deg2rad(to.longitude - from.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(from.latitude)) * 
      Math.cos(this.deg2rad(to.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   */
  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Validate if coordinates are valid
   */
  static isValidCoordinates(coordinates: LocationCoordinates): boolean {
    const { latitude, longitude } = coordinates;
    return (
      latitude >= -90 && 
      latitude <= 90 && 
      longitude >= -180 && 
      longitude <= 180
    );
  }

  /**
   * Format coordinates for display
   */
  static formatCoordinates(coordinates: LocationCoordinates): string {
    const { latitude, longitude } = coordinates;
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }
}

export default LocationService;
