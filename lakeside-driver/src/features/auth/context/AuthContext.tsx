import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, tokenManager, User } from '../../../shared/services/api';
import { normalizeEthiopianPhone } from '../../../shared/utils/phoneUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  login: (phone: string, password: string) => Promise<void>;
  signup: (userData: {
    name: string;
    phone: string;
    password: string;
    vehicleType: string;
    licenseNumber: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  finishOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  const checkAuthState = async () => {
    try {
      const [token, onboardingSeen] = await Promise.all([
        tokenManager.getToken(),
        AsyncStorage.getItem('@driver_onboarding_seen'),
      ]);
      
      if (onboardingSeen === 'true') {
        setHasSeenOnboarding(true);
      }
      
      if (token) {
        try {
          const response = await authAPI.verifyToken();
          if (response.success) {
            setUser(response.user);
          } else {
            await tokenManager.removeToken();
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          await tokenManager.removeToken();
        }
      }
    } catch (error) {
      console.error('Failed to check auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone: string, password: string) => {
    try {
      const normalizedPhone = normalizeEthiopianPhone(phone);
      console.log('🔐 Attempting login with:', { phone: normalizedPhone });
      console.log('📡 API URL:', 'http://192.168.219.154:3001/api/auth/login');
      
      const response = await authAPI.login({ phone: normalizedPhone, password });
      console.log('✅ Login API response:', response);
      
      if (response.success && response.user && response.token) {
        console.log('🎉 Login successful, setting token and user');
        await tokenManager.setToken(response.token);
        setUser(response.user);
      } else {
        console.log('❌ Login failed - API returned unsuccessful response:', response);
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      // Detailed error logging
      console.log('💥 Login error details:');
      console.log('- Error type:', error.constructor.name);
      console.log('- Error message:', error.message);
      console.log('- Error code:', error.code);
      
      if (error.response) {
        // Server responded with error status
        console.log('🌐 Server Response Error:');
        console.log('- Status:', error.response.status);
        console.log('- Status Text:', error.response.statusText);
        console.log('- Response Data:', error.response.data);
        console.log('- Response Headers:', error.response.headers);
      } else if (error.request) {
        // Request made but no response received
        console.log('📡 Network/Request Error:');
        console.log('- Request details:', error.request);
        console.log('- Possible causes: Server not running, network issues, wrong IP address');
      } else {
        // Something else happened
        console.log('❓ Other error:', error.message);
      }
      
      throw error;
    }
  };

  const signup = async (userData: {
    name: string;
    phone: string;
    password: string;
    vehicleType: string;
    licenseNumber: string;
  }) => {
    try {
      const normalizedPhone = normalizeEthiopianPhone(userData.phone);
      const response = await authAPI.register({ ...userData, phone: normalizedPhone });
      
      if (response.success && response.user && response.token) {
        await tokenManager.setToken(response.token);
        setUser(response.user);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await tokenManager.removeToken();
      setUser(null);
    }
  };

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('@driver_onboarding_seen', 'true');
    setHasSeenOnboarding(true);
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    hasSeenOnboarding,
    login,
    signup,
    logout,
    finishOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
