import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, tokenManager, User } from '../../../shared/services/api';
import { normalizeEthiopianPhone } from '../../../shared/utils/phoneUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import socketService from '../../../shared/services/socketService';

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
        AsyncStorage.getItem('@onboarding_seen'),
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
      const response = await authAPI.login({ phone: normalizedPhone, password });
      
      if (response.success && response.user && response.token) {
        await tokenManager.setToken(response.token);
        setUser(response.user);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (userData: {
    name: string;
    phone: string;
    password: string;
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
    await AsyncStorage.setItem('@onboarding_seen', 'true');
    setHasSeenOnboarding(true);
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  // Auto-connect Socket.IO when user is authenticated
  useEffect(() => {
    if (user && !isLoading) {
      console.log('🔌 User authenticated, connecting Socket.IO...');
      
      // Connect to Socket.IO with a small delay to ensure auth token is ready
      const connectSocket = async () => {
        try {
          const connected = await socketService.connect();
          if (connected) {
            console.log('✅ Socket.IO connected successfully for user:', user.id);
          } else {
            console.warn('⚠️ Socket.IO connection failed for user:', user.id);
          }
        } catch (error) {
          console.error('❌ Socket.IO connection error:', error);
        }
      };

      // Small delay to ensure authentication is fully complete
      setTimeout(connectSocket, 1000);
    } else if (!user && !isLoading) {
      // User logged out, disconnect Socket.IO
      console.log('🔌 User logged out, disconnecting Socket.IO...');
      socketService.disconnect();
    }
  }, [user, isLoading]);

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
