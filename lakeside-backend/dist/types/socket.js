"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.createOrderStatusUpdate = exports.SocketErrorCodes = exports.SocketRooms = void 0;
// Room naming conventions
exports.SocketRooms = {
    user: (userId) => `user_${userId}`,
    order: (orderId) => `order_${orderId}`,
    restaurant: (restaurantId) => `restaurant_${restaurantId}`,
    driver: (driverId) => `driver_${driverId}`,
};
// Error codes
var SocketErrorCodes;
(function (SocketErrorCodes) {
    SocketErrorCodes["AUTHENTICATION_FAILED"] = "AUTHENTICATION_FAILED";
    SocketErrorCodes["INVALID_TOKEN"] = "INVALID_TOKEN";
    SocketErrorCodes["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    SocketErrorCodes["UNAUTHORIZED"] = "UNAUTHORIZED";
    SocketErrorCodes["ROOM_JOIN_FAILED"] = "ROOM_JOIN_FAILED";
    SocketErrorCodes["INVALID_DATA"] = "INVALID_DATA";
})(SocketErrorCodes || (exports.SocketErrorCodes = SocketErrorCodes = {}));
// Helper functions
const createOrderStatusUpdate = (order, message) => ({
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
exports.createOrderStatusUpdate = createOrderStatusUpdate;
const createNotification = (type, title, message, additionalData) => ({
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    message,
    type,
    timestamp: new Date().toISOString(),
    ...additionalData,
});
exports.createNotification = createNotification;
// Default status messages
const getDefaultStatusMessage = (status) => {
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
//# sourceMappingURL=socket.js.map