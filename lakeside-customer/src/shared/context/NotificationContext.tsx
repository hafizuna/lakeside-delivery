import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { Order, OrderStatus } from '../types/Order';
import NotificationService, { 
  NotificationSettings, 
  OrderNotificationData, 
  WalletNotificationData 
} from '../services/notificationService';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order_update' | 'promotion' | 'general';
  orderId?: number;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  // In-app notifications
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  handleOrderStatusChange: (order: Order, previousStatus?: OrderStatus) => void;
  handleWalletTransactionChange: (transaction: any) => Promise<void>;
  checkAndNotifyLowBalance: (balance: number) => Promise<void>;
  
  // Push notifications
  pushNotificationSettings: NotificationSettings;
  updatePushNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  sendOrderNotification: (orderData: OrderNotificationData) => Promise<void>;
  sendWalletNotification: (walletData: WalletNotificationData) => Promise<void>;
  sendTestNotification: () => Promise<void>;
  getPushToken: () => string | null;
  isNotificationServiceReady: boolean;
  
  // Debug functions
  testOrderStatusNotification: (status: OrderStatus) => Promise<void>;
  getNotificationStats: () => any;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationServiceReady, setIsNotificationServiceReady] = useState(false);
  const [pushNotificationSettings, setPushNotificationSettings] = useState<NotificationSettings>({
    orderUpdates: true,
    walletTransactions: true,
    promotionalOffers: true,
    systemNotifications: true,
  });

  // Initialize push notification service
  useEffect(() => {
    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    try {
      console.log('🔔 Initializing push notifications...');
      await NotificationService.initialize();
      const currentSettings = NotificationService.getNotificationSettings();
      setPushNotificationSettings(currentSettings);
      setIsNotificationServiceReady(true);
      
      // Validate configuration
      const validation = await NotificationService.validateConfiguration();
      console.log('🔔 Push notification validation:', validation);
      
      if (!validation.isValid) {
        console.warn('🔔 Push notification issues found:', validation.issues);
      }
      
      console.log('🔔 Push notification service initialized successfully', {
        settings: currentSettings,
        token: NotificationService.getPushToken()?.slice(0, 20) + '...',
        isValid: validation.isValid
      });
    } catch (error) {
      console.error('🔔 Failed to initialize push notification service:', error);
      setIsNotificationServiceReady(false);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show alert for important order updates
    if (notification.type === 'order_update') {
      Alert.alert(notification.title, notification.message);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Push notification methods
  const updatePushNotificationSettings = async (settings: Partial<NotificationSettings>) => {
    try {
      await NotificationService.updateNotificationSettings(settings);
      const updatedSettings = NotificationService.getNotificationSettings();
      setPushNotificationSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update push notification settings:', error);
    }
  };

  const sendOrderNotification = async (orderData: OrderNotificationData) => {
    try {
      await NotificationService.sendOrderNotification(orderData);
    } catch (error) {
      console.error('Failed to send order notification:', error);
    }
  };

  const sendWalletNotification = async (walletData: WalletNotificationData) => {
    try {
      await NotificationService.sendWalletNotification(walletData);
    } catch (error) {
      console.error('Failed to send wallet notification:', error);
    }
  };

  const sendTestNotification = async () => {
    try {
      await NotificationService.sendTestNotification();
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  const getPushToken = () => {
    return NotificationService.getPushToken();
  };

  const getStatusMessage = (status: OrderStatus): { title: string; message: string } => {
    switch (status) {
      case OrderStatus.ACCEPTED:
        return {
          title: 'Order Confirmed! 🎉',
          message: 'Your order has been confirmed by the restaurant and will be prepared soon.'
        };
      case OrderStatus.PREPARING:
        return {
          title: 'Order Being Prepared 👨‍🍳',
          message: 'The kitchen is now preparing your delicious meal!'
        };
      case OrderStatus.PICKED_UP:
        return {
          title: 'Order Picked Up 🚗',
          message: 'Your order has been picked up by the delivery driver.'
        };
      case OrderStatus.DELIVERING:
        return {
          title: 'On the Way! 🛵',
          message: 'Your order is on its way to you. Get ready to enjoy!'
        };
      case OrderStatus.DELIVERED:
        return {
          title: 'Order Delivered! ✅',
          message: 'Your order has been delivered successfully. Enjoy your meal!'
        };
      case OrderStatus.CANCELLED:
        return {
          title: 'Order Cancelled ❌',
          message: 'Your order has been cancelled. Any payment will be refunded.'
        };
      default:
        return {
          title: 'Order Update',
          message: 'Your order status has been updated.'
        };
    }
  };

  // Handle wallet transaction notifications
  const handleWalletTransactionChange = async (transaction: any) => {
    if (!isNotificationServiceReady || !pushNotificationSettings.walletTransactions) {
      return;
    }

    let notificationData = null;
    let inAppNotification = null;

    switch (transaction.type) {
      case 'CUSTOMER_TOPUP':
        if (transaction.status === 'APPROVED') {
          notificationData = {
            transactionId: transaction.id.toString(),
            amount: parseFloat(transaction.amount),
            type: 'topup' as const,
            status: 'approved' as const
          };
          inAppNotification = {
            title: 'Top-up Approved! 💰',
            message: `Your wallet has been credited with ₹${parseFloat(transaction.amount).toFixed(2)}`,
            type: 'general' as const
          };
        } else if (transaction.status === 'REJECTED') {
          notificationData = {
            transactionId: transaction.id.toString(),
            amount: parseFloat(transaction.amount),
            type: 'topup' as const,
            status: 'rejected' as const
          };
          inAppNotification = {
            title: 'Top-up Rejected 😔',
            message: `Your top-up request of ₹${parseFloat(transaction.amount).toFixed(2)} was rejected`,
            type: 'general' as const
          };
        }
        break;

      case 'CUSTOMER_ORDER_PAYMENT':
        notificationData = {
          transactionId: transaction.id.toString(),
          amount: Math.abs(parseFloat(transaction.amount)),
          type: 'payment' as const,
          status: 'processed' as const
        };
        inAppNotification = {
          title: 'Payment Processed ✅',
          message: `₹${Math.abs(parseFloat(transaction.amount)).toFixed(2)} deducted from your wallet`,
          type: 'general' as const
        };
        break;

      case 'CUSTOMER_REFUND':
        notificationData = {
          transactionId: transaction.id.toString(),
          amount: parseFloat(transaction.amount),
          type: 'refund' as const,
          status: 'processed' as const
        };
        inAppNotification = {
          title: 'Refund Processed! 💸',
          message: `₹${parseFloat(transaction.amount).toFixed(2)} has been refunded to your wallet`,
          type: 'general' as const
        };
        break;
    }

    if (notificationData && inAppNotification) {
      try {
        // Send push notification
        await sendWalletNotification(notificationData);
        
        // Add in-app notification
        addNotification(inAppNotification);
      } catch (error) {
        console.error('Failed to send wallet notification:', error);
      }
    }
  };

  // Handle low balance alerts
  const checkAndNotifyLowBalance = async (balance: number) => {
    const LOW_BALANCE_THRESHOLD = 50; // ₹50
    
    if (balance > 0 && balance <= LOW_BALANCE_THRESHOLD && 
        isNotificationServiceReady && pushNotificationSettings.walletTransactions) {
      try {
        const inAppNotification = {
          title: 'Low Wallet Balance ⚠️',
          message: `Your wallet balance is ₹${balance.toFixed(2)}. Consider topping up to avoid order interruptions.`,
          type: 'general' as const
        };
        
        addNotification(inAppNotification);
        
        // Also send as promotional notification to get attention
        await NotificationService.sendPromotionalNotification(
          'Low Balance Alert',
          `Your wallet has only ₹${balance.toFixed(2)} left. Top up now to keep ordering!`
        );
      } catch (error) {
        console.error('Failed to send low balance notification:', error);
      }
    }
  };

  const handleOrderStatusChange = async (order: Order, previousStatus?: OrderStatus) => {
    console.log('🔔 handleOrderStatusChange called:', {
      orderId: order.id,
      previousStatus,
      newStatus: order.status,
      isServiceReady: isNotificationServiceReady,
      orderUpdatesEnabled: pushNotificationSettings.orderUpdates
    });

    // Don't notify for initial status or same status
    if (!previousStatus || previousStatus === order.status) {
      console.log('🔔 Skipping notification - no status change');
      return;
    }

    // Only notify for meaningful status changes
    const notifiableStatuses = [
      OrderStatus.ACCEPTED,
      OrderStatus.PREPARING,
      OrderStatus.PICKED_UP,
      OrderStatus.DELIVERING,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED
    ];

    if (notifiableStatuses.includes(order.status)) {
      console.log('🔔 Processing notification for status:', order.status);
      const { title, message } = getStatusMessage(order.status);
      
      // Add in-app notification
      addNotification({
        title,
        message: `Order #${order.id}: ${message}`,
        type: 'order_update',
        orderId: order.id
      });
      console.log('🔔 In-app notification added');

      // Send push notification if service is ready
      if (isNotificationServiceReady && pushNotificationSettings.orderUpdates) {
        try {
          console.log('🔔 Sending push notification...');
          await sendOrderNotification({
            orderId: order.id.toString(),
            restaurantName: order.restaurant?.name || 'Restaurant',
            orderStatus: order.status,
            estimatedTime: order.estimatedDeliveryTime ?
              new Date(Date.now() + order.estimatedDeliveryTime * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
              'Calculating...'
          });
          console.log('🔔 Push notification sent successfully');
        } catch (error) {
          console.error('🔔 Failed to send push notification for order status change:', error);
        }
      } else {
        console.log('🔔 Push notification skipped:', {
          serviceReady: isNotificationServiceReady,
          settingEnabled: pushNotificationSettings.orderUpdates
        });
      }
    } else {
      console.log('🔔 Status not in notifiable list:', order.status);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Debug functions
  const testOrderStatusNotification = async (status: OrderStatus) => {
    console.log('🔔 Testing order status notification:', status);
    const mockOrder: Order = {
      id: 999,
      status,
      restaurant: { id: 1, name: 'Test Restaurant' },
      estimatedDelivery: new Date(Date.now() + 30 * 60000).toISOString(), // 30 minutes from now
    } as any;
    
    await handleOrderStatusChange(mockOrder, OrderStatus.PENDING);
  };
  
  const getNotificationStats = () => {
    return {
      notificationService: NotificationService.getNotificationStats(),
      inAppNotifications: {
        total: notifications.length,
        unread: unreadCount
      },
      settings: pushNotificationSettings,
      isServiceReady: isNotificationServiceReady
    };
  };

  const value: NotificationContextType = {
    // In-app notifications
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    handleOrderStatusChange,
    handleWalletTransactionChange,
    checkAndNotifyLowBalance,
    
    // Push notifications
    pushNotificationSettings,
    updatePushNotificationSettings,
    sendOrderNotification,
    sendWalletNotification,
    sendTestNotification,
    getPushToken,
    isNotificationServiceReady,
    
    // Debug functions
    testOrderStatusNotification,
    getNotificationStats,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
