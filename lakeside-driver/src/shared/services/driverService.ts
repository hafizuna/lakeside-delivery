import { authAPI, Driver } from './api';
import socketService from './socketService';
import driverStatusService, { DriverState } from './driverStatusService';

export interface DriverServiceState {
  isInitialized: boolean;
  driver: Driver | null;
  isOnline: boolean;
  socketConnected: boolean;
  error: string | null;
}

export interface DriverServiceCallbacks {
  onStateChange?: (state: DriverServiceState) => void;
  onDriverStatusChange?: (driverState: DriverState) => void;
  onSocketConnectionChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
}

class DriverService {
  private state: DriverServiceState = {
    isInitialized: false,
    driver: null,
    isOnline: false,
    socketConnected: false,
    error: null,
  };
  
  private callbacks: DriverServiceCallbacks = {};
  private statusChangeUnsubscribe: (() => void) | null = null;

  // Initialize driver service
  async initialize(callbacks?: DriverServiceCallbacks): Promise<boolean> {
    try {
      console.log('🚀 Initializing Driver Service...');
      
      if (callbacks) {
        this.callbacks = callbacks;
      }

      // Get driver profile
      const profileResponse = await authAPI.getProfile();
      if (!profileResponse.success) {
        throw new Error('Failed to get driver profile');
      }

      this.updateState({ 
        driver: profileResponse.user,
        error: null 
      });

      // Initialize driver status service
      const statusInitialized = await driverStatusService.initialize(profileResponse.user.id.toString());
      if (!statusInitialized) {
        throw new Error('Failed to initialize driver status service');
      }

      // Subscribe to driver status changes
      this.statusChangeUnsubscribe = driverStatusService.addStatusChangeListener(
        (driverState) => {
          this.updateState({ 
            isOnline: driverState.isOnline 
          });
          this.callbacks.onDriverStatusChange?.(driverState);
        }
      );

      // Connect to Socket.IO
      const socketConnected = await socketService.connect(profileResponse.user.id.toString());
      this.updateState({ 
        socketConnected,
        error: socketConnected ? null : 'Socket connection failed'
      });

      if (socketConnected) {
        // Join driver room for targeted notifications
        socketService.joinDriverRoom(profileResponse.user.id.toString());
        
        // Set up socket connection monitoring
        this.monitorSocketConnection();
      }

      this.updateState({ 
        isInitialized: true,
        error: null 
      });
      
      this.callbacks.onSocketConnectionChange?.(socketConnected);

      console.log('✅ Driver Service initialized successfully');
      return true;

    } catch (error: any) {
      console.error('❌ Driver Service initialization failed:', error);
      this.updateState({ 
        error: error.message || 'Initialization failed',
        isInitialized: false
      });
      this.callbacks.onError?.(error.message || 'Initialization failed');
      return false;
    }
  }

  // Go online (enables receiving assignment offers)
  async goOnline(): Promise<boolean> {
    try {
      if (!this.state.isInitialized) {
        throw new Error('Driver service not initialized');
      }

      console.log('🟢 Going online...');
      
      const success = await driverStatusService.goOnline();
      
      if (success) {
        this.updateState({ 
          isOnline: true,
          error: null 
        });
        console.log('✅ Successfully went online');
        return true;
      } else {
        throw new Error('Failed to go online');
      }
    } catch (error: any) {
      console.error('❌ Failed to go online:', error);
      this.updateState({ 
        error: error.message || 'Failed to go online',
        isOnline: false 
      });
      this.callbacks.onError?.(error.message || 'Failed to go online');
      return false;
    }
  }

  // Go offline (stops receiving assignment offers)
  async goOffline(): Promise<boolean> {
    try {
      if (!this.state.isInitialized) {
        throw new Error('Driver service not initialized');
      }

      console.log('🔴 Going offline...');
      
      const success = await driverStatusService.goOffline();
      
      if (success) {
        this.updateState({ 
          isOnline: false,
          error: null 
        });
        console.log('✅ Successfully went offline');
        return true;
      } else {
        throw new Error('Failed to go offline');
      }
    } catch (error: any) {
      console.error('❌ Failed to go offline:', error);
      this.updateState({ 
        error: error.message || 'Failed to go offline'
      });
      this.callbacks.onError?.(error.message || 'Failed to go offline');
      return false;
    }
  }

  // Get current driver service state
  getState(): DriverServiceState {
    return { ...this.state };
  }

  // Get current driver status
  getDriverStatus(): DriverState {
    return driverStatusService.getState();
  }

  // Check if driver is ready to receive offers
  isReadyForOffers(): boolean {
    return (
      this.state.isInitialized &&
      this.state.isOnline &&
      this.state.socketConnected &&
      !this.state.error
    );
  }

  // Update location manually
  async updateLocation(): Promise<boolean> {
    try {
      if (!this.state.isInitialized) {
        return false;
      }
      
      return await driverStatusService.updateLocationNow();
    } catch (error: any) {
      console.error('Failed to update location:', error);
      return false;
    }
  }

