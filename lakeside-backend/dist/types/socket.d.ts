import { OrderStatus } from '@prisma/client';
export interface SocketAuthData {
    token: string;
    userId?: number;
}
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
export interface ConnectionStatusData {
    connected: boolean;
    userId?: number;
    timestamp: string;
}
export interface ServerToClientEvents {
    order_status_update: (data: OrderStatusUpdateData) => void;
    order_cancelled: (data: OrderCancellationData) => void;
    notification: (data: NotificationData) => void;
    connection_status: (data: ConnectionStatusData) => void;
    authenticated: (data: {
        success: boolean;
        message: string;
        userId?: number;
    }) => void;
    error: (data: {
        message: string;
        code?: string;
    }) => void;
}
export interface ClientToServerEvents {
    authenticate: (data: SocketAuthData) => void;
    join_order: (data: {
        orderId: number;
    }) => void;
    leave_order: (data: {
        orderId: number;
    }) => void;
    join_user_room: (data: {
        userId: number;
    }) => void;
    leave_user_room: (data: {
        userId: number;
    }) => void;
    ping: () => void;
}
export interface InterServerEvents {
    order_update_broadcast: (data: OrderStatusUpdateData) => void;
}
export interface SocketData {
    userId?: number;
    isAuthenticated: boolean;
    joinedRooms: string[];
}
export declare const SocketRooms: {
    readonly user: (userId: number) => string;
    readonly order: (orderId: number) => string;
    readonly restaurant: (restaurantId: number) => string;
    readonly driver: (driverId: number) => string;
};
export declare enum SocketErrorCodes {
    AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
    INVALID_TOKEN = "INVALID_TOKEN",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    UNAUTHORIZED = "UNAUTHORIZED",
    ROOM_JOIN_FAILED = "ROOM_JOIN_FAILED",
    INVALID_DATA = "INVALID_DATA"
}
export declare const createOrderStatusUpdate: (order: any, message?: string) => OrderStatusUpdateData;
export declare const createNotification: (type: NotificationData["type"], title: string, message: string, additionalData?: Partial<NotificationData>) => NotificationData;
//# sourceMappingURL=socket.d.ts.map