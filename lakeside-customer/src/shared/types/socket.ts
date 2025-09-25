// Socket event types for frontend (shared with backend)

import { OrderStatus } from './Order';

// Authentication events
export interface SocketAuthData {
  token: string;
  userId?: number;
}

// Order-related events
export interface OrderStatusUpdateData {
  orderId: number;
  status: OrderStatus;
  customerId: number;
  restaurantId: number;
  message: string;
  timestamp: string;
  estimatedTime?: string;
  driverName?: string;
  restaurantName?: string;
}

export interface OrderCancellationData {
  orderId: number;
  customerId: number;
  reason: string;
  refundAmount?: number;
  timestamp: string;
}

// Notification events
export interface SocketNotificationData {
  id: string;
  title: string;
  message: string;
  type: 'order_update' | 'wallet_update' | 'promotional' | 'system';
  orderId?: number;
  transactionId?: string;
  timestamp: string;
  data?: Record<string, any>;
}

// Connection events
export interface ConnectionStatusData {
  connected: boolean;
  userId?: number;
  timestamp: string;
}

// Socket event definitions
export interface ServerToClientEvents {
  // Order events
  order_status_update: (data: OrderStatusUpdateData) => void;
  order_cancelled: (data: OrderCancellationData) => void;
  
  // Notification events
  notification: (data: SocketNotificationData) => void;
  
  // Connection events
  connection_status: (data: ConnectionStatusData) => void;
  authenticated: (data: { success: boolean; message: string; userId?: number }) => void;
  error: (data: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  // Authentication
  authenticate: (data: SocketAuthData) => void;
  
  // Order room management
  join_order: (data: { orderId: number }) => void;
  leave_order: (data: { orderId: number }) => void;
  
  // User room management
  join_user_room: (data: { userId: number }) => void;
  leave_user_room: (data: { userId: number }) => void;
  
  // Heartbeat
  ping: () => void;
}

// Error codes
export enum SocketErrorCodes {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  ROOM_JOIN_FAILED = 'ROOM_JOIN_FAILED',
  INVALID_DATA = 'INVALID_DATA',
}

// Connection states
export enum SocketConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  AUTHENTICATED = 'AUTHENTICATED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR',
}
