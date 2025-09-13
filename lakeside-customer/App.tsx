import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import providers and navigation
import { AuthProvider } from './src/features/auth/context/AuthContext';
import { CartProvider } from './src/features/cart/context/CartContext';
import { NotificationProvider } from './src/shared/context/NotificationContext';
import { ToastProvider } from './src/shared/context/ToastContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Colors } from './src/shared/theme';

export default function App() {

  return (
    <GestureHandlerRootView style={styles.container}>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <AppNavigator />
            </NotificationProvider>
            <StatusBar style="dark" backgroundColor={Colors.background.primary} />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
