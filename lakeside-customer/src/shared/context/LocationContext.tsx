import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocationService, { LocationCoordinates, LocationAddress } from '../services/locationService';

interface SavedAddress {
  id: string;
  label: string; // 'Home', 'Work', 'Other'
  address: string;
  coordinates: LocationCoordinates;
  isDefault?: boolean;
}

interface LocationState {
  currentLocation: LocationCoordinates | null;
  currentAddress: LocationAddress | null;
  savedAddresses: SavedAddress[];
  isLocationEnabled: boolean;
  isLoading: boolean;
  hasLocationPermission: boolean;
}

interface LocationContextType {
  state: LocationState;
  getCurrentLocation: () => Promise<LocationCoordinates | null>;
  updateCurrentLocation: (location: LocationCoordinates) => void;
  reverseGeocodeLocation: (coordinates: LocationCoordinates) => Promise<LocationAddress | null>;
  geocodeAddress: (address: string) => Promise<LocationCoordinates | null>;
  saveAddress: (address: SavedAddress) => Promise<void>;
  updateAddress: (id: string, updates: Partial<SavedAddress>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  getDefaultAddress: () => SavedAddress | null;
  requestLocationPermission: () => Promise<boolean>;
  calculateDistance: (from: LocationCoordinates, to: LocationCoordinates) => number;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

const STORAGE_KEYS = {
  SAVED_ADDRESSES: 'saved_addresses',
  DEFAULT_ADDRESS_ID: 'default_address_id',
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [state, setState] = useState<LocationState>({
    currentLocation: null,
    currentAddress: null,
    savedAddresses: [],
    isLocationEnabled: false,
    isLoading: false,
    hasLocationPermission: false,
  });

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Load saved addresses
      await loadSavedAddresses();
      
      // Check if location is enabled
      const locationEnabled = await LocationService.isLocationEnabled();
      
      setState(prev => ({
        ...prev,
        isLocationEnabled: locationEnabled,
        isLoading: false,
      }));

      // Try to get current location
      if (locationEnabled) {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Error initializing location:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const loadSavedAddresses = async () => {
    try {
      const savedAddressesJson = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_ADDRESSES);
      if (savedAddressesJson) {
        const savedAddresses: SavedAddress[] = JSON.parse(savedAddressesJson);
        setState(prev => ({ ...prev, savedAddresses }));
      }
    } catch (error) {
      console.error('Error loading saved addresses:', error);
    }
  };

  const getCurrentLocation = async (): Promise<LocationCoordinates | null> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const location = await LocationService.getCurrentLocation();
      
      if (location) {
        setState(prev => ({
          ...prev,
          currentLocation: location,
          hasLocationPermission: true,
        }));

        // Get address for the location
        const address = await LocationService.reverseGeocode(location);
        if (address) {
          setState(prev => ({ ...prev, currentAddress: address }));
        }
      } else {
        setState(prev => ({ ...prev, hasLocationPermission: false }));
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        hasLocationPermission: false 
      }));
      return null;
    }
  };

  const updateCurrentLocation = (location: LocationCoordinates) => {
    setState(prev => ({ ...prev, currentLocation: location }));
  };

  const reverseGeocodeLocation = async (coordinates: LocationCoordinates): Promise<LocationAddress | null> => {
    try {
      const address = await LocationService.reverseGeocode(coordinates);
      return address;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  };

  const geocodeAddress = async (address: string): Promise<LocationCoordinates | null> => {
    try {
      const coordinates = await LocationService.geocodeAddress(address);
      return coordinates;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  };

  const saveAddress = async (address: SavedAddress) => {
    try {
      const updatedAddresses = [...state.savedAddresses, address];
      
      setState(prev => ({ ...prev, savedAddresses: updatedAddresses }));
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.SAVED_ADDRESSES,
        JSON.stringify(updatedAddresses)
      );
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  const updateAddress = async (id: string, updates: Partial<SavedAddress>) => {
    try {
      const updatedAddresses = state.savedAddresses.map(addr =>
        addr.id === id ? { ...addr, ...updates } : addr
      );
      
      setState(prev => ({ ...prev, savedAddresses: updatedAddresses }));
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.SAVED_ADDRESSES,
        JSON.stringify(updatedAddresses)
      );
    } catch (error) {
      console.error('Error updating address:', error);
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      const updatedAddresses = state.savedAddresses.filter(addr => addr.id !== id);
      
      setState(prev => ({ ...prev, savedAddresses: updatedAddresses }));
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.SAVED_ADDRESSES,
        JSON.stringify(updatedAddresses)
      );

      // If this was the default address, clear the default
      const defaultAddressId = await AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_ADDRESS_ID);
      if (defaultAddressId === id) {
        await AsyncStorage.removeItem(STORAGE_KEYS.DEFAULT_ADDRESS_ID);
      }
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const setDefaultAddress = async (id: string) => {
    try {
      // Remove default from all addresses
      const updatedAddresses = state.savedAddresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id,
      }));
      
      setState(prev => ({ ...prev, savedAddresses: updatedAddresses }));
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.SAVED_ADDRESSES,
        JSON.stringify(updatedAddresses)
      );
      
      await AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_ADDRESS_ID, id);
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  };

  const getDefaultAddress = (): SavedAddress | null => {
    return state.savedAddresses.find(addr => addr.isDefault) || null;
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    const hasPermission = await LocationService.requestLocationPermission();
    setState(prev => ({ ...prev, hasLocationPermission: hasPermission }));
    return hasPermission;
  };

  const calculateDistance = (from: LocationCoordinates, to: LocationCoordinates): number => {
    return LocationService.calculateDistance(from, to);
  };

  const value: LocationContextType = {
    state,
    getCurrentLocation,
    updateCurrentLocation,
    reverseGeocodeLocation,
    geocodeAddress,
    saveAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getDefaultAddress,
    requestLocationPermission,
    calculateDistance,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationProvider;
