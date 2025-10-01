import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { CheckCircle, Clock, Gift } from 'lucide-react-native';
import { Colors } from '../theme/colors';

interface OrderSuccessModalProps {
  visible: boolean;
  orderId: number;
  onClose: () => void;
  autoCloseDelay?: number; // in milliseconds, default 8000
}

const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  visible,
  orderId,
  onClose,
  autoCloseDelay = 8000,
}) => {
  const scaleValue = React.useRef(new Animated.Value(0)).current;
  const fadeValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate modal appearing
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto close after delay
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    } else {
      scaleValue.setValue(0);
      fadeValue.setValue(0);
    }
  }, [visible, autoCloseDelay]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ scale: scaleValue }],
                  opacity: fadeValue,
                },
              ]}
            >
              {/* Success Icon */}
              <View style={styles.iconContainer}>
                <CheckCircle size={80} color={Colors.action.success} />
              </View>

              {/* Success Message */}
              <Text style={styles.successTitle}>Success! 🎉</Text>
              <Text style={styles.successSubtitle}>Order Placed Successfully!</Text>
              
              {/* Order Details */}
              <View style={styles.orderDetails}>
                <Text style={styles.orderIdText}>Order #{orderId}</Text>
                <Text style={styles.orderStatusText}>Your order is being prepared</Text>
              </View>

              {/* Grace Period Information */}
              <View style={styles.gracePeriodContainer}>
                <View style={styles.gracePeriodIcon}>
                  <Clock size={20} color={Colors.action.warning} />
                </View>
                <View style={styles.gracePeriodTextContainer}>
                  <Text style={styles.gracePeriodTitle}>Ordered by mistake?</Text>
                  <Text style={styles.gracePeriodMessage}>
                    You can cancel within one minute before the restaurant sees and accepts your order.
                  </Text>
                </View>
              </View>

              {/* Redirect Notice */}
              <View style={styles.redirectNotice}>
                <Gift size={16} color={Colors.primary.main} />
                <Text style={styles.redirectText}>
                  Redirecting to your orders...
                </Text>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.background.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: Colors.background.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
    elevation: 10,
    shadowColor: Colors.shadow.dark,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  iconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.action.success,
    marginBottom: 24,
    textAlign: 'center',
  },
  orderDetails: {
    backgroundColor: Colors.primary.light + '15',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  orderIdText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary.main,
    marginBottom: 4,
  },
  orderStatusText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  gracePeriodContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.action.warning + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: Colors.action.warning,
  },
  gracePeriodIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  gracePeriodTextContainer: {
    flex: 1,
  },
  gracePeriodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  gracePeriodMessage: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  redirectNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  redirectText: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default OrderSuccessModal;