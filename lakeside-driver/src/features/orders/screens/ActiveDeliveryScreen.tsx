import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../../shared/theme';
import { Button } from '../../../components/ui';
import { useOrders } from '../context/OrderContext';
import { Order } from '../../../shared/services/api';

const { width } = Dimensions.get('window');

interface DeliveryStep {
  id: string;
  title: string;
  icon: string;
  status: 'completed' | 'active' | 'pending';
  action?: () => void;
  buttonText?: string;
}

export const ActiveDeliveryScreen: React.FC = () => {
  const {
    activeOrder,
    arriveAtRestaurant,
    pickupOrder,
    startDelivery,
    completeDelivery,
    cancelOrder,
    error,
    isLoading,
  } = useOrders();

  const [isUpdating, setIsUpdating] = useState(false);

  if (!activeOrder) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No active delivery</Text>
          <Text style={styles.emptySubtext}>Accept an order to start delivering</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getDeliverySteps = (order: Order): DeliveryStep[] => {
    const status = order.status;
    
    return [
      {
        id: 'assigned',
        title: 'Assigned',
        icon: '📋',
        status: 'completed',
      },
      {
        id: 'en_route_restaurant',
        title: 'En Route to Restaurant',
        icon: '🚗',
        status: status === 'accepted' ? 'active' : 'completed',
        action: status === 'accepted' ? handleArriveAtRestaurant : undefined,
        buttonText: 'I\'ve Arrived',
      },
      {
        id: 'waiting',
        title: 'Waiting at Restaurant',
        icon: '⏱️',
        status: status === 'preparing' || status === 'ready' ? 'active' : 
               ['picked_up', 'delivering', 'delivered'].includes(status) ? 'completed' : 'pending',
        action: status === 'ready' ? handlePickupOrder : undefined,
        buttonText: 'Order Picked Up',
      },
      {
        id: 'picked_up',
        title: 'Order Picked Up',
        icon: '🛍️',
        status: status === 'picked_up' ? 'active' : 
               ['delivering', 'delivered'].includes(status) ? 'completed' : 'pending',
        action: status === 'picked_up' ? handleStartDelivery : undefined,
        buttonText: 'Start Delivery',
      },
      {
        id: 'delivering',
        title: 'Delivering to Customer',
        icon: '🚚',
        status: status === 'delivering' ? 'active' : 
               status === 'delivered' ? 'completed' : 'pending',
        action: status === 'delivering' ? handleCompleteDelivery : undefined,
        buttonText: 'Mark Delivered',
      },
      {
        id: 'delivered',
        title: 'Delivered',
        icon: '✅',
        status: status === 'delivered' ? 'completed' : 'pending',
      },
    ];
  };

  const handleArriveAtRestaurant = async () => {
    setIsUpdating(true);
    try {
      await arriveAtRestaurant(activeOrder.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to update arrival status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePickupOrder = async () => {
    setIsUpdating(true);
    try {
      const success = await pickupOrder(activeOrder.id);
      if (success) {
        Alert.alert('Success', 'Order picked up successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update pickup status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartDelivery = async () => {
    setIsUpdating(true);
    try {
      await startDelivery(activeOrder.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to start delivery');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteDelivery = async () => {
    Alert.alert(
      'Complete Delivery',
      'Confirm that you have delivered the order to the customer?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm Delivery', onPress: confirmDelivery },
      ]
    );
  };

  const confirmDelivery = async () => {
    setIsUpdating(true);
    try {
      const success = await completeDelivery(activeOrder.id);
      if (success) {
        Alert.alert('Success', 'Delivery completed successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to complete delivery');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelOrder = () => {
    if (!['accepted', 'preparing', 'ready'].includes(activeOrder.status)) {
      Alert.alert(
        'Cannot Cancel',
        'Order cannot be cancelled after pickup. Please contact support.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', onPress: showCancelReasons },
      ]
    );
  };

  const showCancelReasons = () => {
    Alert.alert(
      'Reason for Cancellation',
      'Please select a reason:',
      [
        { text: 'Vehicle Issue', onPress: () => performCancel('VEHICLE_ISSUE') },
        { text: 'Emergency', onPress: () => performCancel('EMERGENCY') },
        { text: 'Restaurant Delay', onPress: () => performCancel('RESTAURANT_DELAY') },
        { text: 'Wrong Address', onPress: () => performCancel('WRONG_ADDRESS') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const performCancel = async (reason: string) => {
    setIsUpdating(true);
    try {
      const success = await cancelOrder(activeOrder.id, reason);
      if (success) {
        Alert.alert('Order Cancelled', 'The order has been cancelled and reassigned.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel order');
    } finally {
      setIsUpdating(false);
    }
  };

  const makePhoneCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(err =>
      Alert.alert('Error', 'Unable to make phone call')
    );
  };

  const openNavigation = (address: string, lat?: number, lng?: number) => {
    const destination = lat && lng 
      ? `${lat},${lng}`
      : encodeURIComponent(address);
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    
    Linking.openURL(url).catch(err =>
      Alert.alert('Error', 'Unable to open navigation')
    );
  };

  const steps = getDeliverySteps(activeOrder);
  const currentStepIndex = steps.findIndex(step => step.status === 'active');
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Active Delivery</Text>
          <Text style={styles.orderNumber}>#{activeOrder.orderNumber}</Text>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          
          {/* Progress Text */}
          <Text style={styles.progressText}>
            Step {currentStepIndex + 1} of {steps.length}
          </Text>
        </View>

        {/* Status Pipeline */}
        <View style={styles.pipelineContainer}>
          {steps.map((step, index) => (
            <View key={step.id} style={styles.stepContainer}>
              <View style={styles.stepRow}>
                <View style={[
                  styles.stepIcon,
                  step.status === 'completed' && styles.stepIconCompleted,
                  step.status === 'active' && styles.stepIconActive,
                ]}>
                  <Text style={[
                    styles.stepIconText,
                    step.status === 'completed' && styles.stepIconTextCompleted,
                    step.status === 'active' && styles.stepIconTextActive,
                  ]}>
                    {step.icon}
                  </Text>
                </View>
                
                <View style={styles.stepContent}>
                  <Text style={[
                    styles.stepTitle,
                    step.status === 'active' && styles.stepTitleActive,
                  ]}>
                    {step.title}
                  </Text>
                  
                  {step.action && step.buttonText && (
                    <TouchableOpacity
                      style={styles.stepButton}
                      onPress={step.action}
                      disabled={isUpdating}
                    >
                      <Text style={styles.stepButtonText}>
                        {isUpdating ? 'Updating...' : step.buttonText}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              
              {index < steps.length - 1 && (
                <View style={[
                  styles.stepConnector,
                  step.status === 'completed' && styles.stepConnectorCompleted,
                ]} />
              )}
            </View>
          ))}
        </View>

        {/* Restaurant Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🏪</Text>
            <Text style={styles.cardTitle}>Restaurant</Text>
          </View>
          <Text style={styles.restaurantName}>{activeOrder.restaurantName}</Text>
          <Text style={styles.address}>{activeOrder.restaurantAddress}</Text>
          
          <View style={styles.cardActions}>
            <Button
              title="Navigate"
              variant="outline"
              onPress={() => openNavigation(
                activeOrder.restaurantAddress,
                activeOrder.restaurantLat,
                activeOrder.restaurantLng
              )}
              style={styles.actionButton}
            />
          </View>
        </View>

        {/* Customer Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>👤</Text>
            <Text style={styles.cardTitle}>Customer</Text>
          </View>
          <Text style={styles.customerName}>{activeOrder.customerName}</Text>
          <Text style={styles.address}>{activeOrder.deliveryAddress}</Text>
          
          <View style={styles.cardActions}>
            <Button
              title="Call"
              variant="outline"
              onPress={() => makePhoneCall(activeOrder.customerPhone)}
              style={[styles.actionButton, { marginRight: Spacing.sm }]}
            />
            <Button
              title="Navigate"
              variant="outline"
              onPress={() => openNavigation(
                activeOrder.deliveryAddress,
                activeOrder.deliveryLat,
                activeOrder.deliveryLng
              )}
              style={styles.actionButton}
            />
          </View>
        </View>

        {/* Order Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📦</Text>
            <Text style={styles.cardTitle}>Order Details</Text>
            <Text style={styles.orderValue}>₹{activeOrder.totalAmount}</Text>
          </View>
          
          {(activeOrder.items || []).map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Text style={styles.itemQuantity}>{item.quantity}x</Text>
              <Text style={styles.itemName}>{item.itemName}</Text>
              <Text style={styles.itemPrice}>₹{item.price}</Text>
            </View>
          ))}
          
          {/* Earnings Info */}
          <View style={styles.earningsContainer}>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Delivery Fee:</Text>
              <Text style={styles.earningsValue}>₹{activeOrder.deliveryFee}</Text>
            </View>
            {activeOrder.tip > 0 && (
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Tip:</Text>
                <Text style={styles.earningsValue}>₹{activeOrder.tip}</Text>
              </View>
            )}
            <View style={[styles.earningsRow, styles.totalEarningsRow]}>
              <Text style={styles.totalEarningsLabel}>Your Earnings:</Text>
              <Text style={styles.totalEarningsValue}>
                ₹{activeOrder.driverEarning + activeOrder.tip}
              </Text>
            </View>
          </View>
        </View>

        {/* Cancel Button (only for pre-pickup) */}
        {['accepted', 'preparing', 'ready'].includes(activeOrder.status) && (
          <View style={styles.cancelContainer}>
            <Button
              title="Cancel Order"
              variant="outline"
              onPress={handleCancelOrder}
              disabled={isUpdating}
              style={styles.cancelButton}
              textStyle={styles.cancelButtonText}
            />
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.primary.main,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.background.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  orderNumber: {
    fontSize: Typography.fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.background.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  pipelineContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  stepContainer: {
    position: 'relative',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border.light,
  },
  stepIconCompleted: {
    backgroundColor: Colors.success.main,
    borderColor: Colors.success.main,
  },
  stepIconActive: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  stepIconText: {
    fontSize: 20,
  },
  stepIconTextCompleted: {
    color: Colors.background.primary,
  },
  stepIconTextActive: {
    color: Colors.background.primary,
  },
  stepContent: {
    flex: 1,
    paddingTop: Spacing.sm,
  },
  stepTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  stepTitleActive: {
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  stepButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  stepButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.background.primary,
  },
  stepConnector: {
    position: 'absolute',
    left: 23,
    top: 48,
    width: 2,
    height: 32,
    backgroundColor: Colors.border.light,
  },
  stepConnectorCompleted: {
    backgroundColor: Colors.success.main,
  },
  card: {
    backgroundColor: Colors.background.primary,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: 16,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    flex: 1,
  },
  orderValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success.main,
  },
  restaurantName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  customerName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  address: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  cardActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  itemQuantity: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary.main,
    width: 32,
  },
  itemName: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemPrice: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
  },
  earningsContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  earningsLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  earningsValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  totalEarningsRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: 0,
  },
  totalEarningsLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  totalEarningsValue: {
    fontSize: Typography.fontSize.lg,
    color: Colors.success.main,
    fontWeight: Typography.fontWeight.bold,
  },
  cancelContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cancelButton: {
    borderColor: Colors.status.error,
  },
  cancelButtonText: {
    color: Colors.status.error,
  },
  bottomSpacing: {
    height: Spacing.xl,
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