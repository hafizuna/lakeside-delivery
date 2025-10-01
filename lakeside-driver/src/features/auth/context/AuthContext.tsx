import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, tokenManager, User, Driver } from '../../../shared/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: Driver | null;
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
    vehiclePlate: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  finishOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Driver | null>(null);
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
          if (response.success && response.user) {
            // Verify this is a driver account
            if (response.user.role === 'DRIVER') {
              setUser(response.user);
            } else {
              // Not a driver account, remove token
              await tokenManager.removeToken();
            }
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
      const response = await authAPI.login({ phone, password });
      
      if (response.success && response.user && response.token) {
        // Verify this is a driver account
        if (response.user.role !== 'DRIVER') {
          throw new Error('This account is not registered as a driver');
        }
        
        // Check if driver account is active
        if (response.user.status === 'BLOCKED') {
          throw new Error('Your account has been blocked. Please contact support.');
        }
        
        if (response.user.status === 'PENDING') {
          throw new Error('Your driver account is pending approval. Please wait for verification.');
        }
        
        await tokenManager.setToken(response.token);
        setUser(response.user as Driver);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (userData: {
    name: string;
    phone: string;
    password: string;
    vehicleType: string;
    licenseNumber: string;
    vehiclePlate: string;
  }) => {
    try {
      const signupData = {
        ...userData,
        role: 'DRIVER' as const,
        vehicleRegistration: userData.vehiclePlate,
      };
      
      const response = await authAPI.register(signupData);
      
      if (response.success && response.user && response.token) {
        await tokenManager.setToken(response.token);
        setUser(response.user as Driver);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
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
      await AsyncStorage.removeItem('@driver_user');
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