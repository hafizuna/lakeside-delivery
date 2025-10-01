import { useState, useEffect, useRef } from 'react';
import { getUpdatedGracePeriodStatus, GracePeriodStatus } from '../utils/gracePeriodUtils';

/**
 * Custom hook for managing real-time grace period countdown
 * Updates every second during the grace period and stops when expired
 */
export const useGracePeriodCountdown = (orderCreatedAt: string, orderStatus: string) => {
  const [gracePeriodInfo, setGracePeriodInfo] = useState(() => 
    getUpdatedGracePeriodStatus(orderCreatedAt, orderStatus)
  );
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Update immediately
    const updateGracePeriodInfo = () => {
      const newInfo = getUpdatedGracePeriodStatus(orderCreatedAt, orderStatus);
      setGracePeriodInfo(newInfo);
      
      // Stop interval if grace period is over or order is no longer pending
      if (!newInfo.isInGracePeriod || orderStatus !== 'PENDING') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    // Update immediately
    updateGracePeriodInfo();

    // Set up interval only if we're in grace period and order is pending
    const currentInfo = getUpdatedGracePeriodStatus(orderCreatedAt, orderStatus);
    if (currentInfo.isInGracePeriod && orderStatus === 'PENDING') {
      intervalRef.current = setInterval(updateGracePeriodInfo, 1000); // Update every second
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [orderCreatedAt, orderStatus]);

  return gracePeriodInfo;
};

/**
 * Hook specifically for managing grace period status of multiple orders
 * Useful for order lists where multiple orders might be in grace period
 */
export const useOrdersGracePeriodStatus = (orders: Array<{ id: number; createdAt: string; status: string; acceptedAt?: string | null }>) => {
  const [ordersGracePeriodStatus, setOrdersGracePeriodStatus] = useState<Record<number, any>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateAllOrdersStatus = () => {
      const newStatus: Record<number, any> = {};
      let hasActiveGracePeriods = false;

      orders.forEach(order => {
        const gracePeriodInfo = getUpdatedGracePeriodStatus(order.createdAt, order.status);
        newStatus[order.id] = gracePeriodInfo;
        
        
        if (gracePeriodInfo.isInGracePeriod && order.status === 'PENDING') {
          hasActiveGracePeriods = true;
        }
      });

      setOrdersGracePeriodStatus(newStatus);

      // Clear interval if no orders have active grace periods
      if (!hasActiveGracePeriods && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    // Update immediately
    updateAllOrdersStatus();

    // Set up interval if any orders are in grace period
    const hasActiveGracePeriods = orders.some(order => {
      const info = getUpdatedGracePeriodStatus(order.createdAt, order.status);
      return info.isInGracePeriod && order.status === 'PENDING';
    });

    if (hasActiveGracePeriods) {
      intervalRef.current = setInterval(updateAllOrdersStatus, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [orders.length]); // Only depend on orders.length to prevent infinite re-renders

  return ordersGracePeriodStatus;
};

/**
 * Simple hook to check if restaurant actions should be disabled for an order
 */
export const useRestaurantActionsDisabled = (orderCreatedAt: string, orderStatus: string, orderAcceptedAt?: string | null) => {
  const gracePeriodInfo = useGracePeriodCountdown(orderCreatedAt, orderStatus);
  
  return {
    actionsDisabled: gracePeriodInfo.shouldDisableActions,
    gracePeriodInfo,
    isInGracePeriod: gracePeriodInfo.isInGracePeriod,
    remainingTime: gracePeriodInfo.formattedTime
  };
};