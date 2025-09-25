import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { 
  BackIcon,
  MapIcon,
  ClockIcon,
  OrdersIcon,
  CheckIcon,
  TrashIcon,
  PhoneIcon,
  StarIcon,
  AlertIcon
} from '../../../shared/components/CustomIcons';
import { Colors } from '../../../shared/theme/colors';
import { Order, OrderStatus } from '../../../shared/types/Order';
import { orderAPI } from '../../../shared/services/api';
import OrderStatusProgress from '../components/OrderStatusProgress';
import { useOrderUpdates } from '../hooks/useOrderUpdates';
import { useToast } from '../../../shared/context/ToastContext';
import Rating, { RatingData } from '../../../shared/components/Rating';
import { ratingAPI } from '../../../shared/services/api';
import { Modal } from 'react-native';
import { tokenManager } from '../../../shared/services/api';

// Escrow API endpoints
const escrowAPI = {
  checkCancellation: async (orderId: number) => {
    const response = await fetch(`http://192.168.1.5:3001/api/escrow-orders/${orderId}/cancellation-info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await tokenManager.getToken()}`,
      },
    });
    return await response.json();
  },
  
  cancelOrder: async (orderId: number, reason?: string) => {
    const response = await fetch(`http://192.168.1.5:3001/api/escrow-orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await tokenManager.getToken()}`,
      },
      body: JSON.stringify({ reason: reason || 'Customer requested cancellation' }),
    });
    return await response.json();
  }
};

interface OrderDetailScreenProps {
  orderId: number;
  onBackPress: () => void;
}

interface CancellationStatus {
  canCancel: boolean;
  reason: string;
  message: string;
  timeRemaining?: number;
  restaurantTimeRemaining?: number;
  timeoutOccurred?: boolean;
}

