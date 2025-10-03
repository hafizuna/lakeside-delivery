import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../shared/theme/colors';
import { Typography } from '../../shared/theme/typography';
import { Spacing } from '../../shared/theme/spacing';

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  amount?: number;
  currency?: string;
  duration?: number; // Auto-dismiss duration in milliseconds
  onDismiss?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  title,
  message,
  amount,
  currency = '₹',
  duration = 8000, // 8 seconds default
  onDismiss,
}) => {
  const scaleValue = new Animated.Value(0);
  const fadeValue = new Animated.Value(0);

  useEffect(() => {
    console.log('🎆 === SUCCESS MODAL DEBUG ===');
    console.log('Visible:', visible);
    console.log('Title:', title);
    console.log('Message:', message);
    console.log('Amount:', amount);
    console.log('Currency:', currency);
    console.log('Duration:', duration);
    console.log('=== END SUCCESS MODAL DEBUG ===');
    
    if (visible) {
      console.log('🚀 SUCCESS MODAL: Starting animations...');
      // Start animations
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        console.log('⏰ SUCCESS MODAL: Auto-dismissing after', duration, 'ms');
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      console.log('🟨 SUCCESS MODAL: Resetting animations (not visible)');
      // Reset animations
      scaleValue.setValue(0);
      fadeValue.setValue(0);
    }
  }, [visible, duration]);

  const handleDismiss = () => {
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
      if (onDismiss) {
        onDismiss();
      }
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeValue }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name="checkmark-circle"
              size={64}
              color={Colors.success.main}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Amount Display (if provided) */}
          {amount !== undefined && (
            <View style={styles.amountContainer}>
              <Text style={styles.amountText}>
                {currency}{amount.toFixed(2)}
              </Text>
            </View>
          )}

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Progress Bar (visual countdown) */}
          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: fadeValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: 20,
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    alignItems: 'center',
    maxWidth: screenWidth * 0.85,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  amountContainer: {
    backgroundColor: Colors.success.light,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    marginBottom: Spacing.md,
  },
  amountText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success.main,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.border.light,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.success.main,
    borderRadius: 2,
  },
});

export default SuccessModal;