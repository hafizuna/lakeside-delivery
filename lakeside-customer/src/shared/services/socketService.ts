import io from 'socket.io-client';
import { 
  OrderStatusUpdateData,
  OrderCancellationData,
  SocketNotificationData,
  SocketConnectionState,
  SocketErrorCodes
} from '../types/socket';
import { tokenManager } from './api';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

/**
 * Socket.IO Service for Real-time Communication
 * Using Socket.IO 2.4.0 for React Native compatibility
 */
class SocketService {
  private static instance: SocketService;
  private socket: any = null; // Socket.IO 2.4.0 socket instance
  private connectionState: SocketConnectionState = SocketConnectionState.DISCONNECTED;
  private authToken: string | null = null;
  private userId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds
  private isAppActive = true;
  private isNetworkConnected = true;

  // Event listeners (kept for compatibility)
  private orderUpdateListeners: Array<(data: OrderStatusUpdateData) => void> = [];
  private orderCancellationListeners: Array<(data: OrderCancellationData) => void> = [];
  private notificationListeners: Array<(data: SocketNotificationData) => void> = [];
  private connectionStateListeners: Array<(state: SocketConnectionState) => void> = [];
  private errorListeners: Array<(error: string, code?: string) => void> = [];

  private constructor() {
    this.setupAppStateListener();
    this.setupNetworkListener();
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Connect to Socket.IO server with authentication
   */
  public async connect(): Promise<boolean> {
    try {
      // Get auth token
      this.authToken = await tokenManager.getToken();
      if (!this.authToken) {
        console.warn('🔌 No auth token available for socket connection');
        return false;
      }

      console.log('🔑 Auth token available for socket connection');

      // Don't connect if app is not active or network is not available
      if (!this.isAppActive || !this.isNetworkConnected) {
        console.log('🔌 Skipping socket connection - app not active or network unavailable');
        return false;
      }

      // Don't create multiple connections
      if (this.socket?.connected) {
        console.log('🔌 Socket already connected');
        return true;
      }

      this.setConnectionState(SocketConnectionState.CONNECTING);
      console.log('🔌 Connecting to Socket.IO server...');

      // Create Socket.IO connection (2.4.0 compatible)
      const socketUrl = 'http://192.168.1.5:3001';
      console.log(`🔌 Attempting connection to: ${socketUrl}`);
      
      this.socket = io(socketUrl, {
        // Simplified configuration for maximum compatibility
        autoConnect: false,
        reconnection: false,
        forceNew: true
      });

      this.setupSocketListeners();
      
      console.log('🚀 Starting socket connection...');
      this.socket.connect();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error('⏰ Socket connection timeout after 15 seconds');
          reject(new Error('Socket connection timeout'));
        }, 15000);

        this.socket.once('connect', () => {
          console.log('✅ Socket connected successfully!', this.socket.id);
          clearTimeout(timeout);
          this.setConnectionState(SocketConnectionState.CONNECTED);
          
          // Authenticate immediately after connection
          console.log('🔐 Starting authentication process...');
          this.authenticate().then((success) => {
            if (success) {
              console.log('🎉 Socket connection and authentication complete!');
              resolve(true);
            } else {
              console.error('❌ Authentication failed after connection');
              reject(new Error('Authentication failed'));
            }
          }).catch((error) => {
            console.error('❌ Authentication error:', error);
            reject(error);
          });
        });

        this.socket.once('connect_error', (error: any) => {
          console.error('❌ Socket connection error:', error);
          clearTimeout(timeout);
          this.setConnectionState(SocketConnectionState.ERROR);
          reject(error);
        });
      });

    } catch (error) {
      console.error('🔌 Socket connection failed:', error);
      this.setConnectionState(SocketConnectionState.ERROR);
      return false;
    }
  }

  /**
   * Authenticate socket connection
   */
  private async authenticate(): Promise<boolean> {
    if (!this.socket || !this.authToken) {
      console.error('🔐 Authentication failed: missing socket or token');
      return false;
    }

    console.log('🔐 Sending authentication request to server...');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('⏰ Authentication timeout after 10 seconds');
        reject(new Error('Authentication timeout'));
      }, 10000);

      this.socket.once('authenticated', (data: any) => {
        console.log('📨 Received authentication response:', data);
        clearTimeout(timeout);
        if (data.success) {
          this.userId = data.userId || null;
          this.setConnectionState(SocketConnectionState.AUTHENTICATED);
          console.log('✅ Socket authenticated successfully', { userId: this.userId });
          this.reconnectAttempts = 0;
          
          // Join user room automatically after authentication
          if (this.userId) {
            console.log(`💬 Joining user room: user_${this.userId}`);
            this.socket.emit('join_user_room', { userId: this.userId });
          }
          
          resolve(true);
        } else {
          console.error('❌ Socket authentication failed:', data.message);
          this.setConnectionState(SocketConnectionState.ERROR);
          reject(new Error(data.message));
        }
      });

      this.socket.once('error', (error: any) => {
        console.error('❌ Socket authentication error event:', error);
        clearTimeout(timeout);
        this.setConnectionState(SocketConnectionState.ERROR);
        reject(new Error(error.message || error));
      });

      // Send authentication request
      const authData = { token: this.authToken };
      console.log('📤 Emitting authenticate event with token length:', this.authToken.length);
      this.socket.emit('authenticate', authData);
    });
  }

  /**
   * Disconnect socket
   */
  public disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.setConnectionState(SocketConnectionState.DISCONNECTED);
    }
  }

  /**
   * Check if socket is connected and authenticated
   */
  public isConnected(): boolean {
    return this.connectionState === SocketConnectionState.AUTHENTICATED;
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): SocketConnectionState {
    return this.connectionState;
  }

  /**
   * Join order room for real-time updates
   */
  public joinOrder(orderId: number): void {
    if (this.isConnected() && this.socket) {
      this.socket.emit('join_order', { orderId });
      console.log(`📦 Joining order room: ${orderId}`);
    }
  }

  /**
   * Leave order room
   */
  public leaveOrder(orderId: number): void {
    if (this.isConnected() && this.socket) {
      this.socket.emit('leave_order', { orderId });
      console.log(`📦 Leaving order room: ${orderId}`);
    }
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected');
      this.setConnectionState(SocketConnectionState.CONNECTED);
    });

    this.socket.on('disconnect', (reason: any) => {
      console.log('🔌 Socket disconnected:', reason);
      this.setConnectionState(SocketConnectionState.DISCONNECTED);
      
      // Auto-reconnect if not intentional disconnect
      if (reason !== 'io client disconnect' && this.isAppActive && this.isNetworkConnected) {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('🔌 Socket connection error:', error);
      this.setConnectionState(SocketConnectionState.ERROR);
      this.scheduleReconnect();
    });

    this.socket.on('order_status_update', (data: OrderStatusUpdateData) => {
      console.log('📦 Order status update received:', data);
      this.orderUpdateListeners.forEach(listener => listener(data));
    });

    this.socket.on('order_cancelled', (data: OrderCancellationData) => {
      console.log('❌ Order cancellation received:', data);
      this.orderCancellationListeners.forEach(listener => listener(data));
    });

    this.socket.on('notification', (data: SocketNotificationData) => {
      console.log('🔔 Notification received:', data);
      this.notificationListeners.forEach(listener => listener(data));
    });

    this.socket.on('error', (error: any) => {
      console.error('🔌 Socket error:', error);
      this.errorListeners.forEach(listener => listener(error.message || error, error.code));
    });

    this.socket.on('connection_status', (data: any) => {
      console.log('🔌 Connection status:', data);
    });
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🔌 Max reconnection attempts reached');
      this.setConnectionState(SocketConnectionState.ERROR);
      return;
    }

    this.reconnectAttempts++;
    this.setConnectionState(SocketConnectionState.RECONNECTING);

    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`🔌 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (this.isAppActive && this.isNetworkConnected) {
        this.connect();
      }
    }, delay);
  }

  /**
   * Set connection state and notify listeners
   */
  private setConnectionState(state: SocketConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      console.log(`🔌 Connection state changed: ${state}`);
      this.connectionStateListeners.forEach(listener => listener(state));
    }
  }

  /**
   * Setup app state listener
   */
  private setupAppStateListener(): void {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      console.log('📱 App state changed:', nextAppState);
      this.isAppActive = nextAppState === 'active';

      if (nextAppState === 'active') {
        // App became active - connect socket
        if (!this.isConnected() && this.isNetworkConnected) {
          this.connect();
        }
      } else {
        // App went to background - disconnect to save battery
        this.disconnect();
      }
    });
  }

  /**
   * Setup network listener
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasConnected = this.isNetworkConnected;
      this.isNetworkConnected = !!state.isConnected;
      
      console.log('📶 Network state changed:', { 
        isConnected: this.isNetworkConnected,
        type: state.type 
      });

      if (this.isNetworkConnected && !wasConnected && this.isAppActive) {
        // Network came back - reconnect
        this.connect();
      } else if (!this.isNetworkConnected) {
        // Network lost - disconnect
        this.disconnect();
      }
    });
  }

  // Event listener management methods
  public onOrderUpdate(listener: (data: OrderStatusUpdateData) => void): () => void {
    this.orderUpdateListeners.push(listener);
    return () => {
      this.orderUpdateListeners = this.orderUpdateListeners.filter(l => l !== listener);
    };
  }

  public onOrderCancellation(listener: (data: OrderCancellationData) => void): () => void {
    this.orderCancellationListeners.push(listener);
    return () => {
      this.orderCancellationListeners = this.orderCancellationListeners.filter(l => l !== listener);
    };
  }

  public onNotification(listener: (data: SocketNotificationData) => void): () => void {
    this.notificationListeners.push(listener);
    return () => {
      this.notificationListeners = this.notificationListeners.filter(l => l !== listener);
    };
  }

  public onConnectionStateChange(listener: (state: SocketConnectionState) => void): () => void {
    this.connectionStateListeners.push(listener);
    return () => {
      this.connectionStateListeners = this.connectionStateListeners.filter(l => l !== listener);
    };
  }

  public onError(listener: (error: string, code?: string) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }

  /**
   * Send ping to server (for testing connection)
   */
  public ping(): void {
    if (this.isConnected() && this.socket) {
      this.socket.emit('ping');
      console.log('📡 Ping sent to server');
    }
  }

  /**
   * Get debug information
   */
  public getDebugInfo() {
    return {
      connectionState: this.connectionState,
      isConnected: this.isConnected(),
      socketId: this.socket?.id,
      userId: this.userId,
      isAppActive: this.isAppActive,
      isNetworkConnected: this.isNetworkConnected,
      reconnectAttempts: this.reconnectAttempts,
      listenerCounts: {
        orderUpdate: this.orderUpdateListeners.length,
        orderCancellation: this.orderCancellationListeners.length,
        notification: this.notificationListeners.length,
        connectionState: this.connectionStateListeners.length,
        error: this.errorListeners.length,
      }
    };
  }
}

// Export singleton instance
export default SocketService.getInstance();