  // Reconnect socket if disconnected
  async reconnectSocket(): Promise<boolean> {
    try {
      if (!this.state.driver) {
        throw new Error('No driver profile available');
      }

      console.log('🔄 Reconnecting socket...');
      
      const connected = await socketService.connect(this.state.driver.id.toString());
      
      this.updateState({ 
        socketConnected: connected,
        error: connected ? null : 'Socket reconnection failed'
      });
      
      if (connected) {
        socketService.joinDriverRoom(this.state.driver.id.toString());
      }
      
      this.callbacks.onSocketConnectionChange?.(connected);
      
      return connected;
    } catch (error: any) {
      console.error('Socket reconnection failed:', error);
      this.updateState({ 
        socketConnected: false,
        error: 'Socket reconnection failed'
      });
      this.callbacks.onError?.(error.message || 'Socket reconnection failed');
      return false;
    }
  }

  // Monitor socket connection health
  private monitorSocketConnection() {
    const checkInterval = setInterval(() => {
      const isConnected = socketService.isConnected();
      
      if (this.state.socketConnected !== isConnected) {
        this.updateState({ socketConnected: isConnected });
        this.callbacks.onSocketConnectionChange?.(isConnected);
        
        if (!isConnected) {
          this.updateState({ 
            error: 'Socket connection lost'
          });
          this.callbacks.onError?.('Socket connection lost');
        }
      }
    }, 10000); // Check every 10 seconds

    // Clean up on service shutdown
    this.cleanupCallbacks.push(() => clearInterval(checkInterval));
  }

  private cleanupCallbacks: (() => void)[] = [];

  // Update internal state and notify callbacks
  private updateState(updates: Partial<DriverServiceState>) {
    this.state = { ...this.state, ...updates };
    this.callbacks.onStateChange?.(this.getState());
  }

  // Cleanup service resources
  async cleanup() {
    console.log('🧹 Cleaning up Driver Service...');
    
    // Go offline before cleanup
    if (this.state.isOnline) {
      try {
        await this.goOffline();
      } catch (error) {
        console.error('Failed to go offline during cleanup:', error);
      }
    }
    
    // Cleanup status change listener
    if (this.statusChangeUnsubscribe) {
      this.statusChangeUnsubscribe();
      this.statusChangeUnsubscribe = null;
    }
    
    // Cleanup driver status service
    driverStatusService.cleanup();
    
    // Disconnect socket
    if (this.state.driver) {
      socketService.leaveDriverRoom(this.state.driver.id.toString());
    }
    socketService.disconnect();
    
    // Run cleanup callbacks
    this.cleanupCallbacks.forEach(callback => callback());
    this.cleanupCallbacks = [];
    
    // Reset state
    this.state = {
      isInitialized: false,
      driver: null,
      isOnline: false,
      socketConnected: false,
      error: null,
    };
    
    this.callbacks = {};
    
    console.log('✅ Driver Service cleaned up');
  }

  // Health check
  async performHealthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      initialized: boolean;
      socketConnected: boolean;
      heartbeatActive: boolean;
      timeSinceLastHeartbeat: number | null;
      locationPermissions: boolean;
    };
  }> {
    const driverState = driverStatusService.getState();
    const timeSinceLastHeartbeat = driverStatusService.getTimeSinceLastHeartbeat();
    const servicesActive = driverStatusService.isServicesActive();
    
    const details = {
      initialized: this.state.isInitialized,
      socketConnected: this.state.socketConnected,
      heartbeatActive: servicesActive,
      timeSinceLastHeartbeat,
      locationPermissions: driverState.isLocationEnabled,
    };

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (!details.initialized || (!details.socketConnected && this.state.isOnline)) {
      overall = 'unhealthy';
    } else if (
      !details.heartbeatActive ||
      (timeSinceLastHeartbeat && timeSinceLastHeartbeat > 120) || // 2 minutes
      !details.locationPermissions
    ) {
      overall = 'degraded';
    }

    return { overall, details };
  }

  // Get service status summary
  getStatusSummary(): {
    status: string;
    isOnline: boolean;
    canReceiveOffers: boolean;
    lastHeartbeat: Date | null;
    issues: string[];
  } {
    const driverState = driverStatusService.getState();
    const issues: string[] = [];
    
    if (!this.state.isInitialized) {
      issues.push('Service not initialized');
    }
    
    if (this.state.isOnline && !this.state.socketConnected) {
      issues.push('Socket connection lost');
    }
    
    if (!driverState.isLocationEnabled) {
      issues.push('Location permissions not granted');
    }
    
    if (this.state.error) {
      issues.push(this.state.error);
    }
    
    const timeSinceHeartbeat = driverStatusService.getTimeSinceLastHeartbeat();
    if (this.state.isOnline && timeSinceHeartbeat && timeSinceHeartbeat > 90) {
      issues.push('Heartbeat delayed');
    }

    return {
      status: driverState.status,
      isOnline: this.state.isOnline,
      canReceiveOffers: this.isReadyForOffers(),
      lastHeartbeat: driverState.lastHeartbeat,
      issues,
    };
  }
}

// Export singleton instance
export const driverService = new DriverService();
export default driverService;