"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expo_server_sdk_1 = require("expo-server-sdk");
const client_1 = require("@prisma/client");
const socketService_1 = __importDefault(require("./socketService"));
const prisma = new client_1.PrismaClient();
class PushNotificationService {
    constructor() {
        this.expo = new expo_server_sdk_1.Expo({
            accessToken: process.env.EXPO_ACCESS_TOKEN, // Optional: for better rate limits
        });
    }
    static getInstance() {
        if (!PushNotificationService.instance) {
            PushNotificationService.instance = new PushNotificationService();
        }
        return PushNotificationService.instance;
    }
    /**
     * Send push notification to user if they're not connected via socket
     */
    async sendNotificationToUser(userId, title, body, data) {
        try {
            // Check if user is connected via socket (real-time)
            const isUserConnectedViaSocket = socketService_1.default.isUserConnected(userId);
            if (isUserConnectedViaSocket) {
                console.log(`📱 User ${userId} is connected via socket, but sending push notification anyway for testing`);
                // For testing: send push notification even when socket is connected
                // In production, you might want to skip this to avoid duplicates
            }
            // User is not connected, send push notification
            console.log(`📱 User ${userId} not connected via socket, sending push notification`);
            // Get user's push token from database (you'll need to store this)
            const userPushToken = await this.getUserPushToken(userId);
            if (!userPushToken) {
                console.warn(`📱 No push token found for user ${userId}`);
                return false;
            }
            const success = await this.sendPushNotification(userPushToken, title, body, data);
            return success;
        }
        catch (error) {
            console.error('Error sending notification to user:', error);
            return false;
        }
    }
    /**
     * Send order status update push notification
     */
    async sendOrderUpdateNotification(customerId, orderId, orderStatus, restaurantName, estimatedTime) {
        const { title, body } = this.getOrderNotificationContent(orderStatus, restaurantName, estimatedTime);
        return await this.sendNotificationToUser(customerId, title, body, {
            type: 'order_update',
            orderId: orderId.toString(),
            orderStatus,
        });
    }
    /**
     * Send order cancellation push notification
     */
    async sendOrderCancellationNotification(customerId, orderId, reason, refundAmount) {
        const title = 'Order Cancelled 😔';
        const body = `Order #${orderId} has been cancelled. ${reason}${refundAmount ? ` Refund: ₹${refundAmount}` : ''}`;
        return await this.sendNotificationToUser(customerId, title, body, {
            type: 'order_cancelled',
            orderId: orderId.toString(),
            reason,
            refundAmount,
        });
    }
    /**
     * Send individual push notification
     */
    async sendPushNotification(pushToken, title, body, data) {
        try {
            // Check that the push token is valid
            if (!expo_server_sdk_1.Expo.isExpoPushToken(pushToken)) {
                console.error(`Invalid push token: ${pushToken}`);
                return false;
            }
            const message = {
                to: pushToken,
                sound: 'default',
                title,
                body,
                data: data || {},
                priority: 'high',
                badge: 1,
            };
            console.log('📤 Sending push notification:', { title, body, to: pushToken.slice(0, 10) + '...' });
            // Send the notification
            const tickets = await this.expo.sendPushNotificationsAsync([message]);
            // Handle the ticket response
            const ticket = tickets[0];
            if (ticket.status === 'error') {
                console.error('❌ Push notification error:', ticket.message);
                if (ticket.details?.error === 'DeviceNotRegistered') {
                    // Remove invalid token from database
                    await this.removeInvalidPushToken(pushToken);
                }
                return false;
            }
            console.log('✅ Push notification sent successfully:', ticket.id);
            return true;
        }
        catch (error) {
            console.error('Error sending push notification:', error);
            return false;
        }
    }
    /**
     * Get user's push token from database
     * Note: You'll need to create a table to store user push tokens
     */
    async getUserPushToken(userId) {
        try {
            // For now, we'll check if there's a push token field on the user table
            // In a real implementation, you might have a separate user_devices table
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    // pushToken: true, // You'd need to add this field to your User model
                }
            });
            // TODO: Implement push token storage in database
            // For testing: return a dummy token that will be replaced with real token from your app
            console.log(`📱 Using test push token for user ${userId} (implement proper storage later)`);
            // TEMPORARY: Return a test token - replace with actual token from your app
            // You'll get the real token from your React Native app logs
            if (userId === 1) {
                return 'REPLACE_WITH_REAL_TOKEN_FROM_APP_LOGS'; // Replace this with actual token
            }
            return null;
        }
        catch (error) {
            console.error('Error getting user push token:', error);
            return null;
        }
    }
    /**
     * Remove invalid push token from database
     */
    async removeInvalidPushToken(pushToken) {
        try {
            console.log(`🗑️ Removing invalid push token: ${pushToken.slice(0, 10)}...`);
            // TODO: Remove from database when push token storage is implemented
        }
        catch (error) {
            console.error('Error removing invalid push token:', error);
        }
    }
    /**
     * Generate notification content based on order status
     */
    getOrderNotificationContent(orderStatus, restaurantName, estimatedTime) {
        switch (orderStatus.toUpperCase()) {
            case 'PENDING':
                return {
                    title: 'Order Placed Successfully! 🎉',
                    body: `Your order from ${restaurantName} is waiting for confirmation.`
                };
            case 'ACCEPTED':
                return {
                    title: 'Order Confirmed! ✅',
                    body: `${restaurantName} has accepted your order${estimatedTime ? ` and will have it ready in ${estimatedTime}` : ''}.`
                };
            case 'PREPARING':
                return {
                    title: 'Cooking Started! 👨‍🍳',
                    body: `${restaurantName} is now preparing your delicious meal${estimatedTime ? `. Ready in ${estimatedTime}` : ''}.`
                };
            case 'READY':
                return {
                    title: 'Order Ready! 🔥',
                    body: `Your order from ${restaurantName} is ready and waiting for pickup!`
                };
            case 'PICKED_UP':
                return {
                    title: 'Order Picked Up! 🛵',
                    body: `Your order from ${restaurantName} has been picked up and is on the way to you!`
                };
            case 'DELIVERING':
                return {
                    title: 'On the Way! 🚚',
                    body: `Your order is being delivered${estimatedTime ? `. Expected arrival: ${estimatedTime}` : ''}. Get ready!`
                };
            case 'DELIVERED':
                return {
                    title: 'Order Delivered! 🎉',
                    body: `Your order from ${restaurantName} has been delivered. Enjoy your meal!`
                };
            case 'CANCELLED':
                return {
                    title: 'Order Cancelled 😔',
                    body: `Your order from ${restaurantName} has been cancelled. Any payment will be refunded.`
                };
            default:
                return {
                    title: 'Order Update',
                    body: `Your order from ${restaurantName} has been updated.`
                };
        }
    }
    /**
     * Test function to verify push notification setup
     */
    async testPushNotification(pushToken) {
        return await this.sendPushNotification(pushToken, 'Test Notification 🧪', 'This is a test notification from Lakeside Delivery backend!', { type: 'test' });
    }
    /**
     * Get service statistics
     */
    getStats() {
        return {
            expoSdkInstalled: true,
            accessToken: !!process.env.EXPO_ACCESS_TOKEN,
        };
    }
}
// Export singleton instance
exports.default = PushNotificationService.getInstance();
//# sourceMappingURL=pushNotificationService.js.map