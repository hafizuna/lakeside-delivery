import { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus } from '../../../shared/types/Order';
import { orderAPI } from '../../../shared/services/api';
import { useNotifications } from '../../../shared/context/NotificationContext';
import socketService from '../../../shared/services/socketService';
import { OrderStatusUpdateData } from '../../../shared/types/socket';

interface UseOrderUpdatesProps {
  orderId?: number;
  enabled?: boolean;
  enableRealTime?: boolean; // New option to enable real-time updates
  fallbackPollingInterval?: number; // Fallback polling if socket fails
}

interface OrderUpdateHook {
  order: Order | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useOrderUpdates = ({
  orderId,
  enabled = true,
  enableRealTime = true,
  fallbackPollingInterval = 30000 // 30 seconds - only used as fallback
}: UseOrderUpdatesProps): OrderUpdateHook => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const previousStatusRef = useRef<OrderStatus | undefined>(undefined);
  const socketListenerRef = useRef<(() => void) | null>(null);
  const { handleOrderStatusChange, socketConnectionState } = useNotifications();

  const fetchOrder = async () => {
    if (!orderId || !enabled) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await orderAPI.getOrderById(orderId);
      
      if (response.success && mountedRef.current) {
        const newOrder = response.data;
        const previousStatus = previousStatusRef.current;
        
        // Check for status changes and trigger notifications
        // Only trigger notification if status actually changed and it's not a socket-triggered fetch
        if (previousStatus && previousStatus !== newOrder.status) {
          console.log('📊 API polling detected status change:', { from: previousStatus, to: newOrder.status });
          handleOrderStatusChange(newOrder, previousStatus);
        }
        
        setOrder(newOrder);
        previousStatusRef.current = newOrder.status;
      }
    } catch (err) {
      if (mountedRef.current) {
        setError('Failed to fetch order updates');
        console.error('Order fetch error:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const refetch = async () => {
    await fetchOrder();
  };

  useEffect(() => {
    mountedRef.current = true;
    
    if (!orderId || !enabled) {
      return;
    }

    // Initial fetch
    fetchOrder();

    return () => {
      mountedRef.current = false;
    };
  }, [orderId, enabled]);

  // Socket-based real-time updates
  useEffect(() => {
    if (!orderId || !enabled || !enableRealTime) {
      return;
    }

    console.log('🔌 Setting up socket listener for order:', orderId);
    
    // Set up socket listener for order updates
    const unsubscribeOrderUpdate = socketService.onOrderUpdate((data: OrderStatusUpdateData) => {
      if (data.orderId === orderId && mountedRef.current) {
        console.log('📦 Socket order update received for order:', orderId, data);
        
        // Update order data in real-time
        setOrder(prevOrder => {
          if (prevOrder) {
            const updatedOrder = {
              ...prevOrder,
              status: data.status,
              updatedAt: data.timestamp
            };
            
            // Trigger notification for status change
            if (previousStatusRef.current && previousStatusRef.current !== data.status) {
              console.log('🔔 Socket detected status change:', { from: previousStatusRef.current, to: data.status });
              handleOrderStatusChange(updatedOrder, previousStatusRef.current);
            }
            previousStatusRef.current = data.status;
            
            return updatedOrder;
          }
          return prevOrder;
        });
      }
    });

    // Join order room for real-time updates
    socketService.joinOrder(orderId);
    socketListenerRef.current = unsubscribeOrderUpdate;

    return () => {
      console.log('🔌 Cleaning up socket listener for order:', orderId);
      if (socketListenerRef.current) {
        socketListenerRef.current();
        socketListenerRef.current = null;
      }
      socketService.leaveOrder(orderId);
    };
  }, [orderId, enabled, enableRealTime]);

  // Fallback polling when socket is not available or fails
  useEffect(() => {
    if (!orderId || !enabled || !order) {
      return;
    }

    // Only use polling as fallback when:
    // 1. Real-time is disabled, OR
    // 2. Socket is not connected/authenticated, OR 
    // 3. Order is in active status that needs updates
    const shouldUseFallbackPolling = (
      !enableRealTime || 
      socketConnectionState !== 'AUTHENTICATED'
    ) && shouldPollForActiveOrder(order);

    if (!shouldUseFallbackPolling) {
      // Clear any existing polling
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log('📊 Starting fallback polling for order:', orderId, {
      realTimeEnabled: enableRealTime,
      socketState: socketConnectionState,
      orderStatus: order.status
    });

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      console.log('📊 Fallback polling for order updates...');
      fetchOrder();
    }, fallbackPollingInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [order?.status, orderId, enabled, enableRealTime, socketConnectionState, fallbackPollingInterval]);

  // Helper function to determine if order needs polling
  const shouldPollForActiveOrder = (currentOrder: Order | null) => {
    if (!currentOrder) return false;
    
    const activeStatuses = [
      OrderStatus.PENDING,
      OrderStatus.ACCEPTED,
      OrderStatus.PREPARING,
      OrderStatus.PICKED_UP,
      OrderStatus.DELIVERING
    ];
    
    return activeStatuses.includes(currentOrder.status);
  };

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    order,
    loading,
    error,
    refetch
  };
};

export default useOrderUpdates;
