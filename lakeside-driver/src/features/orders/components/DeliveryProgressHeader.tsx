import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DeliveryStatus } from '../hooks/useDeliveryStatusManager';
import { Colors } from '../../../shared/theme/colors';

interface DeliveryProgressHeaderProps {
  currentStatus: DeliveryStatus;
  progressPercentage: number;
  statusSteps: Array<{
    status: DeliveryStatus;
    label: string;
    completed: boolean;
    current: boolean;
  }>;
}

const DeliveryProgressHeader: React.FC<DeliveryProgressHeaderProps> = ({
  currentStatus,
  progressPercentage,
  statusSteps,
}) => {
  const getStatusDisplayText = (status: DeliveryStatus): string => {
    switch (status) {
      case 'ASSIGNED':
        return 'Order Assigned';
      case 'EN_ROUTE_TO_RESTAURANT':
        return 'Heading to Restaurant';
      case 'WAITING_AT_RESTAURANT':
        return 'At Restaurant';
      case 'PICKED_UP':
        return 'Order Picked Up';
      case 'EN_ROUTE_TO_CUSTOMER':
        return 'Delivering to Customer';
      case 'DELIVERED':
        return 'Delivered Successfully';
      default:
        return 'Delivery in Progress';
    }
  };

  const currentStep = statusSteps.findIndex(step => step.current) + 1;
  const totalSteps = statusSteps.length;

  return (
    <View style={styles.container}>
      <Text style={styles.statusText}>
        {getStatusDisplayText(currentStatus)}
      </Text>
      
      <Text style={styles.stepText}>
        Step {currentStep} of {totalSteps}
      </Text>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
      </View>

      {/* Status Dots */}
      <View style={styles.dotsContainer}>
        {statusSteps.map((step, index) => (
          <View
            key={step.status}
            style={[
              styles.dot,
              step.completed && styles.dotCompleted,
              step.current && styles.dotCurrent,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 3,
  },
  dotCompleted: {
    backgroundColor: 'white',
  },
  dotCurrent: {
    backgroundColor: 'white',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default DeliveryProgressHeader;