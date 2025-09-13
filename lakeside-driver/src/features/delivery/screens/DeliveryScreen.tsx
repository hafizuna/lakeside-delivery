import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../../shared/theme';
import { Button } from '../../../components/ui';
import {
  DeliveryBoxIcon,
  LocationPinIcon,
  PhoneIcon,
  TimerIcon,
  NavigationIcon,
  PickupIcon,
  DeliveredIcon,
  BackIcon,
  RefreshIcon,
} from '../../../shared/components/CustomIcons';
import api from '../../../shared/services/api';
import { useToast } from '../../../shared/context/ToastContext';

interface BackendOrder {
  id: number;
  status: string;
  totalPrice: number;
  deliveryFee: number;
  driverEarning: number;
  pickupLat?: number | string;
  pickupLng?: number | string;
  deliveryLat?: number | string;
  deliveryLng?: number | string;
  deliveryAddress: string;
  restaurant: {
    id: number;
    name: string;
    address: string;
    lat: number | string;
    lng: number | string;
    user: {
      name: string;
      phone: string;
    };
  };
  customer: {
    id: number;
    name: string;
    phone: string;
  };
  orderItems: Array<{
    id: number;
    quantity: number;
    menu: {
      itemName: string;
      price: number;
      imageUrl?: string;
    };
  }>;
}

interface DeliveryOrder {
  id: string;
  restaurant: {
    name: string;
    address: string;
    phone: string;
    lat: number;
    lng: number;
  };
  customer: {
    name: string;
    address: string;
    phone: string;
    lat: number;
    lng: number;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
  totalAmount: string;
  deliveryFee: string;
  earnings: string;
  estimatedTime: string;
  distance: string;
  status: 'PREPARING' | 'READY' | 'PICKED_UP' | 'DELIVERING' | 'DELIVERED';
}

export const DeliveryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { showToast, showSuccess, showError } = useToast();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [backendOrder, setBackendOrder] = useState<BackendOrder | null>(null);
  const [timer, setTimer] = useState(1500); // 25 minutes in seconds
  const [lastStatusCheck, setLastStatusCheck] = useState<number>(Date.now());
  
  // Polling refs
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const isPollingActive = useRef(false);
  
  // Get order data from navigation params (if navigated from dashboard)
  const orderParams = route?.params;
  const hasNavigationOrder = orderParams?.orderData || orderParams?.orderId;


  // Utility function to safely parse coordinates
  const parseCoordinate = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Backend integration functions
  const transformBackendOrder = (backendOrder: BackendOrder): DeliveryOrder => {
    console.log('Transforming backend order:', {
      restaurantLat: backendOrder.restaurant.lat,
      restaurantLng: backendOrder.restaurant.lng,
      deliveryLat: backendOrder.deliveryLat,
      deliveryLng: backendOrder.deliveryLng
    });

    return {
      id: backendOrder.id.toString(),
      restaurant: {
        name: backendOrder.restaurant.name,
        address: backendOrder.restaurant.address,
        phone: backendOrder.restaurant.user.phone,
        lat: parseCoordinate(backendOrder.restaurant.lat),
        lng: parseCoordinate(backendOrder.restaurant.lng),
      },
      customer: {
        name: backendOrder.customer.name,
        address: backendOrder.deliveryAddress,
        phone: backendOrder.customer.phone,
        lat: parseCoordinate(backendOrder.deliveryLat || 0),
        lng: parseCoordinate(backendOrder.deliveryLng || 0),
      },
      items: backendOrder.orderItems.map(item => ({
        name: item.menu.itemName,
        quantity: item.quantity,
        price: `₹${item.menu.price}`,
      })),
      totalAmount: `₹${backendOrder.totalPrice}`,
      deliveryFee: `₹${backendOrder.deliveryFee}`,
      earnings: `₹${backendOrder.driverEarning}`,
      estimatedTime: '25 min', // Can be calculated
      distance: '1.2 km', // Can be calculated
      status: backendOrder.status as 'PREPARING' | 'READY' | 'PICKED_UP' | 'DELIVERING' | 'DELIVERED',
    };
  };

