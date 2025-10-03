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
  duration = 10000, // 10 seconds default
  onDismiss,
}) => {
  const scaleValue = new Animated.Value(0);
  const fadeValue = new Animated.Value(0);
  const progressValue = new Animated.Value(0);
  const bounceValue = new Animated.Value(0);
  const rotateValue = new Animated.Value(0);
  const pulseValue = new Animated.Value(1);

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
      console.log('🚀 SUCCESS MODAL: Starting enhanced animations...');
      
      // Start entrance animations
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
            tension: 80,
            friction: 6,
          }),
          Animated.timing(fadeValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        // Icon bounce animation
        Animated.spring(bounceValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 4,
        }),
      ]).start();

      // Continuous pulse animation for amount
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Celebrate rotation animation
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }).start();

      // Start progress bar animation
      Animated.timing(progressValue, {
        toValue: 1,
        duration: duration,
        useNativeDriver: false,
      }).start();

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        console.log('⏰ SUCCESS MODAL: Auto-dismissing after', duration, 'ms');
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      console.log('🟨 SUCCESS MODAL: Resetting animations (not visible)');
      // Reset all animations
      scaleValue.setValue(0);
      fadeValue.setValue(0);
      progressValue.setValue(0);
      bounceValue.setValue(0);
      rotateValue.setValue(0);
      pulseValue.setValue(1);
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
          {/* Celebration Emojis */}
          <View style={styles.celebrationContainer}>
            <Animated.View
              style={[
                styles.emojiContainer,
                {
                  transform: [
                    {
                      rotate: rotateValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '20deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.celebrationEmoji}>🎉</Text>
            </Animated.View>
            <Animated.View
              style={[
                styles.emojiContainer,
                {
                  transform: [
                    {
                      rotate: rotateValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '-20deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.celebrationEmoji}>🎉</Text>
            </Animated.View>
          </View>

          {/* Success Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ scale: bounceValue }],
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={80}
              color={Colors.success.main}
            />
          </Animated.View>

          {/* Title with Emoji */}
          <View style={styles.titleContainer}>
            <Text style={styles.titleEmoji}>🚀</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.titleEmoji}>🚀</Text>
          </View>

          {/* Amount Display (if provided) */}
          {amount !== undefined && (
            <Animated.View
              style={[
                styles.amountContainer,
                {
                  transform: [{ scale: pulseValue }],
                },
              ]}
            >
              <Text style={styles.amountLabel}>💰 You Earned</Text>
              <Text style={styles.amountText}>
                {currency}{amount.toFixed(2)}
              </Text>
              <Text style={styles.amountSubtext}>Great job! 👏</Text>
            </Animated.View>
          )}

          {/* Message */}
          <Text style={styles.message}>🎆 {message} 🎆</Text>

          {/* Progress Bar (visual countdown) */}
          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressValue.interpolate({
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: 24,
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    alignItems: 'center',
    maxWidth: screenWidth * 0.9,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
  },
  celebrationContainer: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  emojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationEmoji: {
    fontSize: 32,
  },
  iconContainer: {
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  titleEmoji: {
    fontSize: 24,
    marginHorizontal: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  amountContainer: {
    backgroundColor: Colors.success.light,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: 20,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.success.main,
  },
  amountLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.success.dark,
    marginBottom: Spacing.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  amountText: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success.main,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  amountSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.success.dark,
    fontWeight: Typography.fontWeight.medium,
  },
  message: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
    fontWeight: Typography.fontWeight.medium,
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