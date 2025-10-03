import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { driverAPI, Order } from '../../../shared/services/api';
import socketService, { AssignmentOffer as SocketAssignmentOffer } from '../../../shared/services/socketService';
import driverStatusService from '../../../shared/services/driverStatusService';

// Order Context Types
export interface OrderState {
  availableOrders: Order[];
  activeOrder: Order | null;
  orderHistory: Order[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  assignmentOffer: AssignmentOffer | null;
}

export interface AssignmentOffer {
  id: string;
  assignmentId: string;
  orderId: number;
  order: Order;
  expiresAt: Date;
  timeRemaining: number;
  wave: number;
  priority: 'high' | 'medium' | 'low';
  distance: number;
  createdAt: Date;
}

type OrderAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_AVAILABLE_ORDERS'; payload: Order[] }
  | { type: 'SET_ACTIVE_ORDER'; payload: Order | null }
  | { type: 'SET_ORDER_HISTORY'; payload: Order[] }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: number; status: string; order?: Order } }
  | { type: 'SET_ASSIGNMENT_OFFER'; payload: AssignmentOffer | null }
  | { type: 'ACCEPT_ORDER'; payload: Order }
  | { type: 'DECLINE_ORDER'; payload: { orderId: number; reason?: string } }
  | { type: 'COMPLETE_DELIVERY'; payload: Order }
  | { type: 'CANCEL_ORDER'; payload: { orderId: number; reason: string } }
  | { type: 'OFFER_EXPIRED'; payload: { assignmentId: string; orderId: number } }
  | { type: 'OFFER_ACCEPTED_BY_OTHER'; payload: { assignmentId: string; orderId: number } }
  | { type: 'OFFER_CANCELLED'; payload: { assignmentId: string; orderId: number; reason: string } };

interface OrderContextType extends OrderState {
  // Order Management
  fetchAvailableOrders: () => Promise<void>;
  fetchActiveOrder: () => Promise<void>;
  fetchOrderHistory: () => Promise<void>;
  
  // Assignment Offers (New hybrid system)
  acceptAssignmentOffer: (assignmentId: string) => Promise<boolean>;
  declineAssignmentOffer: (assignmentId: string, reason?: string) => Promise<boolean>;
  
  // Order Status Updates
  arriveAtRestaurant: (orderId: number) => Promise<boolean>;
  pickupOrder: (orderId: number) => Promise<boolean>;
  startDelivery: (orderId: number) => Promise<boolean>;
  completeDelivery: (orderId: number, proof?: any) => Promise<boolean>;
  cancelOrder: (orderId: number, reason: string) => Promise<boolean>;
  
  // Real-time Updates
  handleAssignmentOffer: (offer: AssignmentOffer) => void;
  clearAssignmentOffer: () => void;
  handleOfferExpired: (data: { assignmentId: string; orderId: number }) => void;
  handleOfferAcceptedByOther: (data: { assignmentId: string; orderId: number }) => void;
  handleOfferCancelled: (data: { assignmentId: string; orderId: number; reason: string }) => void;
  
  // Utility
  refreshOrders: () => Promise<void>;
  clearError: () => void;
}

// Initial State
const initialState: OrderState = {
  availableOrders: [],
  activeOrder: null,
  orderHistory: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  assignmentOffer: null,
};

