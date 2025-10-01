import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  X 
} from 'lucide-react-native';
import { Colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  showCloseButton?: boolean;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const getToastConfig = (type: ToastType) => {
  switch (type) {
    case 'success':
      return {
        icon: CheckCircle,
        colors: [Colors.action.success, '#66BB6A'],
        iconColor: Colors.text.white,
        shadowColor: Colors.action.success,
      };
    case 'error':
      return {
        icon: XCircle,
        colors: [Colors.action.error, '#EF5350'],
        iconColor: Colors.text.white,
        shadowColor: Colors.action.error,
      };
    case 'warning':
      return {
        icon: AlertCircle,
        colors: [Colors.action.warning, '#FFB74D'],
        iconColor: Colors.text.white,
        shadowColor: Colors.action.warning,
      };
    case 'info':
      return {
        icon: Info,
        colors: [Colors.action.info, '#42A5F5'],
        iconColor: Colors.text.white,
        shadowColor: Colors.action.info,
      };
    default:
      return {
        icon: Info,
        colors: [Colors.primary.main, Colors.primary.light],
        iconColor: Colors.text.white,
        shadowColor: Colors.primary.main,
      };
  }
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const config = getToastConfig(toast.type);
  const IconComponent = config.icon;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (_, gestureState) => {
      translateX.setValue(gestureState.dx);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (Math.abs(gestureState.dx) > SCREEN_WIDTH * 0.3) {
        // Dismiss toast if swiped far enough
        dismissToast();
      } else {
        // Spring back to original position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const showToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  };

  useEffect(() => {
    showToast();

    // Auto dismiss after duration (default 4 seconds)
    const timer = setTimeout(() => {
      dismissToast();
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }, { translateX }],
          opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <LinearGradient
        colors={config.colors}
        style={[
          styles.toast,
          {
            shadowColor: config.shadowColor,
          },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <IconComponent size={24} color={config.iconColor} />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>{toast.title}</Text>
            {toast.message && (
              <Text style={styles.message}>{toast.message}</Text>
            )}
          </View>

          {toast.showCloseButton && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => onDismiss(toast.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={Colors.text.white} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Below status bar
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.white,
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: Colors.text.white,
    opacity: 0.9,
    lineHeight: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
