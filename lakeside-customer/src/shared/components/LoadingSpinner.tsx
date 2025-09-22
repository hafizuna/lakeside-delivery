import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  style?: any;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'large',
  style 
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={Colors.primary.main} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export default LoadingSpinner;
