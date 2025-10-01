import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Colors, Typography, Spacing } from '../../../shared/theme';
import { Order } from '../../../shared/services/api';

const { width } = Dimensions.get('window');

interface ActiveOrderCardProps {
  order: Order;
  onPress?: () => void;
  showProgress?: boolean;
}

export const ActiveOrderCard: React.FC<ActiveOrderCardProps> = ({
  order,
  onPress,
  showProgress = true,
}) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'accepted':
        return { text: 'Heading to Restaurant', color: Colors.primary.main, icon: '🚗' };
      case 'preparing':
        return { text: 'Waiting at Restaurant', color: Colors.warning.main, icon: '⏱️' };
      case 'ready':
        return { text: 'Ready for Pickup', color: Colors.success.main, icon: '🛍️' };
      case 'picked_up':
        return { text: 'Order Picked Up', color: Colors.primary.main, icon: '📦' };
      case 'delivering':
        return { text: 'Delivering to Customer', color: Colors.primary.dark, icon: '🚚' };
      case 'delivered':
        return { text: 'Delivered Successfully', color: Colors.success.main, icon: '✅' };
      default:
        return { text: 'Processing', color: Colors.text.secondary, icon: '📋' };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const totalDistance = 0; // This would be calculated from coordinates
  const estimatedTime = '15 mins'; // This would be calculated

  const CardContent = () => (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Text style={styles.restaurantName}>{order.restaurantName}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.earnings}>₹{order.driverEarning + order.tip}</Text>
          <Text style={styles.earningsLabel}>Your earnings</Text>
        </View>
      </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: statusInfo.color }]}>
          <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
        </View>
        <Text style={[styles.statusText, { color: statusInfo.color }]}>
          {statusInfo.text}
        </Text>
      </View>

      {/* Progress Bar */}
      {showProgress && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${getProgressPercentage(order.status)}%`,
                  backgroundColor: statusInfo.color,
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {getProgressPercentage(order.status)}% Complete
          </Text>
        </View>
      )}

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>👤</Text>
          <Text style={styles.detailText} numberOfLines={1}>
            {order.customerName}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>📦</Text>
          <Text style={styles.detailText}>
            {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>⏱️</Text>
          <Text style={styles.detailText}>{estimatedTime}</Text>
        </View>
      </View>

      {/* Action Hint */}
      {onPress && (
        <View style={styles.actionHint}>
          <Text style={styles.actionHintText}>Tap for details</Text>
        </View>
      )}
    </View>
  );

  const getProgressPercentage = (status: string): number => {
    const statusMap: { [key: string]: number } = {
      'accepted': 20,
      'preparing': 40,
      'ready': 60,
      'picked_up': 70,
      'delivering': 90,
      'delivered': 100,
    };
    return statusMap[status] || 0;
  };

  if (onPress) {
    return (
      <TouchableOpacity style={styles.touchable} onPress={onPress} activeOpacity={0.9}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

const styles = StyleSheet.create({
  touchable: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  container: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  orderNumber: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  restaurantName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  statusIcon: {
    fontSize: 16,
  },
  statusText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
  progressSection: {
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.background.secondary,
    borderRadius: 3,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'right',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: Spacing.xs,
  },
  detailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    flex: 1,
  },
  actionHint: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  actionHintText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary.main,
    fontStyle: 'italic',
  },
});