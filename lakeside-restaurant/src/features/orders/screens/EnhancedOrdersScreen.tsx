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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { CookingIcon, ClockIcon, CheckIcon } from '../../../shared/components/CustomIcons';
import { Colors } from '../../../shared/theme/colors';
import { Typography } from '../../../shared/theme/typography';
import { Spacing } from '../../../shared/theme/spacing';
import { RootStackParamList } from '../../../navigation/AppNavigator';
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

type MainTab = 'ACTIVE' | 'HISTORY';
type ActiveTab = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY';
type HistoryTab = 'DELIVERED' | 'CANCELLED';

type OrdersScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const EnhancedOrdersScreen: React.FC = () => {
  const navigation = useNavigation<OrdersScreenNavigationProp>();
  const { 
    orders, 
    loading, 
    refreshing, 
    refreshOrders, 
    updateOrderStatus 
  } = useOrders();

  // Main tab state
  const [mainTab, setMainTab] = useState<MainTab>('ACTIVE');
  const [activeSubTab, setActiveSubTab] = useState<ActiveTab>('PENDING');
  const [historySubTab, setHistorySubTab] = useState<HistoryTab>('DELIVERED');

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
        { text: 'Start Preparing', onPress: () => handleUpdateOrderStatus(orderId, 'PREPARING') },
      ]
    );
  };

  const markAsReady = (orderId: number) => {
    Alert.alert(
      'Mark as Ready',
      'Mark this order as ready for pickup?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark Ready', onPress: () => handleUpdateOrderStatus(orderId, 'READY') },
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

  const handleOrderPress = (orderId: number) => {
    navigation.navigate('OrderDetail', { orderId });
  };

  // Calculate food total (excluding delivery fee)
  const getFoodTotal = (order: Order): number => {
    return order.totalPrice - order.deliveryFee;
  };

  // Filter orders based on current tab
  const getFilteredOrders = () => {
    if (mainTab === 'ACTIVE') {
      return orders.filter(order => {
        const activeStatuses: OrderStatus[] = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'];
        return activeStatuses.includes(order.status) && order.status === activeSubTab;
      });
    } else {
      const historyStatuses: OrderStatus[] = ['DELIVERED', 'CANCELLED', 'PICKED_UP', 'DELIVERING'];
      return orders.filter(order => {
        if (historySubTab === 'DELIVERED') {
          return ['DELIVERED', 'PICKED_UP', 'DELIVERING'].includes(order.status);
        } else {
          return order.status === 'CANCELLED';
        }
      });
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return Colors.warning.main;
      case 'ACCEPTED': return Colors.info.main;
      case 'PREPARING': return Colors.primary.main;
      case 'READY': return Colors.success.light;
      case 'PICKED_UP': return Colors.success.main;
      case 'DELIVERING': return Colors.success.main;
      case 'DELIVERED': return Colors.success.dark;
      case 'CANCELLED': return Colors.error.main;
      default: return Colors.text.secondary;
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return <ClockIcon size={16} color={Colors.warning.main} />;
      case 'ACCEPTED': return <CheckIcon size={16} color={Colors.info.main} />;
      case 'PREPARING': return <CookingIcon size={16} color={Colors.primary.main} />;
      case 'READY': return <CheckIcon size={16} color={Colors.success.light} />;
      case 'PICKED_UP': return <CheckIcon size={16} color={Colors.success.main} />;
      case 'DELIVERING': return <Ionicons name="car" size={16} color={Colors.success.main} />;
      case 'DELIVERED': return <CheckIcon size={16} color={Colors.success.dark} />;
      case 'CANCELLED': return <Ionicons name="close-circle" size={16} color={Colors.error.main} />;
      default: return <ClockIcon size={16} color={Colors.text.secondary} />;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusDisplayText = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'New Request';
      case 'ACCEPTED': return 'Accepted';
      case 'PREPARING': return 'Cooking';
      case 'READY': return 'Ready';
      case 'PICKED_UP': return 'Picked Up';
      case 'DELIVERING': return 'Out for Delivery';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  // Get order counts for badges
  const getActiveOrderCounts = () => {
    const counts = {
      PENDING: orders.filter(o => o.status === 'PENDING').length,
      ACCEPTED: orders.filter(o => o.status === 'ACCEPTED').length,
      PREPARING: orders.filter(o => o.status === 'PREPARING').length,
      READY: orders.filter(o => o.status === 'READY').length,
    };
    return counts;
  };

  const getHistoryOrderCounts = () => {
    const counts = {
      DELIVERED: orders.filter(o => ['DELIVERED', 'PICKED_UP', 'DELIVERING'].includes(o.status)).length,
      CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
    };
    return counts;
  };

  const renderOrderCard = (order: Order) => {
    const foodTotal = getFoodTotal(order);
    const isActiveOrder = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(order.status);

    return (
      <TouchableOpacity 
        key={order.id} 
        style={styles.orderCard}
        onPress={() => handleOrderPress(order.id)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderNumberContainer}>
            <Text style={styles.orderNumber}>Order #{order.id}</Text>
            <Text style={styles.orderDate}>
              {formatDate(order.createdAt)} • {formatTime(order.createdAt)}
            </Text>
          </View>
          <View style={styles.orderStatusContainer}>
            {getStatusIcon(order.status)}
            <Text style={[styles.statusBadge, { color: getStatusColor(order.status) }]}>
              {getStatusDisplayText(order.status)}
            </Text>
          </View>
        </View>

        <View style={styles.customerInfo}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerInitial}>
              {order.customer.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{order.customer.name}</Text>
            <Text style={styles.itemCount}>
              {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.orderSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Food Total:</Text>
            <Text style={styles.summaryValue}>${foodTotal.toFixed(2)}</Text>
          </View>
          {order.status === 'PREPARING' && (
            <View style={styles.statusIndicator}>
              <CookingIcon size={16} color={Colors.primary.main} />
              <Text style={styles.statusIndicatorText}>Cooking</Text>
            </View>
          )}
        </View>

        {/* Action buttons only for active orders */}
        {isActiveOrder && (
          <View style={styles.actionButtons}>
            {order.status === 'PENDING' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={(e) => {
                    e.stopPropagation();
                    rejectOrder(order.id);
                  }}
                >
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: Colors.success.main }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    acceptOrder(order.id);
                  }}
                >
                  <Text style={styles.actionButtonText}>Accept</Text>
                </TouchableOpacity>
              </>
            )}
            {order.status === 'ACCEPTED' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colors.primary.main }]}
                onPress={(e) => {
                  e.stopPropagation();
                  markAsPreparing(order.id);
                }}
              >
                <Text style={styles.actionButtonText}>Start Preparing</Text>
              </TouchableOpacity>
            )}
            {order.status === 'PREPARING' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colors.warning.main }]}
                onPress={(e) => {
                  e.stopPropagation();
                  markAsReady(order.id);
                }}
              >
                <Text style={styles.actionButtonText}>Mark Ready</Text>
              </TouchableOpacity>
            )}
            {order.status === 'READY' && (
              <View style={styles.waitingIndicator}>
                <Text style={styles.waitingText}>Waiting for driver pickup...</Text>
              </View>
            )}
          </View>
        )}

        {/* Tap indicator */}
        <View style={styles.tapIndicator}>
          <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
          <Text style={styles.tapIndicatorText}>Tap to view details</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredOrders = getFilteredOrders();
  const activeOrderCounts = getActiveOrderCounts();
  const historyOrderCounts = getHistoryOrderCounts();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh-outline" size={24} color={Colors.primary.main} />
        </TouchableOpacity>
      </View>

      {/* Main Tabs */}
      <View style={styles.mainTabsContainer}>
        <TouchableOpacity
          style={[styles.mainTab, mainTab === 'ACTIVE' && styles.activeMainTab]}
          onPress={() => setMainTab('ACTIVE')}
        >
          <Text style={[styles.mainTabText, mainTab === 'ACTIVE' && styles.activeMainTabText]}>
            Active Orders
          </Text>
          {Object.values(activeOrderCounts).reduce((a, b) => a + b, 0) > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {Object.values(activeOrderCounts).reduce((a, b) => a + b, 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTab, mainTab === 'HISTORY' && styles.activeMainTab]}
          onPress={() => setMainTab('HISTORY')}
        >
          <Text style={[styles.mainTabText, mainTab === 'HISTORY' && styles.activeMainTabText]}>
            Order History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sub Tabs */}
      {mainTab === 'ACTIVE' ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.subTabsContainer}
          contentContainerStyle={styles.subTabsContent}
        >
          <TouchableOpacity
            style={[styles.subTab, activeSubTab === 'PENDING' && styles.activeSubTab]}
            onPress={() => setActiveSubTab('PENDING')}
          >
            <Text style={[styles.subTabText, activeSubTab === 'PENDING' && styles.activeSubTabText]}>
              Requests
            </Text>
            {activeOrderCounts.PENDING > 0 && (
              <View style={styles.subTabBadge}>
                <Text style={styles.subTabBadgeText}>{activeOrderCounts.PENDING}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subTab, activeSubTab === 'ACCEPTED' && styles.activeSubTab]}
            onPress={() => setActiveSubTab('ACCEPTED')}
          >
            <Text style={[styles.subTabText, activeSubTab === 'ACCEPTED' && styles.activeSubTabText]}>
              Accepted
            </Text>
            {activeOrderCounts.ACCEPTED > 0 && (
              <View style={styles.subTabBadge}>
                <Text style={styles.subTabBadgeText}>{activeOrderCounts.ACCEPTED}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subTab, activeSubTab === 'PREPARING' && styles.activeSubTab]}
            onPress={() => setActiveSubTab('PREPARING')}
          >
            <Text style={[styles.subTabText, activeSubTab === 'PREPARING' && styles.activeSubTabText]}>
              Cooking
            </Text>
            {activeOrderCounts.PREPARING > 0 && (
              <View style={styles.subTabBadge}>
                <Text style={styles.subTabBadgeText}>{activeOrderCounts.PREPARING}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subTab, activeSubTab === 'READY' && styles.activeSubTab]}
            onPress={() => setActiveSubTab('READY')}
          >
            <Text style={[styles.subTabText, activeSubTab === 'READY' && styles.activeSubTabText]}>
              Ready
            </Text>
            {activeOrderCounts.READY > 0 && (
              <View style={styles.subTabBadge}>
                <Text style={styles.subTabBadgeText}>{activeOrderCounts.READY}</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.subTabsContainer}
          contentContainerStyle={styles.subTabsContent}
        >
          <TouchableOpacity
            style={[styles.subTab, historySubTab === 'DELIVERED' && styles.activeSubTab]}
            onPress={() => setHistorySubTab('DELIVERED')}
          >
            <Text style={[styles.subTabText, historySubTab === 'DELIVERED' && styles.activeSubTabText]}>
              Delivered
            </Text>
            {historyOrderCounts.DELIVERED > 0 && (
              <View style={styles.subTabBadge}>
                <Text style={styles.subTabBadgeText}>{historyOrderCounts.DELIVERED}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subTab, historySubTab === 'CANCELLED' && styles.activeSubTab]}
            onPress={() => setHistorySubTab('CANCELLED')}
          >
            <Text style={[styles.subTabText, historySubTab === 'CANCELLED' && styles.activeSubTabText]}>
              Cancelled
            </Text>
            {historyOrderCounts.CANCELLED > 0 && (
              <View style={styles.subTabBadge}>
                <Text style={styles.subTabBadgeText}>{historyOrderCounts.CANCELLED}</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Orders List */}
      <ScrollView
        style={styles.ordersContainer}
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
            <Text style={styles.emptyText}>
              {mainTab === 'ACTIVE' ? 'No active orders' : 'No order history'}
            </Text>
            <Text style={styles.emptySubtext}>
              {mainTab === 'ACTIVE' 
                ? `No ${activeSubTab.toLowerCase()} orders found`
                : `No ${historySubTab.toLowerCase()} orders found`}
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
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 10,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  
  // Main Tabs
  mainTabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.xs,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
  },
  activeMainTab: {
    backgroundColor: Colors.primary.main,
  },
  mainTabText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  activeMainTabText: {
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.semiBold,
  },
  tabBadge: {
    backgroundColor: Colors.error.main,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  tabBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },

  // Sub Tabs
  subTabsContainer: {
    backgroundColor: Colors.background.primary,
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  subTabsContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  subTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.sm,
    borderRadius: 12,
    backgroundColor: Colors.background.secondary,
    minHeight: 32,
  },
  activeSubTab: {
    backgroundColor: Colors.success.main,
  },
  subTabText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  activeSubTabText: {
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.semiBold,
  },
  subTabBadge: {
    backgroundColor: Colors.error.main,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  subTabBadgeText: {
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },

  // Orders
  ordersContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  orderCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: Colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.background.secondary,
    borderRadius: 20,
  },
  statusBadge: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: 4,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  customerInitial: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  itemCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
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
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  rejectButton: {
    backgroundColor: Colors.error.main,
  },
  rejectButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  actionButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  waitingIndicator: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  waitingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  tapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  tapIndicatorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginLeft: Spacing.xs,
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

export default EnhancedOrdersScreen;
