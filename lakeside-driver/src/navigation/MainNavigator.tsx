import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { OrdersScreen } from '../features/orders/screens/OrdersScreen';
import { EarningsScreen } from '../features/earnings/screens/EarningsScreen';
import { AccountScreen } from '../features/account/screens/AccountScreen';
import { BottomNavigation, TabName } from '../components/navigation/BottomNavigation';
import { OrderProvider } from '../features/orders/context/OrderContext';
import { DashboardProvider } from '../features/dashboard/context/DashboardContext';
import driverService from '../shared/services/driverService';
import { LoadingSpinner } from '../shared/components/LoadingSpinner';

export const MainNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabName>('Home');
  const [isServiceInitialized, setIsServiceInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  // Initialize driver service on mount
  useEffect(() => {
    let mounted = true;

    const initializeServices = async () => {
      try {
        console.log('🚀 Initializing driver services...');
        
        const initialized = await driverService.initialize({
          onError: (error) => {
            console.error('Driver service error:', error);
            if (mounted) {
              setInitializationError(error);
            }
          },
          onStateChange: (state) => {
            console.log('Driver service state changed:', state);
          },
          onSocketConnectionChange: (connected) => {
            console.log('Socket connection changed:', connected);
            if (!connected && mounted) {
              // Could show a toast notification here
              console.warn('Real-time connection lost');
            }
          },
        });

        if (mounted) {
          if (initialized) {
            setIsServiceInitialized(true);
            console.log('✅ Driver services initialized successfully');
          } else {
            setInitializationError('Failed to initialize driver services');
          }
        }
      } catch (error: any) {
        console.error('Service initialization error:', error);
        if (mounted) {
          setInitializationError(error.message || 'Service initialization failed');
        }
      }
    };

    initializeServices();

    return () => {
      mounted = false;
      driverService.cleanup();
    };
  }, []);

  // Handle initialization error
  useEffect(() => {
    if (initializationError) {
      Alert.alert(
        'Service Error',
        `Driver services failed to initialize: ${initializationError}\n\nSome features may not work correctly.`,
        [
          { text: 'Retry', onPress: () => setInitializationError(null) },
          { text: 'Continue Anyway', onPress: () => setIsServiceInitialized(true) },
        ]
      );
    }
  }, [initializationError]);

  const handleTabPress = (tab: TabName) => {
    setActiveTab(tab);
  };

  const renderCurrentScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeScreen />;
      case 'Orders':
        return <OrdersScreen />;
      case 'Earnings':
        return <EarningsScreen />;
      case 'Account':
        return <AccountScreen />;
      default:
        return <HomeScreen />;
    }
  };

  // Show loading screen while initializing services
  if (!isServiceInitialized && !initializationError) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </View>
    );
  }

  return (
    <DashboardProvider>
      <OrderProvider>
        <View style={styles.container}>
          <View style={styles.content}>
            {renderCurrentScreen()}
          </View>
          <BottomNavigation
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        </View>
      </OrderProvider>
    </DashboardProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
