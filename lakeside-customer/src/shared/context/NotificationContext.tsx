import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { Order, OrderStatus } from '../types/Order';

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
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  handleOrderStatusChange: (order: Order, previousStatus?: OrderStatus) => void;
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

  const handleOrderStatusChange = (order: Order, previousStatus?: OrderStatus) => {
    // Don't notify for initial status or same status
    if (!previousStatus || previousStatus === order.status) {
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
      const { title, message } = getStatusMessage(order.status);
      
      addNotification({
        title,
        message: `Order #${order.id}: ${message}`,
        type: 'order_update',
        orderId: order.id
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    handleOrderStatusChange,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
