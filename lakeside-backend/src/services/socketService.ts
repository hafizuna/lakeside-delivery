import socketIo from 'socket.io';
import { Server as HTTPServer } from 'http';
import {
  OrderStatusUpdateData,
  NotificationData,
  createOrderStatusUpdate,
  createNotification,
  SocketRooms
} from '../types/socket';
import { socketAuthMiddleware } from '../middleware/socketAuth';
import pushNotificationService from './pushNotificationService';

class SocketService {
  private static instance: SocketService;
  private io: SocketIO.Server | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Initialize Socket.IO server
   */
  public initialize(httpServer: HTTPServer): void {
    if (this.isInitialized) {
      console.warn('🔌 Socket service already initialized');
      return;
    }

    this.io = socketIo(httpServer, {
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      // Allow all origins for testing (Socket.IO 2.4.1)
      origins: '*:*'
    });

    // Apply authentication middleware
    this.io!.use(socketAuthMiddleware);

    // Set up connection handling
    this.io!.on('connection', (socket) => {
      console.log('🔌 Socket connected:', socket.id);
      
      // Emit connection status
      socket.emit('connection_status', {
        connected: true,
        timestamp: new Date().toISOString()
      });
    });

    this.isInitialized = true;
    console.log('🚀 Socket.IO server initialized successfully');
  }

  /**
   * Get Socket.IO server instance
   */
  public getIO(): SocketIO.Server | null {
    return this.io;
  }

  /**
   * Check if Socket.IO is initialized
   */
  public isReady(): boolean {
    return this.isInitialized && this.io !== null;
  }

  /**
   * Emit order status update to relevant users
   */
  public emitOrderStatusUpdate(orderData: OrderStatusUpdateData): void {
    if (!this.io) {
      console.warn('🔌 Socket not initialized, cannot emit order status update');
      return;
    }

    console.log('📡 Emitting order status update:', {
      orderId: orderData.orderId,
      status: orderData.status,
      customerId: orderData.customerId
    });

    // Emit to customer
    const customerRoom = SocketRooms.user(orderData.customerId);
    this.io.to(customerRoom).emit('order_status_update', orderData);

    // Emit to order-specific room (for multiple listeners)
    const orderRoom = SocketRooms.order(orderData.orderId);
    this.io.to(orderRoom).emit('order_status_update', orderData);

    // Also emit to restaurant (for restaurant dashboard if needed)
    const restaurantRoom = SocketRooms.restaurant(orderData.restaurantId);
    this.io.to(restaurantRoom).emit('order_status_update', orderData);

    // Send push notification if customer is not connected via socket
    pushNotificationService.sendOrderUpdateNotification(
      orderData.customerId,
      orderData.orderId,
      orderData.status,
      orderData.restaurantName || 'Restaurant',
      orderData.estimatedTime
    ).catch(error => {
      console.error('Failed to send push notification:', error);
    });

    console.log('📡 Order status update emitted to rooms:', {
      customer: customerRoom,
      order: orderRoom,
      restaurant: restaurantRoom
    });
  }

  /**
   * Emit order status update from order object
   */
  public emitOrderUpdate(order: any, customMessage?: string): void {
    if (!this.io || !order) {
      console.warn('🔌 Socket not initialized or invalid order data');
      return;
    }

    const orderUpdateData = createOrderStatusUpdate(order, customMessage);
    this.emitOrderStatusUpdate(orderUpdateData);
  }

  /**
   * Emit notification to specific user
   */
  public emitNotificationToUser(userId: number, notification: NotificationData): void {
    if (!this.io) {
      console.warn('🔌 Socket not initialized, cannot emit notification');
      return;
    }

    const userRoom = SocketRooms.user(userId);
    this.io.to(userRoom).emit('notification', notification);

    console.log('🔔 Notification emitted to user:', { userId, type: notification.type, title: notification.title });
  }

