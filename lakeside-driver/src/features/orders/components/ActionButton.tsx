import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Colors } from '../../../shared/theme/colors';

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'success' | 'warning';
}

const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}) => {
  const getButtonStyle = () => {
    if (disabled) {
      return [styles.button, styles.buttonDisabled];
    }
    
    switch (variant) {
      case 'success':
        return [styles.button, styles.buttonSuccess];
      case 'warning':
        return [styles.button, styles.buttonWarning];
      default:
        return [styles.button, styles.buttonPrimary];
    }
  };

  const getTextStyle = () => {
    if (disabled) {
      return [styles.buttonText, styles.buttonTextDisabled];
    }
    return [styles.buttonText, styles.buttonTextEnabled];
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {loading && (
          <ActivityIndicator
            size="small"
            color="white"
            style={styles.loader}
          />
        )}
        <Text style={getTextStyle()}>
          {loading ? 'Processing...' : title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary.main,
  },
  buttonSuccess: {
    backgroundColor: '#22c55e',
  },
  buttonWarning: {
    backgroundColor: '#f59e0b',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonTextEnabled: {
    color: 'white',
  },
  buttonTextDisabled: {
    color: '#d1d5db',
  },
});

export default ActionButton;