// Reducer
function orderReducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
      
    case 'SET_AVAILABLE_ORDERS':
      return {
        ...state,
        availableOrders: action.payload,
        lastUpdated: new Date(),
        isLoading: false,
        error: null,
      };
      
    case 'SET_ACTIVE_ORDER':
      return {
        ...state,
        activeOrder: action.payload,
        isLoading: false,
        error: null,
      };
      
    case 'SET_ORDER_HISTORY':
      return {
        ...state,
        orderHistory: action.payload,
        isLoading: false,
        error: null,
      };
      
    case 'UPDATE_ORDER_STATUS':
      console.log('🔄 === UPDATE_ORDER_STATUS TRIGGERED ===');
      console.log('Action payload orderId:', action.payload.orderId);
      console.log('Action payload status:', action.payload.status);
      console.log('Current activeOrder ID:', state.activeOrder?.id);
      console.log('Current activeOrder items type:', typeof state.activeOrder?.items);
      console.log('Current activeOrder items isArray:', Array.isArray(state.activeOrder?.items));
      console.log('Current activeOrder items length:', state.activeOrder?.items?.length);
      console.log('New order from API items type:', typeof action.payload.order?.items);
      console.log('New order from API items isArray:', Array.isArray(action.payload.order?.items));
      console.log('New order from API items length:', action.payload.order?.items?.length);
      console.log('New order from API items:', action.payload.order?.items);
      console.log('Will merge be called?', state.activeOrder?.id === action.payload.orderId);
      console.log('🔄 === End UPDATE_ORDER_STATUS Debug ===');
      
      // Helper function to merge order data, preserving existing data when API returns incomplete data
      const mergeOrderData = (existingOrder: Order, newOrderData?: Order) => {
        if (!newOrderData) {
          return { ...existingOrder, status: action.payload.status };
        }
        
        console.log('=== Merge Debug ===');
        console.log('Existing items length:', existingOrder.items?.length || 0);
        console.log('New items length:', newOrderData.items?.length || 0);
        console.log('New items array:', newOrderData.items);
        console.log('=== End Merge Debug ===');
        
        // Check if new data has valid items (not empty array)
        const hasValidItems = newOrderData.items && Array.isArray(newOrderData.items) && newOrderData.items.length > 0;
        const hasValidRestaurant = newOrderData.restaurantName && newOrderData.restaurantName.trim() !== '' && newOrderData.restaurantName !== 'Unknown Restaurant';
        const hasValidCustomer = newOrderData.customerName && newOrderData.customerName.trim() !== '' && newOrderData.customerName !== 'Unknown Customer';
        
        // If the new order data is missing critical fields, preserve the existing ones
        const mergedOrder = {
          ...existingOrder, // Start with existing order data
          ...newOrderData,  // Overlay new data
          // Preserve existing items if new data has empty/invalid items
          items: hasValidItems ? newOrderData.items : (existingOrder.items || []),
          // Preserve existing restaurant data if new data has invalid values
          restaurantName: hasValidRestaurant ? newOrderData.restaurantName : existingOrder.restaurantName,
          restaurantAddress: (newOrderData.restaurantAddress && newOrderData.restaurantAddress.trim() !== '' && newOrderData.restaurantAddress !== 'Unknown Address') 
            ? newOrderData.restaurantAddress 
            : existingOrder.restaurantAddress,
          restaurantPhone: newOrderData.restaurantPhone || existingOrder.restaurantPhone,
          restaurantLat: newOrderData.restaurantLat || existingOrder.restaurantLat,
          restaurantLng: newOrderData.restaurantLng || existingOrder.restaurantLng,
          // Preserve existing customer data if new data has invalid values
          customerName: hasValidCustomer ? newOrderData.customerName : existingOrder.customerName,
          customerPhone: newOrderData.customerPhone || existingOrder.customerPhone,
          // Preserve other critical fields
          deliveryAddress: newOrderData.deliveryAddress || existingOrder.deliveryAddress,
          deliveryLat: newOrderData.deliveryLat || existingOrder.deliveryLat,
          deliveryLng: newOrderData.deliveryLng || existingOrder.deliveryLng,
          totalAmount: newOrderData.totalAmount || existingOrder.totalAmount,
          driverEarning: newOrderData.driverEarning || existingOrder.driverEarning,
        };
        
        console.log('=== Merged Order Data ===');
        console.log('Merged items length:', mergedOrder.items?.length || 0);
        console.log('Merged restaurant name:', mergedOrder.restaurantName);
        console.log('Merged customer name:', mergedOrder.customerName);
        console.log('=== End Merged Data ===');
        
        return mergedOrder;
      };
      
      return {
        ...state,
        activeOrder: state.activeOrder?.id === action.payload.orderId 
          ? mergeOrderData(state.activeOrder, action.payload.order)
          : state.activeOrder,
        availableOrders: (state.availableOrders || []).map(order =>
          order.id === action.payload.orderId
            ? (action.payload.order ? mergeOrderData(order, action.payload.order) : { ...order, status: action.payload.status })
            : order
        ),
      };
      
    case 'SET_ASSIGNMENT_OFFER':
      return { ...state, assignmentOffer: action.payload };
      
    case 'ACCEPT_ORDER':
      return {
        ...state,
        activeOrder: action.payload,
        assignmentOffer: null,
        availableOrders: (state.availableOrders || []).filter(order => order.id !== action.payload.id),
        isLoading: false,
        error: null,
      };
      
    case 'DECLINE_ORDER':
      return {
        ...state,
        availableOrders: (state.availableOrders || []).filter(order => order.id !== action.payload.orderId),
        assignmentOffer: null,
        isLoading: false,
      };
      
    case 'COMPLETE_DELIVERY':
      console.log('📦 === COMPLETE_DELIVERY REDUCER ===');
      console.log('Current activeOrder for history:', state.activeOrder?.id);
      console.log('API response order:', action.payload?.id);
      
      // Prevent double execution - check if this order is already in history
      // Add safety check in case orderHistory is undefined
      console.log('DEBUG: state.orderHistory type:', typeof state.orderHistory);
      console.log('DEBUG: state.orderHistory value:', state.orderHistory);
      console.log('DEBUG: state.orderHistory isArray:', Array.isArray(state.orderHistory));
      
      const orderHistory = state.orderHistory || [];
      console.log('DEBUG: orderHistory after fallback type:', typeof orderHistory);
      console.log('DEBUG: orderHistory after fallback value:', orderHistory);
      console.log('DEBUG: orderHistory after fallback isArray:', Array.isArray(orderHistory));
      
      // Extra safety - ensure it's definitely an array
      const safeOrderHistory = Array.isArray(orderHistory) ? orderHistory : [];
      console.log('DEBUG: safeOrderHistory type:', typeof safeOrderHistory);
      console.log('DEBUG: safeOrderHistory isArray:', Array.isArray(safeOrderHistory));
      
      const orderAlreadyInHistory = safeOrderHistory.some(order => order.id === action.payload?.id);
      if (orderAlreadyInHistory) {
        console.log('⚠️ COMPLETE_DELIVERY: Order', action.payload?.id, 'already in history - skipping');
        console.log('📦 === End COMPLETE_DELIVERY REDUCER (skipped) ===');
        return {
          ...state,
          activeOrder: null, // Still set to null in case it wasn't
          isLoading: false,
          error: null,
        };
      }
      
      // Also check if activeOrder is null
      if (!state.activeOrder) {
        console.log('⚠️ COMPLETE_DELIVERY called but activeOrder is already null - skipping');
        console.log('📦 === End COMPLETE_DELIVERY REDUCER (skipped) ===');
        return state;
      }
      
      console.log('Setting activeOrder to null');
      
      // Use the current activeOrder data (which has good data) instead of the API response
      // The API response has degraded data (empty items, "Unknown" names)
      const orderForHistory = state.activeOrder ? {
        ...state.activeOrder,
        status: 'DELIVERED',
        deliveredAt: action.payload?.deliveredAt || new Date().toISOString(),
      } : action.payload;
      
      console.log('Adding to history with items length:', orderForHistory?.items?.length || 0);
      console.log('📦 === End COMPLETE_DELIVERY REDUCER ===');
      
      return {
        ...state,
        activeOrder: null,
        orderHistory: [orderForHistory, ...safeOrderHistory],
        isLoading: false,
        error: null,
      };
      
    case 'CANCEL_ORDER':
      return {
        ...state,
        activeOrder: state.activeOrder?.id === action.payload.orderId ? null : state.activeOrder,
        isLoading: false,
      };

    case 'OFFER_EXPIRED':
      return {
        ...state,
        assignmentOffer: state.assignmentOffer?.assignmentId === action.payload.assignmentId 
          ? null 
          : state.assignmentOffer,
        isLoading: false,
      };

    case 'OFFER_ACCEPTED_BY_OTHER':
      return {
        ...state,
        assignmentOffer: state.assignmentOffer?.assignmentId === action.payload.assignmentId 
          ? null 
          : state.assignmentOffer,
        isLoading: false,
      };

    case 'OFFER_CANCELLED':
      return {
        ...state,
        assignmentOffer: state.assignmentOffer?.assignmentId === action.payload.assignmentId 
          ? null 
          : state.assignmentOffer,
        isLoading: false,
      };
      
    default:
      return state;
  }
}

