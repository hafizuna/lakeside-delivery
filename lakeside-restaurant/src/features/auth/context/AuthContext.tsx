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
  businessLicense?: string;
  approved: boolean;
  commissionRate: number;
  status: 'OPEN' | 'CLOSED' | 'SUSPENDED';
}

export interface RestaurantSignupData {
  name: string;
  phone: string;
  password: string;
  businessLicense?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  restaurant: Restaurant | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (signupData: RestaurantSignupData) => Promise<{ success: boolean; message?: string }>;
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
      // Let the apiService handle token loading and validation
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        setRestaurant(response.data);
        setIsAuthenticated(true);
      } else {
        // Profile fetch failed, user is not authenticated
        setIsAuthenticated(false);
        setRestaurant(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setLoading(true);
      const normalizedPhone = normalizeEthiopianPhone(phone);
      const response = await apiService.login(normalizedPhone, password);
      
      if (response.success && response.data) {
        setRestaurant(response.data.restaurant);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Invalid phone number or password' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (signupData: RestaurantSignupData): Promise<{ success: boolean; message?: string }> => {
    try {
      setLoading(true);
      const normalizedPhone = normalizeEthiopianPhone(signupData.phone);
      const response = await apiService.register({
        ...signupData,
        phone: normalizedPhone,
      });
      
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'An error occurred during registration' };
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
    register,
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
