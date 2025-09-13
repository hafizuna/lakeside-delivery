import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../../../shared/services/api';
import { normalizeEthiopianPhone } from '../../../shared/utils/phoneUtils';

interface Restaurant {
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
  status: 'OPEN' | 'CLOSED' | 'SUSPENDED';
}

interface AuthContextType {
  isAuthenticated: boolean;
  restaurant: Restaurant | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateRestaurant: (restaurant: Restaurant) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('restaurant_token');
      if (token) {
        const response = await apiService.getProfile();
        if (response.success && response.data) {
          setRestaurant(response.data);
          setIsAuthenticated(true);
        } else {
          // Token is invalid, remove it
          await AsyncStorage.removeItem('restaurant_token');
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      await AsyncStorage.removeItem('restaurant_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const normalizedPhone = normalizeEthiopianPhone(phone);
      const response = await apiService.login(normalizedPhone, password);
      
      if (response.success && response.data) {
        setRestaurant(response.data.restaurant);
        setIsAuthenticated(true);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
      setIsAuthenticated(false);
      setRestaurant(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateRestaurant = (updatedRestaurant: Restaurant) => {
    setRestaurant(updatedRestaurant);
  };

  const value: AuthContextType = {
    isAuthenticated,
    restaurant,
    loading,
    login,
    logout,
    updateRestaurant,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
