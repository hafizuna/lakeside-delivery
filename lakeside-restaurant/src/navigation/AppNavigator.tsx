import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RestaurantSignupScreen from '../features/auth/screens/RestaurantSignupScreen';
import BottomTabNavigator from './BottomTabNavigator';
import { useAuth } from '../features/auth/context/AuthContext';
import { Colors } from '../shared/theme/colors';
import AddMenuItemScreen from '../features/menu/screens/AddMenuItemScreen';
import EditMenuItemScreen from '../features/menu/screens/EditMenuItemScreen';
import ProfileEditScreen from '../features/profile/screens/ProfileEditScreen';
import RestaurantLocationScreen from '../features/profile/screens/RestaurantLocationScreen';
import CategoryManagementScreen from '../features/menu/screens/CategoryManagementScreen';
import { BulkOperationsScreen } from '../features/menu/screens/BulkOperationsScreen';
import OrderDetailScreen from '../features/orders/screens/OrderDetailScreen';

interface MenuItem {
  id: number;
  restaurantId: number;
  itemName: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  category: string;
}

interface RestaurantProfile {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  logoUrl?: string;
  bannerUrl?: string;
  rating?: number;
  totalOrders: number;
  description?: string;
  commissionRate: number;
  status: 'OPEN' | 'CLOSED' | 'BUSY';
}

export type RootStackParamList = {
  Login: undefined;
  RestaurantSignup: undefined;
  Main: undefined;
  AddMenuItem: undefined;
  EditMenuItem: { item: MenuItem };
  ProfileEdit: { restaurant?: RestaurantProfile };
  RestaurantLocation: undefined;
  CategoryManagement: undefined;
  BulkOperations: undefined;
  OrderDetail: { orderId: number };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background.primary,
      }}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          // Authenticated screens
          <>
            <Stack.Screen name="Main" component={BottomTabNavigator} />
            <Stack.Screen 
              name="AddMenuItem" 
              component={AddMenuItemScreen}
              options={{ headerShown: true, title: 'Add Menu Item' }}
            />
            <Stack.Screen 
              name="EditMenuItem" 
              component={EditMenuItemScreen}
              options={{ headerShown: true, title: 'Edit Menu Item' }}
            />
            <Stack.Screen 
              name="ProfileEdit" 
              component={ProfileEditScreen}
              options={{ headerShown: true, title: 'Edit Profile' }}
            />
            <Stack.Screen 
              name="RestaurantLocation" 
              component={RestaurantLocationScreen}
              options={{ headerShown: true, title: 'Restaurant Location' }}
            />
            <Stack.Screen 
              name="CategoryManagement" 
              component={CategoryManagementScreen}
            />
            <Stack.Screen 
              name="BulkOperations" 
              component={BulkOperationsScreen}
            />
            <Stack.Screen 
              name="OrderDetail" 
              component={OrderDetailScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // Unauthenticated screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="RestaurantSignup" component={RestaurantSignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
