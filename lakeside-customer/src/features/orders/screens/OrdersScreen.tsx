import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { 
  ClockIcon,
  MapIcon,
  StarIcon,
  OrdersIcon,
  CheckIcon,
  TrashIcon,
  BackIcon,
  PhoneIcon
} from '../../../shared/components/CustomIcons';
import { ratingAPI } from '../../../shared/services/api';
import { Modal } from 'react-native';
import Rating, { RatingData } from '../../../shared/components/Rating';
import { SharedHeader } from '../../../shared/components/SharedHeader';
import { Colors } from '../../../shared/theme/colors';
import { Order, OrderStatus } from '../../../shared/types/Order';
import { orderAPI } from '../../../shared/services/api';
import { useCart } from '../../cart/context/CartContext';

interface OrdersScreenProps {
  navigation: any;
}

const OrdersScreen: React.FC<OrdersScreenProps> = ({ navigation }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const { state } = useCart();
  
  // Rating state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [ratingType, setRatingType] = useState<'restaurant' | 'order' | 'driver'>('order');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingStates, setRatingStates] = useState<{[key: string]: {hasRatedOrder: boolean, hasRatedRestaurant: boolean, hasRatedDriver: boolean}}>({});

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getUserOrders();
      if (response.success) {
        setOrders(response.data);
        // Load rating states for delivered orders
        await loadRatingStates(response.data);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadRatingStates = async (orders: Order[]) => {
    const deliveredOrders = orders.filter(order => order.status === 'DELIVERED');
    const newRatingStates: {[key: string]: {hasRatedOrder: boolean, hasRatedRestaurant: boolean, hasRatedDriver: boolean}} = {};
    
    for (const order of deliveredOrders) {
      try {
        // Check order rating
        const orderRatingResponse = await ratingAPI.checkRating('order', order.id);
        const hasRatedOrder = orderRatingResponse.success && orderRatingResponse.data.hasRated;
        
        // Check restaurant rating
        const restaurantRatingResponse = await ratingAPI.checkRating('restaurant', order.restaurant.id);
        const hasRatedRestaurant = restaurantRatingResponse.success && restaurantRatingResponse.data.hasRated;
        
        // Check driver rating (only if order has a driver)
        let hasRatedDriver = false;
        if (order.driverId) {
          const driverRatingResponse = await ratingAPI.checkRating('driver', order.driverId);
          hasRatedDriver = driverRatingResponse.success && driverRatingResponse.data.hasRated;
        }
        
        newRatingStates[order.id] = {
          hasRatedOrder,
          hasRatedRestaurant,
          hasRatedDriver
        };
      } catch (error) {
        console.error(`Error checking rating states for order ${order.id}:`, error);
        // Default to not rated if error
        newRatingStates[order.id] = {
          hasRatedOrder: false,
          hasRatedRestaurant: false,
          hasRatedDriver: false
        };
      }
    }
    
    setRatingStates(newRatingStates);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleCancelOrder = async (orderId: number) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await orderAPI.cancelOrder(orderId);
              if (response.success) {
                Alert.alert('Success', 'Order cancelled successfully');
                loadOrders();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel order. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getStatusIcon = (status: OrderStatus) => {
    const iconProps = { size: 16, color: Colors.background.primary };
    
    switch (status) {
      case OrderStatus.PENDING:
        return <ClockIcon {...iconProps} />;
      case OrderStatus.ACCEPTED:
        return <CheckIcon {...iconProps} />;
      case OrderStatus.PREPARING:
        return <OrdersIcon {...iconProps} />;
      case OrderStatus.READY:
        return <CheckIcon {...iconProps} />;
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
      case OrderStatus.READY:
        return Colors.status.confirmed;
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
      case OrderStatus.READY:
        return 'Food Ready';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const isActiveOrder = (status: OrderStatus) => {
    return [
      OrderStatus.PENDING,
      OrderStatus.ACCEPTED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.PICKED_UP,
      OrderStatus.DELIVERING
    ].includes(status);
  };

  const handleRateOrder = (order: Order, type: 'restaurant' | 'order' | 'driver') => {
    setSelectedOrder(order);
    setRatingType(type);
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async (ratingData: RatingData) => {
    if (!selectedOrder) return;

    setIsSubmittingRating(true);
    try {
      if (ratingType === 'restaurant') {
        await ratingAPI.rateRestaurant(selectedOrder.restaurant.id, ratingData.rating, ratingData.comment);
        Alert.alert('Rating Submitted', 'Thank you for rating the restaurant!');
      } else if (ratingType === 'order') {
        await ratingAPI.rateOrder(selectedOrder.id, ratingData.rating, ratingData.comment);
        Alert.alert('Rating Submitted', 'Thank you for rating your order!');
      } else if (ratingType === 'driver' && selectedOrder.driverId) {
        await ratingAPI.rateDriver(selectedOrder.driverId, ratingData.rating, ratingData.comment);
        Alert.alert('Rating Submitted', 'Thank you for rating the driver!');
      }
      setShowRatingModal(false);
      setSelectedOrder(null);
      // Reload rating states to update buttons
      await loadRatingStates(orders);
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Rating Failed', 'Unable to submit rating. Please try again.');
    } finally {
      setIsSubmittingRating(false);
    }
  };


  const filteredOrders = orders.filter(order => 
    activeTab === 'active' ? isActiveOrder(order.status) : !isActiveOrder(order.status)
  );

  const renderOrderItem = ({ item }: { item: Order }) => {
    const canCancel = item.status === OrderStatus.PENDING || item.status === OrderStatus.ACCEPTED || item.status === OrderStatus.PREPARING;
    const isActiveOrder = [
      OrderStatus.PENDING,
      OrderStatus.ACCEPTED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
      OrderStatus.PICKED_UP,
      OrderStatus.DELIVERING
    ].includes(item.status);
    
    const isHistoryOrder = activeTab === 'completed';
    
    return (
      <TouchableOpacity 
        style={[styles.orderCard, isHistoryOrder && styles.historyOrderCard]}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      >
        <View style={styles.orderHeader}>
          <View style={styles.restaurantInfo}>
            <Image
              source={{ uri: item.restaurant.logoUrl || 'https://via.placeholder.com/50x50' }}
              style={styles.restaurantLogo}
            />
            <View style={styles.restaurantDetails}>
              <Text style={styles.restaurantName}>{item.restaurant.name}</Text>
              <View style={styles.orderMeta}>
                <MapIcon size={12} color={Colors.text.secondary} />
                <Text style={styles.restaurantAddress}>{item.restaurant.address}</Text>
              </View>
            </View>
          </View>
          <View style={styles.orderTime}>
            <Text style={styles.timeText}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        {/* Status Badge - Different for history */}
        <View style={[styles.orderStatus, isHistoryOrder && styles.historyOrderStatus]}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            {getStatusIcon(item.status)}
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
          
          {/* Show delivery date for completed orders */}
          {isHistoryOrder && (
            <Text style={styles.completedDate}>
              Completed: {formatDate(item.updatedAt || item.createdAt)}
            </Text>
          )}
        </View>

        <View style={styles.orderItems}>
          <Text style={styles.itemsLabel}>Items:</Text>
          {item.orderItems.slice(0, isHistoryOrder ? 3 : 2).map((orderItem, index) => (
            <Text key={index} style={styles.itemText}>
              {orderItem.quantity}x {orderItem.menu.itemName}
            </Text>
          ))}
          {item.orderItems.length > (isHistoryOrder ? 3 : 2) && (
            <Text style={styles.moreItems}>
              +{item.orderItems.length - (isHistoryOrder ? 3 : 2)} more items
            </Text>
          )}
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.priceInfo}>
            <Text style={styles.totalPrice}>₹{parseFloat(item.totalPrice.toString()).toFixed(2)}</Text>
            <Text style={styles.deliveryFee}>Delivery: ₹{parseFloat(item.deliveryFee.toString()).toFixed(2)}</Text>
          </View>
          
          <View style={styles.orderActions}>
            {/* Active Order Actions */}
            {isActiveOrder && canCancel && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelOrder(item.id)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
            
            {/* History Order Actions - Rating Buttons Only */}
            {isHistoryOrder && item.status === OrderStatus.DELIVERED && (
              <View style={styles.ratingActionsContainer}>
                <View style={styles.ratingActionsRow}>
                  <TouchableOpacity 
                    style={[
                      styles.rateOrderButton,
                      ratingStates[item.id]?.hasRatedOrder && styles.ratedButton
                    ]}
                    onPress={() => handleRateOrder(item, 'order')}
                    disabled={ratingStates[item.id]?.hasRatedOrder}
                  >
                    <StarIcon 
                      size={16} 
                      color={ratingStates[item.id]?.hasRatedOrder ? Colors.action.success : Colors.primary.main} 
                    />
                    <Text style={[
                      styles.rateOrderText,
                      ratingStates[item.id]?.hasRatedOrder && styles.ratedText
                    ]}>
                      {ratingStates[item.id]?.hasRatedOrder ? 'Rated' : 'Rate Order'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.rateRestaurantButton,
                      ratingStates[item.id]?.hasRatedRestaurant && styles.ratedButton
                    ]}
                    onPress={() => handleRateOrder(item, 'restaurant')}
                    disabled={ratingStates[item.id]?.hasRatedRestaurant}
                  >
                    <StarIcon 
                      size={16} 
                      color={ratingStates[item.id]?.hasRatedRestaurant ? Colors.action.success : Colors.action.warning} 
                    />
                    <Text style={[
                      styles.rateRestaurantText,
                      ratingStates[item.id]?.hasRatedRestaurant && styles.ratedText
                    ]}>
                      {ratingStates[item.id]?.hasRatedRestaurant ? 'Rated' : 'Rate Restaurant'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Driver Rating Button - Only show if order has a driver */}
                {item.driverId && (
                  <TouchableOpacity 
                    style={[
                      styles.rateDriverButton,
                      ratingStates[item.id]?.hasRatedDriver && styles.ratedButton
                    ]}
                    onPress={() => handleRateOrder(item, 'driver')}
                    disabled={ratingStates[item.id]?.hasRatedDriver}
                  >
                    <StarIcon 
                      size={16} 
                      color={ratingStates[item.id]?.hasRatedDriver ? Colors.action.success : '#6B46C1'} 
                    />
                    <Text style={[
                      styles.rateDriverText,
                      ratingStates[item.id]?.hasRatedDriver && styles.ratedText
                    ]}>
                      {ratingStates[item.id]?.hasRatedDriver ? 'Driver Rated' : 'Rate Driver'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            
            {/* Active order actions */}
            {!isHistoryOrder && (
              <TouchableOpacity 
                style={styles.viewButton}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
              >
                <Text style={styles.viewButtonText}>View Details</Text>
                <BackIcon size={14} color={Colors.primary.main} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <OrdersIcon size={64} color={Colors.text.light} />
      <Text style={styles.emptyTitle}>
        {activeTab === 'active' ? 'No Active Orders' : 'No Order History'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'active' 
          ? 'Your active orders will appear here' 
          : 'Your completed orders will appear here'
        }
      </Text>
      {activeTab === 'active' && (
        <TouchableOpacity 
          style={styles.browseButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.browseButtonText}>Browse Restaurants</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const handleCartPress = () => {
    navigation.navigate('Home'); // Navigate back to home to access cart
  };

  const handleMenuPress = () => {
    // Handle menu press - could open drawer or show menu
    console.log('Menu pressed');
  };

  const handleNotificationPress = () => {
    // Handle notification press
    console.log('Notifications pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Shared Header */}
      <SharedHeader 
        cartItemCount={state.totalItems}
        onCartPress={handleCartPress}
        onNotificationPress={handleNotificationPress}
        onMenuPress={handleMenuPress}
      />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Order History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => `order-${item.id}`}
        contentContainerStyle={styles.ordersList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary.main]}
            tintColor={Colors.primary.main}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
      
      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>
                Rate {ratingType === 'restaurant' ? selectedOrder?.restaurant.name : 'Your Order'}
              </Text>
              <TouchableOpacity
                style={modalStyles.closeButton}
                onPress={() => setShowRatingModal(false)}
              >
                <Text style={modalStyles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Rating
              title={ratingType === 'restaurant' ? 'Rate Restaurant' : ratingType === 'driver' ? 'Rate Driver' : 'Rate Your Order'}
              subtitle={ratingType === 'restaurant' 
                ? `How was your experience with ${selectedOrder?.restaurant.name}?`
                : ratingType === 'driver'
                ? 'How was your delivery experience with the driver?'
                : 'How was your overall order experience?'
              }
              onRatingSubmit={handleRatingSubmit}
              isLoading={isSubmittingRating}
              onCancel={() => setShowRatingModal(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.primary.main,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  activeTabText: {
    color: Colors.text.white,
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  restaurantInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  restaurantLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  restaurantDetails: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantAddress: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginLeft: 4,
    flex: 1,
  },
  orderTime: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: Colors.text.light,
  },
  orderStatus: {
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.white,
    marginLeft: 6,
  },
  orderItems: {
    marginBottom: 16,
  },
  itemsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  itemText: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  moreItems: {
    fontSize: 13,
    color: Colors.text.light,
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceInfo: {
    flex: 1,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  deliveryFee: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  orderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.action.error,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.action.error,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary.light,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary.main,
    marginRight: 4,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.primary.main,
    marginRight: 8,
  },
  rateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary.main,
    marginLeft: 4,
  },
  // History Order Styles
  historyOrderCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.status.delivered,
  },
  historyOrderStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedDate: {
    fontSize: 11,
    color: Colors.text.light,
    fontStyle: 'italic',
  },
  // Rating Action Styles
  ratingActions: {
    flexDirection: 'column',
    gap: 6,
  },
  ratingActionsContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  ratingActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rateOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: Colors.primary.light,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  rateRestaurantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#FFF8DC',
    borderWidth: 1,
    borderColor: Colors.action.warning,
  },
  rateOrderText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary.main,
    marginLeft: 6,
  },
  rateRestaurantText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.action.warning,
    marginLeft: 6,
  },
  ratedButton: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.action.success,
    opacity: 0.7,
  },
  ratedText: {
    color: Colors.action.success,
  },
  rateDriverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#F3F0FF',
    borderWidth: 1,
    borderColor: '#6B46C1',
    alignSelf: 'flex-start',
  },
  rateDriverText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B46C1',
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.white,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
});

export default OrdersScreen;
