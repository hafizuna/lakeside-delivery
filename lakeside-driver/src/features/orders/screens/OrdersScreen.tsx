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
import { useOrders } from '../context/OrderContext';
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
      onPress={() => setActiveTab(tab)}
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

  const renderAvailableOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.restaurantName}>{item.restaurantName}</Text>
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
        </View>
        <View style={styles.orderValue}>
          <Text style={styles.earnings}>₹{item.driverEarning + item.tip}</Text>
          <Text style={styles.earningsLabel}>Earnings</Text>
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
          <Text style={styles.detailText}>{item.customerName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📦</Text>
          <Text style={styles.detailText}>
            {item.items?.length || 0} item{(item.items?.length || 0) !== 1 ? 's' : ''} • ₹{item.totalAmount}
          </Text>
        </View>
      </View>

      <View style={styles.orderActions}>
        <Text style={styles.distanceText}>~2.3 km • 15 mins</Text>
      </View>
    </View>
  );

  const renderHistoryOrder = ({ item }: { item: Order }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <View style={styles.historyInfo}>
          <Text style={styles.historyRestaurant}>{item.restaurantName}</Text>
          <Text style={styles.historyDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.historyStatus}>
          <Text style={styles.historyEarnings}>₹{item.driverEarning + item.tip}</Text>
          <View style={[
            styles.statusBadge,
            item.status === 'delivered' && styles.deliveredBadge,
            item.status === 'cancelled' && styles.cancelledBadge,
          ]}>
            <Text style={[
              styles.statusText,
              item.status === 'delivered' && styles.deliveredText,
              item.status === 'cancelled' && styles.cancelledText,
            ]}>
              {item.status === 'delivered' ? 'Delivered' : 'Cancelled'}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.historyCustomer}>To: {item.customerName}</Text>
    </View>
  );

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
      if (!orderHistory || orderHistory.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Order History</Text>
            <Text style={styles.emptyText}>
              Your completed orders will appear here.
            </Text>
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
