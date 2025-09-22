import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData extends Record<string, unknown> {
  orderId?: string;
  transactionId?: string;
  type: 'order' | 'wallet' | 'promotional' | 'system';
  action?: string;
}

export interface NotificationSettings {
  orderUpdates: boolean;
  walletTransactions: boolean;
  promotionalOffers: boolean;
  systemNotifications: boolean;
}

export interface OrderNotificationData {
  orderId: string;
  restaurantName: string;
  orderStatus: string;
  estimatedTime?: string;
  driverName?: string;
}

export interface WalletNotificationData {
  transactionId: string;
  amount: number;
  type: 'topup' | 'payment' | 'refund';
  status: 'approved' | 'rejected' | 'processed';
}

class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;
  private notificationSettings: NotificationSettings = {
    orderUpdates: true,
    walletTransactions: true,
    promotionalOffers: true,
    systemNotifications: true,
  };

  // Notification throttling to prevent spam
  private lastNotificationTimes: Map<string, number> = new Map();
  private readonly MIN_NOTIFICATION_INTERVAL = 10000; // 10 seconds between similar notifications

  private readonly STORAGE_KEYS = {
    PUSH_TOKEN: 'expo_push_token',
    NOTIFICATION_SETTINGS: 'notification_settings',
  };

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service - call this on app startup
   */
  async initialize(): Promise<void> {
    try {
      // Load saved settings
      await this.loadSettings();
      
      // Request permissions and get token
      await this.registerForPushNotificationsAsync();
      
      // Set up notification listeners
      this.setupNotificationListeners();
      
      console.log('NotificationService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NotificationService:', error);
    }
  }

  /**
   * Request notification permissions and get push token
   */
  async registerForPushNotificationsAsync(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Must use physical device for Push Notifications');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Notification Permission Required',
          'Please enable notifications in settings to receive order updates and important information.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Notifications.requestPermissionsAsync() }
          ]
        );
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      this.expoPushToken = token;
      
      // Save token for future use
      await AsyncStorage.setItem(this.STORAGE_KEYS.PUSH_TOKEN, token);
      
      console.log('Push token obtained:', token);
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Set up notification event listeners
   */
  private setupNotificationListeners(): void {
    // Handle notification received while app is foregrounded
    Notifications.addNotificationReceivedListener(this.handleNotificationReceived);

    // Handle notification response (when user taps notification)
    Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse);
  }

  /**
   * Handle notification received while app is open
   */
  private handleNotificationReceived = (notification: Notifications.Notification) => {
    console.log('Notification received:', notification);
    
    // You can add custom logic here for handling notifications while app is open
    // For example, show an in-app notification banner
  };

  /**
   * Handle notification tap/response
   */
  private handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as unknown as NotificationData;
    console.log('Notification response:', data);

    // Navigate based on notification type
    this.handleNotificationNavigation(data);
  };

  /**
   * Handle navigation when notification is tapped
   */
  private handleNotificationNavigation(data: NotificationData): void {
    // This would typically use a navigation service
    // For now, we'll just log the intended navigation
    switch (data.type) {
      case 'order':
        console.log('Navigate to order details:', data.orderId);
        // NavigationService.navigate('OrderDetail', { orderId: data.orderId });
        break;
      case 'wallet':
        console.log('Navigate to wallet/transactions');
        // NavigationService.navigate('Wallet');
        break;
      case 'promotional':
        console.log('Navigate to promotions/home');
        // NavigationService.navigate('Home');
        break;
      default:
        console.log('No specific navigation for notification type:', data.type);
    }
  }

  /**
   * Send order status notification
   */
  async sendOrderNotification(orderData: OrderNotificationData): Promise<void> {
    if (!this.notificationSettings.orderUpdates) {
      console.log('Order notifications disabled');
      return;
    }

    const { title, body, icon } = this.getOrderNotificationContent(orderData);
    
    await this.scheduleNotification({
      title,
      body,
      data: {
        orderId: orderData.orderId,
        type: 'order',
        action: 'view_order'
      } as NotificationData,
      icon,
    });
  }

  /**
   * Generate order notification content based on status
   */
  private getOrderNotificationContent(orderData: OrderNotificationData): {
    title: string;
    body: string;
    icon: string;
  } {
    const { restaurantName, orderStatus, estimatedTime, driverName } = orderData;

    switch (orderStatus.toLowerCase()) {
      case 'pending':
        return {
          title: 'Order Placed Successfully! 🎉',
          body: `Your order from ${restaurantName} has been placed and is waiting for confirmation.`,
          icon: '📋'
        };

      case 'accepted':
      case 'confirmed':
        return {
          title: 'Order Confirmed! ✅',
          body: `${restaurantName} has confirmed your order${estimatedTime ? ` and will have it ready in ${estimatedTime}` : ''}.`,
          icon: '✅'
        };

      case 'preparing':
        return {
          title: 'Cooking Started! 👨‍🍳',
          body: `${restaurantName} is now preparing your delicious meal${estimatedTime ? `. Estimated time: ${estimatedTime}` : ''}.`,
          icon: '👨‍🍳'
        };

      case 'ready':
        return {
          title: 'Order Ready! 🔥',
          body: `Your order from ${restaurantName} is ready${driverName ? ` and ${driverName} will pick it up soon` : ' for pickup'}!`,
          icon: '🔥'
        };

      case 'picked_up':
        return {
          title: 'Order Picked Up! 🛵',
          body: `${driverName || 'Your driver'} has picked up your order from ${restaurantName} and is on the way to you!`,
          icon: '🛵'
        };

      case 'delivering':
        return {
          title: 'On the Way! 🚚',
          body: `${driverName || 'Your driver'} is delivering your order${estimatedTime ? `. Expected delivery: ${estimatedTime}` : ''}. Get ready!`,
          icon: '🚚'
        };

      case 'delivered':
        return {
          title: 'Order Delivered! 🎉',
          body: `Your order from ${restaurantName} has been delivered. Enjoy your meal and don't forget to rate your experience!`,
          icon: '🎉'
        };

      case 'cancelled':
        return {
          title: 'Order Cancelled 😔',
          body: `Your order from ${restaurantName} has been cancelled. Any payment will be refunded to your wallet.`,
          icon: '😔'
        };

      default:
        return {
          title: 'Order Update',
          body: `Your order from ${restaurantName} status has been updated.`,
          icon: '📱'
        };
    }
  }

  /**
   * Send wallet transaction notification
   */
  async sendWalletNotification(walletData: WalletNotificationData): Promise<void> {
    if (!this.notificationSettings.walletTransactions) {
      console.log('Wallet notifications disabled');
      return;
    }

    const { title, body, icon } = this.getWalletNotificationContent(walletData);

    await this.scheduleNotification({
      title,
      body,
      data: {
        transactionId: walletData.transactionId,
        type: 'wallet',
        action: 'view_wallet'
      } as NotificationData,
      icon,
    });
  }

  /**
   * Generate wallet notification content
   */
  private getWalletNotificationContent(walletData: WalletNotificationData): {
    title: string;
    body: string;
    icon: string;
  } {
    const { amount, type, status } = walletData;

    if (type === 'topup') {
      switch (status) {
        case 'approved':
          return {
            title: 'Top-up Approved! 💰',
            body: `Your wallet has been credited with ₹${amount.toFixed(2)}. Happy ordering!`,
            icon: '💰'
          };
        case 'rejected':
          return {
            title: 'Top-up Rejected 😔',
            body: `Your top-up request of ₹${amount.toFixed(2)} was rejected. Please contact support if you need help.`,
            icon: '😔'
          };
        default:
          return {
            title: 'Top-up Processing ⏳',
            body: `Your top-up request of ₹${amount.toFixed(2)} is being processed.`,
            icon: '⏳'
          };
      }
    } else if (type === 'payment') {
      return {
        title: 'Payment Processed! ✅',
        body: `₹${amount.toFixed(2)} has been deducted from your wallet for your order.`,
        icon: '✅'
      };
    } else if (type === 'refund') {
      return {
        title: 'Refund Processed! 💸',
        body: `₹${amount.toFixed(2)} has been refunded to your wallet.`,
        icon: '💸'
      };
    }

    return {
      title: 'Wallet Update',
      body: `Your wallet transaction of ₹${amount.toFixed(2)} has been processed.`,
      icon: '💳'
    };
  }

  /**
   * Send promotional notification
   */
  async sendPromotionalNotification(title: string, body: string, imageUrl?: string): Promise<void> {
    if (!this.notificationSettings.promotionalOffers) {
      console.log('Promotional notifications disabled');
      return;
    }

    await this.scheduleNotification({
      title: `🎉 ${title}`,
      body,
      data: {
        type: 'promotional',
        action: 'view_offers'
      } as NotificationData,
      icon: '🎉',
    });
  }

  /**
   * Check if notification should be throttled
   */
  private shouldThrottleNotification(notificationKey: string): boolean {
    const now = Date.now();
    const lastTime = this.lastNotificationTimes.get(notificationKey);
    
    if (lastTime && (now - lastTime) < this.MIN_NOTIFICATION_INTERVAL) {
      console.log(`Throttling notification: ${notificationKey}`);
      return true;
    }
    
    this.lastNotificationTimes.set(notificationKey, now);
    return false;
  }

  /**
   * Schedule a local notification with throttling
   */
  private async scheduleNotification(notification: {
    title: string;
    body: string;
    data: NotificationData;
    icon?: string;
  }): Promise<void> {
    try {
      // Create throttling key based on type and relevant data
      const throttleKey = `${notification.data.type}-${notification.data.orderId || notification.data.transactionId || 'general'}`;
      
      // Check if notification should be throttled
      if (this.shouldThrottleNotification(throttleKey)) {
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: 'default',
        },
        trigger: null, // Show immediately
      });

      console.log('Notification scheduled:', notification.title);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
    this.notificationSettings = { ...this.notificationSettings, ...settings };
    await AsyncStorage.setItem(
      this.STORAGE_KEYS.NOTIFICATION_SETTINGS,
      JSON.stringify(this.notificationSettings)
    );
    console.log('Notification settings updated:', this.notificationSettings);
  }

  /**
   * Get current notification settings
   */
  getNotificationSettings(): NotificationSettings {
    return { ...this.notificationSettings };
  }

  /**
   * Load saved settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const savedSettings = await AsyncStorage.getItem(this.STORAGE_KEYS.NOTIFICATION_SETTINGS);
      if (savedSettings) {
        this.notificationSettings = { ...this.notificationSettings, ...JSON.parse(savedSettings) };
      }

      const savedToken = await AsyncStorage.getItem(this.STORAGE_KEYS.PUSH_TOKEN);
      if (savedToken) {
        this.expoPushToken = savedToken;
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  /**
   * Get current push token
   */
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Test notification (for debugging)
   */
  async sendTestNotification(): Promise<void> {
    await this.scheduleNotification({
      title: 'Test Notification 🧪',
      body: 'This is a test notification from Lakeside Delivery!',
      data: {
        type: 'system',
        action: 'test'
      } as NotificationData,
      icon: '🧪',
    });
  }

  /**
   * Get notification statistics for debugging
   */
  getNotificationStats(): {
    tokenExists: boolean;
    permissionsGranted: boolean;
    settings: NotificationSettings;
  } {
    return {
      tokenExists: !!this.expoPushToken,
      permissionsGranted: !!this.expoPushToken, // Simplified check
      settings: this.getNotificationSettings()
    };
  }

  /**
   * Validate notification configuration
   */
  async validateConfiguration(): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Check device compatibility
    if (!Device.isDevice) {
      issues.push('Must use physical device for push notifications');
    }

    // Check permissions
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        issues.push('Notification permissions not granted');
      }
    } catch (error) {
      issues.push('Could not check notification permissions');
    }

    // Check push token
    if (!this.expoPushToken) {
      issues.push('Push token not available');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
    console.log('All notifications cleared');
  }

  /**
   * Cancel scheduled notifications
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All scheduled notifications cancelled');
  }
}

export default NotificationService.getInstance();
