import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { LoginScreen } from './src/features/auth/screens/LoginScreen';
import { ToastProvider } from './src/shared/context/ToastContext';

export default function TestLoginApp() {
  const handleLogin = async (phone: string, password: string) => {
    // Mock login logic - simulate API call
    console.log('Mock login:', { phone, password });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock success (you can change this to throw an error to test error handling)
    return { success: true, token: 'mock-token' };
  };

  const handleNavigateToSignup = () => {
    console.log('Navigate to signup');
    // Mock navigation to signup
  };

  return (
    <ToastProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <LoginScreen 
          onLogin={handleLogin}
          onNavigateToSignup={handleNavigateToSignup}
        />
      </NavigationContainer>
    </ToastProvider>
  );
}
