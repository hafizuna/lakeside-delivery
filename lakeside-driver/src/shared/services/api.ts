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
    return 'http://172.20.10.3:3001/api';
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
const TOKEN_KEY = 'driver_auth_token';

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
  // Driver-specific fields
  vehicleType?: string;
  licenseNumber?: string;
  isActive?: boolean;
  location?: {
    lat: number;
    lng: number;
  };
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
  vehicleType: string;
  licenseNumber: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

// Driver-specific types
export interface DeliveryOrder {
  id: number;
  restaurantId: number;
  customerId: number;
  status: 'PENDING' | 'ACCEPTED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
  totalPrice: number;
  deliveryFee: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  estimatedDeliveryTime: string;
  restaurant: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  customer: {
    name: string;
    phone: string;
  };
  items: Array<{
    itemName: string;
    quantity: number;
    price: number;
  }>;
}

// API Functions
export const authAPI = {
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', {
      ...userData,
      role: 'driver', // Ensure driver role
    });
    return response.data;
  },

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', {
      ...credentials,
      role: 'driver', // Ensure driver role
    });
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

// Driver-specific API Functions
export const driverAPI = {
  async getAvailableOrders(): Promise<{ success: boolean; data: DeliveryOrder[] }> {
    try {
      console.log('Calling getAvailableOrders API...');
      const response = await api.get('/driver/orders/available');
      console.log('getAvailableOrders response:', response.data);
      return response.data;
    } catch (error) {
      console.error('getAvailableOrders error:', error);
      throw error;
    }
  },

  async acceptOrder(orderId: number): Promise<{ success: boolean; data: DeliveryOrder }> {
    try {
      console.log('Calling acceptOrder API...');
      const response = await api.post(`/driver/orders/${orderId}/accept`);
      console.log('acceptOrder response:', response.data);
      return response.data;
    } catch (error) {
      console.error('acceptOrder error:', error);
      throw error;
    }
  },

  async updateOrderStatus(orderId: number, status: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Calling updateOrderStatus API...');
      const response = await api.patch(`/driver/orders/${orderId}/status`, { status });
      console.log('updateOrderStatus response:', response.data);
      return response.data;
    } catch (error) {
      console.error('updateOrderStatus error:', error);
      throw error;
    }
  },

  async updateLocation(lat: number, lng: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/driver/location', { lat, lng });
      return response.data;
    } catch (error) {
      console.error('updateLocation error:', error);
      throw error;
    }
  },

  async getEarnings(period: 'day' | 'week' | 'month' = 'day'): Promise<{ success: boolean; data: any }> {
    try {
      console.log('Calling getEarnings API...');
      const response = await api.get('/driver/earnings', {
        params: { period }
      });
      console.log('getEarnings response:', response.data);
      return response.data;
    } catch (error) {
      console.error('getEarnings error:', error);
      throw error;
    }
  },

  async toggleAvailability(isAvailable: boolean): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Calling toggleAvailability API...');
      const response = await api.post('/driver/availability', { isAvailable });
      console.log('toggleAvailability response:', response.data);
      return response.data;
    } catch (error) {
      console.error('toggleAvailability error:', error);
      throw error;
    }
  },
};

export { tokenManager };
export default api;
