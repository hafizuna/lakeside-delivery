import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { 
  BackIcon,
  MapIcon,
  ClockIcon,
  OrdersIcon,
  CheckIcon,
  TrashIcon,
  PhoneIcon,
  StarIcon
} from '../../../shared/components/CustomIcons';
import { Colors } from '../../../shared/theme/colors';
import { Order, OrderStatus } from '../../../shared/types/Order';
import { orderAPI } from '../../../shared/services/api';
import OrderStatusProgress from '../components/OrderStatusProgress';
import { useOrderUpdates } from '../hooks/useOrderUpdates';
import { useToast } from '../../../shared/context/ToastContext';

interface OrderDetailScreenProps {
  orderId: number;
  onBackPress: () => void;
}

const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ orderId, onBackPress }) => {
  // Use real-time order updates hook
  const { order, loading, error, refetch } = useOrderUpdates({
    orderId,
    enabled: true,
    pollingInterval: 15000 // Poll every 15 seconds for active orders
  });
  const { showSuccess, showError, showWarning } = useToast();
  
  // Timer state for estimated delivery countdown
  const [timer, setTimer] = useState(1500); // 25 minutes in seconds

  useEffect(() => {
    if (error) {
      showError('Failed to Load', 'Could not load order details. Please check your connection and try again.');
    }
  }, [error]);
  
  // Timer effect - countdown for active orders
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (order && (
      order.status === OrderStatus.PENDING ||
      order.status === OrderStatus.ACCEPTED ||
      order.status === OrderStatus.PREPARING ||
      order.status === OrderStatus.PICKED_UP ||
      order.status === OrderStatus.DELIVERING
    )) {
      interval = setInterval(() => {
        setTimer(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [order?.status]);

  const handleCancelOrder = async () => {
    if (!order) return;
    
    showWarning('Cancelling Order', 'Please wait while we cancel your order...');
    
    try {
      const response = await orderAPI.cancelOrder(order.id);
      if (response.success) {
        showSuccess('Order Cancelled', 'Your order has been successfully cancelled.');
        refetch(); // Refresh order data
      } else {
        throw new Error('Cancellation failed');
      }
    } catch (error) {
      showError('Cancellation Failed', 'Unable to cancel your order. Please contact support if this persists.');
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    const iconProps = { size: 20, color: Colors.background.primary };
    
    switch (status) {
      case OrderStatus.PENDING:
        return <ClockIcon {...iconProps} />;
      case OrderStatus.ACCEPTED:
        return <CheckIcon {...iconProps} />;
      case OrderStatus.PREPARING:
        return <OrdersIcon {...iconProps} />;
      case OrderStatus.PICKED_UP:
      case OrderStatus.DELIVERING:
        return <MapIcon {...iconProps} />;
      case OrderStatus.DELIVERED:
        return <CheckIcon {...iconProps} />;
      case OrderStatus.CANCELLED:
        return <TrashIcon {...iconProps} />;
      default:
        return <ClockIcon {...iconProps} />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return Colors.status.pending;
      case OrderStatus.ACCEPTED:
        return Colors.status.confirmed;
      case OrderStatus.PREPARING:
        return Colors.status.preparing;
      case OrderStatus.PICKED_UP:
      case OrderStatus.DELIVERING:
        return Colors.primary.main;
      case OrderStatus.DELIVERED:
        return Colors.status.delivered;
      case OrderStatus.CANCELLED:
        return Colors.status.cancelled;
      default:
        return Colors.status.pending;
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'Order Placed';
      case OrderStatus.ACCEPTED:
        return 'Order Confirmed';
      case OrderStatus.PREPARING:
        return 'Being Prepared';
      case OrderStatus.PICKED_UP:
        return 'Picked Up';
      case OrderStatus.DELIVERING:
        return 'On the Way';
      case OrderStatus.DELIVERED:
        return 'Delivered';
      case OrderStatus.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getStatusDescription = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'Your order has been placed and is waiting for restaurant confirmation.';
      case OrderStatus.ACCEPTED:
        return 'The restaurant has confirmed your order and will start preparing it soon.';
      case OrderStatus.PREPARING:
        return 'Your delicious food is being prepared with care.';
      case OrderStatus.PICKED_UP:
        return 'Your order has been picked up and is on its way to you.';
      case OrderStatus.DELIVERING:
        return 'Your order is being delivered to your location.';
      case OrderStatus.DELIVERED:
        return 'Your order has been successfully delivered. Enjoy your meal!';
      case OrderStatus.CANCELLED:
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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canCancel = order && (order.status === OrderStatus.PENDING || order.status === OrderStatus.ACCEPTED);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
        <View style={styles.loadingContainer}>
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
        {/* Order Status Display */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>📦 Order Status</Text>
          <View style={styles.statusRow}>
            {getStatusIcon(order.status)}
            <Text style={styles.statusMainText}>{getStatusText(order.status)}</Text>
          </View>
          <Text style={styles.statusDescription}>{getStatusDescription(order.status)}</Text>
          
          {/* Address Information */}
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>📍 From: {order.restaurant?.name || 'Restaurant'}</Text>
            <Text style={styles.addressText}>{order.restaurant?.address || 'Restaurant Address'}</Text>
            <Text style={styles.addressLabel}>🏠 To: Delivery Address</Text>
            <Text style={styles.addressText}>{order.deliveryAddress || 'Your Address'}</Text>
          </View>
          
          {/* Driver Information */}
          {order.driver && (
            <View style={styles.driverInfo}>
              <Text style={styles.driverLabel}>🚗 Driver: {order.driver.name}</Text>
              <Text style={styles.driverDetails}>{order.driver.vehicleType || 'Bike'} • 4.8⭐</Text>
              <TouchableOpacity style={styles.callDriverButton}>
                <PhoneIcon size={20} color={Colors.primary.main} />
                <Text style={styles.callDriverText}>Call Driver</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Timer */}
          <View style={styles.timerContainer}>
            <ClockIcon size={20} color={Colors.primary.main} />
            <Text style={styles.timerText}>Estimated: {formatTime(timer)}</Text>
          </View>
        </View>
        
        {/* Order Progress */}
        <View style={styles.section}>
          <OrderStatusProgress 
            status={order.status}
            estimatedDelivery={order.estimatedDelivery}
            showMap={false}
          />
        </View>
        
        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <Text style={styles.orderDate}>Placed on {formatDate(order.createdAt)}</Text>
          
          {/* Restaurant Info */}
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
              <Text style={styles.summaryValue}>₹{(parseFloat(order.totalPrice.toString()) - parseFloat(order.deliveryFee.toString())).toFixed(2)}</Text>
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
        
        {/* Action Buttons */}
        {canCancel && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelOrder}>
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: Colors.background.primary,
    borderWidth: 2,
    borderColor: Colors.action.error,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.action.error,
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
});

export default OrderDetailScreen;
