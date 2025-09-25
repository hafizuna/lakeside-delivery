import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';
import { PrismaClient } from '@prisma/client';
import socketService from './socketService';

const prisma = new PrismaClient();

class PushNotificationService {
  private static instance: PushNotificationService;
  private expo: Expo;

  private constructor() {
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN, // Optional: for better rate limits
    });
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Send push notification to user if they're not connected via socket
   */
  public async sendNotificationToUser(
    userId: number,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Check if user is connected via socket (real-time)
      const isUserConnectedViaSocket = socketService.isUserConnected(userId);
      
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

    } catch (error) {
      console.error('Error sending notification to user:', error);
      return false;
    }
  }

  /**
   * Send order status update push notification
   */
  public async sendOrderUpdateNotification(
    customerId: number,
    orderId: number,
    orderStatus: string,
    restaurantName: string,
    estimatedTime?: string
  ): Promise<boolean> {
    const { title, body } = this.getOrderNotificationContent(orderStatus, restaurantName, estimatedTime);
    
    return await this.sendNotificationToUser(
      customerId,
      title,
      body,
      {
        type: 'order_update',
        orderId: orderId.toString(),
        orderStatus,
      }
    );
  }

  /**
   * Send order cancellation push notification
   */
  public async sendOrderCancellationNotification(
    customerId: number,
    orderId: number,
    reason: string,
    refundAmount?: number
  ): Promise<boolean> {
    const title = 'Order Cancelled 😔';
    const body = `Order #${orderId} has been cancelled. ${reason}${refundAmount ? ` Refund: ₹${refundAmount}` : ''}`;
    
    return await this.sendNotificationToUser(
      customerId,
      title,
      body,
      {
        type: 'order_cancelled',
        orderId: orderId.toString(),
        reason,
        refundAmount,
      }
    );
  }

  /**
   * Send individual push notification
   */
  private async sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Check that the push token is valid
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Invalid push token: ${pushToken}`);
        return false;
      }

      const message: ExpoPushMessage = {
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

    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Get user's push token from database
   * Note: You'll need to create a table to store user push tokens
   */
  private async getUserPushToken(userId: number): Promise<string | null> {
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

    } catch (error) {
      console.error('Error getting user push token:', error);
      return null;
    }
  }

  /**
   * Remove invalid push token from database
   */
  private async removeInvalidPushToken(pushToken: string): Promise<void> {
    try {
      console.log(`🗑️ Removing invalid push token: ${pushToken.slice(0, 10)}...`);
      // TODO: Remove from database when push token storage is implemented
    } catch (error) {
      console.error('Error removing invalid push token:', error);
    }
  }

  /**
   * Generate notification content based on order status
   */
  private getOrderNotificationContent(
    orderStatus: string,
    restaurantName: string,
    estimatedTime?: string
  ): { title: string; body: string } {
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
  public async testPushNotification(pushToken: string): Promise<boolean> {
    return await this.sendPushNotification(
      pushToken,
      'Test Notification 🧪',
      'This is a test notification from Lakeside Delivery backend!',
      { type: 'test' }
    );
  }

  /**
   * Get service statistics
   */
  public getStats() {
    return {
      expoSdkInstalled: true,
      accessToken: !!process.env.EXPO_ACCESS_TOKEN,
    };
  }
}

// Export singleton instance
export default PushNotificationService.getInstance();
