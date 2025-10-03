import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../../shared/theme';
import { useOrders, AssignmentOffer } from '../context/OrderContext';
import { Order } from '../../../shared/services/api';
import {
  OrderRequestModal,
  ActiveOrderCard,
} from '../components';
import ActiveDeliveryScreen from './ActiveDeliveryScreen';
import { Button } from '../../../components/ui';

type TabType = 'available' | 'active' | 'history';

export const OrdersScreen: React.FC = () => {
  const {
    availableOrders = [],
    activeOrder,
    orderHistory = [],
    assignmentOffer,
    isLoading,
    error,
    fetchAvailableOrders,
    fetchOrderHistory,
    clearAssignmentOffer,
    refreshOrders,
    handleAssignmentOffer,
    acceptPoolOrder,
  } = useOrders();

  const [activeTab, setActiveTab] = useState<TabType>(
    activeOrder ? 'active' : 'available'
  );
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Update tab when active order changes
  useEffect(() => {
    if (activeOrder && activeTab !== 'active') {
      setActiveTab('active');
    }
  }, [activeOrder]);

  // Show assignment offer modal
  useEffect(() => {
    if (assignmentOffer) {
      setShowOrderModal(true);
    }
  }, [assignmentOffer]);

  // Fetch history on mount
  useEffect(() => {
    console.log('🔄 OrdersScreen mounted, fetching initial data...');
    fetchOrderHistory();
  }, []);

  const handleRefresh = async () => {
    if (activeTab === 'available') {
      await fetchAvailableOrders();
    } else if (activeTab === 'history') {
      await fetchOrderHistory();
    } else {
      await refreshOrders();
    }
  };

  const renderTabButton = (tab: TabType, title: string, badge?: number) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && styles.activeTabButton,
      ]}
      onPress={() => {
        setActiveTab(tab);
        // Fetch history when switching to history tab
        if (tab === 'history') {
          fetchOrderHistory();
        }
      }}
    >
      <View style={styles.tabContent}>
        <Text
          style={[
            styles.tabText,
            activeTab === tab && styles.activeTabText,
          ]}
        >
          {title}
        </Text>
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const handleAcceptOrder = async (order: Order & { isPoolOrder?: boolean; orderType?: string }) => {
    try {
      console.log('Attempting to accept order:', order.id, 'Type:', order.orderType || 'unknown');
      
      // Check if this is a pool order
      if (order.isPoolOrder || order.orderType === 'pool') {
        console.log('🌊 POOL ORDER: Accepting directly without modal');
        
        const success = await acceptPoolOrder(order.id);
        if (success) {
          console.log('✅ POOL ORDER: Successfully accepted, should navigate to active delivery');
          // Order is now active, the context will handle the state update
        } else {
          console.log('❌ POOL ORDER: Failed to accept');
          // Error is handled by the context and displayed to user
        }
        return;
      }
      
      // For real-time offers, use the modal system
      console.log('🟢 REAL-TIME ORDER: Using modal system');
      
      // Ensure items array exists to prevent mapping errors
      const safeOrder = {
        ...order,
        items: order.items || [] // Provide empty array if items is undefined
      };
      
      // For real-time orders, create assignment with normal timer
      const mockAssignmentOffer: AssignmentOffer = {
        id: `offer-${Date.now()}`,
        assignmentId: `assignment-${order.id}-${Date.now()}`,
        orderId: order.id,
        order: safeOrder,
        expiresAt: new Date(Date.now() + 30000), // 30 seconds for real-time
        timeRemaining: 30, // 30 seconds
        wave: 1,
        priority: 'medium',
        distance: 2.3,
        createdAt: new Date(),
      };
      
      // Trigger the assignment offer modal with this order
      handleAssignmentOffer(mockAssignmentOffer);
      
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const renderAvailableOrder = ({ item }: { item: Order & { isPoolOrder?: boolean; orderType?: string; poolEntryTime?: string } }) => {
    console.log('🔍 ORDER ITEM (should be transformed now):', {
      id: item.id,
      restaurantName: item.restaurantName,
      restaurantAddress: item.restaurantAddress,
      customerName: item.customerName,
      items: item.items,
      itemsLength: item.items?.length,
      totalAmount: item.totalAmount,
      driverEarning: item.driverEarning,
      isPoolOrder: item.isPoolOrder,
      orderType: item.orderType
    });
    
    // Now that data is transformed properly, use it directly
    const driverEarning = parseFloat(item.driverEarning?.toString() || '0');
    const totalAmount = parseFloat(item.totalAmount?.toString() || '0');
    const itemCount = item.items?.length || 0;
    const isPoolOrder = item.isPoolOrder || item.orderType === 'pool';
    
    // Calculate time in pool for pool orders
    let timeInPool = '';
    if (isPoolOrder && item.poolEntryTime) {
      const entryTime = new Date(item.poolEntryTime);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - entryTime.getTime()) / (1000 * 60));
      timeInPool = `${diffMinutes} mins waiting`;
    }

    return (
      <View style={styles.orderCard}>
        {/* Pool Order Badge - Subtle */}
        {isPoolOrder && (
          <View style={styles.poolBadge}>
            <Text style={styles.poolBadgeText}>Order is in Pool</Text>
          </View>
        )}
        
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.restaurantName}>{item.restaurantName}</Text>
            <View style={styles.orderNumberRow}>
              <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
              {isPoolOrder && timeInPool && (
                <Text style={styles.poolTime}>• {timeInPool}</Text>
              )}
            </View>
          </View>
          <View style={styles.orderValue}>
            <Text style={styles.earnings}>${driverEarning.toFixed(2)}</Text>
            <Text style={styles.earningsLabel}>You'll earn</Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText} numberOfLines={2}>
              {item.restaurantAddress}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>👤</Text>
            <Text style={styles.detailText}>
              Deliver to: {item.customerName}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📦</Text>
            <Text style={styles.detailText}>
              {itemCount} item{itemCount !== 1 ? 's' : ''} • Order total: ${totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.orderActions}>
          <View style={styles.orderDistance}>
            <Text style={styles.distanceText}>🗺️ ~2.3 km • ⏱️ 15 mins</Text>
          </View>
          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={() => handleAcceptOrder(item)}
          >
            <Text style={styles.acceptButtonText}>
              {isPoolOrder ? 'Accept Order' : 'Accept Order'}
            </Text>
            {isPoolOrder && (
              <Text style={styles.acceptButtonSubtext}>Pool order - no timer</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHistoryOrder = ({ item }: { item: Order }) => {
    console.log('📋 HISTORY ITEM (should be transformed now):', {
      id: item.id,
      restaurantName: item.restaurantName,
      status: item.status,
      driverEarning: item.driverEarning,
      deliveredAt: item.deliveredAt,
      createdAt: item.createdAt
    });
    
    // Now that data is transformed properly, use it directly
    const driverEarning = parseFloat(item.driverEarning?.toString() || '0');
    const deliveryDate = item.deliveredAt ? new Date(item.deliveredAt) : new Date(item.createdAt);
    const itemCount = item.items?.length || 0;
    
    return (
      <View style={styles.historyCard}>
        <View style={styles.historyHeader}>
          <View style={styles.historyInfo}>
            <Text style={styles.historyRestaurant}>{item.restaurantName}</Text>
            <Text style={styles.historyDate}>
              {deliveryDate.toLocaleDateString()} at {deliveryDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
          </View>
          <View style={styles.historyStatus}>
            <Text style={styles.historyEarnings}>${driverEarning.toFixed(2)}</Text>
            <View style={[
              styles.statusBadge,
              item.status === 'DELIVERED' && styles.deliveredBadge,
              item.status === 'delivered' && styles.deliveredBadge,
              item.status === 'cancelled' && styles.cancelledBadge,
            ]}>
              <Text style={[
                styles.statusText,
                (item.status === 'DELIVERED' || item.status === 'delivered') && styles.deliveredText,
                item.status === 'cancelled' && styles.cancelledText,
              ]}>
                {(item.status === 'DELIVERED' || item.status === 'delivered') ? 'Delivered' : 'Cancelled'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.historyDetailsRow}>
          <Text style={styles.historyCustomer}>Delivered to: {item.customerName}</Text>
          <Text style={styles.historyItems}>{itemCount} items</Text>
        </View>
      </View>
    );
  };

  const handleDeliveryComplete = () => {
    // When delivery is complete, switch to history tab
    // This allows the driver to see their completed delivery
    setActiveTab('history');
  };

  const renderTabContent = () => {
    if (activeTab === 'active') {
      return <ActiveDeliveryScreen onDeliveryComplete={handleDeliveryComplete} />;
    }

    if (activeTab === 'available') {
      if (!availableOrders || availableOrders.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No Available Orders</Text>
            <Text style={styles.emptyText}>
              Assignment offers will appear as real-time notifications when you're online.
            </Text>
            <Button
              title="Refresh"
              onPress={handleRefresh}
              style={styles.refreshButton}
            />
          </View>
        );
      }

      return (
        <FlatList
          data={availableOrders}
          renderItem={renderAvailableOrder}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              colors={[Colors.primary.main]}
            />
          }
        />
      );
    }

    if (activeTab === 'history') {
      console.log('📋 HISTORY TAB: orderHistory length:', orderHistory?.length || 0);
      console.log('📋 HISTORY TAB: orderHistory data:', orderHistory);
      
      if (!orderHistory || orderHistory.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Order History</Text>
            <Text style={styles.emptyText}>
              Your completed orders will appear here.
            </Text>
            <Button
              title="Refresh History"
              onPress={() => fetchOrderHistory()}
              style={styles.refreshButton}
            />
          </View>
        );
      }

      return (
        <FlatList
          data={orderHistory}
          renderItem={renderHistoryOrder}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              colors={[Colors.primary.main]}
            />
          }
        />
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {activeTab !== 'active' && (
        <View style={styles.header}>
          <Text style={styles.title}>Orders</Text>
          
          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            {renderTabButton('available', 'Available', availableOrders?.length || 0)}
            {activeOrder && renderTabButton('active', 'Active')}
            {renderTabButton('history', 'History', orderHistory?.length || 0)}
          </View>
        </View>
      )}

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>

      {/* Order Request Modal */}
      <OrderRequestModal
        visible={showOrderModal}
        offer={assignmentOffer}
        onClose={() => {
          setShowOrderModal(false);
          clearAssignmentOffer();
        }}
      />

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
    borderRadius: 12,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: Colors.primary.main,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  activeTabText: {
    color: Colors.background.primary,
  },
  badge: {
    backgroundColor: Colors.status.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.background.primary,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: Spacing.lg,
  },
  orderCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  orderInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  orderNumber: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  orderValue: {
    alignItems: 'flex-end',
  },
  earnings: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success.main,
  },
  earningsLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  orderDetails: {
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
    width: 20,
  },
  detailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    flex: 1,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  distanceText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.medium,
  },
  historyCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  historyInfo: {
    flex: 1,
  },
  historyRestaurant: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  historyDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  historyStatus: {
    alignItems: 'flex-end',
  },
  historyEarnings: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.success.main,
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
    backgroundColor: Colors.background.secondary,
  },
  deliveredBadge: {
    backgroundColor: Colors.success.light,
  },
  cancelledBadge: {
    backgroundColor: Colors.status.error + '20',
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  deliveredText: {
    color: Colors.success.dark,
  },
  cancelledText: {
    color: Colors.status.error,
  },
  historyCustomer: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  refreshButton: {
    paddingHorizontal: Spacing.xl,
  },
  // New styles for improved order cards
  orderDistance: {
    flex: 1,
  },
  acceptButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  acceptButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  
  // Pool Order Styles - Subtle
  poolBadge: {
    position: 'absolute',
    top: 82,
    right: 8,
    backgroundColor: Colors.secondary.main,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
    zIndex: 1,
  },
  poolBadgeText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poolTime: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    marginLeft: Spacing.sm,
  },
  // New styles for improved history cards
  historyDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItems: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  errorContainer: {
    backgroundColor: Colors.status.error,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.background.primary,
    textAlign: 'center',
  },
});
