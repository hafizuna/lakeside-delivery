"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = __importDefault(require("socket.io"));
const socket_1 = require("../types/socket");
const socketAuth_1 = require("../middleware/socketAuth");
const pushNotificationService_1 = __importDefault(require("./pushNotificationService"));
class SocketService {
    constructor() {
        this.io = null;
        this.isInitialized = false;
    }
    static getInstance() {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }
    /**
     * Initialize Socket.IO server
     */
    initialize(httpServer) {
        if (this.isInitialized) {
            console.warn('🔌 Socket service already initialized');
            return;
        }
        this.io = (0, socket_io_1.default)(httpServer, {
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000,
            // Allow all origins for testing (Socket.IO 2.4.1)
            origins: '*:*'
        });
        // Apply authentication middleware
        this.io.use(socketAuth_1.socketAuthMiddleware);
        // Set up connection handling
        this.io.on('connection', (socket) => {
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
    getIO() {
        return this.io;
    }
    /**
     * Check if Socket.IO is initialized
     */
    isReady() {
        return this.isInitialized && this.io !== null;
    }
    /**
     * Emit order status update to relevant users
     */
    emitOrderStatusUpdate(orderData) {
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
        const customerRoom = socket_1.SocketRooms.user(orderData.customerId);
        this.io.to(customerRoom).emit('order_status_update', orderData);
        // Emit to order-specific room (for multiple listeners)
        const orderRoom = socket_1.SocketRooms.order(orderData.orderId);
        this.io.to(orderRoom).emit('order_status_update', orderData);
        // Also emit to restaurant (for restaurant dashboard if needed)
        const restaurantRoom = socket_1.SocketRooms.restaurant(orderData.restaurantId);
        this.io.to(restaurantRoom).emit('order_status_update', orderData);
        // Send push notification if customer is not connected via socket
        pushNotificationService_1.default.sendOrderUpdateNotification(orderData.customerId, orderData.orderId, orderData.status, orderData.restaurantName || 'Restaurant', orderData.estimatedTime).catch(error => {
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
    emitOrderUpdate(order, customMessage) {
        if (!this.io || !order) {
            console.warn('🔌 Socket not initialized or invalid order data');
            return;
        }
        const orderUpdateData = (0, socket_1.createOrderStatusUpdate)(order, customMessage);
        this.emitOrderStatusUpdate(orderUpdateData);
    }
    /**
     * Emit notification to specific user
     */
    emitNotificationToUser(userId, notification) {
        if (!this.io) {
            console.warn('🔌 Socket not initialized, cannot emit notification');
            return;
        }
        const userRoom = socket_1.SocketRooms.user(userId);
        this.io.to(userRoom).emit('notification', notification);
        console.log('🔔 Notification emitted to user:', { userId, type: notification.type, title: notification.title });
    }
    /**
     * Emit order cancellation to relevant users
     */
    emitOrderCancellation(orderId, customerId, reason, refundAmount) {
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
        const customerRoom = socket_1.SocketRooms.user(customerId);
        this.io.to(customerRoom).emit('order_cancelled', cancellationData);
        // Emit to order room
        const orderRoom = socket_1.SocketRooms.order(orderId);
        this.io.to(orderRoom).emit('order_cancelled', cancellationData);
        // Send push notification if customer is not connected via socket
        pushNotificationService_1.default.sendOrderCancellationNotification(customerId, orderId, reason, refundAmount).catch(error => {
            console.error('Failed to send cancellation push notification:', error);
        });
        console.log('❌ Order cancellation emitted:', { orderId, customerId, reason });
    }
    /**
     * Emit notification to all users in a room
     */
    emitNotificationToRoom(roomName, notification) {
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
    getConnectionStats() {
        if (!this.io) {
            return { totalConnections: 0, authenticatedConnections: 0 };
        }
        const sockets = this.io.sockets.sockets;
        const totalConnections = Object.keys(sockets).length;
        let authenticatedConnections = 0;
        Object.values(sockets).forEach((socket) => {
            if (socket.data && socket.data.isAuthenticated) {
                authenticatedConnections++;
            }
        });
        return { totalConnections, authenticatedConnections };
    }
    /**
     * Disconnect all unauthenticated sockets
     */
    disconnectUnauthenticated() {
        if (!this.io) {
            console.warn('🔌 Socket not initialized');
            return;
        }
        const sockets = this.io.sockets.sockets;
        let disconnectedCount = 0;
        Object.values(sockets).forEach((socket) => {
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
    sendTestNotification(userId) {
        const testNotification = (0, socket_1.createNotification)('system', 'Test Notification', 'This is a test notification from Socket.IO service');
        this.emitNotificationToUser(userId, testNotification);
    }
    /**
     * Broadcast system notification to all connected users
     */
    broadcastSystemNotification(title, message) {
        if (!this.io) {
            console.warn('🔌 Socket not initialized, cannot broadcast');
            return;
        }
        const notification = (0, socket_1.createNotification)('system', title, message);
        this.io.emit('notification', notification);
        console.log('📢 System notification broadcasted:', { title, message });
    }
    /**
     * Get all connected user IDs
     */
    getConnectedUserIds() {
        if (!this.io) {
            return [];
        }
        const userIds = [];
        Object.values(this.io.sockets.sockets).forEach((socket) => {
            if (socket.data && socket.data.isAuthenticated && socket.data.userId) {
                userIds.push(socket.data.userId);
            }
        });
        return [...new Set(userIds)]; // Remove duplicates
    }
    /**
     * Check if user is connected
     */
    isUserConnected(userId) {
        if (!this.io) {
            return false;
        }
        const connectedUserIds = this.getConnectedUserIds();
        return connectedUserIds.includes(userId);
    }
    /**
     * Force disconnect all sockets for a user (useful for logout)
     */
    disconnectUser(userId) {
        if (!this.io) {
            return;
        }
        let disconnectedCount = 0;
        Object.values(this.io.sockets.sockets).forEach((socket) => {
            if (socket.data && socket.data.userId === userId) {
                socket.disconnect();
                disconnectedCount++;
            }
        });
        console.log(`🔌 Disconnected ${disconnectedCount} sockets for user ${userId}`);
    }
    /**
     * Emit specific event to a driver (for hybrid assignment system)
     */
    emitToDriver(driverId, eventName, data) {
        if (!this.io) {
            console.warn('🔌 [SOCKET-SERVICE] Socket not initialized, cannot emit to driver');
            return;
        }
        console.log(`🔊 [SOCKET-SERVICE] Attempting to emit event '${eventName}' to driver ${driverId}`);
        const driverRoom = socket_1.SocketRooms.user(driverId);
        console.log(`💬 [SOCKET-SERVICE] Driver room: ${driverRoom}`);
        // Check socket connection status
        console.log(`📡 [SOCKET-SERVICE] Attempting to emit to room: ${driverRoom}`);
        console.log(`🔍 [SOCKET-SERVICE] Socket.IO server has ${Object.keys(this.io.sockets.sockets).length} total connected sockets`);
        // Get connection stats
        const stats = this.getConnectionStats();
        console.log(`📊 [SOCKET-SERVICE] Connection stats: ${stats.totalConnections} total, ${stats.authenticatedConnections} authenticated`);
        // List all connected users
        const connectedUserIds = this.getConnectedUserIds();
        console.log(`👥 [SOCKET-SERVICE] Connected user IDs: [${connectedUserIds.join(', ')}]`);
        console.log(`🔍 [SOCKET-SERVICE] Is driver ${driverId} connected? ${connectedUserIds.includes(driverId)}`);
        this.io.to(driverRoom).emit(eventName, data);
        console.log(`✅ [SOCKET-SERVICE] Event '${eventName}' emitted to room ${driverRoom}`);
        console.log(`🚗 [SOCKET-SERVICE] Event '${eventName}' emitted to driver ${driverId}:`, {
            driverId,
            eventName,
            driverRoom,
            dataKeys: Object.keys(data),
            assignmentId: data.assignmentId || 'N/A',
            orderId: data.orderId || 'N/A'
        });
    }
    /**
     * Emit driver assignment status change
     */
    emitDriverAssignmentUpdate(driverId, assignmentData) {
        if (!this.io) {
            console.warn('🔌 Socket not initialized, cannot emit assignment update');
            return;
        }
        this.emitToDriver(driverId, 'assignment_status_change', assignmentData);
        console.log(`📋 Assignment status update emitted to driver ${driverId}`);
    }
}
// Export singleton instance
exports.default = SocketService.getInstance();
//# sourceMappingURL=socketService.js.map