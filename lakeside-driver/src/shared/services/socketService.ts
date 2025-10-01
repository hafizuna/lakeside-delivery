import io from 'socket.io-client';
import { Platform } from 'react-native';
import { tokenManager } from './api';
import { getSocketBaseUrl } from '../config/endpoints';

// Socket configuration
const getSocketUrl = getSocketBaseUrl;

// Assignment Offer Types
export interface AssignmentOffer {
  id: string;
  assignmentId: string;
  orderId: number;
  order: {
    id: number;
    orderNumber: string;
    restaurantName: string;
    restaurantAddress: string;
    restaurantLat: number;
    restaurantLng: number;
    customerName: string;
    deliveryAddress: string;
    deliveryLat: number;
    deliveryLng: number;
    totalAmount: number;
    deliveryFee: number;
    driverEarning: number;
    estimatedPickupTime?: string;
    estimatedDeliveryTime?: string;
    items: Array<{
      itemName: string;
      quantity: number;
      price: number;
    }>;
  };
  expiresAt: string;
  timeRemaining: number;
  wave: number;
  priority: 'high' | 'medium' | 'low';
  distance: number;
  createdAt: string;
}

export interface SocketEventHandlers {
  onOfferReceived?: (offer: AssignmentOffer) => void;
  onOfferExpired?: (data: { assignmentId: string; orderId: number }) => void;
  onOfferAccepted?: (data: { assignmentId: string; orderId: number; driverId: string }) => void;
  onOfferCancelled?: (data: { assignmentId: string; orderId: number; reason: string }) => void;
  onDriverStatusUpdated?: (data: { driverId: string; status: string; isOnline: boolean }) => void;
  onConnectionError?: (error: any) => void;
  onReconnected?: () => void;
}

class SocketService {
  private socket: SocketIOClient.Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private eventHandlers: SocketEventHandlers = {};

  async connect(driverId: string): Promise<boolean> {
    if (this.socket?.connected || this.isConnecting) {
      console.log('Socket already connected or connecting');
      return true;
    }

    try {
      this.isConnecting = true;
      const token = await tokenManager.getToken();
      
      if (!token) {
        console.error('No auth token available for socket connection');
        this.isConnecting = false;
        return false;
      }

      const socketUrl = getSocketUrl();
      console.log('🔌 Connecting to Socket.IO server:', socketUrl);
      console.log('🔑 Using token:', token ? 'Token available' : 'No token');
      console.log('👤 Driver ID:', driverId);

      // Socket.IO v2.x configuration
      this.socket = io(socketUrl, {
        query: {
          token: token,
          driverId: driverId,
          userType: 'driver'
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: this.maxReconnectAttempts,
        forceNew: true,
        autoConnect: true
      });

      // Set up event listeners
      this.setupEventListeners();

      // Wait for connection
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.error('Socket connection timeout');
          this.isConnecting = false;
          resolve(false);
        }, 10000);

        this.socket!.on('connect', () => {
          console.log('✅ Socket connected successfully');
          clearTimeout(timeout);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve(true);
        });

        this.socket!.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
          clearTimeout(timeout);
          this.isConnecting = false;
          this.eventHandlers.onConnectionError?.(error);
          resolve(false);
        });
      });

    } catch (error) {
      console.error('Socket connection failed:', error);
      this.isConnecting = false;
      return false;
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🟢 Socket connected, ID:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      this.eventHandlers.onReconnected?.();
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('🔄 Socket reconnection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    // Assignment offer events
    this.socket.on('offer_received', (offer: AssignmentOffer) => {
      console.log('📥 Assignment offer received:', offer.assignmentId);
      this.eventHandlers.onOfferReceived?.(offer);
    });

    this.socket.on('offer_expired', (data: { assignmentId: string; orderId: number }) => {
      console.log('⏰ Assignment offer expired:', data.assignmentId);
      this.eventHandlers.onOfferExpired?.(data);
    });

    this.socket.on('offer_accepted', (data: { assignmentId: string; orderId: number; driverId: string }) => {
      console.log('✅ Assignment offer accepted by another driver:', data.assignmentId);
      this.eventHandlers.onOfferAccepted?.(data);
    });

    this.socket.on('offer_cancelled', (data: { assignmentId: string; orderId: number; reason: string }) => {
      console.log('❌ Assignment offer cancelled:', data.assignmentId, 'Reason:', data.reason);
      this.eventHandlers.onOfferCancelled?.(data);
    });

    // Driver status events
    this.socket.on('driver_status_updated', (data: { driverId: string; status: string; isOnline: boolean }) => {
      console.log('👤 Driver status updated:', data);
      this.eventHandlers.onDriverStatusUpdated?.(data);
    });

    // Error handling
    this.socket.on('error', (error: any) => {
      console.error('🚨 Socket error:', error);
      this.eventHandlers.onConnectionError?.(error);
    });
  }

  setEventHandlers(handlers: SocketEventHandlers) {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  // Send driver location update
  updateLocation(latitude: number, longitude: number) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot update location');
      return;
    }

    this.socket.emit('driver_location_update', {
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    });
  }

  // Send driver status update
  updateDriverStatus(status: 'online' | 'offline' | 'busy') {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot update status');
      return;
    }

    this.socket.emit('driver_status_update', {
      status,
      timestamp: new Date().toISOString(),
    });
  }

  // Join driver room for targeted notifications
  joinDriverRoom(driverId: string) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot join room');
      return;
    }

    this.socket.emit('join_driver_room', { driverId });
  }

  // Leave driver room
  leaveDriverRoom(driverId: string) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot leave room');
      return;
    }

    this.socket.emit('leave_driver_room', { driverId });
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.eventHandlers = {};
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getSocketId(): string | null {
    return this.socket?.id ?? null;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;