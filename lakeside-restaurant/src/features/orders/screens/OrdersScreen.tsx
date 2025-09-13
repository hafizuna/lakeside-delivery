import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CookingIcon, ClockIcon, CheckIcon } from '../../../shared/components/CustomIcons';
import { Colors } from '../../../shared/theme/colors';
import { Typography } from '../../../shared/theme/typography';
import { Spacing } from '../../../shared/theme/spacing';
import { useOrders } from '../context/OrdersContext';

// Order status enum matching backend Prisma schema
type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'DELIVERING' | 'DELIVERED' | 'CANCELLED';
type PaymentMethod = 'CASH' | 'CARD' | 'WALLET' | 'UPI';
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

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
  status: OrderStatus;
  deliveryAddress: string;
  deliveryInstructions?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
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

const OrdersScreen: React.FC = () => {
  const { 
    orders, 
    loading, 
    refreshing, 
    refreshOrders, 
    updateOrderStatus 
  } = useOrders();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');

  const onRefresh = async () => {
    await refreshOrders();
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      const success = await updateOrderStatus(orderId, newStatus);
      if (!success) {
        Alert.alert('Error', 'Failed to update order status');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const acceptOrder = (orderId: number) => {
    Alert.alert(
      'Accept Order',
      'Are you sure you want to accept this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: () => handleUpdateOrderStatus(orderId, 'ACCEPTED') },
      ]
    );
  };

  const markAsPreparing = (orderId: number) => {
    Alert.alert(
      'Mark as Preparing',
      'Mark this order as being prepared?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark as Preparing', onPress: () => handleUpdateOrderStatus(orderId, 'PREPARING') },
      ]
    );
  };

  const markAsReady = (orderId: number) => {
    Alert.alert(
      'Mark as Ready',
      'Mark this order as ready for pickup?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark as Ready', onPress: () => handleUpdateOrderStatus(orderId, 'READY') },
      ]
    );
  };

  const rejectOrder = (orderId: number) => {
    Alert.alert(
      'Reject Order',
      'Are you sure you want to reject this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => handleUpdateOrderStatus(orderId, 'CANCELLED') },
      ]
    );
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return Colors.warning.main;
      case 'ACCEPTED':
        return Colors.info.main;
      case 'PREPARING':
        return Colors.primary.main;
      case 'READY':
        return Colors.success.light;
      case 'PICKED_UP':
        return Colors.success.main;
      case 'DELIVERING':
        return Colors.success.main;
      case 'DELIVERED':
        return Colors.success.dark;
      case 'CANCELLED':
        return Colors.error.main;
      default:
        return Colors.text.secondary;
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon size={16} color={Colors.warning.main} />;
      case 'ACCEPTED':
        return <CheckIcon size={16} color={Colors.info.main} />;
      case 'PREPARING':
        return <CookingIcon size={16} color={Colors.primary.main} />;
      case 'READY':
        return <CheckIcon size={16} color={Colors.success.light} />;
      case 'PICKED_UP':
        return <CheckIcon size={16} color={Colors.success.main} />;
      case 'DELIVERING':
        return <Ionicons name="car" size={16} color={Colors.success.main} />;
      case 'DELIVERED':
        return <CheckIcon size={16} color={Colors.success.dark} />;
      case 'CANCELLED':
        return <Ionicons name="close-circle" size={16} color={Colors.error.main} />;
      default:
        return <ClockIcon size={16} color={Colors.text.secondary} />;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const filteredOrders = selectedStatus === 'ALL' 
    ? orders 
    : orders.filter(order => {
        if (selectedStatus === 'ACCEPTED') {
          return order.status === 'ACCEPTED';
        }
        if (selectedStatus === 'READY') {
          return order.status === 'READY';
        }
        if (selectedStatus === 'PICKED_UP') {
          return order.status === 'PICKED_UP';
        }
        if (selectedStatus === 'DELIVERING') {
          return order.status === 'DELIVERING';
        }
        return order.status === selectedStatus;
      });

  const pendingCount = orders.filter(order => order.status === 'PENDING').length;
  const acceptedCount = orders.filter(order => order.status === 'ACCEPTED').length;
  const preparingCount = orders.filter(order => order.status === 'PREPARING').length;
  const readyCount = orders.filter(order => order.status === 'READY').length;
  const pickedUpCount = orders.filter(order => order.status === 'PICKED_UP').length;
  const deliveringCount = orders.filter(order => order.status === 'DELIVERING').length;
  const deliveredCount = orders.filter(order => order.status === 'DELIVERED').length;
  const cancelledCount = orders.filter(o => o.status === 'CANCELLED').length;

  const renderOrderCard = (order: Order) => (
    <View key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderNumberContainer}>
          <Text style={styles.orderNumber}>Order #{order.id}</Text>
          <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} {formatTime(order.createdAt)}</Text>
        </View>
        <View style={styles.orderStatusContainer}>
          {order.status === 'PREPARING' && <CookingIcon size={16} color={Colors.success.main} />}
          {order.status === 'PENDING' && <ClockIcon size={16} color={Colors.warning.main} />}
          {order.status === 'ACCEPTED' && <CheckIcon size={16} color={Colors.info.main} />}
          {order.status === 'READY' && <CheckIcon size={16} color={Colors.success.light} />}
          {order.status === 'PICKED_UP' && <CheckIcon size={16} color={Colors.success.main} />}
          {order.status === 'DELIVERING' && <Ionicons name="car" size={16} color={Colors.success.main} />}
          {order.status === 'DELIVERED' && <CheckIcon size={16} color={Colors.success.dark} />}
          {order.status === 'CANCELLED' && <ClockIcon size={16} color={Colors.error.main} />}
          <Text style={styles.statusBadge}>
            {order.status === 'PREPARING' ? 'Cooking' : 
             order.status === 'PENDING' ? 'Pending' :
             order.status === 'ACCEPTED' ? 'Accepted' :
             order.status === 'READY' ? 'Ready' :
             order.status === 'PICKED_UP' ? 'Picked Up' :
             order.status === 'DELIVERING' ? 'Out for Delivery' :
             order.status === 'DELIVERED' ? 'Delivered' :
             order.status === 'CANCELLED' ? 'Cancelled' : order.status}
          </Text>
        </View>
      </View>

      <View style={styles.restaurantInfo}>
        <View style={styles.restaurantAvatar}>
          <Text style={styles.restaurantInitial}>E</Text>
        </View>
        <View style={styles.restaurantDetails}>
          <Text style={styles.restaurantName}>Eatsro</Text>
          <Text style={styles.customerName}>{order.customer.name}</Text>
        </View>
      </View>

      <View style={styles.itemsList}>
        <Text style={styles.itemsTitle}>Items List</Text>
        {order.orderItems.map(item => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemImageContainer}>
              <Image 
                source={{ uri: 'https://via.placeholder.com/50x50/FF6B35/FFFFFF?text=🍔' }} 
                style={styles.itemImage}
              />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.menu.itemName}</Text>
              <Text style={styles.itemDescription}>Homemade beef cutlet with signature...</Text>
              <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.itemQuantity}>
              <Text style={styles.quantityText}>{item.quantity}x</Text>
              <Text style={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.addressInfo}>
        <Ionicons name="location-outline" size={16} color={Colors.text.secondary} />
        <Text style={styles.address}>{order.deliveryAddress}</Text>
      </View>

      {order.deliveryInstructions && (
        <View style={styles.instructionsInfo}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.text.secondary} />
          <Text style={styles.instructions}>{order.deliveryInstructions}</Text>
        </View>
      )}

      <View style={styles.orderSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total:</Text>
          <Text style={styles.summaryValue}>${order.totalPrice.toFixed(2)}</Text>
        </View>
        {order.status === 'PREPARING' && (
          <View style={styles.statusIndicator}>
            <CookingIcon size={16} color={Colors.primary.main} />
            <Text style={styles.statusIndicatorText}>Cooking</Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        {order.status === 'PENDING' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => rejectOrder(order.id)}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: Colors.success.main }]}
              onPress={() => acceptOrder(order.id)}
            >
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
          </>
        )}
        {order.status === 'ACCEPTED' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.primary.main }]}
            onPress={() => markAsPreparing(order.id)}
          >
            <Text style={styles.actionButtonText}>Start Preparing</Text>
          </TouchableOpacity>
        )}
        {order.status === 'PREPARING' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.warning.main }]}
            onPress={() => markAsReady(order.id)}
          >
            <Text style={styles.actionButtonText}>Mark Ready</Text>
          </TouchableOpacity>
        )}
        {/* READY status - no button, waiting for driver pickup */}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={24} color={Colors.primary.main} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.statusFilter}
        contentContainerStyle={styles.filterContainer}
      >
        <TouchableOpacity
          style={[styles.filterButton, selectedStatus === 'PENDING' && styles.activeFilter]}
          onPress={() => setSelectedStatus('PENDING')}
        >
          <Text style={[styles.filterText, selectedStatus === 'PENDING' && styles.activeFilterText]}>
            Requests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedStatus === 'ACCEPTED' && styles.activeFilter]}
          onPress={() => setSelectedStatus('ACCEPTED')}
        >
          <Text style={[styles.filterText, selectedStatus === 'ACCEPTED' && styles.activeFilterText]}>
            Accepted
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedStatus === 'PREPARING' && styles.activeFilter]}
          onPress={() => setSelectedStatus('PREPARING')}
        >
          <Text style={[styles.filterText, selectedStatus === 'PREPARING' && styles.activeFilterText]}>
            Cooking
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedStatus === 'READY' && styles.activeFilter]}
          onPress={() => setSelectedStatus('READY')}
        >
          <Text style={[styles.filterText, selectedStatus === 'READY' && styles.activeFilterText]}>
            Ready
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredOrders.length > 0 ? (
          filteredOrders.map(renderOrderCard)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={Colors.text.disabled} />
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>
              {selectedStatus === 'ALL' 
                ? 'New orders will appear here' 
                : `No ${selectedStatus.toLowerCase()} orders`}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  statusFilter: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: Colors.background.primary,
    maxHeight: 40,
  },
  filterContainer: {
    paddingRight: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: Colors.background.secondary,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: Colors.success.main,
  },
  filterText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: 16,
  },
  activeFilterText: {
    color: Colors.background.primary,
  },
  ordersList: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  orderCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: Colors.shadow.color,
    shadowOffset: Colors.shadow.offset,
    shadowOpacity: Colors.shadow.opacity,
    shadowRadius: Colors.shadow.radius,
    elevation: Colors.shadow.elevation,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  orderNumberContainer: {
    flex: 1,
  },
  orderNumber: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  orderDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  orderStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadge: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.success.main,
    marginLeft: 4,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  restaurantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  restaurantInitial: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.background.primary,
  },
  restaurantDetails: {
    flex: 1,
  },
  restaurantName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  itemsList: {
    marginBottom: Spacing.md,
  },
  itemsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  itemImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: Spacing.sm,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  itemDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primary.main,
    marginTop: 2,
  },
  itemQuantity: {
    alignItems: 'flex-end',
  },
  quantityText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  itemTotal: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginTop: 2,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginRight: Spacing.xs,
  },
  summaryValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.main,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.light,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIndicatorText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary.main,
    marginLeft: 4,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  customerName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    marginLeft: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  customerPhone: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  orderItems: {
    marginBottom: Spacing.sm,
  },
  orderItem: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  address: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  instructionsInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  instructions: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
    flex: 1,
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  priceInfo: {
    flex: 1,
  },
  totalPrice: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.main,
  },
  paymentMethod: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: Colors.success.main,
  },
  acceptButtonText: {
    color: Colors.background.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  rejectButton: {
    backgroundColor: Colors.error.main,
  },
  rejectButtonText: {
    color: Colors.background.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  primaryButton: {
    backgroundColor: Colors.primary.main,
  },
  primaryButtonText: {
    color: Colors.background.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  actionButtonText: {
    color: Colors.background.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  statusTab: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: Colors.background.secondary,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.primary.main,
  },
  statusTabText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: 16,
  },
  activeTabText: {
    color: Colors.background.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.disabled,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});

export default OrdersScreen;
