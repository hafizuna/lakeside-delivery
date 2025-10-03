import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../shared/theme/colors';
import { Typography } from '../../../shared/theme/typography';
import { Spacing } from '../../../shared/theme/spacing';
import { Order } from '../../../shared/services/api';

interface BottomDeliveryModalProps {
  order: Order;
  deliveryStatus: 'ASSIGNED' | 'EN_ROUTE_TO_RESTAURANT' | 'WAITING_AT_RESTAURANT' | 'PICKED_UP' | 'EN_ROUTE_TO_CUSTOMER' | 'DELIVERED';
  actionButtonText?: string;
  onActionPress?: () => void;
  isActionLoading?: boolean;
  canProceedToNext?: boolean;
}

const { height: screenHeight } = Dimensions.get('window');
const MODAL_FIXED_HEIGHT = screenHeight * 0.4; // Fixed 40% of screen

const BottomDeliveryModal: React.FC<BottomDeliveryModalProps> = ({
  order,
  deliveryStatus,
  actionButtonText,
  onActionPress,
  isActionLoading,
  canProceedToNext,
}) => {
  // Debug: Log order data to see what's missing
  console.log('BottomDeliveryModal order data:', {
    driverEarning: order.driverEarning,
    tip: order.tip,
    totalAmount: order.totalAmount,
    items: order.items,
  });
  // Fixed modal - no animation or expansion needed

  const handleCallRestaurant = () => {
    // Mock restaurant phone for now - in a real app this would come from the order or restaurant data
    const restaurantPhone = '+1234567890'; // Replace with actual restaurant phone
    Linking.openURL(`tel:${restaurantPhone}`);
  };

  const handleCallCustomer = () => {
    if (order.customerPhone) {
      Linking.openURL(`tel:${order.customerPhone}`);
    }
  };


  // Safe number conversion for potentially undefined/string values
  const safeNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  const formatEarnings = (amount: any): string => {
    const safeAmount = safeNumber(amount);
    return `₹${safeAmount.toFixed(0)}`;
  };

  const getEstimatedTime = (): string => {
    // Mock estimated times based on status
    switch (deliveryStatus) {
      case 'ASSIGNED':
        return '5 min to restaurant';
      case 'EN_ROUTE_TO_RESTAURANT':
        return '3 min to restaurant';
      case 'WAITING_AT_RESTAURANT':
        return 'Ready in ~5 min';
      case 'PICKED_UP':
        return '12 min to customer';
      case 'EN_ROUTE_TO_CUSTOMER':
        return '8 min to customer';
      default:
        return 'Completed';
    }
  };

  return (
    <View style={[styles.modalContainer, { height: MODAL_FIXED_HEIGHT }]}>
      <View style={styles.modalContent}>

        {/* Top Section - Always Visible */}
        <View style={styles.topSection}>
          {/* Earnings and Action Buttons Row */}
          <View style={styles.topRow}>
            {/* Earnings Display */}
            <View style={styles.earningsContainer}>
              <View style={styles.earningsBox}>
                <Text style={styles.earningsAmount}>
                  {formatEarnings(order.driverEarning)}
                </Text>
                <Text style={styles.earningsLabel}>Earnings</Text>
              </View>
            </View>

            {/* Call Buttons */}
            <View style={styles.callButtonsContainer}>
              <TouchableOpacity 
                style={styles.callButton} 
                onPress={handleCallRestaurant}
              >
                <Ionicons name="restaurant-outline" size={20} color={Colors.primary.main} />
                <Text style={styles.callButtonText}>Restaurant</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.callButton} 
                onPress={handleCallCustomer}
              >
                <Ionicons name="person-outline" size={20} color={Colors.action.success} />
                <Text style={styles.callButtonText}>Customer</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Order Summary */}
          <View style={styles.orderSummary}>
            <Text style={styles.orderNumber}>Order #{order.orderNumber || 'N/A'}</Text>
            <Text style={styles.restaurantName}>{order.restaurantName || 'Restaurant'}</Text>
            
            <View style={styles.timeDistanceRow}>
              <View style={styles.timeInfo}>
                <Ionicons name="time-outline" size={16} color={Colors.text.secondary} />
                <Text style={styles.timeText}>{getEstimatedTime()}</Text>
              </View>
              
              <View style={styles.distanceInfo}>
                <Ionicons name="location-outline" size={16} color={Colors.text.secondary} />
                <Text style={styles.distanceText}>2.4 mi</Text>
              </View>
            </View>
          </View>

        </View>

        {/* Addresses Section */}
        <View style={styles.addressSection}>
          <View style={styles.addressItem}>
            <Ionicons name="restaurant" size={16} color={Colors.primary.main} />
            <View style={styles.addressText}>
              <Text style={styles.addressLabel}>Pickup</Text>
              <Text style={styles.addressValue} numberOfLines={2}>
                {order.restaurantAddress || 'Restaurant Address'}
              </Text>
            </View>
          </View>

          <View style={styles.addressItem}>
            <Ionicons name="location" size={16} color={Colors.action.success} />
            <View style={styles.addressText}>
              <Text style={styles.addressLabel}>Delivery</Text>
              <Text style={styles.addressValue} numberOfLines={2}>
                {order.deliveryAddress || 'Delivery Address'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        {actionButtonText && onActionPress && (
          <View style={styles.actionButtonContainer}>
            <TouchableOpacity 
              style={[
                styles.actionButton,
                !canProceedToNext && styles.actionButtonDisabled,
                deliveryStatus === 'DELIVERED' && styles.actionButtonSuccess
              ]}
              onPress={onActionPress}
              disabled={isActionLoading || !canProceedToNext}
            >
              <Text style={[
                styles.actionButtonText,
                deliveryStatus === 'DELIVERED' && styles.actionButtonTextSuccess
              ]}>
                {isActionLoading ? 'Processing...' : actionButtonText}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.md,
  },
  topSection: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  earningsContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  earningsBox: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.action.success,
  },
  earningsAmount: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.action.success,
  },
  earningsLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.action.success,
    marginTop: 2,
  },
  callButtonsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  callButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: Spacing.sm,
    width: 80,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  callButtonText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  orderSummary: {
    marginBottom: Spacing.lg,
  },
  orderNumber: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  restaurantName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  timeDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  addressSection: {
    flex: 1,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  addressText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  addressLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  addressValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  actionButtonContainer: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  actionButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: Colors.background.secondary,
    opacity: 0.6,
  },
  actionButtonSuccess: {
    backgroundColor: Colors.action.success,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: 'white',
  },
  actionButtonTextSuccess: {
    color: 'white',
  },
});

export default BottomDeliveryModal;
