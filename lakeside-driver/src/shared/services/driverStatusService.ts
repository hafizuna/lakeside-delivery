import { driverAPI } from './api';
import socketService from './socketService';
import * as Location from 'expo-location';

export interface DriverState {
  isOnline: boolean;
  status: 'online' | 'offline' | 'busy';
  lastHeartbeat: Date | null;
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  isLocationEnabled: boolean;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}

class DriverStatusService {
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private locationUpdateInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly LOCATION_UPDATE_INTERVAL = 60000; // 1 minute
  private currentState: DriverState = {
    isOnline: false,
    status: 'offline',
    lastHeartbeat: null,
    currentLocation: null,
    isLocationEnabled: false,
  };
  private statusChangeListeners: ((state: DriverState) => void)[] = [];

  // Get current driver state
  getState(): DriverState {
    return { ...this.currentState };
  }

  // Add status change listener
  addStatusChangeListener(listener: (state: DriverState) => void) {
    this.statusChangeListeners.push(listener);
    return () => {
      const index = this.statusChangeListeners.indexOf(listener);
      if (index > -1) {
        this.statusChangeListeners.splice(index, 1);
      }
    };
  }

  private notifyStatusChange() {
    this.statusChangeListeners.forEach(listener => listener(this.getState()));
  }

  // Request location permissions
  async requestLocationPermissions(): Promise<LocationPermissionStatus> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      let backgroundStatus = Location.PermissionStatus.DENIED;
      if (foregroundStatus === Location.PermissionStatus.GRANTED) {
        const { status } = await Location.requestBackgroundPermissionsAsync();
        backgroundStatus = status;
      }

      const granted = foregroundStatus === Location.PermissionStatus.GRANTED && 
                     backgroundStatus === Location.PermissionStatus.GRANTED;

      this.currentState.isLocationEnabled = granted;
      this.notifyStatusChange();

