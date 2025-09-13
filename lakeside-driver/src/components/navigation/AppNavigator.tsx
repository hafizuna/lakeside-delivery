import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Layout } from '../../shared/theme';
import { useAuth } from '../../features/auth/context/AuthContext';
import {
  DashboardIcon,
  OrdersIcon,
  WalletIcon,
  ProfileIcon,
  BikeIcon,
} from '../../shared/components/CustomIcons';

// Auth Screens
import { LoginScreen } from '../../features/auth/screens/LoginScreen';
import { SignupScreen } from '../../features/auth/screens/SignupScreen';
import { DriverRegistrationScreen } from '../../features/onboarding/screens/DriverRegistrationScreen';

// Main App Screens (placeholders for now)
import { DashboardScreen } from '../../features/dashboard/screens/DashboardScreen';
import { DeliveryScreen } from '../../features/delivery/screens/DeliveryScreen';
import { WalletScreen } from '../../features/wallet/screens/WalletScreen';
import { ProfileScreen } from '../../features/profile/screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={Colors.primary.main} />
  </View>
);

// Auth Stack Navigator
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background.primary },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          animationTypeForReplace: 'push',
        }}
      />
      <Stack.Screen 
        name="Signup" 
        component={SignupScreen}
        options={{
          animationTypeForReplace: 'push',
        }}
      />
      <Stack.Screen 
        name="DriverRegistration" 
        component={DriverRegistrationScreen}
        options={{
          animationTypeForReplace: 'push',
        }}
      />
    </Stack.Navigator>
  );
};

// Main App Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: Colors.border.light,
          paddingVertical: Spacing.xs,
          height: 85,
          ...Layout.shadow,
        },
        tabBarLabelStyle: {
          fontSize: Typography.fontSize.xs,
          fontWeight: Typography.fontWeight.medium,
          marginTop: 4,
          marginBottom: 8,
        },
        tabBarActiveTintColor: Colors.primary.main,
        tabBarInactiveTintColor: Colors.text.secondary,
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;
          const iconSize = focused ? 28 : 24;
          const iconColor = focused ? Colors.primary.main : Colors.text.secondary;

          switch (route.name) {
            case 'DashboardTab':
              IconComponent = DashboardIcon;
              break;
            case 'OrderHistoryTab':
              IconComponent = OrdersIcon;
              break;
            case 'Wallet':
              IconComponent = WalletIcon;
              break;
            case 'Profile':
              IconComponent = ProfileIcon;
              break;
            default:
              IconComponent = DashboardIcon;
          }

          return <IconComponent size={iconSize} color={iconColor} />;
        },
      })}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardStackNavigator}
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="OrderHistoryTab" 
        component={DeliveryScreen}
        options={{
          tabBarLabel: 'History',
        }}
      />
      <Tab.Screen 
        name="Wallet" 
        component={WalletScreen}
        options={{
          tabBarLabel: 'Wallet',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Dashboard Stack Navigator for order flow
const DashboardStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background.secondary },
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen}
      />
      <Stack.Screen 
        name="ActiveDelivery" 
        component={DeliveryScreen}
        options={{
          gestureEnabled: false, // Prevent swipe back during active delivery
        }}
      />
    </Stack.Navigator>
  );
};

// Root Navigator
export const AppNavigator: React.FC = () => {
  const { 
    isLoading, 
    isAuthenticated, 
    hasSeenOnboarding, 
    login, 
    signup
  } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login">
              {({ navigation }) => (
                <LoginScreen
                  onLogin={login}
                  onNavigateToSignup={() => navigation.navigate('Signup')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Signup">
              {({ navigation }) => (
                <SignupScreen
                  onSignup={signup}
                  onNavigateToLogin={() => navigation.navigate('Login')}
                />
              )}
            </Stack.Screen>
          </>
        ) : (
          <Stack.Screen name="Home">
            {() => <MainTabNavigator />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
});