// Context
const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Provider Component
interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(orderReducer, initialState);

  // Fetch Available Orders
  const fetchAvailableOrders = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await driverAPI.getAvailableOrders();
      
      if (response.success) {
        dispatch({ type: 'SET_AVAILABLE_ORDERS', payload: response.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch available orders' });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Network error' });
    }
  };

  // Fetch Active Order
  const fetchActiveOrder = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await driverAPI.getActiveOrder();
      
      if (response.success) {
        dispatch({ type: 'SET_ACTIVE_ORDER', payload: response.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch active order' });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Network error' });
    }
  };

  // Fetch Order History
  const fetchOrderHistory = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await driverAPI.getOrderHistory({ limit: 50 });
      
      if (response.success) {
        dispatch({ type: 'SET_ORDER_HISTORY', payload: response.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch order history' });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Network error' });
    }
  };



  // Accept Assignment Offer (New hybrid system)
  const acceptAssignmentOffer = async (assignmentId: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await driverAPI.acceptAssignmentOffer(assignmentId);
      
      if (response.success) {
        dispatch({ type: 'ACCEPT_ORDER', payload: response.data });
        // Set driver to busy when accepting an assignment
        await driverStatusService.setBusy();
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message || 'Failed to accept assignment' });
        return false;
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Network error' });
      return false;
    }
  };

  // Decline Assignment Offer (New hybrid system)
  const declineAssignmentOffer = async (assignmentId: string, reason?: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await driverAPI.declineAssignmentOffer(assignmentId, reason);
      
      if (response.success) {
        dispatch({ type: 'SET_ASSIGNMENT_OFFER', payload: null });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.message || 'Failed to decline assignment' });
        return false;
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Network error' });
      return false;
    }
  };

  // Arrive at Restaurant
  const arriveAtRestaurant = async (orderId: number): Promise<boolean> => {
    try {
      const response = await driverAPI.arriveAtRestaurant(orderId);
      
      if (response.success) {
        dispatch({ 
          type: 'UPDATE_ORDER_STATUS', 
          payload: { orderId, status: 'arrived', order: response.data } 
        });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update arrival status' });
        return false;
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Network error' });
      return false;
    }
  };

  // Pickup Order
  const pickupOrder = async (orderId: number): Promise<boolean> => {
    try {
      const response = await driverAPI.pickupOrder(orderId);
      
      if (response.success) {
        dispatch({ 
          type: 'UPDATE_ORDER_STATUS', 
          payload: { orderId, status: 'picked_up', order: response.data } 
        });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update pickup status' });
        return false;
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Network error' });
      return false;
    }
  };

  // Start Delivery
  const startDelivery = async (orderId: number): Promise<boolean> => {
    try {
      const response = await driverAPI.startDelivery(orderId);
      
      if (response.success) {
        dispatch({ 
          type: 'UPDATE_ORDER_STATUS', 
          payload: { orderId, status: 'delivering', order: response.data } 
        });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to start delivery' });
        return false;
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Network error' });
      return false;
    }
  };

  // Complete Delivery
  const completeDelivery = async (orderId: number, proof?: any): Promise<boolean> => {
    try {
      console.log('🏁 === COMPLETE DELIVERY START ===');
      console.log('Order ID:', orderId);
      console.log('Proof:', proof);
      
      const response = await driverAPI.completeDelivery(orderId, proof);
      
      console.log('Complete delivery API response:', response);
      
      if (response.success) {
        console.log('✅ Complete delivery SUCCESS - dispatching COMPLETE_DELIVERY');
        console.log('Response data:', response.data);
        dispatch({ type: 'COMPLETE_DELIVERY', payload: response.data });
        
        // Set driver available after completing delivery (only if online)
        const driverState = driverStatusService.getState();
        console.log('Driver state after delivery:', driverState);
        if (driverState.isOnline) {
          await driverStatusService.setAvailable();
        }
        console.log('🏁 === COMPLETE DELIVERY END - SUCCESS ===');
        return true;
      } else {
        console.log('❌ Complete delivery FAILED:', response.message);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to complete delivery' });
        return false;
      }
    } catch (error: any) {
      console.log('💥 Complete delivery ERROR:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Network error' });
      return false;
    }
  };

  // Cancel Order (Pre-pickup only)
  const cancelOrder = async (orderId: number, reason: string): Promise<boolean> => {
    try {
      // This would need to be implemented in the API
      // For now, we'll use updateOrderStatus
      const response = await driverAPI.updateOrderStatus(orderId, 'cancelled');
      
      if (response.success) {
        dispatch({ type: 'CANCEL_ORDER', payload: { orderId, reason } });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to cancel order' });
        return false;
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Network error' });
      return false;
    }
  };

  // Handle Assignment Offer (for real-time notifications)
  const handleAssignmentOffer = (socketOffer: SocketAssignmentOffer) => {
    console.log('🚨 ASSIGNMENT OFFER RECEIVED IN CONTEXT!', socketOffer);
    const offer: AssignmentOffer = {
      id: socketOffer.id,
      assignmentId: socketOffer.assignmentId,
      orderId: socketOffer.orderId,
      order: {
        id: socketOffer.order.id,
        orderNumber: socketOffer.order.orderNumber,
        restaurantId: 0, // Will be populated by backend
        restaurantName: socketOffer.order.restaurantName,
        restaurantAddress: socketOffer.order.restaurantAddress,
        restaurantLat: socketOffer.order.restaurantLat,
        restaurantLng: socketOffer.order.restaurantLng,
        customerId: 0, // Will be populated by backend
        customerName: socketOffer.order.customerName,
        customerPhone: '', // Will be populated by backend
        deliveryAddress: socketOffer.order.deliveryAddress,
        deliveryLat: socketOffer.order.deliveryLat,
        deliveryLng: socketOffer.order.deliveryLng,
        items: socketOffer.order.items.map(item => ({
          id: 0, // Will be populated by backend
          itemName: item.itemName,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: socketOffer.order.totalAmount,
        deliveryFee: socketOffer.order.deliveryFee,
        driverEarning: socketOffer.order.driverEarning,
        tip: 0, // Will be populated by backend
        status: 'pending',
        estimatedPickupTime: socketOffer.order.estimatedPickupTime 
          ? new Date(socketOffer.order.estimatedPickupTime)
          : undefined,
        estimatedDeliveryTime: socketOffer.order.estimatedDeliveryTime
          ? new Date(socketOffer.order.estimatedDeliveryTime)
          : undefined,
        createdAt: new Date(socketOffer.createdAt),
      },
      expiresAt: new Date(socketOffer.expiresAt),
      timeRemaining: socketOffer.timeRemaining,
      wave: socketOffer.wave,
      priority: socketOffer.priority,
      distance: socketOffer.distance,
      createdAt: new Date(socketOffer.createdAt),
    };
    dispatch({ type: 'SET_ASSIGNMENT_OFFER', payload: offer });
  };

  // Clear Assignment Offer
  const clearAssignmentOffer = () => {
    dispatch({ type: 'SET_ASSIGNMENT_OFFER', payload: null });
  };

  // Handle offer expired
  const handleOfferExpired = (data: { assignmentId: string; orderId: number }) => {
    console.log('Assignment offer expired:', data.assignmentId);
    dispatch({ type: 'OFFER_EXPIRED', payload: data });
  };

  // Handle offer accepted by another driver
  const handleOfferAcceptedByOther = (data: { assignmentId: string; orderId: number }) => {
    console.log('Assignment offer accepted by another driver:', data.assignmentId);
    dispatch({ type: 'OFFER_ACCEPTED_BY_OTHER', payload: data });
  };

  // Handle offer cancelled
  const handleOfferCancelled = (data: { assignmentId: string; orderId: number; reason: string }) => {
    console.log('Assignment offer cancelled:', data.assignmentId, 'Reason:', data.reason);
    dispatch({ type: 'OFFER_CANCELLED', payload: data });
  };

  // Refresh All Orders
  const refreshOrders = async () => {
    await Promise.all([
      fetchAvailableOrders(),
      fetchActiveOrder(),
      fetchOrderHistory(),
    ]);
  };

  // Clear Error
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // Note: Disabled automatic polling for available orders since we now use 
  // real-time assignment offers via Socket.IO. The fetchAvailableOrders 
  // method is kept for manual refresh if needed.

  // Setup socket event handlers
  useEffect(() => {
    socketService.setEventHandlers({
      onOfferReceived: handleAssignmentOffer,
      onOfferExpired: handleOfferExpired,
      onOfferAccepted: handleOfferAcceptedByOther,
      onOfferCancelled: handleOfferCancelled,
      onConnectionError: (error) => {
        console.error('Socket connection error:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Real-time connection lost' });
      },
      onReconnected: () => {
        console.log('Socket reconnected');
        dispatch({ type: 'SET_ERROR', payload: null });
      },
    });
  }, []);

  // Initial data fetch
  useEffect(() => {
    refreshOrders();
  }, []);

  const contextValue: OrderContextType = {
    ...state,
    fetchAvailableOrders,
    fetchActiveOrder,
    fetchOrderHistory,
    acceptAssignmentOffer,
    declineAssignmentOffer,
    arriveAtRestaurant,
    pickupOrder,
    startDelivery,
    completeDelivery,
    cancelOrder,
    handleAssignmentOffer,
    clearAssignmentOffer,
    handleOfferExpired,
    handleOfferAcceptedByOther,
    handleOfferCancelled,
    refreshOrders,
    clearError,
  };

  return (
    <OrderContext.Provider value={contextValue}>
      {children}
    </OrderContext.Provider>
  );
};

// Hook
export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};