import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Animated, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing } from '../../shared/theme';
import driverService, { DriverServiceState } from '../../shared/services/driverService';
import driverStatusService, { DriverState } from '../../shared/services/driverStatusService';

interface OnlineToggleProps {
  // Optional: can be controlled or uncontrolled
  isOnline?: boolean;
  onToggle?: (value: boolean) => void;
  showDetailedStatus?: boolean;
}

export const OnlineToggle: React.FC<OnlineToggleProps> = ({ 
  isOnline: controlledIsOnline, 
  onToggle, 
  showDetailedStatus = false 
}) => {
  // Internal state management
  const [serviceState, setServiceState] = useState<DriverServiceState | null>(null);
  const [driverState, setDriverState] = useState<DriverState | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  // Use controlled or internal state
  const isOnline = controlledIsOnline ?? serviceState?.isOnline ?? false;
  const [animation] = useState(new Animated.Value(isOnline ? 1 : 0));

  // Subscribe to service state changes
  useEffect(() => {
    const updateStates = () => {
      setServiceState(driverService.getState());
      setDriverState(driverStatusService.getState());
    };

    // Initial state
    updateStates();

    // Set up polling for state changes (since we don't have direct subscription)
    const interval = setInterval(updateStates, 1000);

    return () => clearInterval(interval);
  }, []);

  // Animate when online status changes
  useEffect(() => {
    Animated.timing(animation, {
      toValue: isOnline ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOnline]);

  const handleToggle = async (value: boolean) => {
    if (isToggling) return;
    
    setIsToggling(true);
    try {
      if (value) {
        const success = await driverService.goOnline();
        if (!success) {
          // Handle error - could show toast
          console.error('Failed to go online');
          return;
        }
      } else {
        const success = await driverService.goOffline();
        if (!success) {
          // Handle error - could show toast
          console.error('Failed to go offline');
          return;
        }
      }
      
      // Call external callback if provided
      onToggle?.(value);
    } finally {
      setIsToggling(false);
    }
  };

  const getStatusInfo = () => {
    if (!serviceState || !driverState) {
      return {
        status: 'INITIALIZING',
        subtitle: 'Setting up driver services...',
        color: Colors.warning,
        issues: [],
      };
    }

    const issues: string[] = [];
    
    if (!serviceState.socketConnected && isOnline) {
      issues.push('Connection issue');
    }
    
    if (!driverState.isLocationEnabled) {
      issues.push('Location needed');
    }
    
    const timeSinceHeartbeat = driverStatusService.getTimeSinceLastHeartbeat();
    if (isOnline && timeSinceHeartbeat && timeSinceHeartbeat > 90) {
      issues.push('Heartbeat delayed');
    }

    if (isOnline && issues.length === 0) {
      return {
        status: 'ONLINE',
        subtitle: 'Ready to receive assignments',
        color: Colors.success,
        issues,
      };
    } else if (isOnline && issues.length > 0) {
      return {
        status: 'ONLINE',
        subtitle: `Issues: ${issues.join(', ')}`,
        color: Colors.warning,
        issues,
      };
    } else {
      return {
        status: 'OFFLINE',
        subtitle: 'Go online to start earning',
        color: Colors.error,
        issues,
      };
    }
  };

  const statusInfo = getStatusInfo();
  
  const backgroundColor = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.error, statusInfo.color],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <TouchableOpacity 
        style={styles.content} 
        onPress={() => showDetailedStatus && setShowStatus(!showStatus)}
        disabled={!showDetailedStatus}
      >
        <View style={styles.statusIndicator}>
          <View style={[
            styles.dot,
            { backgroundColor: isOnline ? '#ffffff' : '#ffcccc' }
          ]} />
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusText}>
              {statusInfo.status}
            </Text>
            {statusInfo.issues.length > 0 && (
              <Text style={styles.issuesText}>
                ⚠️ {statusInfo.issues.length} issue{statusInfo.issues.length !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.switchContainer}>
          {isToggling && (
            <ActivityIndicator 
              size="small" 
              color="#ffffff" 
              style={styles.loadingIndicator} 
            />
          )}
          <Switch
            value={isOnline}
            onValueChange={handleToggle}
            disabled={isToggling || !serviceState?.isInitialized}
            trackColor={{ false: '#ffffff30', true: '#ffffff50' }}
            thumbColor={isOnline ? '#ffffff' : '#f4f3f4'}
            ios_backgroundColor="#ffffff30"
          />
        </View>
      </TouchableOpacity>
      
      <Text style={styles.subtitle}>
        {statusInfo.subtitle}
      </Text>
      
      {/* Detailed Status */}
      {showDetailedStatus && showStatus && serviceState && driverState && (
        <View style={styles.detailedStatus}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Socket:</Text>
            <Text style={[styles.statusValue, {
              color: serviceState.socketConnected ? Colors.success : Colors.error
            }]}>
              {serviceState.socketConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Location:</Text>
            <Text style={[styles.statusValue, {
              color: driverState.isLocationEnabled ? Colors.success : Colors.error
            }]}>
              {driverState.isLocationEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          
          {driverState.lastHeartbeat && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Last Heartbeat:</Text>
              <Text style={styles.statusValue}>
                {Math.floor((Date.now() - driverState.lastHeartbeat.getTime()) / 1000)}s ago
              </Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.white,
    letterSpacing: 1,
  },
  issuesText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.white,
    opacity: 0.8,
    marginTop: 2,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingIndicator: {
    marginRight: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.white,
    marginTop: Spacing.xs,
    opacity: 0.9,
  },
  detailedStatus: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  statusLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.white,
    opacity: 0.8,
  },
  statusValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.white,
    fontWeight: Typography.fontWeight.medium,
  },
});
