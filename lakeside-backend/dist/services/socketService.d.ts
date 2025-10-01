import { Server as HTTPServer } from 'http';
import { OrderStatusUpdateData, NotificationData } from '../types/socket';
declare class SocketService {
    private static instance;
    private io;
    private isInitialized;
    private constructor();
    static getInstance(): SocketService;
    /**
     * Initialize Socket.IO server
     */
    initialize(httpServer: HTTPServer): void;
    /**
     * Get Socket.IO server instance
     */
    getIO(): SocketIO.Server | null;
    /**
     * Check if Socket.IO is initialized
     */
    isReady(): boolean;
    /**
     * Emit order status update to relevant users
     */
    emitOrderStatusUpdate(orderData: OrderStatusUpdateData): void;
    /**
     * Emit order status update from order object
     */
    emitOrderUpdate(order: any, customMessage?: string): void;
    /**
     * Emit notification to specific user
     */
    emitNotificationToUser(userId: number, notification: NotificationData): void;
    /**
     * Emit order cancellation to relevant users
     */
    emitOrderCancellation(orderId: number, customerId: number, reason: string, refundAmount?: number): void;
    /**
     * Emit notification to all users in a room
     */
    emitNotificationToRoom(roomName: string, notification: NotificationData): void;
    /**
     * Get connection statistics
     */
    getConnectionStats(): {
        totalConnections: number;
        authenticatedConnections: number;
    };
    /**
     * Disconnect all unauthenticated sockets
     */
    disconnectUnauthenticated(): void;
    /**
     * Send test notification (for debugging)
     */
    sendTestNotification(userId: number): void;
    /**
     * Broadcast system notification to all connected users
     */
    broadcastSystemNotification(title: string, message: string): void;
    /**
     * Get all connected user IDs
     */
    getConnectedUserIds(): number[];
    /**
     * Check if user is connected
     */
    isUserConnected(userId: number): boolean;
    /**
     * Force disconnect all sockets for a user (useful for logout)
     */
    disconnectUser(userId: number): void;
    /**
     * Emit specific event to a driver (for hybrid assignment system)
     */
    emitToDriver(driverId: number, eventName: string, data: any): void;
    /**
     * Emit driver assignment status change
     */
    emitDriverAssignmentUpdate(driverId: number, assignmentData: any): void;
}
declare const _default: SocketService;
export default _default;
//# sourceMappingURL=socketService.d.ts.map