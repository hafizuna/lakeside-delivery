import { OrderStatus } from '@prisma/client';

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
export interface NotificationData {
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
  notification: (data: NotificationData) => void;
  
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

export interface InterServerEvents {
  // For future scaling with multiple server instances
  order_update_broadcast: (data: OrderStatusUpdateData) => void;
}

export interface SocketData {
  userId?: number;
  isAuthenticated: boolean;
  joinedRooms: string[];
}

// Room naming conventions
export const SocketRooms = {
  user: (userId: number) => `user_${userId}`,
  order: (orderId: number) => `order_${orderId}`,
  restaurant: (restaurantId: number) => `restaurant_${restaurantId}`,
  driver: (driverId: number) => `driver_${driverId}`,
} as const;

// Error codes
export enum SocketErrorCodes {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  ROOM_JOIN_FAILED = 'ROOM_JOIN_FAILED',
  INVALID_DATA = 'INVALID_DATA',
}

// Helper functions
export const createOrderStatusUpdate = (
  order: any,
  message?: string
): OrderStatusUpdateData => ({
  orderId: order.id,
  status: order.status,
  customerId: order.customerId,
  restaurantId: order.restaurantId,
  message: message || getDefaultStatusMessage(order.status),
  timestamp: new Date().toISOString(),
  restaurantName: order.restaurant?.name,
  estimatedTime: order.estimatedDeliveryTime ? 
    new Date(Date.now() + order.estimatedDeliveryTime * 60000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : undefined,
});

export const createNotification = (
  type: NotificationData['type'],
  title: string,
  message: string,
  additionalData?: Partial<NotificationData>
): NotificationData => ({
  id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  title,
  message,
  type,
  timestamp: new Date().toISOString(),
  ...additionalData,
});

// Default status messages
const getDefaultStatusMessage = (status: OrderStatus): string => {
  switch (status) {
    case 'PENDING':
      return 'Your order has been placed and is awaiting restaurant confirmation.';
    case 'ACCEPTED':
      return 'Your order has been confirmed by the restaurant.';
    case 'PREPARING':
      return 'The kitchen is now preparing your delicious meal!';
    case 'READY':
      return 'Your order is ready for pickup.';
    case 'PICKED_UP':
      return 'Your order has been picked up by the delivery driver.';
    case 'DELIVERING':
      return 'Your order is on its way to you!';
    case 'DELIVERED':
      return 'Your order has been delivered successfully.';
    case 'CANCELLED':
      return 'Your order has been cancelled.';
    default:
      return 'Your order status has been updated.';
  }
};
