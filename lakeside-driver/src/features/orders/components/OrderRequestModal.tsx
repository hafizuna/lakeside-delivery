import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing } from '../../../shared/theme';
import { Button } from '../../../components/ui';
import { Order } from '../../../shared/services/api';
import { AssignmentOffer, useOrders } from '../context/OrderContext';

const { width, height } = Dimensions.get('window');

interface OrderRequestModalProps {
  visible: boolean;
  offer: AssignmentOffer | null;
  onClose: () => void;
}

export const OrderRequestModal: React.FC<OrderRequestModalProps> = ({
  visible,
  offer,
  onClose,
}) => {
  const { acceptAssignmentOffer, declineAssignmentOffer, clearAssignmentOffer } = useOrders();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (!offer || !visible) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(offer.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      
      setTimeRemaining(remaining);

      if (remaining === 0) {
        // Auto-decline when expired
        handleDecline('expired');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [offer, visible]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  const handleAccept = async () => {
    if (!offer) return;

    setIsAccepting(true);
    try {
      const success = await acceptAssignmentOffer(offer.assignmentId);
      
      if (success) {
        clearAssignmentOffer();
        onClose();
      } else {
        Alert.alert(
          'Assignment Unavailable',
          'This assignment has already been taken by another driver or has expired.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to accept assignment. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async (reason: string = 'driver_declined') => {
    if (!offer) return;

    setIsDeclining(true);
    try {
      await declineAssignmentOffer(offer.assignmentId, reason);
      clearAssignmentOffer();
      onClose();
    } catch (error) {
      console.error('Failed to decline assignment:', error);
    } finally {
      setIsDeclining(false);
    }
  };

  const showDeclineOptions = () => {
    Alert.alert(
      'Decline Order',
      'Why are you declining this order?',
      [
        { text: 'Too far away', onPress: () => handleDecline('too_far') },
        { text: 'Vehicle issue', onPress: () => handleDecline('vehicle_issue') },
        { text: 'Not available', onPress: () => handleDecline('not_available') },
        { text: 'Other reason', onPress: () => handleDecline('other') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (!offer || !visible) return null;

  const { order } = offer;
  const restaurantDistance = calculateDistance(
    0, 0, // Current location would come from LocationContext
    order.restaurantLat,
    order.restaurantLng
  );
  const customerDistance = calculateDistance(
    order.restaurantLat,
    order.restaurantLng,
    order.deliveryLat,
    order.deliveryLng
  );

  const totalDistance = restaurantDistance + customerDistance;
  const isExpiringSoon = timeRemaining <= 10;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.title}>New Order Request</Text>
              <View style={[
                styles.timerContainer,
                isExpiringSoon && styles.timerExpiring
              ]}>
                <Text style={[
                  styles.timerText,
                  isExpiringSoon && styles.timerTextExpiring
                ]}>
                  {formatTime(timeRemaining)}
                </Text>
              </View>
            </View>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          </View>

          {/* Restaurant Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🏪</Text>
              <Text style={styles.sectionTitle}>Restaurant</Text>
              <Text style={styles.distanceText}>{restaurantDistance.toFixed(1)} km</Text>
            </View>
            <Text style={styles.restaurantName}>{order.restaurantName}</Text>
            <Text style={styles.address}>{order.restaurantAddress}</Text>
          </View>

          {/* Customer Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>👤</Text>
              <Text style={styles.sectionTitle}>Customer</Text>
              <Text style={styles.distanceText}>{customerDistance.toFixed(1)} km</Text>
            </View>
            <Text style={styles.customerName}>{order.customerName}</Text>
            <Text style={styles.address}>{order.deliveryAddress}</Text>
          </View>

          {/* Order Summary */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📦</Text>
              <Text style={styles.sectionTitle}>Order Details</Text>
            </View>
            <View style={styles.orderSummary}>
              <Text style={styles.itemCount}>
                {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.orderValue}>₹{order.totalAmount}</Text>
            </View>
            {(order.items || []).slice(0, 3).map((item, index) => (
              <Text key={index} style={styles.itemText}>
                {item.quantity}x {item.itemName}
              </Text>
            ))}
            {(order.items?.length || 0) > 3 && (
              <Text style={styles.moreItems}>
                +{(order.items?.length || 0) - 3} more items
              </Text>
            )}
          </View>

          {/* Earnings Info */}
          <View style={styles.earningsSection}>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Base Delivery Fee:</Text>
              <Text style={styles.earningsValue}>₹{order.deliveryFee}</Text>
            </View>
            {order.tip > 0 && (
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Tip:</Text>
                <Text style={styles.earningsValue}>₹{order.tip}</Text>
              </View>
            )}
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Distance:</Text>
              <Text style={styles.earningsValue}>{totalDistance.toFixed(1)} km</Text>
            </View>
            <View style={[styles.earningsRow, styles.totalEarningsRow]}>
              <Text style={styles.totalEarningsLabel}>Your Earnings:</Text>
              <Text style={styles.totalEarningsValue}>
                ₹{order.driverEarning + order.tip}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Decline"
              variant="outline"
              onPress={showDeclineOptions}
              disabled={isAccepting || isDeclining}
              style={styles.declineButton}
              textStyle={styles.declineButtonText}
            />
            <Button
              title={isAccepting ? 'Accepting...' : 'Accept'}
              variant="primary"
              onPress={handleAccept}
              disabled={isAccepting || isDeclining}
              style={styles.acceptButton}
            />
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar,
                { width: `${((30 - timeRemaining) / 30) * 100}%` }
              ]} 
            />
          </View>

          {/* Wave Indicator */}
          {offer.wave > 1 && (
            <View style={styles.waveIndicator}>
              <Text style={styles.waveText}>
                Wave {offer.wave} • Higher Priority
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  modalContainer: {
    width: width * 0.92,
    maxWidth: 400,
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    paddingBottom: Spacing.lg,
    maxHeight: height * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.background.primary,
  },
  timerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  timerExpiring: {
    backgroundColor: Colors.status.error,
  },
  timerText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.background.primary,
  },
  timerTextExpiring: {
    color: Colors.background.primary,
  },
  orderNumber: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    flex: 1,
  },
  distanceText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.medium,
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
    lineHeight: 18,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  itemCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  orderValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  itemText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  moreItems: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontStyle: 'italic',
  },
  earningsSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.secondary,
    marginHorizontal: Spacing.lg,
    borderRadius: 12,
    marginTop: Spacing.md,
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
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  declineButton: {
    flex: 1,
    borderColor: Colors.status.error,
  },
  declineButtonText: {
    color: Colors.status.error,
  },
  acceptButton: {
    flex: 2,
  },
  progressContainer: {
    height: 4,
    backgroundColor: Colors.border.light,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary.main,
    borderRadius: 2,
  },
  waveIndicator: {
    backgroundColor: Colors.warning.light,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  waveText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.warning.dark,
    fontWeight: Typography.fontWeight.medium,
  },
});