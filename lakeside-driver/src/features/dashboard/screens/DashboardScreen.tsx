import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../shared/theme';
import { Button } from '../../../components/ui';
import {
  DashboardIcon,
  BikeIcon,
  WalletIcon,
  OrdersIcon,
  ProfileIcon,
} from '../../../shared/components/CustomIcons';
import api from '../../../shared/services/api';
import { useToast } from '../../../shared/context/ToastContext';
import { cacheService } from '../../../shared/services/cacheService';

interface OrderItem {
  id: string;
  restaurant: string;
  address: string;
  distance: string;
  earnings: string;
  estimatedTime: string;
  items: number;
}

interface DashboardStats {
  todayEarnings: string;
  completedDeliveries: number;
  averageRating: number;
  onlineTime: string;
}

interface BackendOrder {
  id: number;
  status: string;
  restaurant: {
    name: string;
    address: string;
  };
  calculatedDriverEarning: number;
  calculatedDistance: number;
  estimatedTime: number;
  totalPrice: number;
}

interface DashboardData {
  driver: {
    name: string;
    isAvailable: boolean;
    rating: number;
    totalDeliveries: number;
  };
  todayStats: {
    earnings: number;
    deliveries: number;
    onlineTime: number;
  };
  weeklyStats: {
    earnings: number;
  };
  wallet: {
    balance: number;
  };
  availableOrdersCount: number;
}

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { showToast, showSuccess, showError, showWarning } = useToast();
  const [isOnline, setIsOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [backendOrders, setBackendOrders] = useState<BackendOrder[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    todayEarnings: '₹0.00',
    completedDeliveries: 0,
    averageRating: 5.0,
    onlineTime: '0h 0m',
  });
  
  const [availableOrders, setAvailableOrders] = useState<OrderItem[]>([]);

  // Backend integration functions
  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/driver/dashboard');
      if (response.data.success) {
        const data: DashboardData = response.data.data;
        setDashboardData(data);
        setIsOnline(data.driver.isAvailable);
        
        // Update stats with backend data
        setStats({
          todayEarnings: `₹${data.todayStats.earnings}`,
          completedDeliveries: data.todayStats.deliveries,
          averageRating: data.driver.rating,
          onlineTime: `${Math.floor(data.todayStats.onlineTime / 60)}h ${data.todayStats.onlineTime % 60}m`,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchAvailableOrders = async () => {
    try {
      const response = await api.get('/driver/orders/available');
      if (response.data.success) {
        const orders: BackendOrder[] = response.data.data;
        setBackendOrders(orders);
        
        // Transform backend orders to UI format
        const transformedOrders: OrderItem[] = orders.map(order => ({
          id: order.id.toString(),
          restaurant: order.restaurant.name,
          address: order.restaurant.address,
          distance: `${order.calculatedDistance}km`,
          earnings: `₹${order.calculatedDriverEarning}`,
          estimatedTime: `${order.estimatedTime} min`,
          items: 1, // Could calculate from orderItems
        }));
        
        setAvailableOrders(transformedOrders);
      }
    } catch (error) {
      console.error('Error fetching available orders:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchDashboardData(), fetchAvailableOrders()]);
      setLoading(false);
    };
    
    loadInitialData();
  }, []);

  // Poll for orders when online
  useEffect(() => {
    if (!isOnline) return;

    const pollInterval = setInterval(fetchAvailableOrders, 30000); // Poll every 30 seconds
    return () => clearInterval(pollInterval);
  }, [isOnline]);

  // No cleanup needed for mock location
  useEffect(() => {
    return () => {
      // TODO: Add locationService.stopTracking() when location is enabled
      console.log('Dashboard unmounting - location service disabled');
    };
  }, []);

  const handleStatusToggle = async (value: boolean) => {
    try {
      // Call backend API to update driver availability
      const response = await api.post('/driver/availability', {
        isAvailable: value
      });
      
      if (response.data.success) {
        setIsOnline(value);
        const statusMessage = value ? 'online' : 'offline';
        showToast(`You are now ${statusMessage}`, 'success');
        
        // Fetch updated dashboard data
        await fetchDashboardData();
        if (value) {
          await fetchAvailableOrders();
        } else {
          setAvailableOrders([]);
        }
      }
    } catch (error: any) {
      console.error('Status toggle error:', error);
      showToast(
        error.response?.data?.message || 'Failed to update status',
        'error'
      );
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    const orderToAccept = availableOrders.find(order => order.id === orderId);
    const backendOrder = backendOrders.find(order => order.id.toString() === orderId);
    
    if (!orderToAccept || !backendOrder) return;
    
    const statusText = backendOrder.status === 'PREPARING' ? 
      'Food is being prepared - you\'ll wait at the restaurant' : 
      'Food is ready - immediate pickup';
    
    Alert.alert(
      'Accept Delivery Request',
      `🏪 ${orderToAccept.restaurant}\n💰 Earning: ${orderToAccept.earnings}\n📍 Distance: ${orderToAccept.distance}\n\n${statusText}`,
      [
        { text: 'Decline', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              console.log('🚀 Starting order acceptance for order ID:', orderId);
              console.log('📦 Backend order:', backendOrder);
              
              // Optimistically remove from UI
              setAvailableOrders(prev => prev.filter(order => order.id !== orderId));
              
              // Call backend API to accept order
              console.log('📡 Calling backend API to accept order...');
              const response = await api.post(`/driver/orders/${orderId}/accept`);
              console.log('✅ Backend response:', response.data);
              
              if (response.data.success) {
                showToast('Order accepted successfully! 🎉', 'success');
                
                console.log('🧭 Navigating to ActiveDelivery screen...');
                console.log('📍 Navigation params:', {
                  orderId: backendOrder.id,
                  orderData: response.data.data,
                });
                
                // Navigate to delivery screen with backend order data
                navigation.navigate('ActiveDelivery', {
                  orderId: backendOrder.id,
                  orderData: response.data.data,
                });
                
                console.log('✅ Navigation completed');
                
                // Refresh dashboard data
                await fetchDashboardData();
              } else {
                console.error('❌ Backend returned unsuccessful response:', response.data);
                // Re-add order to list if acceptance failed
                setAvailableOrders(prev => [...prev, orderToAccept]);
                showToast('Failed to accept order - backend error', 'error');
              }
            } catch (error: any) {
              console.error('❌ Error accepting order:', error);
              console.error('Error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
              });
              
              // Re-add order to list if acceptance failed
              setAvailableOrders(prev => [...prev, orderToAccept]);
              
              const message = error.response?.data?.message || 'Failed to accept order';
              
              if (error.response?.status === 409) {
                showToast('Order was already assigned to another driver', 'warning');
              } else {
                showToast(message, 'error');
              }
              
              // Refresh available orders in case of conflicts
              await fetchAvailableOrders();
            }
          }
        }
      ]
    );
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchDashboardData(), fetchAvailableOrders()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const renderStatusCard = () => (
    <View style={styles.statusCard}>
      <View style={styles.statusHeader}>
        <View style={styles.statusInfo}>
          <BikeIcon 
            size={24} 
            color={isOnline ? theme.colors.driver.online : theme.colors.driver.offline} 
          />
          <Text style={styles.statusTitle}>Driver Status</Text>
        </View>
        <Switch
          value={isOnline}
          onValueChange={handleStatusToggle}
          trackColor={{
            false: theme.colors.border.medium,
            true: theme.colors.driver.online,
          }}
          thumbColor={isOnline ? theme.colors.background.primary : theme.colors.text.light}
          style={styles.switch}
        />
      </View>
      <Text style={[
        styles.statusText,
        { color: isOnline ? theme.colors.driver.online : theme.colors.driver.offline }
      ]}>
        {isOnline ? 'Online - Ready for deliveries' : 'Offline - Not accepting orders'}
      </Text>
      
      {/* Location status indicator */}
      {isOnline && (
        <View style={styles.locationStatus}>
          <View style={[
            styles.locationIndicator,
            { backgroundColor: true ? theme.colors.action.success : theme.colors.action.warning }
          ]}>
            <Text style={styles.locationText}>
              📍 Location: Mock location enabled (Maps disabled)
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderEarningsCard = () => (
    <LinearGradient
      colors={theme.colors.primary.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.earningsCard}
    >
      <View style={styles.earningsHeader}>
        <WalletIcon size={24} color={theme.colors.text.white} />
        <Text style={styles.earningsTitle}>Today's Earnings</Text>
      </View>
      <Text style={styles.earningsAmount}>{stats.todayEarnings}</Text>
      <View style={styles.earningsStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.completedDeliveries}</Text>
          <Text style={styles.statLabel}>Deliveries</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.averageRating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.onlineTime}</Text>
          <Text style={styles.statLabel}>Online</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const renderOrderItem = (order: OrderItem) => (
    <View key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.restaurantName}>{order.restaurant}</Text>
          <Text style={styles.orderAddress}>{order.address}</Text>
        </View>
        <View style={styles.orderEarnings}>
          <Text style={styles.earningsText}>{order.earnings}</Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.orderMeta}>
          <Text style={styles.metaText}>{order.distance} • {order.estimatedTime} • {order.items} items</Text>
        </View>
      </View>
      
      <Button
        title="Accept Order"
        onPress={() => handleAcceptOrder(order.id)}
        variant="primary"
        size="medium"
        style={styles.acceptButton}
      />
    </View>
  );

  const renderAvailableOrders = () => (
    <View style={styles.ordersSection}>
      <View style={styles.sectionHeader}>
        <OrdersIcon size={24} color={theme.colors.primary.main} />
        <Text style={styles.sectionTitle}>Available Orders</Text>
      </View>
      
      {!isOnline ? (
        <View style={styles.offlineMessage}>
          <Text style={styles.offlineText}>Go online to see available orders</Text>
        </View>
      ) : availableOrders.length === 0 ? (
        <View style={styles.noOrdersMessage}>
          <Text style={styles.noOrdersText}>No orders available right now</Text>
          <Text style={styles.noOrdersSubtext}>Check back in a few minutes</Text>
        </View>
      ) : (
        availableOrders.map(renderOrderItem)
      )}
    </View>
  );

  // TEMPORARY: Development debug section - REMOVE FOR PRODUCTION
  const renderDebugSection = () => (
    <View style={styles.debugSection}>
      <View style={styles.debugHeader}>
        <Text style={styles.debugTitle}>🛠️ Development Tools</Text>
        <Text style={styles.debugSubtitle}>Temporary - Remove for production</Text>
      </View>
      
      <View style={styles.debugButtons}>
        <TouchableOpacity 
          style={styles.debugButton}
          onPress={() => cacheService.showClearCacheDialog()}
        >
          <Text style={styles.debugButtonText}>🗑️ Clear Cache</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.debugButton}
          onPress={() => cacheService.showCacheInfo()}
        >
          <Text style={styles.debugButtonText}>📊 Cache Info</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.debugButton, styles.debugButtonDanger]}
          onPress={() => {
            Alert.alert(
              '🔄 Force Refresh',
              'This will reload dashboard data and clear local state.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Refresh',
                  onPress: async () => {
                    setLoading(true);
                    setAvailableOrders([]);
                    setDashboardData(null);
                    await Promise.all([fetchDashboardData(), fetchAvailableOrders()]);
                    setLoading(false);
                    showToast('Dashboard refreshed!', 'success');
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.debugButtonText}>🔄 Force Refresh</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.debugWarning}>
        ⚠️ These tools are for development only and will be removed in production builds.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.subtitle}>Ready to start earning?</Text>
        </View>

        {renderStatusCard()}
        {renderEarningsCard()}
        {renderAvailableOrders()}
        {renderDebugSection()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  welcomeText: {
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.regular,
    color: theme.colors.text.secondary,
  },
  
  // Status Card Styles
  statusCard: {
    backgroundColor: theme.colors.background.card,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.layout.shadow.sm,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.semiBold,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  statusText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  locationIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  locationText: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  
  // Earnings Card Styles
  earningsCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.layout.shadow.sm,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  earningsTitle: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.white,
    marginLeft: theme.spacing.sm,
  },
  earningsAmount: {
    fontSize: theme.typography.sizes.xxxl,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.white,
    marginBottom: theme.spacing.lg,
  },
  earningsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.white,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.white,
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.text.white,
    opacity: 0.3,
  },
  
  // Orders Section Styles
  ordersSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  
  // Order Card Styles
  orderCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.layout.shadow.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  orderInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  restaurantName: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  orderAddress: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.regular,
    color: theme.colors.text.secondary,
  },
  orderEarnings: {
    backgroundColor: theme.colors.primary.light,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.layout.borderRadius.sm,
  },
  earningsText: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.primary.dark,
  },
  orderDetails: {
    marginBottom: theme.spacing.lg,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
  acceptButton: {
    marginTop: theme.spacing.sm,
  },
  
  // Message Styles
  offlineMessage: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.layout.shadow.sm,
  },
  offlineText: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  noOrdersMessage: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.layout.shadow.sm,
  },
  noOrdersText: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  noOrdersSubtext: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  // Debug Section Styles - TEMPORARY
  debugSection: {
    backgroundColor: theme.colors.background.card,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.action.warning,
    borderStyle: 'dashed',
    ...theme.layout.shadow.sm,
  },
  debugHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  debugTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.action.warning,
    marginBottom: theme.spacing.xs,
  },
  debugSubtitle: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  debugButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  debugButton: {
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.layout.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    width: '48%',
    alignItems: 'center',
  },
  debugButtonDanger: {
    borderColor: theme.colors.action.error,
    backgroundColor: `${theme.colors.action.error}10`,
  },
  debugButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  debugWarning: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.weights.regular,
    color: theme.colors.action.warning,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
