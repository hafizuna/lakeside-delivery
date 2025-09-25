import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { 
  ArrowBackIcon, 
  ClockIcon, 
  CheckIcon, 
  CookingIcon, 
  PhoneIcon,
  LocationIcon,
  CashIcon,
  CardIcon,
  WalletIcon,
  InfoIcon
} from '../../../shared/components/CustomIcons';
import { Colors } from '../../../shared/theme/colors';
import { Typography } from '../../../shared/theme/typography';
import { Spacing } from '../../../shared/theme/spacing';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { apiService } from '../../../shared/services/api';
import { useOrders } from '../context/OrdersContext';

type OrderDetailScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type OrderDetailScreenRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;

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
    description?: string;
    imageUrl?: string;
  };
}

interface OrderDetail {
  id: number;
  customerId: number;
  totalPrice: number;
  deliveryFee: number;
  status: OrderStatus;
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
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
    id: number;
    name: string;
    phone: string;
    email?: string;
  };
  orderItems: OrderItem[];
  driver?: {
    id: number;
    name: string;
    phone: string;
    vehicleType: string;
    vehicleNumber: string;
  };
}

const OrderDetailScreen: React.FC = () => {
  const navigation = useNavigation<OrderDetailScreenNavigationProp>();
  const route = useRoute<OrderDetailScreenRouteProp>();
  const { updateOrderStatus } = useOrders();
  
  const orderId = route.params?.orderId;
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Load order details
  const loadOrderDetails = async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      const response = await apiService.getOrderDetails(orderId.toString());
      
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        Alert.alert('Error', 'Failed to load order details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      Alert.alert('Error', 'Failed to load order details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrderDetails();
    setRefreshing(false);
  };

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (orderId) {
        loadOrderDetails();
      }
    }, [orderId])
  );

  // Status update handlers
  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return;

    try {
      setUpdatingStatus(true);
      const success = await updateOrderStatus(order.id, newStatus);
      
      if (success) {
        setOrder(prev => prev ? { 
          ...prev, 
          status: newStatus,
          updatedAt: new Date().toISOString(),
          ...(newStatus === 'ACCEPTED' && { acceptedAt: new Date().toISOString() }),
          ...(newStatus === 'PREPARING' && { preparingAt: new Date().toISOString() }),
          ...(newStatus === 'READY' && { estimatedDelivery: new Date(Date.now() + 30 * 60000).toISOString() }),
        } : null);
        
        Alert.alert('Success', `Order status updated to ${newStatus.toLowerCase()}`);
      } else {
        Alert.alert('Error', 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Action handlers
  const handleAcceptOrder = () => {
    Alert.alert(
      'Accept Order',
      'Are you sure you want to accept this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: () => handleStatusUpdate('ACCEPTED') },
      ]
    );
  };

  const handleRejectOrder = () => {
    Alert.alert(
      'Reject Order',
      'Are you sure you want to reject this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => handleStatusUpdate('CANCELLED') },
      ]
    );
  };

  const handleStartPreparing = () => {
    Alert.alert(
      'Start Preparing',
      'Mark this order as being prepared?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Preparing', onPress: () => handleStatusUpdate('PREPARING') },
      ]
    );
  };

  const handleMarkReady = () => {
    Alert.alert(
      'Mark as Ready',
      'Mark this order as ready for pickup?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark Ready', onPress: () => handleStatusUpdate('READY') },
      ]
    );
  };

  const handleCallCustomer = () => {
    if (order?.customer?.phone) {
      Linking.openURL(`tel:${order.customer.phone}`);
    }
  };

  const handleCallDriver = () => {
    if (order?.driver?.phone) {
      Linking.openURL(`tel:${order.driver.phone}`);
    }
  };

  const handleViewLocation = () => {
    if (order?.deliveryLat && order?.deliveryLng) {
      const url = `https://maps.google.com/?q=${order.deliveryLat},${order.deliveryLng}`;
      Linking.openURL(url);
    }
  };

  // Helper functions
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
      case 'PENDING': return <ClockIcon size={20} color={Colors.warning.main} />;
      case 'ACCEPTED': return <CheckIcon size={20} color={Colors.info.main} />;
      case 'PREPARING': return <CookingIcon size={20} color={Colors.primary.main} />;
      case 'READY': return <CheckIcon size={20} color={Colors.success.light} />;
      case 'PICKED_UP': return <CheckIcon size={20} color={Colors.success.main} />;
      case 'DELIVERING': return <Ionicons name="car" size={20} color={Colors.success.main} />;
      case 'DELIVERED': return <CheckIcon size={20} color={Colors.success.dark} />;
      case 'CANCELLED': return <Ionicons name="close-circle" size={20} color={Colors.error.main} />;
      default: return <ClockIcon size={20} color={Colors.text.secondary} />;
    }
  };

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'CASH': return <CashIcon size={20} color={Colors.success.main} />;
      case 'CARD': return <CardIcon size={20} color={Colors.primary.main} />;
      case 'WALLET': return <WalletIcon size={20} color={Colors.info.main} />;
      case 'UPI': return <Ionicons name="card" size={20} color={Colors.warning.main} />;
      default: return <CashIcon size={20} color={Colors.text.secondary} />;
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowBackIcon size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Order #{order.id}</Text>
          <Text style={styles.headerSubtitle}>
            {formatDate(order.createdAt)} • {formatTime(order.createdAt)}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          {getStatusIcon(order.status)}
          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
            {order.status}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.customerCard}>
            <View style={styles.customerHeader}>
              <View style={styles.customerAvatar}>
                <Text style={styles.customerInitial}>
                  {order.customer.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{order.customer.name}</Text>
                <Text style={styles.customerPhone}>{order.customer.phone}</Text>
                {order.customer.email && (
                  <Text style={styles.customerEmail}>{order.customer.email}</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCallCustomer}
              >
                <PhoneIcon size={20} color={Colors.primary.main} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Delivery Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          <View style={styles.deliveryCard}>
            <View style={styles.addressRow}>
              <LocationIcon size={20} color={Colors.text.secondary} />
              <Text style={styles.addressText}>{order.deliveryAddress}</Text>
              {order.deliveryLat && order.deliveryLng && (
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={handleViewLocation}
                >
                  <Ionicons name="map" size={16} color={Colors.primary.main} />
                </TouchableOpacity>
              )}
            </View>
            
            {order.deliveryInstructions && (
              <View style={styles.instructionsRow}>
                <InfoIcon size={20} color={Colors.text.secondary} />
                <Text style={styles.instructionsText}>{order.deliveryInstructions}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({order.orderItems.length})</Text>
          <View style={styles.itemsContainer}>
            {order.orderItems.map((item, index) => (
              <View key={item.id} style={styles.orderItem}>
                <View style={styles.itemImageContainer}>
                  <Image 
                    source={{ 
                      uri: item.menu.imageUrl || 'https://via.placeholder.com/60x60/FF6B35/FFFFFF?text=🍔' 
                    }} 
                    style={styles.itemImage}
                  />
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.menu.itemName}</Text>
                  {item.menu.description && (
                    <Text style={styles.itemDescription} numberOfLines={1}>
                      {item.menu.description}
                    </Text>
                  )}
                  <Text style={styles.itemPrice}>${item.price.toFixed(2)} each</Text>
                </View>
                <View style={styles.itemQuantity}>
                  <Text style={styles.quantityText}>{item.quantity}x</Text>
                  <Text style={styles.itemTotal}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Item Count:</Text>
              <Text style={styles.summaryValue}>
                {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Food Total:</Text>
              <Text style={styles.totalValue}>${(order.totalPrice - order.deliveryFee).toFixed(2)}</Text>
            </View>
            <View style={styles.paymentRow}>
              {getPaymentIcon(order.paymentMethod)}
              <Text style={styles.paymentMethod}>
                Payment: {order.paymentMethod} • {order.paymentStatus}
              </Text>
            </View>
            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>
                💡 Restaurant revenue: Food total only (delivery fees handled separately)
              </Text>
            </View>
          </View>
        </View>

        {/* Driver Information (if assigned) */}
        {order.driver && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Driver Information</Text>
            <View style={styles.driverCard}>
              <View style={styles.driverInfo}>
                <View style={styles.driverAvatar}>
                  <Text style={styles.driverInitial}>
                    {order.driver.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.driverDetails}>
                  <Text style={styles.driverName}>{order.driver.name}</Text>
                  <Text style={styles.driverPhone}>{order.driver.phone}</Text>
                  <Text style={styles.vehicleInfo}>
                    {order.driver.vehicleType} • {order.driver.vehicleNumber}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={handleCallDriver}
                >
                  <PhoneIcon size={20} color={Colors.primary.main} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Timeline</Text>
          <View style={styles.timelineContainer}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Order Placed</Text>
                <Text style={styles.timelineTime}>
                  {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                </Text>
              </View>
            </View>
            
            {order.acceptedAt && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.activeTimelineDot]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Order Accepted</Text>
                  <Text style={styles.timelineTime}>
                    {formatDate(order.acceptedAt)} at {formatTime(order.acceptedAt)}
                  </Text>
                </View>
              </View>
            )}
            
            {order.preparingAt && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.activeTimelineDot]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Preparation Started</Text>
                  <Text style={styles.timelineTime}>
                    {formatDate(order.preparingAt)} at {formatTime(order.preparingAt)}
                  </Text>
                </View>
              </View>
            )}
            
            {order.pickedUpAt && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.activeTimelineDot]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Picked Up by Driver</Text>
                  <Text style={styles.timelineTime}>
                    {formatDate(order.pickedUpAt)} at {formatTime(order.pickedUpAt)}
                  </Text>
                </View>
              </View>
            )}
            
            {order.deliveredAt && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.deliveredTimelineDot]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Order Delivered</Text>
                  <Text style={styles.timelineTime}>
                    {formatDate(order.deliveredAt)} at {formatTime(order.deliveredAt)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
        <View style={styles.actionsContainer}>
          {order.status === 'PENDING' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={handleRejectOrder}
                disabled={updatingStatus}
              >
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={handleAcceptOrder}
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                <ActivityIndicator size="small" color={Colors.text.inverse} />
                ) : (
                  <Text style={styles.acceptButtonText}>Accept Order</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {order.status === 'ACCEPTED' && (
            <TouchableOpacity
              style={[styles.fullActionButton, styles.preparingButton]}
              onPress={handleStartPreparing}
              disabled={updatingStatus}
            >
              {updatingStatus ? (
                <ActivityIndicator size="small" color={Colors.text.inverse} />
              ) : (
                <Text style={styles.fullActionButtonText}>Start Preparing</Text>
              )}
            </TouchableOpacity>
          )}

          {order.status === 'PREPARING' && (
            <TouchableOpacity
              style={[styles.fullActionButton, styles.readyButton]}
              onPress={handleMarkReady}
              disabled={updatingStatus}
            >
              {updatingStatus ? (
                <ActivityIndicator size="small" color={Colors.text.inverse} />
              ) : (
                <Text style={styles.fullActionButtonText}>Mark as Ready</Text>
              )}
            </TouchableOpacity>
          )}

          {order.status === 'READY' && (
            <View style={styles.waitingContainer}>
              <View style={styles.waitingIndicator}>
                <ActivityIndicator size="small" color={Colors.success.main} />
                <Text style={styles.waitingText}>Waiting for driver pickup...</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.error.main,
    marginBottom: Spacing.md,
  },
  backButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 10,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    shadowColor: Colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerBackButton: {
    padding: Spacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.background.secondary,
    borderRadius: 20,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginLeft: Spacing.xs,
    textTransform: 'capitalize',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  customerCard: {
    backgroundColor: Colors.background.primary,
    marginHorizontal: Spacing.lg,
    borderRadius: 12,
    padding: Spacing.md,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  customerInitial: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  customerPhone: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  customerEmail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryCard: {
    backgroundColor: Colors.background.primary,
    marginHorizontal: Spacing.lg,
    borderRadius: 12,
    padding: Spacing.md,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  addressText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
    lineHeight: 20,
  },
  locationButton: {
    padding: Spacing.xs,
    backgroundColor: Colors.primary.light,
    borderRadius: 6,
    marginLeft: Spacing.sm,
  },
  instructionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionsText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  itemsContainer: {
    backgroundColor: Colors.background.primary,
    marginHorizontal: Spacing.lg,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: Spacing.md,
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
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  itemDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  itemQuantity: {
    alignItems: 'flex-end',
  },
  quantityText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primary.main,
  },
  itemTotal: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: Colors.background.primary,
    marginHorizontal: Spacing.lg,
    borderRadius: 12,
    padding: Spacing.md,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  totalLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  totalValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.main,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  paymentMethod: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  noteContainer: {
    backgroundColor: Colors.info.light,
    borderRadius: 8,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.info.main,
  },
  noteText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.info.dark,
    lineHeight: 18,
  },
  driverCard: {
    backgroundColor: Colors.background.primary,
    marginHorizontal: Spacing.lg,
    borderRadius: 12,
    padding: Spacing.md,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.success.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  driverInitial: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  driverPhone: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  vehicleInfo: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  timelineContainer: {
    backgroundColor: Colors.background.primary,
    marginHorizontal: Spacing.lg,
    borderRadius: 12,
    padding: Spacing.md,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.text.disabled,
    marginTop: 4,
    marginRight: Spacing.md,
  },
  activeTimelineDot: {
    backgroundColor: Colors.primary.main,
  },
  deliveredTimelineDot: {
    backgroundColor: Colors.success.main,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  timelineTime: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  actionsContainer: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  rejectButton: {
    backgroundColor: Colors.error.main,
  },
  rejectButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
  },
  acceptButton: {
    backgroundColor: Colors.success.main,
  },
  acceptButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
  },
  fullActionButton: {
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  preparingButton: {
    backgroundColor: Colors.primary.main,
  },
  readyButton: {
    backgroundColor: Colors.warning.main,
  },
  fullActionButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
  },
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  waitingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waitingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
});

export default OrderDetailScreen;