const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ orderId, onBackPress }) => {
  // Use real-time order updates hook with socket support
  const { order, loading, error, refetch } = useOrderUpdates({
    orderId,
    enabled: true,
    enableRealTime: true, // Enable real-time socket updates
    fallbackPollingInterval: 30000 // Fallback polling every 30 seconds if socket fails
  });
  const { showSuccess, showError, showWarning } = useToast();
  
  // Escrow-specific state
  const [cancellationStatus, setCancellationStatus] = useState<CancellationStatus | null>(null);
  const [loadingCancellation, setLoadingCancellation] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Timer state for grace period countdown
  const [graceTimer, setGraceTimer] = useState(0);
  const [restaurantTimer, setRestaurantTimer] = useState(0);
  
  // Rating state (keep existing rating functionality)
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingType, setRatingType] = useState<'restaurant' | 'order' | 'driver'>('order');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingStates, setRatingStates] = useState<{hasRatedOrder: boolean, hasRatedRestaurant: boolean, hasRatedDriver: boolean}>({hasRatedOrder: false, hasRatedRestaurant: false, hasRatedDriver: false});

  // Load cancellation status when order changes (real-time via socket now, but keep initial load)
  useEffect(() => {
    if (order && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED) {
      loadCancellationStatus();
      // Real-time updates via socket eliminate the need for polling cancellation status
      // Only poll as fallback if socket is not working
      const shouldFallbackPoll = false; // Socket handles real-time cancellation updates
      
      if (shouldFallbackPoll) {
        const interval = setInterval(loadCancellationStatus, 60000); // Reduced frequency
        return () => clearInterval(interval);
      }
    }
  }, [order?.id, order?.status]);

  // Timer effect for grace period countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (cancellationStatus?.timeRemaining && cancellationStatus.timeRemaining > 0) {
      interval = setInterval(() => {
        setGraceTimer(prev => {
          const newTime = Math.max(0, prev - 1);
          if (newTime === 0) {
            // Grace period ended, reload cancellation status
            loadCancellationStatus();
          }
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cancellationStatus?.timeRemaining]);

  // Timer effect for restaurant timeout countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (cancellationStatus?.restaurantTimeRemaining && cancellationStatus.restaurantTimeRemaining > 0) {
      interval = setInterval(() => {
        setRestaurantTimer(prev => {
          const newTime = Math.max(0, prev - 1);
          if (newTime === 0) {
            // Restaurant timeout reached, reload cancellation status
            loadCancellationStatus();
          }
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cancellationStatus?.restaurantTimeRemaining]);

  useEffect(() => {
    if (error) {
      showError('Failed to Load', 'Could not load order details. Please check your connection and try again.');
    }
  }, [error]);
  
  // Load rating states when order is loaded
  useEffect(() => {
    if (order && order.status === OrderStatus.DELIVERED) {
      loadRatingStates();
    }
  }, [order]);
  
  const loadCancellationStatus = async () => {
    if (!order) {
      console.log('🔍 loadCancellationStatus: No order available');
      return;
    }
    
    console.log('🔍 Starting loadCancellationStatus for order:', order.id, 'status:', order.status);
    
    try {
      setLoadingCancellation(true);
      const response = await escrowAPI.checkCancellation(order.id);
      
      console.log('🔍 ESCROW API RESPONSE:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        const status = response.data.cancellation;
        console.log('🔍 CANCELLATION STATUS:', JSON.stringify(status, null, 2));
        setCancellationStatus(status);
        
        // Set initial timer values
        if (status.timeRemaining) {
          setGraceTimer(Math.floor(status.timeRemaining / 1000));
        }
        if (status.restaurantTimeRemaining) {
          setRestaurantTimer(Math.floor(status.restaurantTimeRemaining / 1000));
        }
      } else {
        console.error('❌ Failed to load cancellation status:', response.message);
        // Set a fallback status to show the section
        setCancellationStatus({
          canCancel: false,
          reason: 'API_ERROR',
          message: `Unable to load cancellation status: ${response.message || 'Unknown error'}`,
        });
      }
    } catch (error) {
      console.error('🚨 Error loading cancellation status:', error);
      // Set a fallback status to show the section
      setCancellationStatus({
        canCancel: false,
        reason: 'NETWORK_ERROR',
        message: 'Unable to connect to cancellation service. Please check your connection.',
      });
    } finally {
      setLoadingCancellation(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !cancellationStatus?.canCancel) return;
    
    setIsCancelling(true);
    
    try {
      const response = await escrowAPI.cancelOrder(order.id, 'Customer requested cancellation');
      
      if (response.success) {
        showSuccess(
          'Order Cancelled Successfully! ✅', 
          `${response.message}. ${response.data?.refundAmount ? `₹${response.data.refundAmount} refund processed.` : ''}`
        );
        refetch(); // Refresh order data
        loadCancellationStatus(); // Refresh cancellation status
      } else {
        throw new Error(response.message || 'Cancellation failed');
      }
    } catch (error: any) {
      showError('Cancellation Failed', error.message || 'Unable to cancel your order. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const loadRatingStates = async () => {
    if (!order) return;
    
    try {
      const orderRatingResponse = await ratingAPI.checkRating('order', order.id);
      const hasRatedOrder = orderRatingResponse.success && orderRatingResponse.data.hasRated;
      
      const restaurantRatingResponse = await ratingAPI.checkRating('restaurant', order.restaurant.id);
      const hasRatedRestaurant = restaurantRatingResponse.success && restaurantRatingResponse.data.hasRated;
      
      let hasRatedDriver = false;
      if (order.driverId) {
        const driverRatingResponse = await ratingAPI.checkRating('driver', order.driverId);
        hasRatedDriver = driverRatingResponse.success && driverRatingResponse.data.hasRated;
      }
      
      setRatingStates({ hasRatedOrder, hasRatedRestaurant, hasRatedDriver });
    } catch (error) {
      console.error('Error checking rating states:', error);
      setRatingStates({ hasRatedOrder: false, hasRatedRestaurant: false, hasRatedDriver: false });
    }
  };
  

  const getStatusIcon = (status: OrderStatus) => {
    const iconProps = { size: 20, color: Colors.background.primary };
    const statusStr = String(status).toUpperCase();
    
    switch (statusStr) {
      case 'PENDING':
        return <ClockIcon {...iconProps} />;
      case 'ACCEPTED':
        return <CheckIcon {...iconProps} />;
      case 'PREPARING':
        return <OrdersIcon {...iconProps} />;
      case 'READY':
        return <CheckIcon {...iconProps} />; // Ready for pickup
      case 'PICKED_UP':
      case 'DELIVERING':
        return <MapIcon {...iconProps} />;
      case 'DELIVERED':
        return <CheckIcon {...iconProps} />;
      case 'CANCELLED':
        return <TrashIcon {...iconProps} />;
      default:
        return <ClockIcon {...iconProps} />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const statusStr = String(status).toUpperCase();
    
    switch (statusStr) {
      case 'PENDING':
        return Colors.status.pending;
      case 'ACCEPTED':
        return Colors.status.confirmed;
      case 'PREPARING':
        return Colors.status.preparing;
      case 'READY':
        return Colors.action.warning; // Orange for ready
      case 'PICKED_UP':
      case 'DELIVERING':
        return Colors.primary.main;
      case 'DELIVERED':
        return Colors.status.delivered;
      case 'CANCELLED':
        return Colors.status.cancelled;
      default:
        return Colors.status.pending;
    }
  };

  const getStatusText = (status: OrderStatus) => {
    console.log('📋 Order Status Debug:', {
      status: status,
      statusType: typeof status,
      statusValue: JSON.stringify(status),
      allOrderStatuses: Object.values(OrderStatus),
      enumComparisons: {
        isPending: status === OrderStatus.PENDING,
        isAccepted: status === OrderStatus.ACCEPTED,
        isPreparing: status === OrderStatus.PREPARING,
        isReady: status === OrderStatus.READY,
        isPickedUp: status === OrderStatus.PICKED_UP,
        isDelivering: status === OrderStatus.DELIVERING,
        isDelivered: status === OrderStatus.DELIVERED,
        isCancelled: status === OrderStatus.CANCELLED
      }
    });
    
    // Convert to uppercase string for comparison to handle any case issues
    const statusStr = String(status).toUpperCase();
    
    switch (statusStr) {
      case 'PENDING':
        return 'Order Placed';
      case 'ACCEPTED':
        return 'Order Confirmed';
      case 'PREPARING':
        return 'Being Prepared';
      case 'READY':
        return 'Ready for Pickup';
      case 'PICKED_UP':
        return 'Picked Up';
      case 'DELIVERING':
        return 'On the Way';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        console.warn('⚠️ Unknown order status:', status, 'converted to:', statusStr);
        return `Status: ${status}`;  // Show actual status instead of "Unknown"
    }
  };

  const getStatusDescription = (status: OrderStatus) => {
    const statusStr = String(status).toUpperCase();
    
    switch (statusStr) {
      case 'PENDING':
        return 'Your order has been placed and is waiting for restaurant confirmation.';
      case 'ACCEPTED':
        return 'The restaurant has confirmed your order and will start preparing it soon.';
      case 'PREPARING':
        return 'Your delicious food is being prepared with care.';
      case 'READY':
        return 'Your order is ready for pickup and waiting for the driver.';
      case 'PICKED_UP':
        return 'Your order has been picked up and is on its way to you.';
      case 'DELIVERING':
        return 'Your order is being delivered to your location.';
      case 'DELIVERED':
        return 'Your order has been successfully delivered. Enjoy your meal!';
      case 'CANCELLED':
        return 'This order has been cancelled.';
      default:
        return 'Order status unknown.';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format time for countdown displays
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Enhanced cancellation button component
  const renderCancellationSection = () => {
    // Show loading state if cancellation status is not loaded yet
    if (!cancellationStatus && loadingCancellation) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Cancellation</Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary.main} />
            <Text style={styles.loadingText}>Loading cancellation options...</Text>
          </View>
        </View>
      );
    }
    
    // If not loading and no status, show a fallback message for early-stage orders
    if (!cancellationStatus) {
      console.log('🔍 renderCancellationSection: No cancellation status available');
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Cancellation</Text>
          <View style={styles.cancellationCard}>
            <AlertIcon size={24} color={Colors.action.warning} />
            <View style={styles.cancellationContent}>
              <Text style={styles.cancellationMessage}>
                Cancellation options are being loaded. Please check back in a moment.
              </Text>
            </View>
          </View>
        </View>
      );
    }

    const { canCancel, reason, message, timeRemaining, restaurantTimeRemaining, timeoutOccurred } = cancellationStatus;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Cancellation</Text>
        
        {/* Cancellation Status Display */}
        <View style={[styles.cancellationCard, canCancel ? styles.canCancelCard : styles.cannotCancelCard]}>
          {canCancel ? (
            <CheckIcon size={24} color={Colors.action.success} />
          ) : (
            <AlertIcon size={24} color={Colors.action.warning} />
          )}
          
          <View style={styles.cancellationContent}>
            <Text style={styles.cancellationMessage}>{message}</Text>
            
            {/* Grace period countdown */}
            {reason === 'FREE_CANCELLATION_WINDOW' && graceTimer > 0 && (
              <Text style={styles.graceTimer}>
                🕐 Free cancellation ends in {formatTime(graceTimer)}
              </Text>
            )}
            
            {/* Restaurant timeout countdown */}
            {reason === 'BEFORE_RESTAURANT_ACCEPTANCE' && restaurantTimer > 0 && (
              <Text style={styles.restaurantTimer}>
                ⏱️ Restaurant has {formatTime(restaurantTimer)} to accept
              </Text>
            )}
            
            {/* Timeout occurred */}
            {timeoutOccurred && (
              <Text style={styles.timeoutMessage}>
                ⚠️ Restaurant timeout - Full refund available
              </Text>
            )}
          </View>
        </View>

        {/* Cancel Button */}
        {canCancel && (
          <TouchableOpacity 
            style={[styles.cancelButton, isCancelling && styles.cancellingButton]} 
            onPress={handleCancelOrder}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <View style={styles.cancellingContent}>
                <ActivityIndicator size="small" color={Colors.text.white} />
                <Text style={styles.cancellingText}>Cancelling...</Text>
              </View>
            ) : (
              <Text style={styles.cancelButtonText}>
                {reason === 'FREE_CANCELLATION_WINDOW' ? 'Cancel Order (Free)' : 
                 reason === 'RESTAURANT_TIMEOUT' ? 'Cancel Order (Full Refund)' : 
                 'Cancel Order (Full Refund)'}
              </Text>
            )}
          </TouchableOpacity>
        )}
        
        {/* Cannot Cancel Explanation */}
        {!canCancel && (
          <View style={styles.cannotCancelExplanation}>
            <Text style={styles.cannotCancelText}>
              {reason === 'RESTAURANT_ACCEPTED' ? '🏪 Restaurant has accepted and is preparing your order' :
               reason === 'ORDER_COMPLETED' ? `✅ Order has been ${order?.status?.toLowerCase() || 'completed'}` :
               reason === 'UNKNOWN_STATE' ? '📞 Please contact support for assistance' :
               message || 'Order cannot be cancelled at this time'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Determine if cancellation section should be shown (only for API logic)
  const shouldShowCancellationSection = () => {
    if (!order) {
      console.log('🔍 shouldShowCancellationSection: No order');
      return false;
    }
    
    // This function is now mainly for API calls - the UI visibility is controlled by canShowCancellation
    const statusStr = String(order.status).toUpperCase();
    const shouldShow = statusStr === 'PENDING' || statusStr === 'ACCEPTED';
    
    console.log('🔍 shouldShowCancellationSection DEBUG:', {
      orderStatus: order.status,
      orderStatusType: typeof order.status,
      statusStr: statusStr,
      shouldShow: shouldShow
    });
    
    return shouldShow;
  };
  
  const canRate = order && order.status === OrderStatus.DELIVERED;
  const isCompleted = order && (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED);
  
  // Only show cancellation for PENDING and ACCEPTED orders
  const canShowCancellation = order && (() => {
    const statusStr = String(order.status).toUpperCase();
    return statusStr === 'PENDING' || statusStr === 'ACCEPTED';
  })();

  const handleRateOrder = () => {
    if (ratingStates.hasRatedOrder) return; // Already rated
    setRatingType('order');
    setShowRatingModal(true);
  };

  const handleRateRestaurant = () => {
    if (ratingStates.hasRatedRestaurant) return; // Already rated
    setRatingType('restaurant');
    setShowRatingModal(true);
  };
  
  const handleRateDriver = () => {
    if (ratingStates.hasRatedDriver || !order?.driverId) return; // Already rated or no driver
    setRatingType('driver');
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async (ratingData: RatingData) => {
    if (!order) return;

    setIsSubmittingRating(true);
    try {
      if (ratingType === 'restaurant') {
        await ratingAPI.rateRestaurant(order.restaurant.id, ratingData.rating, ratingData.comment);
        showSuccess('Rating Submitted', 'Thank you for rating the restaurant!');
      } else if (ratingType === 'order') {
        await ratingAPI.rateOrder(order.id, ratingData.rating, ratingData.comment);
        showSuccess('Rating Submitted', 'Thank you for rating your order!');
      } else if (ratingType === 'driver' && order.driverId) {
        await ratingAPI.rateDriver(order.driverId, ratingData.rating, ratingData.comment);
        showSuccess('Rating Submitted', 'Thank you for rating the driver!');
      }
      setShowRatingModal(false);
      // Reload rating states to update buttons
      await loadRatingStates();
    } catch (error) {
      console.error('Error submitting rating:', error);
      showError('Rating Failed', 'Unable to submit rating. Please try again.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.main} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <BackIcon size={24} color={Colors.text.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.id}</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Status Section */}
        <View style={styles.section}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            {getStatusIcon(order.status)}
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
          <Text style={styles.orderDate}>Placed on {formatDate(order.createdAt)}</Text>
        </View>

        {/* Escrow Cancellation Section - Only show for PENDING and ACCEPTED orders */}
        {(() => {
          const showSection = canShowCancellation;
          console.log('🔍 CANCELLATION SECTION RENDER DEBUG:', {
            isCompleted: isCompleted,
            canShowCancellation: canShowCancellation,
            showSection: showSection,
            orderStatus: order?.status,
            orderStatusEnum: Object.values(OrderStatus),
            cancellationStatus: cancellationStatus,
            loadingCancellation: loadingCancellation
          });
          return showSection ? renderCancellationSection() : null;
        })()}

        {/* Order Progress - Only show for active orders */}
        {!isCompleted && (
          <View style={styles.section}>
            <OrderStatusProgress 
              status={order.status}
              estimatedDelivery={order.estimatedDeliveryTime ? new Date(Date.now() + order.estimatedDeliveryTime * 60000).toISOString() : undefined}
              showMap={false}
            />
          </View>
        )}
        
        {/* Restaurant Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant</Text>
          <View style={styles.restaurantCard}>
            <Image
              source={{ uri: order.restaurant.logoUrl || 'https://via.placeholder.com/60x60' }}
              style={styles.restaurantLogo}
            />
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{order.restaurant.name}</Text>
              <Text style={styles.restaurantAddress}>{order.restaurant.address}</Text>
            </View>
            <TouchableOpacity style={styles.contactButton}>
              <PhoneIcon size={20} color={Colors.primary.main} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({order.orderItems.length})</Text>
          <View style={styles.itemsContainer}>
            {order.orderItems.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <Image
                  source={{ uri: item.menu.imageUrl || 'https://via.placeholder.com/50x50' }}
                  style={styles.itemImage}
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.menu.itemName}</Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{(parseFloat(item.price.toString()) * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{parseFloat(order.itemsSubtotal?.toString() || '0').toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>₹{parseFloat(order.deliveryFee.toString()).toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{parseFloat(order.totalPrice.toString()).toFixed(2)}</Text>
            </View>
          </View>
        </View>
        
        
        {/* Rating Buttons for Delivered Orders */}
        {canRate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rate Your Experience</Text>
            <View style={styles.ratingActionsContainer}>
              <View style={styles.ratingButtonsRow}>
                <TouchableOpacity 
                  style={[
                    styles.ratingButton,
                    styles.rateOrderButton,
                    ratingStates.hasRatedOrder && styles.ratedButton
                  ]} 
                  onPress={handleRateOrder}
                  disabled={ratingStates.hasRatedOrder}
                >
                  <StarIcon 
                    size={20} 
                    color={ratingStates.hasRatedOrder ? Colors.action.success : Colors.primary.main} 
                  />
                  <Text style={[
                    styles.ratingButtonText,
                    styles.rateOrderText,
                    ratingStates.hasRatedOrder && styles.ratedText
                  ]}>
                    {ratingStates.hasRatedOrder ? 'Rated' : 'Rate Order'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.ratingButton,
                    styles.rateRestaurantButton,
                    ratingStates.hasRatedRestaurant && styles.ratedButton
                  ]} 
                  onPress={handleRateRestaurant}
                  disabled={ratingStates.hasRatedRestaurant}
                >
                  <StarIcon 
                    size={20} 
                    color={ratingStates.hasRatedRestaurant ? Colors.action.success : Colors.action.warning} 
                  />
                  <Text style={[
                    styles.ratingButtonText,
                    styles.rateRestaurantText,
                    ratingStates.hasRatedRestaurant && styles.ratedText
                  ]}>
                    {ratingStates.hasRatedRestaurant ? 'Rated' : 'Rate Restaurant'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Driver Rating Button - Only show if order has a driver */}
              {order.driverId && (
                <TouchableOpacity 
                  style={[
                    styles.rateDriverButton,
                    ratingStates.hasRatedDriver && styles.ratedButton
                  ]}
                  onPress={handleRateDriver}
                  disabled={ratingStates.hasRatedDriver}
                >
                  <StarIcon 
                    size={20} 
                    color={ratingStates.hasRatedDriver ? Colors.action.success : '#6B46C1'} 
                  />
                  <Text style={[
                    styles.rateDriverText,
                    ratingStates.hasRatedDriver && styles.ratedText
                  ]}>
                    {ratingStates.hasRatedDriver ? 'Driver Rated' : 'Rate Driver'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRatingModal(false)}
      >
        <Rating
          title={ratingType === 'restaurant' ? 'Rate Restaurant' : ratingType === 'driver' ? 'Rate Driver' : 'Rate Your Order'}
          subtitle={
            ratingType === 'restaurant' ? `How was your experience with ${order.restaurant.name}?` :
            ratingType === 'driver' ? `How was your delivery experience with ${order.driver?.name || 'the driver'}?` :
            'How was your overall order experience?'
          }
          onRatingSubmit={handleRatingSubmit}
          onCancel={() => setShowRatingModal(false)}
          isLoading={isSubmittingRating}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.primary.main,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.white,
  },
  // Status display styles
  statusContainer: {
    backgroundColor: Colors.background.primary,
    padding: 20,
    marginTop: 8,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusMainText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary.main,
    marginLeft: 12,
  },
  statusDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  addressInfo: {
    marginBottom: 16,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 12,
    paddingLeft: 8,
  },
  driverInfo: {
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  driverLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  driverDetails: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  callDriverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.light,
    padding: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  callDriverText: {
    fontSize: 14,
    color: Colors.primary.main,
    fontWeight: '600',
    marginLeft: 4,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: 12,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.main,
    marginLeft: 8,
  },
  backBtn: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.text.primary,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: Colors.primary.main,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Escrow-specific styles
  cancellationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  canCancelCard: {
    backgroundColor: Colors.action.success + '15',
    borderWidth: 1,
    borderColor: Colors.action.success + '30',
  },
  cannotCancelCard: {
    backgroundColor: Colors.action.warning + '15',
    borderWidth: 1,
    borderColor: Colors.action.warning + '30',
  },
  cancellationContent: {
    flex: 1,
    marginLeft: 12,
  },
  cancellationMessage: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  graceTimer: {
    fontSize: 14,
    color: Colors.action.success,
    fontWeight: '600',
  },
  restaurantTimer: {
    fontSize: 14,
    color: Colors.action.warning,
    fontWeight: '600',
  },
  timeoutMessage: {
    fontSize: 14,
    color: Colors.action.error,
    fontWeight: '600',
  },
  cancellingButton: {
    backgroundColor: Colors.action.error + '80',
  },
  cancellingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancellingText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cannotCancelExplanation: {
    padding: 12,
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
  },
  cannotCancelText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  orderInfoSection: {
    backgroundColor: Colors.background.primary,
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: Colors.background.secondary,
  },
  orderDate: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  deliveryAddress: {
    fontSize: 14,
    color: Colors.text.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    backgroundColor: Colors.background.primary,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    color: Colors.text.white,
    fontWeight: '600',
    marginLeft: 8,
  },
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantAddress: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 4,
    flex: 1,
  },
  contactButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: Colors.primary.light,
    marginLeft: 8,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  driverInitial: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.white,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  driverActions: {
    flexDirection: 'row',
  },
  itemsContainer: {
    gap: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  summaryContainer: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  totalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary.main,
  },
  actionSection: {
    padding: 20,
  },
  cancelButton: {
    backgroundColor: Colors.action.error,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Bottom sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '45%', // Reduced from 50% to 45%
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border.light,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Quick order info
  quickOrderInfo: {
    paddingTop: 20, // More space from handle
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  deliveryAddressCompact: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  
  // Info cards
  infoCardsContainer: {
    paddingVertical: 16,
    gap: 12,
  },
  infoCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  driverIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverInitialCompact: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.white,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  ratingRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingTextCompact: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  cardAction: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary.light,
  },
  
  // Items summary
  itemsSummary: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  compactOrderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemQuantityBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.main,
    backgroundColor: Colors.primary.light,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  compactItemName: {
    fontSize: 14,
    color: Colors.text.primary,
    flex: 1,
  },
  compactItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  moreItemsText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  
  // Order total
  orderTotal: {
    paddingVertical: 16,
  },
  totalRowCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalLabelCompact: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  totalValueCompact: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary.main,
  },
  deliveryFeeText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  
  // Bottom actions
  bottomActions: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  cancelButtonCompact: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.action.error,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonTextCompact: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.action.error,
  },
  
  // Map loading states
  mapLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 20,
  },
  mapLoadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  mapLoadingText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  
  // Completed order
  completedOrderText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  
  // Rating styles
  ratingActionsContainer: {
    gap: 12,
  },
  ratingButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 8,
  },
  rateOrderButton: {
    flex: 1,
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main + '10',
  },
  rateRestaurantButton: {
    flex: 1,
    borderColor: '#FF8C00',
    backgroundColor: '#FF8C00' + '10',
  },
  rateDriverButton: {
    borderColor: '#8A2BE2',
    backgroundColor: '#8A2BE2' + '10',
  },
  ratingButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rateOrderText: {
    color: Colors.primary.main,
  },
  rateRestaurantText: {
    color: '#FF8C00',
  },
  rateDriverText: {
    color: '#8A2BE2',
  },
  ratedButton: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.action.success,
    opacity: 0.7,
  },
  ratedText: {
    color: Colors.action.success,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Completed Order Minimalistic Styles
  completedOrderContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: Colors.background.primary,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
  },
  completedStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 16,
  },
  completedStatusText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.white,
    marginLeft: 8,
  },
  completedDate: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default OrderDetailScreen;