  const fetchActiveOrder = async () => {
    try {
      const response = await api.get('/driver/orders/active');
      if (response.data.success && response.data.data) {
        const backendOrder: BackendOrder = response.data.data;
        setBackendOrder(backendOrder);
        const transformedOrder = transformBackendOrder(backendOrder);
        setOrder(transformedOrder);
      } else {
        // No active order
        setOrder(null);
        setBackendOrder(null);
      }
    } catch (error) {
      console.error('Error fetching active order:', error);
      showToast('Failed to fetch active order', 'error');
      setOrder(null);
      setBackendOrder(null);
    }
  };

  // Smart status checking that only updates order data, not map
  const checkForStatusUpdates = useCallback(async (silent: boolean = true) => {
    if (!backendOrder || isPollingActive.current) return;
    
    try {
      isPollingActive.current = true;
      const response = await api.get('/driver/orders/active');
      
      if (response.data.success && response.data.data) {
        const newBackendOrder: BackendOrder = response.data.data;
        
        // Only update if there's actually a status change
        if (newBackendOrder.status !== backendOrder.status) {
          console.log(`Status changed from ${backendOrder.status} to ${newBackendOrder.status}`);
          
          setBackendOrder(newBackendOrder);
          const transformedOrder = transformBackendOrder(newBackendOrder);
          setOrder(transformedOrder);
          
          // Show toast notification for status changes (except on silent checks)
          if (!silent) {
            showToast(`Order status updated to ${getStatusText(newBackendOrder.status as any)}`, 'success');
          }
          
          setLastStatusCheck(Date.now());
        }
      }
    } catch (error) {
      // Silent fail on status checks to avoid spam
      console.log('Status check failed:', error);
    } finally {
      isPollingActive.current = false;
    }
  }, [backendOrder, showToast]);

  // Polling management
  const startStatusPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
    
    // Determine polling frequency based on order status
    const getPollingInterval = (status: string) => {
      switch (status) {
        case 'PREPARING':
          return 10000; // Check every 10 seconds when food is being prepared
        case 'READY':
          return 15000; // Check every 15 seconds when ready for pickup
        case 'PICKED_UP':
        case 'DELIVERING':
          return 30000; // Check every 30 seconds during delivery
        default:
          return 20000; // Default 20 seconds
      }
    };
    
