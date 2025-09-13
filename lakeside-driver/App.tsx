import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/components/navigation/AppNavigator';
import { AuthProvider } from './src/features/auth/context/AuthContext';
import { ToastProvider } from './src/shared/context/ToastContext';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </ToastProvider>
    </AuthProvider>
  );
}
