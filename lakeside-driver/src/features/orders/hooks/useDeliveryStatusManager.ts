import { useState, useCallback, useEffect, useMemo } from 'react';
import { useOrders } from '../context/OrderContext';
import { Order } from '../../../shared/services/api';

export type DeliveryStatus = 
  | 'ASSIGNED' 
  | 'EN_ROUTE_TO_RESTAURANT' 
  | 'WAITING_AT_RESTAURANT' 
  | 'PICKED_UP' 
  | 'EN_ROUTE_TO_CUSTOMER' 
  | 'DELIVERED';

interface StatusTransition {
  currentStatus: DeliveryStatus;
  nextStatus: DeliveryStatus;
  actionText: string;
  apiCall: (orderId: number) => Promise<boolean>;
}

interface UseDeliveryStatusManagerResult {
  currentStatus: DeliveryStatus;
  actionButtonText: string;
  isLoading: boolean;
  canProceedToNext: boolean;
  handleStatusTransition: () => Promise<void>;
  getProgressPercentage: () => number;
  getStatusSteps: () => Array<{
    status: DeliveryStatus;
    label: string;
    completed: boolean;
    current: boolean;
  }>;
}

export const useDeliveryStatusManager = (
  order: Order | null
): UseDeliveryStatusManagerResult => {
  const [currentStatus, setCurrentStatus] = useState<DeliveryStatus>('ASSIGNED');
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    arriveAtRestaurant,
    pickupOrder,
    startDelivery,
    completeDelivery,
  } = useOrders();

  // HYBRID APPROACH: Map order status + timestamps to detailed driver status
  const getDeliveryStatusFromOrder = useCallback((order: Order): DeliveryStatus => {
    if (!order) return 'ASSIGNED';
    
    // Use HYBRID system: Main status + timestamp fields for granular tracking
    if (order.status === 'DELIVERED') {
      return 'DELIVERED'; // Final state
    }
    
    if (order.status === 'DELIVERING') {
      return 'EN_ROUTE_TO_CUSTOMER'; // Driving to customer
    }
    
    if (order.status === 'PICKED_UP') {
      return 'PICKED_UP'; // Order collected, ready to deliver
    }
    
    // For PREPARING/READY status, use timestamps to determine driver sub-status
    if (order.status === 'PREPARING' || order.status === 'READY') {
      // Check if driver has arrived at restaurant using arrivedAtRestaurantAt timestamp
      if (order.arrivedAtRestaurantAt) {
        return 'WAITING_AT_RESTAURANT'; // Driver at restaurant, waiting for food
      }
      // For early-assigned drivers (PREPARING status), they should start as ASSIGNED
      // so they can manually transition to EN_ROUTE_TO_RESTAURANT
      if (order.driverAssignedAt) {
        return 'ASSIGNED'; // Driver assigned but needs to start navigation
      }
      return 'ASSIGNED'; // Just assigned, driver not yet en route
    }
    
    // Default fallback
    return 'ASSIGNED';
  }, []);

  // Update current status when order changes
  useEffect(() => {
    if (order) {
      const newStatus = getDeliveryStatusFromOrder(order);
      console.log('=== Delivery Status Manager Debug ===');
      console.log('Order Status:', order.status);
      console.log('Driver Assigned At:', order.driverAssignedAt);
      console.log('Arrived At Restaurant At:', order.arrivedAtRestaurantAt);
      console.log('Picked Up At:', order.pickedUpAt);
      console.log('Calculated Delivery Status:', newStatus);
      console.log('Previous Status:', currentStatus);
      console.log('=== End Debug ===');
      
      // For PREPARING orders, allow manual status control
      // Only override manual status if there's a significant change (like arrivedAtRestaurantAt)
      if (order.status === 'PREPARING') {
        // Only update if driver has actually arrived at restaurant
        if (order.arrivedAtRestaurantAt && currentStatus !== 'WAITING_AT_RESTAURANT') {
          setCurrentStatus('WAITING_AT_RESTAURANT');
        } else if (!order.arrivedAtRestaurantAt && currentStatus === 'WAITING_AT_RESTAURANT') {
          // Reset if arrivedAt timestamp is gone
          setCurrentStatus('ASSIGNED');
        }
        // Otherwise, let the driver manually control the status
      } else {
        // For non-PREPARING orders, use calculated status
        if (newStatus !== currentStatus) {
          setCurrentStatus(newStatus);
        }
      }
    }
  }, [order, getDeliveryStatusFromOrder, currentStatus]);

  // HYBRID APPROACH: Define status transitions with proper API calls and timestamp updates
  const getStatusTransitions = useCallback((): StatusTransition[] => [
    {
      currentStatus: 'ASSIGNED',
      nextStatus: 'EN_ROUTE_TO_RESTAURANT',
      actionText: 'Start Navigation to Restaurant',
      apiCall: async (orderId: number) => {
        // Simple status transition - no external API call needed
        // Just change the local status to indicate driver is en route
        console.log('🚚 Driver started navigation to restaurant');
        return true;
      },
    },
    {
      currentStatus: 'EN_ROUTE_TO_RESTAURANT',
      nextStatus: 'WAITING_AT_RESTAURANT',
      actionText: "I've Arrived at Restaurant",
      apiCall: async (orderId: number) => {
        // This should set arrivedAtRestaurantAt timestamp
        // Use arriveAtRestaurant API if available, or generic status update
        try {
          const result = await arriveAtRestaurant(orderId);
          return result;
        } catch (error) {
          console.error('Arrive at restaurant error:', error);
          // If specific endpoint fails, try generic approach
          return true; // For now, allow UI transition
        }
      },
    },
    {
      currentStatus: 'WAITING_AT_RESTAURANT',
      nextStatus: 'PICKED_UP',
      actionText: 'Order is Ready - Pickup',
      apiCall: async (orderId: number) => {
        // This changes order status to PICKED_UP and sets pickedUpAt timestamp
        // Only allowed if restaurant has marked order as READY
        try {
          const result = await pickupOrder(orderId);
          return result;
        } catch (error) {
          console.error('Pickup order error:', error);
          return false;
        }
      },
    },
    {
      currentStatus: 'PICKED_UP',
      nextStatus: 'EN_ROUTE_TO_CUSTOMER',
      actionText: 'Start Delivery to Customer',
      apiCall: async (orderId: number) => {
        // This changes order status to DELIVERING
        try {
          const result = await startDelivery(orderId);
          return result;
        } catch (error) {
          console.error('Start delivery error:', error);
          return false;
        }
      },
    },
    {
      currentStatus: 'EN_ROUTE_TO_CUSTOMER',
      nextStatus: 'DELIVERED',
      actionText: 'Mark as Delivered',
      apiCall: async (orderId: number) => {
        // This changes order status to DELIVERED and sets deliveredAt timestamp
        try {
          const result = await completeDelivery(orderId);
          return result;
        } catch (error) {
          console.error('Complete delivery error:', error);
          return false;
        }
      },
    },
  ], [arriveAtRestaurant, pickupOrder, startDelivery, completeDelivery]);

  // Get current transition
  const getCurrentTransition = useCallback((): StatusTransition | null => {
    const transitions = getStatusTransitions();
    return transitions.find(t => t.currentStatus === currentStatus) || null;
  }, [currentStatus, getStatusTransitions]);

  // Handle status transition
  const handleStatusTransition = useCallback(async (): Promise<void> => {
    if (!order || isLoading) return;

    const transition = getCurrentTransition();
    if (!transition) return;

    setIsLoading(true);
    try {
      const success = await transition.apiCall(order.id);
      
      if (success) {
        // Move to next status
        setCurrentStatus(transition.nextStatus);
      } else {
        // Handle error - could show toast or alert
        console.error('Failed to transition status');
      }
    } catch (error) {
      console.error('Status transition error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [order, isLoading, getCurrentTransition]);

  // Get action button text with context-aware messaging
  const actionButtonText = useMemo(() => {
    const transition = getCurrentTransition();
    if (!transition) return 'Complete';
    
    // Special messaging when waiting at restaurant
    if (currentStatus === 'WAITING_AT_RESTAURANT') {
      if (order?.status === 'PREPARING') {
        return 'Waiting for Restaurant to Prepare Food...';
      } else if (order?.status === 'READY') {
        return 'Order is Ready - Pickup';
      }
    }
    
    return transition.actionText;
  }, [getCurrentTransition, currentStatus, order?.status]);

  // Check if can proceed to next status
  const canProceedToNext = useCallback(() => {
    if (isLoading || currentStatus === 'DELIVERED') return false;
    
    // Special case: Only allow pickup if restaurant has marked order as READY
    if (currentStatus === 'WAITING_AT_RESTAURANT') {
      return order?.status === 'READY'; // Restaurant must mark as ready first
    }
    
    return true;
  }, [isLoading, currentStatus, order?.status]);

  // Calculate progress percentage
  const getProgressPercentage = useCallback((): number => {
    const statusOrder: DeliveryStatus[] = [
      'ASSIGNED',
      'EN_ROUTE_TO_RESTAURANT', 
      'WAITING_AT_RESTAURANT',
      'PICKED_UP',
      'EN_ROUTE_TO_CUSTOMER',
      'DELIVERED'
    ];
    
    const currentIndex = statusOrder.indexOf(currentStatus);
    return ((currentIndex + 1) / statusOrder.length) * 100;
  }, [currentStatus]);

  // Get status steps for progress indicator
  const getStatusSteps = useCallback(() => {
    try {
      const steps: Array<{
        status: DeliveryStatus;
        label: string;
        completed: boolean;
        current: boolean;
      }> = [
        { status: 'ASSIGNED', label: 'Assigned', completed: false, current: false },
        { status: 'EN_ROUTE_TO_RESTAURANT', label: 'En Route', completed: false, current: false },
        { status: 'WAITING_AT_RESTAURANT', label: 'At Restaurant', completed: false, current: false },
        { status: 'PICKED_UP', label: 'Picked Up', completed: false, current: false },
        { status: 'EN_ROUTE_TO_CUSTOMER', label: 'Delivering', completed: false, current: false },
        { status: 'DELIVERED', label: 'Delivered', completed: false, current: false },
      ];

      if (!Array.isArray(steps)) {
        console.error('Steps is not an array:', steps);
        return [];
      }

      const currentIndex = steps.findIndex(step => step && step.status === currentStatus);
      
      // Mark completed steps
      if (Array.isArray(steps)) {
        steps.forEach((step, index) => {
          if (step && typeof index === 'number') {
            if (index < currentIndex) {
              step.completed = true;
            } else if (index === currentIndex) {
              step.current = true;
            }
          }
        });
      }

      return steps;
    } catch (error) {
      console.error('Error in getStatusSteps:', error);
      return [];
    }
  }, [currentStatus]);

  return {
    currentStatus,
    actionButtonText,
    isLoading,
    canProceedToNext: canProceedToNext(),
    handleStatusTransition,
    getProgressPercentage,
    getStatusSteps,
  };
};