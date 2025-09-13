import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { 
  ClockIcon,
  CheckIcon,
  OrdersIcon,
  MapIcon,
  TrashIcon
} from '../../../shared/components/CustomIcons';
import { Colors } from '../../../shared/theme/colors';
import { OrderStatus } from '../../../shared/types/Order';

interface OrderStatusProgressProps {
  status: OrderStatus;
  estimatedDelivery?: string;
  showMap?: boolean;
}

const OrderStatusProgress: React.FC<OrderStatusProgressProps> = ({ 
  status, 
  estimatedDelivery,
  showMap = false 
}) => {
  const statusSteps = [
    {
      key: OrderStatus.PENDING,
      label: 'Order Placed',
      icon: ClockIcon,
      description: 'Your order has been placed'
    },
    {
      key: OrderStatus.ACCEPTED,
      label: 'Confirmed',
      icon: CheckIcon,
      description: 'Restaurant confirmed your order'
    },
    {
      key: OrderStatus.PREPARING,
      label: 'Preparing',
      icon: OrdersIcon,
      description: 'Your food is being prepared'
    },
    {
      key: OrderStatus.READY,
      label: 'Food Ready',
      icon: CheckIcon,
      description: 'Your food is ready for pickup'
    },
    {
      key: OrderStatus.PICKED_UP,
      label: 'Picked Up',
      icon: MapIcon,
      description: 'Driver picked up your order'
    },
    {
      key: OrderStatus.DELIVERING,
      label: 'On the Way',
      icon: MapIcon,
      description: 'Your order is being delivered'
    },
    {
      key: OrderStatus.DELIVERED,
      label: 'Delivered',
      icon: CheckIcon,
      description: 'Order delivered successfully'
    }
  ];

  const getCurrentStepIndex = () => {
    if (status === OrderStatus.CANCELLED) return -1;
    return statusSteps.findIndex(step => step.key === status);
  };

  const currentStepIndex = getCurrentStepIndex();

  const getStepStatus = (stepIndex: number) => {
    if (status === OrderStatus.CANCELLED) return 'cancelled';
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'active';
    return 'pending';
  };

  const getStepColor = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return Colors.status.delivered;
      case 'active':
        return Colors.primary.main;
      case 'cancelled':
        return Colors.status.cancelled;
      default:
        return Colors.text.light;
    }
  };

  if (status === OrderStatus.CANCELLED) {
    return (
      <View style={styles.container}>
      <View style={styles.cancelledContainer}>
        <TrashIcon size={48} color={Colors.status.cancelled} />
        <Text style={styles.cancelledTitle}>Order Cancelled</Text>
        <Text style={styles.cancelledSubtitle}>This order has been cancelled</Text>
      </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map Placeholder */}
      {showMap && (
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <MapIcon size={32} color={Colors.primary.main} />
            <Text style={styles.mapText}>Live Tracking Map</Text>
            <Text style={styles.mapSubtext}>Coming Soon</Text>
          </View>
        </View>
      )}

      {/* Status Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Order Status</Text>
        
        {estimatedDelivery && (
          <View style={styles.estimatedTime}>
            <ClockIcon size={16} color={Colors.text.secondary} />
            <Text style={styles.estimatedText}>
              Estimated delivery: {new Date(estimatedDelivery).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        )}

        <View style={styles.stepsContainer}>
          {statusSteps.map((step, index) => {
            const stepStatus = getStepStatus(index);
            const stepColor = getStepColor(stepStatus);
            const IconComponent = step.icon;
            const isActive = stepStatus === 'active';
            const isCompleted = stepStatus === 'completed';

            return (
              <View key={step.key} style={styles.stepContainer}>
                <View style={styles.stepLeft}>
                  <View style={[
                    styles.stepIcon,
                    { 
                      backgroundColor: isActive || isCompleted ? stepColor : Colors.background.secondary,
                      borderColor: stepColor,
                      borderWidth: isActive ? 2 : 1
                    }
                  ]}>
                    <IconComponent 
                      size={20} 
                      color={isActive || isCompleted ? Colors.text.white : stepColor} 
                    />
                  </View>
                  {index < statusSteps.length - 1 && (
                    <View style={[
                      styles.stepLine,
                      { backgroundColor: isCompleted ? stepColor : Colors.border.light }
                    ]} />
                  )}
                </View>
                
                <View style={styles.stepContent}>
                  <Text style={[
                    styles.stepLabel,
                    { 
                      color: isActive ? Colors.primary.main : 
                             isCompleted ? Colors.text.primary : Colors.text.secondary,
                      fontWeight: isActive ? '600' : '500'
                    }
                  ]}>
                    {step.label}
                  </Text>
                  <Text style={[
                    styles.stepDescription,
                    { color: isActive ? Colors.text.secondary : Colors.text.light }
                  ]}>
                    {step.description}
                  </Text>
                  {isActive && (
                    <View style={styles.activeIndicator}>
                      <View style={styles.pulseDot} />
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
  },
  mapContainer: {
    height: 200,
    backgroundColor: Colors.background.secondary,
    marginBottom: 16,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    margin: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.light,
    borderStyle: 'dashed',
  },
  mapText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 8,
  },
  mapSubtext: {
    fontSize: 12,
    color: Colors.text.light,
    marginTop: 4,
  },
  progressContainer: {
    padding: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  estimatedTime: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.light,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  estimatedText: {
    fontSize: 14,
    color: Colors.primary.main,
    fontWeight: '500',
    marginLeft: 6,
  },
  stepsContainer: {
    paddingLeft: 8,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  stepLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLine: {
    width: 2,
    height: 32,
    marginTop: 4,
  },
  stepContent: {
    flex: 1,
    paddingTop: 8,
    position: 'relative',
  },
  stepLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: 12,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary.main,
  },
  cancelledContainer: {
    alignItems: 'center',
    padding: 40,
  },
  cancelledTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.status.cancelled,
    marginTop: 16,
    marginBottom: 8,
  },
  cancelledSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export default OrderStatusProgress;