    if (backendOrder && backendOrder.status !== 'DELIVERED') {
      const intervalMs = getPollingInterval(backendOrder.status);
      console.log(`Starting status polling every ${intervalMs/1000}s for status: ${backendOrder.status}`);
      
      pollingInterval.current = setInterval(() => {
        checkForStatusUpdates(true);
      }, intervalMs);
    }
  }, [backendOrder, checkForStatusUpdates]);
  
  const stopStatusPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
      console.log('Status polling stopped');
    }
  }, []);

  const updateOrderStatus = async (newStatus: string) => {
    if (!backendOrder) {
      console.error('No backend order available for status update');
      showToast('No active order to update', 'error');
      return;
    }
    
    try {
      console.log(`Updating order #${backendOrder.id} from ${backendOrder.status} to ${newStatus}`);
      
      const response = await api.patch(`/driver/orders/${backendOrder.id}/status`, {
        status: newStatus
      });
      
      console.log('Status update response:', response.data);
      
      if (response.data.success) {
        // Update local state
        const updatedBackendOrder = { ...backendOrder, status: newStatus };
        setBackendOrder(updatedBackendOrder);
        const transformedOrder = transformBackendOrder(updatedBackendOrder);
        setOrder(transformedOrder);
        
        showToast(response.data.message, 'success');
        
        // If delivered, navigate back to dashboard after a delay
        if (newStatus === 'DELIVERED') {
          setTimeout(() => {
            navigation.navigate('Dashboard');
          }, 3000);
        }
      }
    } catch (error: any) {
      console.error('Error updating order status:', error);
      
      // Log detailed error information
      console.log('Error details:');
      console.log('- Status Code:', error.response?.status);
      console.log('- Error Message:', error.response?.data?.message);
      console.log('- Full Response:', error.response?.data);
      console.log('- Request URL:', error.config?.url);
      console.log('- Request Data:', error.config?.data);
      console.log('- Request Headers:', error.config?.headers);
      
      let errorMessage = 'Failed to update order status';
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid status transition';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Not authorized to update this order.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Order not found or not assigned to you.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      showToast(errorMessage, 'error');
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      if (hasNavigationOrder) {
        // Use order data from navigation params
        if (orderParams.orderData) {
          const backendOrderData: BackendOrder = orderParams.orderData;
          setBackendOrder(backendOrderData);
          const transformedOrder = transformBackendOrder(backendOrderData);
          setOrder(transformedOrder);
        }
      } else {
        // Fetch active order from backend (History tab case)
        await fetchActiveOrder();
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [hasNavigationOrder]);

  // Polling lifecycle management
  useEffect(() => {
    if (backendOrder && backendOrder.status !== 'DELIVERED') {
      console.log('Starting status polling for order:', backendOrder.id, 'status:', backendOrder.status);
      startStatusPolling();
    } else {
      console.log('Stopping status polling');
      stopStatusPolling();
    }
    
    // Cleanup on unmount
    return () => {
      stopStatusPolling();
    };
  }, [backendOrder?.status, startStatusPolling, stopStatusPolling]);

  // Enhanced refresh function with status check
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    
    // If we have an active order, check for status updates first
    if (backendOrder) {
      await checkForStatusUpdates(false); // Show toast on manual refresh
    } else {
      await fetchActiveOrder();
    }
    
    setRefreshing(false);
  }, [backendOrder, checkForStatusUpdates]);

  // Location tracking lifecycle management - TEMPORARILY DISABLED
  useEffect(() => {
    // TODO: Re-enable after fixing iOS location permissions
    console.log('Location tracking is temporarily disabled due to iOS permissions');
    
    // Mock location for map display
    if (order && backendOrder) {
      console.log(`Mock location set for order #${order.id} (${order.status})`);
      // You can add mock location logic here if needed
    }
  }, [order?.status, backendOrder?.id]);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCallRestaurant = () => {
    if (!order) return;
    const phoneUrl = `tel:${order.restaurant.phone}`;
    Linking.openURL(phoneUrl).catch(err => 
      Alert.alert('Error', 'Unable to make phone call')
    );
  };

  const handleCallCustomer = () => {
    if (!order) return;
    const phoneUrl = `tel:${order.customer.phone}`;
    Linking.openURL(phoneUrl).catch(err => 
      Alert.alert('Error', 'Unable to make phone call')
    );
  };

  const handleNavigateToRestaurant = () => {
    if (!order) return;
    const address = encodeURIComponent(order.restaurant.address);
    const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    Linking.openURL(url).catch(() => 
      Alert.alert('Error', 'Unable to open navigation')
    );
  };

  const handleNavigateToCustomer = () => {
    if (!order) return;
    const address = encodeURIComponent(order.customer.address);
    const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    Linking.openURL(url).catch(() => 
      Alert.alert('Error', 'Unable to open navigation')
    );
  };

  const handleStatusUpdate = (newStatus: DeliveryOrder['status']) => {
    // Update status on backend
    updateOrderStatus(newStatus);
  };

  const getStatusColor = (status: DeliveryOrder['status']) => {
    switch (status) {
      case 'PREPARING':
      case 'READY':
        return theme.colors.status.confirmed;
      case 'PICKED_UP':
        return theme.colors.driver.atRestaurant;
      case 'DELIVERING':
        return theme.colors.driver.delivering;
      case 'DELIVERED':
        return theme.colors.driver.online;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getStatusText = (status: DeliveryOrder['status']) => {
    switch (status) {
      case 'PREPARING':
        return 'Restaurant Preparing Food';
      case 'READY':
        return 'Ready for Pickup';
      case 'PICKED_UP':
        return 'Order Picked Up';
      case 'DELIVERING':
        return 'Delivering to Customer';
      case 'DELIVERED':
        return 'Delivered';
      default:
        return 'Unknown Status';
    }
  };

  const renderHeader = () => {
    if (!order) return null;
    return (
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BackIcon size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Order #{order.id}</Text>
          <Text style={[
            styles.statusBadge,
            { color: getStatusColor(order.status) }
          ]}>
          {getStatusText(order.status)}
          </Text>
        </View>
        <View style={styles.timer}>
          <TimerIcon size={20} color={theme.colors.action.warning} />
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
        </View>
      </View>
    );
  };

  const renderOrderSummary = () => {
    if (!order) return null;
    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <DeliveryBoxIcon size={24} color={theme.colors.primary.main} />
          <Text style={styles.summaryTitle}>Order Details</Text>
        </View>
        
        <View style={styles.itemsList}>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.quantity}x {item.name}</Text>
              <Text style={styles.itemPrice}>{item.price}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Order Total</Text>
            <Text style={styles.totalValue}>{order.totalAmount}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Delivery Fee</Text>
            <Text style={styles.totalValue}>{order.deliveryFee}</Text>
          </View>
          <View style={[styles.totalRow, styles.earningsRow]}>
            <Text style={styles.earningsLabel}>Your Earnings</Text>
            <Text style={styles.earningsValue}>{order.earnings}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderLocationCard = (type: 'restaurant' | 'customer') => {
    if (!order) return null;
    const location = type === 'restaurant' ? order.restaurant : order.customer;
    const isRestaurant = type === 'restaurant';
    
    return (
      <View style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <LocationPinIcon 
            size={24} 
            color={isRestaurant ? theme.colors.primary.main : theme.colors.action.success} 
          />
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>
              {isRestaurant ? 'Pickup Location' : 'Delivery Location'}
            </Text>
            <Text style={styles.locationName}>{location.name}</Text>
            <Text style={styles.locationAddress}>{location.address}</Text>
          </View>
        </View>
        
        <View style={styles.locationActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={isRestaurant ? handleCallRestaurant : handleCallCustomer}
          >
            <PhoneIcon size={20} color={theme.colors.action.info} />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={isRestaurant ? handleNavigateToRestaurant : handleNavigateToCustomer}
          >
            <NavigationIcon size={20} color={theme.colors.primary.main} />
            <Text style={styles.actionText}>Navigate</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCompactActionButtons = () => {
    if (!order) return null;
    if (order.status === 'DELIVERED') {
      return (
        <View style={styles.completedCompactSection}>
          <DeliveredIcon size={24} color={theme.colors.driver.online} />
          <Text style={styles.completedCompactText}>Delivery Completed!</Text>
          <Button
            title="Back to Dashboard"
            onPress={() => navigation.navigate('Dashboard')}
            variant="primary"
            style={styles.compactButton}
          />
        </View>
      );
    }

    let primaryButton: {
      title: string;
      onPress: () => void;
      disabled?: boolean;
    } | null = null;

    switch (order.status) {
      case 'PREPARING':
        primaryButton = {
          title: 'Waiting...',
          onPress: () => {
            Alert.alert(
              'Order Being Prepared',
              'Restaurant is still preparing the order.',
              [{ text: 'OK' }]
            );
          },
          disabled: true
        };
        break;
      case 'READY':
        primaryButton = {
          title: 'Pick Up Order',
          onPress: () => {
            Alert.alert(
              'Confirm Pickup',
              'Ready to pick up the order?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Yes', onPress: () => handleStatusUpdate('PICKED_UP') }
              ]
            );
          },
          disabled: false
        };
        break;
      case 'PICKED_UP':
        primaryButton = {
          title: 'Start Delivery',
          onPress: () => {
            Alert.alert(
              'Start Delivery',
              'Begin delivery to customer?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Start', onPress: () => handleStatusUpdate('DELIVERING') }
              ]
            );
          },
          disabled: false
        };
        break;
      case 'DELIVERING':
        primaryButton = {
          title: 'Mark Delivered',
          onPress: () => {
            Alert.alert(
              'Confirm Delivery',
              'Order delivered successfully?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delivered', onPress: () => handleStatusUpdate('DELIVERED') }
              ]
            );
          },
          disabled: false
        };
        break;
    }

    return (
      <View style={styles.compactActionContainer}>
        {primaryButton && (
          <Button
            title={primaryButton.title}
            onPress={primaryButton.onPress}
            variant={primaryButton.disabled ? "secondary" : "primary"}
            disabled={primaryButton.disabled}
            style={styles.compactPrimaryButton}
          />
        )}
      </View>
    );
  };

  const renderActionButtons = () => {
    // Keep the old function for reference but it won't be used
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state (no active order)
  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.emptyContainer}
        >
          <View style={styles.emptyState}>
            <DeliveryBoxIcon size={80} color={theme.colors.text.secondary} />
            <Text style={styles.emptyTitle}>No Active Order</Text>
            <Text style={styles.emptySubtitle}>
              You don't have any active deliveries right now.
            </Text>
            <Button
              title="Go to Dashboard"
              onPress={() => navigation.navigate('Dashboard')}
              variant="primary"
              style={styles.emptyButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Compact Header */}
      <View style={styles.compactHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BackIcon size={20} color={theme.colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.compactOrderTitle}>Order #{order.id}</Text>
          <Text style={[
            styles.compactStatus,
            { color: getStatusColor(order.status) }
          ]}>
            {getStatusText(order.status)}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => onRefresh()}
            disabled={refreshing}
          >
            <RefreshIcon 
              size={18} 
              color={refreshing ? theme.colors.text.secondary : theme.colors.primary.main} 
            />
          </TouchableOpacity>
          
          <View style={styles.compactTimer}>
            <TimerIcon size={16} color={theme.colors.action.warning} />
            <Text style={styles.compactTimerText}>{formatTime(timer)}</Text>
          </View>
        </View>
      </View>

      {/* Delivery Information */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.deliveryContainer}>
          <Text style={styles.deliveryTitle}>🚗 Delivery Information</Text>
          
          <View style={styles.addressCard}>
            <Text style={styles.sectionTitle}>📍 Pickup Location</Text>
            <Text style={styles.locationName}>{order.restaurant.name}</Text>
            <Text style={styles.address}>{order.restaurant.address}</Text>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={handleNavigateToRestaurant}
            >
              <NavigationIcon size={16} color={theme.colors.primary.main} />
              <Text style={styles.navButtonText}>Navigate to Restaurant</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.addressCard}>
            <Text style={styles.sectionTitle}>🏠 Delivery Location</Text>
            <Text style={styles.locationName}>{order.customer.name}</Text>
            <Text style={styles.address}>{order.customer.address}</Text>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={handleNavigateToCustomer}
            >
              <NavigationIcon size={16} color={theme.colors.primary.main} />
              <Text style={styles.navButtonText}>Navigate to Customer</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.instruction}>
            📱 Use your preferred navigation app for directions
          </Text>
          
          {/* Order Summary */}
          {renderOrderSummary()}
        </View>
      </ScrollView>
      
      {/* Compact Action Bar */}
      <View style={styles.compactActionBar}>
        {renderCompactActionButtons()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    ...theme.layout.shadow.sm,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  statusBadge: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    marginTop: theme.spacing.xs,
  },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.action.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.layout.borderRadius.sm,
    marginTop: theme.spacing.xs,
  },
  trackingText: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.white,
    marginLeft: theme.spacing.xs,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.action.warning,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.layout.borderRadius.sm,
  },
  timerText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.white,
    marginLeft: theme.spacing.xs,
  },
  
  scrollView: {
    flex: 1,
  },
  
  // Order Summary Styles
  summaryCard: {
    backgroundColor: theme.colors.background.card,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.layout.shadow.sm,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  summaryTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  itemsList: {
    marginBottom: theme.spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  itemName: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    flex: 1,
  },
  itemPrice: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.secondary,
  },
  totalSection: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 2,
    borderTopColor: theme.colors.border.light,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  totalLabel: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
  totalValue: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  earningsRow: {
    backgroundColor: theme.colors.primary.light,
    marginHorizontal: -theme.spacing.lg,
    marginBottom: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomLeftRadius: theme.layout.borderRadius.lg,
    borderBottomRightRadius: theme.layout.borderRadius.lg,
  },
  earningsLabel: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.primary.dark,
  },
  earningsValue: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.primary.dark,
  },
  
  // Location Card Styles
  locationCard: {
    backgroundColor: theme.colors.background.card,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.layout.shadow.sm,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  locationInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  locationTitle: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  locationName: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  locationAddress: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.regular,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  locationActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.layout.borderRadius.md,
    flex: 0.45,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  
  // Action Section Styles
  actionSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    ...theme.layout.shadow.sm,
  },
  primaryActionButton: {
    marginBottom: theme.spacing.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  statusMessage: {
    backgroundColor: theme.colors.action.warning,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.layout.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  statusMessageText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.white,
    textAlign: 'center',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.text.secondary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.layout.borderRadius.md,
    flex: 0.48,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.white,
    marginLeft: theme.spacing.sm,
  },
  
  // Completed State Styles
  completedSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    ...theme.layout.shadow.sm,
  },
  completedText: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.driver.online,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  dashboardButton: {
    width: '100%',
  },
  
  // Loading State Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  // Empty State Styles
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  emptyButton: {
    marginTop: theme.spacing.md,
  },
  
  // New Compact Layout Styles
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    minHeight: 50,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  compactOrderTitle: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  compactStatus: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.weights.medium,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  refreshButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.layout.borderRadius.sm,
  },
  compactTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.action.warning,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.layout.borderRadius.sm,
  },
  compactTimerText: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.white,
    marginLeft: 4,
  },
  
  // Full Screen Map Styles
  fullMapContainer: {
    flex: 1,
    position: 'relative',
  },
  fullMap: {
    flex: 1,
  },
  
  // Floating Elements
  floatingOrderSummary: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.layout.borderRadius.md,
    padding: theme.spacing.md,
    ...theme.layout.shadow.md,
    elevation: 8,
  },
  summaryContent: {
    gap: theme.spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  
  gpsIndicator: {
    position: 'absolute',
    top: 130, // Below floating summary
    left: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.action.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.layout.borderRadius.sm,
    ...theme.layout.shadow.sm,
  },
  gpsText: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.white,
    marginLeft: 4,
  },
  
  // Compact Action Bar
  compactActionBar: {
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    ...theme.layout.shadow.sm,
  },
  compactActionContainer: {
    alignItems: 'center',
  },
  compactPrimaryButton: {
    minWidth: 200,
  },
  compactButton: {
    minWidth: 120,
  },
  
  // Compact Completed State
  completedCompactSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  completedCompactText: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.driver.online,
  },
  
  // Legacy styles (kept for reference)
  mapSection: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  mapSectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  mapContainer: {
    height: 300,
    borderRadius: theme.layout.borderRadius.lg,
    overflow: 'hidden',
    ...theme.layout.shadow.sm,
  },
  map: {
    flex: 1,
  },
  
  // New address display styles
  deliveryContainer: {
    padding: theme.spacing.lg,
  },
  deliveryTitle: {
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  addressCard: {
    backgroundColor: theme.colors.background.card,
    padding: theme.spacing.lg,
    borderRadius: theme.layout.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.layout.shadow.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.primary.main,
    marginBottom: theme.spacing.sm,
  },
  address: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: 22,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary.light,
    padding: theme.spacing.md,
    borderRadius: theme.layout.borderRadius.md,
    alignSelf: 'flex-start',
  },
  navButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.primary.main,
    marginLeft: theme.spacing.sm,
  },
  instruction: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: theme.spacing.lg,
    lineHeight: 22,
  },
});
