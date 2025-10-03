import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors, Typography, Spacing } from '../../../shared/theme';

interface DeliveryTimerProps {
  startTime: Date;
  status?: 'active' | 'paused' | 'completed';
  showSeconds?: boolean;
  style?: any;
}

export const DeliveryTimer: React.FC<DeliveryTimerProps> = ({
  startTime,
  status = 'active',
  showSeconds = true,
  style,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (status !== 'active') return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const elapsed = Math.floor((now - start) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, status]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return showSeconds 
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
        : `${hours}:${minutes.toString().padStart(2, '0')}`;
    }

    return showSeconds 
      ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
      : `${minutes} min`;
  };

  const getTimerColor = (): string => {
    if (status === 'completed') return Colors.success;
    if (status === 'paused') return Colors.warning;
    
    // Active timer color based on elapsed time
    if (elapsedTime < 600) return Colors.primary.main; // < 10 minutes - normal
    if (elapsedTime < 1200) return Colors.warning; // < 20 minutes - warning
    return Colors.status.cancelled; // >= 20 minutes - critical
  };

  const getStatusText = (): string => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'paused':
        return 'Paused';
      case 'active':
        if (elapsedTime < 600) return 'On Time';
        if (elapsedTime < 1200) return 'Moderate Delay';
        return 'Urgent';
      default:
        return '';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.timerSection}>
        <Text style={[styles.timeText, { color: getTimerColor() }]}>
          {formatTime(elapsedTime)}
        </Text>
        <Text style={[styles.statusText, { color: getTimerColor() }]}>
          {getStatusText()}
        </Text>
      </View>
      
      {status === 'active' && (
        <View style={styles.pulseContainer}>
          <View style={[styles.pulseIndicator, { backgroundColor: getTimerColor() }]} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  timerSection: {
    flex: 1,
    alignItems: 'center',
  },
  timeText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    fontVariant: ['tabular-nums'],
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pulseContainer: {
    marginLeft: Spacing.sm,
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.8,
  },
});