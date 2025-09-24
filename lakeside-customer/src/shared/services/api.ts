import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// API Configuration
// Use localhost for web, your computer's IP for mobile devices
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3001/api';
  } else {
    // For mobile devices, use your computer's IP address
    // You may need to update this IP if your network changes
    return 'http://192.168.1.8:3001/api';
  }
};

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'auth_token';

const tokenManager = {
  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(TOKEN_KEY);
      } else {
        return await SecureStore.getItemAsync(TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch (error) {
      console.error('Error setting token:', error);
    }
  },

  async removeToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error removing token:', error);
    }
  },
};

// Add token to requests
api.interceptors.request.use(async (config: any) => {
  const token = await tokenManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    if (error.response?.status === 401) {
      await tokenManager.removeToken();
    }
    return Promise.reject(error);
  }
);

// API Types
export interface User {
  id: number;
  name: string;
  phone: string;
  role: string;
  status: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface RegisterRequest {
  name: string;
  phone: string;
  password: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

// Restaurant types
export interface Restaurant {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: 'OPEN' | 'CLOSED' | 'SUSPENDED';
  logoUrl?: string;
  bannerUrl?: string;
  rating?: number;
  totalOrders?: number;
  description?: string;
  user?: {
    name: string;
  };
  menus?: MenuItem[];
}

export interface MenuItem {
  id: number;
  restaurantId: number;
  itemName: string;
  description?: string;
  price: string | number; // API returns string, but can handle both types
  imageUrl?: string;
  isAvailable: boolean;
  category?: string; // Added from debug output
}

// API Functions
export const authAPI = {
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  async getProfile(): Promise<{ success: boolean; user: User }> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async verifyToken(): Promise<{ success: boolean; user: User }> {
    const response = await api.post('/auth/verify-token');
    return response.data;
  },
};

// Restaurant API Functions
export const restaurantAPI = {
  async getRestaurants(params?: { search?: string; limit?: number; offset?: number }): Promise<{ success: boolean; data: Restaurant[]; total: number }> {
    try {
      console.log('Calling getRestaurants API...');
      const response = await api.get('/restaurants', { params });
      console.log('getRestaurants response:', response.data);
      return response.data;
    } catch (error) {
      console.error('getRestaurants error:', error);
      throw error;
    }
  },

  async getRestaurantById(id: number): Promise<{ success: boolean; data: Restaurant }> {
    try {
      console.log('Calling getRestaurantById API...');
      const response = await api.get(`/restaurants/${id}`);
      console.log('getRestaurantById response:', response.data);
      return response.data;
    } catch (error) {
      console.error('getRestaurantById error:', error);
      throw error;
    }
  },

  async getCategories(): Promise<{ success: boolean; data: string[] }> {
    try {
      console.log('Calling getCategories API...');
      const response = await api.get('/restaurants/categories');
      console.log('getCategories response:', response.data);
      return response.data;
    } catch (error) {
      console.error('getCategories error:', error);
      throw error;
    }
  },
};

// Order API Functions
export const orderAPI = {
  async getUserOrders(): Promise<{ success: boolean; data: import('../types/Order').Order[] }> {
    try {
      console.log('Calling getUserOrders API...');
      const response = await api.get('/orders/user');
      console.log('getUserOrders response:', response.data);
      return response.data;
    } catch (error) {
      console.error('getUserOrders error:', error);
      throw error;
    }
  },

  async getOrderById(orderId: number): Promise<{ success: boolean; data: import('../types/Order').Order }> {
    try {
      console.log('Calling getOrderById API...');
      const response = await api.get(`/orders/${orderId}`);
      console.log('getOrderById response:', response.data);
      return response.data;
    } catch (error) {
      console.error('getOrderById error:', error);
      throw error;
    }
  },

  async createOrder(orderData: {
    restaurantId: number;
    items: Array<{ menuId: number; quantity: number; price: number }>;
    totalPrice: number;
    deliveryFee: number;
    deliveryAddress: string;
    deliveryLat?: number;
    deliveryLng?: number;
    deliveryInstructions?: string;
    paymentMethod: string;
  }): Promise<{ success: boolean; data: import('../types/Order').Order }> {
    try {
      console.log('🌐 API: Calling createOrder...');
      console.log('🌐 API: Base URL:', api.defaults.baseURL);
      console.log('🌐 API: Endpoint: /orders');
      console.log('🌐 API: Order Data:', JSON.stringify(orderData, null, 2));
      
      const response = await api.post('/orders', orderData);
      
      console.log('✅ API: createOrder response status:', response.status);
      console.log('✅ API: createOrder response data:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.error('❌ API: createOrder error details:');
      console.error('❌ API: Error:', error);
      console.error('❌ API: Error message:', error.message);
      console.error('❌ API: Error response:', error.response);
      console.error('❌ API: Error response status:', error.response?.status);
      console.error('❌ API: Error response data:', error.response?.data);
      throw error;
    }
  },

// NOTE: Order cancellation is now handled by the escrow API
  // See escrowAPI.cancelOrder() in OrderDetailScreen.tsx
};

// Wallet API Functions
export const walletAPI = {
  async getWallet(): Promise<{ success: boolean; data: any; message?: string }> {
    try {
      console.log('Calling getWallet API...');
      const response = await api.get('/wallet');
      console.log('getWallet response:', response.data);
      return response.data;
    } catch (error) {
      console.error('getWallet error:', error);
      throw error;
    }
  },

  async requestTopUp(amount: number, screenshotUrl?: string): Promise<{ success: boolean; data: any; message?: string }> {
    try {
      console.log('Calling requestTopUp API...');
      const response = await api.post('/wallet/topup', {
        amount,
        screenshotUrl
      });
      console.log('requestTopUp response:', response.data);
      return response.data;
    } catch (error) {
      console.error('requestTopUp error:', error);
      throw error;
    }
  },

  async getTransactionHistory(page: number = 1, limit: number = 20): Promise<{ success: boolean; data: { transactions: any[]; pagination: any }; message?: string }> {
    try {
      console.log('Calling getTransactionHistory API...');
      const response = await api.get('/wallet/transactions', {
        params: { page, limit }
      });
      console.log('getTransactionHistory response:', response.data);
      return response.data;
    } catch (error) {
      console.error('getTransactionHistory error:', error);
      throw error;
    }
  },

  async checkBalance(amount: number): Promise<{ success: boolean; data: { hasSufficientBalance: boolean; currentBalance: number }; message?: string }> {
    try {
      console.log('Calling checkBalance API...');
      const response = await api.get('/wallet/check-balance', {
        params: { amount }
      });
      console.log('checkBalance response:', response.data);
      return response.data;
    } catch (error) {
      console.error('checkBalance error:', error);
      throw error;
    }
  }
};

// Rating API Functions
export const ratingAPI = {
  async rateRestaurant(restaurantId: number, rating: number, comment?: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Calling rateRestaurant API...');
      const response = await api.post('/ratings/restaurant', {
        restaurantId,
        rating,
        comment
      });
      console.log('rateRestaurant response:', response.data);
      return response.data;
    } catch (error) {
      console.error('rateRestaurant error:', error);
      throw error;
    }
  },

  async rateOrder(orderId: number, rating: number, comment?: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Calling rateOrder API...');
      const response = await api.post('/ratings/order', {
        orderId,
        rating,
        comment
      });
      console.log('rateOrder response:', response.data);
      return response.data;
    } catch (error) {
      console.error('rateOrder error:', error);
      throw error;
    }
  },

  async getUserRatings(): Promise<{ success: boolean; data: any[] }> {
    try {
      console.log('Calling getUserRatings API...');
      const response = await api.get('/ratings/user');
      console.log('getUserRatings response:', response.data);
      return response.data;
    } catch (error) {
      console.error('getUserRatings error:', error);
      throw error;
    }
  },

  async rateDriver(driverId: number, rating: number, comment?: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Calling rateDriver API...');
      const response = await api.post('/ratings/driver', {
        driverId,
        rating,
        comment
      });
      console.log('rateDriver response:', response.data);
      return response.data;
    } catch (error) {
      console.error('rateDriver error:', error);
      throw error;
    }
  },

  async checkRating(type: 'restaurant' | 'order' | 'driver', targetId: number): Promise<{ success: boolean; data: { hasRated: boolean; rating: any } }> {
    try {
      console.log(`Calling checkRating API for ${type}:${targetId}...`);
      const response = await api.get(`/ratings/check/${type}/${targetId}`);
      console.log('checkRating response:', response.data);
      return response.data;
    } catch (error) {
      console.error('checkRating error:', error);
      throw error;
    }
  }
};

export { tokenManager };
export default api;