      return {
        granted,
        canAskAgain: foregroundStatus !== Location.PermissionStatus.DENIED,
        status: foregroundStatus,
      };
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: Location.PermissionStatus.DENIED,
      };
    }
  }

  // Get current location
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== Location.PermissionStatus.GRANTED) {
        console.warn('Location permission not granted');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      this.currentState.currentLocation = coords;
      this.notifyStatusChange();

      return coords;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Set driver online
  async goOnline(): Promise<boolean> {
    try {
      console.log('🟢 Going online...');
      
      // Get current location
      const location = await this.getCurrentLocation();
      if (!location && this.currentState.isLocationEnabled) {
        console.error('Cannot go online without location');
        return false;
      }

      // Update driver state on backend
      const response = await driverAPI.updateDriverState('online', location || undefined);
      
      if (response.success) {
        this.currentState.isOnline = true;
        this.currentState.status = 'online';
        this.notifyStatusChange();

        // Update socket status
        socketService.updateDriverStatus('online');
        
        // Start heartbeat and location updates
        this.startHeartbeat();
        this.startLocationUpdates();

        console.log('✅ Successfully went online');
        return true;
      } else {
        console.error('Failed to go online:', response);
        return false;
      }
    } catch (error) {
      console.error('Error going online:', error);
      return false;
    }
  }

  // Set driver offline
  async goOffline(): Promise<boolean> {
    try {
      console.log('🔴 Going offline...');
      
      // Update driver state on backend
      const response = await driverAPI.updateDriverState('offline');
      
      if (response.success) {
        this.currentState.isOnline = false;
        this.currentState.status = 'offline';
        this.notifyStatusChange();

        // Update socket status
        socketService.updateDriverStatus('offline');
        
        // Stop heartbeat and location updates
        this.stopHeartbeat();
        this.stopLocationUpdates();

        console.log('✅ Successfully went offline');
        return true;
      } else {
        console.error('Failed to go offline:', response);
        return false;
      }
    } catch (error) {
      console.error('Error going offline:', error);
      return false;
    }
  }

  // Set driver busy (when on delivery)
  async setBusy(): Promise<boolean> {
    try {
      if (!this.currentState.isOnline) {
        console.warn('Cannot set busy when offline');
        return false;
      }

      this.currentState.status = 'busy';
      this.notifyStatusChange();

      // Update socket status
      socketService.updateDriverStatus('busy');
      
      console.log('🟡 Driver set to busy');
      return true;
    } catch (error) {
      console.error('Error setting busy status:', error);
      return false;
    }
  }

  // Set driver available (after delivery completion)
  async setAvailable(): Promise<boolean> {
    try {
      if (!this.currentState.isOnline) {
        console.warn('Cannot set available when offline');
        return false;
      }

      this.currentState.status = 'online';
      this.notifyStatusChange();

      // Update socket status
      socketService.updateDriverStatus('online');
      
      console.log('🟢 Driver set to available');
      return true;
    } catch (error) {
      console.error('Error setting available status:', error);
      return false;
    }
  }

  // Start heartbeat
  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.sendHeartbeat(); // Send initial heartbeat
    
    this.heartbeatInterval = setInterval(async () => {
      await this.sendHeartbeat();
    }, this.HEARTBEAT_INTERVAL);

    console.log('💓 Heartbeat started');
  }

  // Stop heartbeat
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('💔 Heartbeat stopped');
    }
  }

  // Send heartbeat
  private async sendHeartbeat() {
    try {
      const location = this.currentState.currentLocation;
      const response = await driverAPI.sendHeartbeat(location || undefined);
      
      if (response.success) {
        this.currentState.lastHeartbeat = new Date();
        this.notifyStatusChange();
      } else {
        console.warn('Heartbeat failed:', response);
      }
    } catch (error) {
      console.error('Heartbeat error:', error);
      
      // If heartbeat fails multiple times, consider going offline
      if (this.currentState.isOnline) {
        console.warn('Heartbeat failed, may need to reconnect');
      }
    }
  }

  // Start location updates
  private startLocationUpdates() {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
    }

    if (!this.currentState.isLocationEnabled) {
      console.warn('Location not enabled, skipping location updates');
      return;
    }

    this.locationUpdateInterval = setInterval(async () => {
      await this.updateLocation();
    }, this.LOCATION_UPDATE_INTERVAL);

    console.log('📍 Location updates started');
  }

  // Stop location updates
  private stopLocationUpdates() {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
      this.locationUpdateInterval = null;
      console.log('📍 Location updates stopped');
    }
  }

  // Update location
  private async updateLocation() {
    try {
      const location = await this.getCurrentLocation();
      
      if (location) {
        // Update location on backend via API
        await driverAPI.updateLocation(location.latitude, location.longitude);
        
        // Update location via socket
        socketService.updateLocation(location.latitude, location.longitude);
      }
    } catch (error) {
      console.error('Location update error:', error);
    }
  }

  // Manual location update
  async updateLocationNow(): Promise<boolean> {
    try {
      await this.updateLocation();
      return true;
    } catch (error) {
      console.error('Manual location update failed:', error);
      return false;
    }
  }

  // Initialize driver status service
  async initialize(driverId: string): Promise<boolean> {
    try {
      console.log('🚀 Initializing driver status service...');
      
      // Request location permissions
      const locationPermission = await this.requestLocationPermissions();
      
      if (!locationPermission.granted) {
        console.warn('Location permissions not granted');
      }

      // Get initial location
      await this.getCurrentLocation();

      console.log('✅ Driver status service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize driver status service:', error);
      return false;
    }
  }

  // Cleanup
  cleanup() {
    console.log('🧹 Cleaning up driver status service...');
    this.stopHeartbeat();
    this.stopLocationUpdates();
    this.statusChangeListeners = [];
    
    this.currentState = {
      isOnline: false,
      status: 'offline',
      lastHeartbeat: null,
      currentLocation: null,
      isLocationEnabled: false,
    };
  }

  // Check if services are running
  isServicesActive(): boolean {
    return this.heartbeatInterval !== null;
  }

  // Get last heartbeat time
  getLastHeartbeat(): Date | null {
    return this.currentState.lastHeartbeat;
  }

  // Get time since last heartbeat in seconds
  getTimeSinceLastHeartbeat(): number | null {
    if (!this.currentState.lastHeartbeat) return null;
    return Math.floor((Date.now() - this.currentState.lastHeartbeat.getTime()) / 1000);
  }
}

// Export singleton instance
export const driverStatusService = new DriverStatusService();
export default driverStatusService;