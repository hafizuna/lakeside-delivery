import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../../../shared/services/api';
import { useAuth } from '../../auth/context/AuthContext';

interface OrderItem {
  id: number;
  menuId: number;
  quantity: number;
  price: number;
  menu: {
    itemName: string;
    imageUrl?: string;
  };
}

interface Order {
  id: number;
  customerId: number;
  totalPrice: number;
  deliveryFee: number;
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
  deliveryAddress: string;
  deliveryInstructions?: string;
  paymentMethod: 'CASH' | 'CARD' | 'WALLET' | 'UPI';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  preparingAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  estimatedDelivery?: string;
  customer: {
    name: string;
    phone: string;
  };
  orderItems: OrderItem[];
}

interface OrdersContextType {
  orders: Order[];
  loading: boolean;
  refreshing: boolean;
  loadOrders: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  acceptOrder: (orderId: number) => Promise<boolean>;
  updateOrderStatus: (orderId: number, status: string) => Promise<boolean>;
  getOrdersByStatus: (status: string) => Order[];
  getTodayStats: () => {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

interface OrdersProviderProps {
  children: ReactNode;
}

export const OrdersProvider: React.FC<OrdersProviderProps> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getOrders();
      
      if (response.success && response.data) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshOrders = async () => {
    try {
      setRefreshing(true);
      const response = await apiService.getOrders();
      
      if (response.success && response.data) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Error refreshing orders:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const acceptOrder = async (orderId: number): Promise<boolean> => {
    try {
      const response = await apiService.acceptOrder(orderId);
      
      if (response.success) {
        setOrders(prev => 
          prev.map(order => 
            order.id === orderId 
              ? { ...order, status: 'ACCEPTED', acceptedAt: new Date().toISOString() }
              : order
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error accepting order:', error);
      return false;
    }
  };

  const updateOrderStatus = async (orderId: number, status: string): Promise<boolean> => {
    try {
      const response = await apiService.updateOrderStatus(orderId, status);
      
      if (response.success) {
        setOrders(prev => 
          prev.map(order => 
            order.id === orderId 
              ? { ...order, status: status as Order['status'], updatedAt: new Date().toISOString() }
              : order
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  };

  const getOrdersByStatus = (status: string): Order[] => {
    return orders.filter(order => order.status === status);
  };

  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(order => 
      new Date(order.createdAt).toDateString() === today
    );

    const totalOrders = todayOrders.length;
    const totalRevenue = todayOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
    };
  };

  const value: OrdersContextType = {
    orders,
    loading,
    refreshing,
    loadOrders,
    refreshOrders,
    acceptOrder,
    updateOrderStatus,
    getOrdersByStatus,
    getTodayStats,
  };

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = (): OrdersContextType => {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
};