  /**
   * Emit order cancellation to relevant users
   */
  public emitOrderCancellation(orderId: number, customerId: number, reason: string, refundAmount?: number): void {
    if (!this.io) {
      console.warn('🔌 Socket not initialized, cannot emit order cancellation');
      return;
    }

    const cancellationData = {
      orderId,
      customerId,
      reason,
      refundAmount,
      timestamp: new Date().toISOString()
    };

    // Emit to customer
    const customerRoom = SocketRooms.user(customerId);
    this.io.to(customerRoom).emit('order_cancelled', cancellationData);

    // Emit to order room
    const orderRoom = SocketRooms.order(orderId);
    this.io.to(orderRoom).emit('order_cancelled', cancellationData);

    // Send push notification if customer is not connected via socket
    pushNotificationService.sendOrderCancellationNotification(
      customerId,
      orderId,
      reason,
      refundAmount
    ).catch(error => {
      console.error('Failed to send cancellation push notification:', error);
    });

    console.log('❌ Order cancellation emitted:', { orderId, customerId, reason });
  }

  /**
   * Emit notification to all users in a room
   */
  public emitNotificationToRoom(roomName: string, notification: NotificationData): void {
    if (!this.io) {
      console.warn('🔌 Socket not initialized, cannot emit room notification');
      return;
    }

    this.io.to(roomName).emit('notification', notification);
    console.log('🔔 Notification emitted to room:', { room: roomName, type: notification.type });
  }

  /**
   * Get connection statistics
   */
  public getConnectionStats(): { totalConnections: number; authenticatedConnections: number } {
    if (!this.io) {
      return { totalConnections: 0, authenticatedConnections: 0 };
    }

    const sockets = this.io.sockets.sockets;
    const totalConnections = Object.keys(sockets).length;
    let authenticatedConnections = 0;

    Object.values(sockets).forEach((socket: any) => {
      if (socket.data && socket.data.isAuthenticated) {
        authenticatedConnections++;
      }
    });

    return { totalConnections, authenticatedConnections };
  }

  /**
   * Disconnect all unauthenticated sockets
   */
  public disconnectUnauthenticated(): void {
    if (!this.io) {
      console.warn('🔌 Socket not initialized');
      return;
    }

    const sockets = this.io.sockets.sockets;
    let disconnectedCount = 0;

    Object.values(sockets).forEach((socket: any) => {
      if (!socket.data || !socket.data.isAuthenticated) {
        socket.disconnect();
        disconnectedCount++;
      }
    });

    console.log(`🔌 Disconnected ${disconnectedCount} unauthenticated sockets`);
  }

  /**
   * Send test notification (for debugging)
   */
  public sendTestNotification(userId: number): void {
    const testNotification = createNotification(
      'system',
      'Test Notification',
      'This is a test notification from Socket.IO service'
    );

    this.emitNotificationToUser(userId, testNotification);
  }

  /**
   * Broadcast system notification to all connected users
   */
  public broadcastSystemNotification(title: string, message: string): void {
    if (!this.io) {
      console.warn('🔌 Socket not initialized, cannot broadcast');
      return;
    }

    const notification = createNotification('system', title, message);
    this.io.emit('notification', notification);

    console.log('📢 System notification broadcasted:', { title, message });
  }

  /**
   * Get all connected user IDs
   */
  public getConnectedUserIds(): number[] {
    if (!this.io) {
      return [];
    }

    const userIds: number[] = [];
    Object.values(this.io.sockets.sockets).forEach((socket: any) => {
      if (socket.data && socket.data.isAuthenticated && socket.data.userId) {
        userIds.push(socket.data.userId);
      }
    });

    return [...new Set(userIds)]; // Remove duplicates
  }

  /**
   * Check if user is connected
   */
  public isUserConnected(userId: number): boolean {
    if (!this.io) {
      return false;
    }

    const connectedUserIds = this.getConnectedUserIds();
    return connectedUserIds.includes(userId);
  }

  /**
   * Force disconnect all sockets for a user (useful for logout)
   */
  public disconnectUser(userId: number): void {
    if (!this.io) {
      return;
    }

    let disconnectedCount = 0;
    Object.values(this.io.sockets.sockets).forEach((socket: any) => {
      if (socket.data && socket.data.userId === userId) {
        socket.disconnect();
        disconnectedCount++;
      }
    });

    console.log(`🔌 Disconnected ${disconnectedCount} sockets for user ${userId}`);
  }
}

// Export singleton instance
export default SocketService.getInstance();
