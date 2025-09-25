import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../features/auth/screens/LoginScreen';
import BottomTabNavigator from './BottomTabNavigator';
import AddMenuItemScreen from '../features/menu/screens/AddMenuItemScreen';
import EditMenuItemScreen from '../features/menu/screens/EditMenuItemScreen';
import ProfileEditScreen from '../features/profile/screens/ProfileEditScreen';
import RestaurantLocationScreen from '../features/profile/screens/RestaurantLocationScreen';
import CategoryManagementScreen from '../features/menu/screens/CategoryManagementScreen';
import { BulkOperationsScreen } from '../features/menu/screens/BulkOperationsScreen';

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
  Main: undefined;
  AddMenuItem: undefined;
  EditMenuItem: { item: MenuItem };
  ProfileEdit: { restaurant?: RestaurantProfile };
  RestaurantLocation: undefined;
  CategoryManagement: undefined;
  BulkOperations: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
