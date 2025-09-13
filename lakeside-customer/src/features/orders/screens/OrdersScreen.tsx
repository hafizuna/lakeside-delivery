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

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getUserOrders();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
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

  const filteredOrders = orders.filter(order => 
    activeTab === 'active' ? isActiveOrder(order.status) : !isActiveOrder(order.status)
  );

  const renderOrderItem = ({ item }: { item: Order }) => {
    const canCancel = item.status === OrderStatus.PENDING || item.status === OrderStatus.ACCEPTED || item.status === OrderStatus.PREPARING;
    
    return (
      <TouchableOpacity 
        style={styles.orderCard}
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

        <View style={styles.orderStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            {getStatusIcon(item.status)}
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.orderItems}>
          <Text style={styles.itemsLabel}>Items:</Text>
          {item.orderItems.slice(0, 2).map((orderItem, index) => (
            <Text key={index} style={styles.itemText}>
              {orderItem.quantity}x {orderItem.menu.itemName}
            </Text>
          ))}
          {item.orderItems.length > 2 && (
            <Text style={styles.moreItems}>
              +{item.orderItems.length - 2} more items
            </Text>
          )}
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.priceInfo}>
            <Text style={styles.totalPrice}>₹{parseFloat(item.totalPrice.toString()).toFixed(2)}</Text>
            <Text style={styles.deliveryFee}>Delivery: ₹{parseFloat(item.deliveryFee.toString()).toFixed(2)}</Text>
          </View>
          
          <View style={styles.orderActions}>
            {canCancel && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelOrder(item.id)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View Details</Text>
              <BackIcon size={14} color={Colors.primary.main} />
            </TouchableOpacity>
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

export default OrdersScreen;
