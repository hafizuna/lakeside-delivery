import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import providers and navigation
import { AuthProvider } from './src/features/auth/context/AuthContext';
import { ToastProvider } from './src/shared/context/ToastContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Colors } from './src/shared/theme';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ToastProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
          <StatusBar style="dark" backgroundColor={Colors.background.primary} />
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
