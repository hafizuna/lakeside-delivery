import { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus } from '../../../shared/types/Order';
import { orderAPI } from '../../../shared/services/api';
import { useNotifications } from '../../../shared/context/NotificationContext';

interface UseOrderUpdatesProps {
  orderId?: number;
  enabled?: boolean;
  pollingInterval?: number;
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
  pollingInterval = 30000 // 30 seconds
}: UseOrderUpdatesProps): OrderUpdateHook => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const previousStatusRef = useRef<OrderStatus | undefined>(undefined);
  const { handleOrderStatusChange } = useNotifications();

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
        if (previousStatus && previousStatus !== newOrder.status) {
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
  }, [orderId, enabled]); // Remove fetchOrder from dependencies to avoid recreation

  // Separate useEffect for polling
  useEffect(() => {
    if (!orderId || !enabled || !order) {
      return;
    }

    const shouldPoll = (currentOrder: Order | null) => {
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

    const startPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      if (shouldPoll(order)) {
        console.log('Starting polling for order status:', order.status);
        intervalRef.current = setInterval(() => {
          console.log('Polling for order updates...');
          fetchOrder();
        }, pollingInterval);
      } else {
        console.log('Order status does not require polling:', order.status);
      }
    };

    // Start polling after a short delay
    const timer = setTimeout(startPolling, 1000);

    return () => {
      clearTimeout(timer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [order?.status, pollingInterval, orderId, enabled]); // Include order status as dependency

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
