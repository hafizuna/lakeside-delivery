import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getApiBaseUrl } from '../config/endpoints';

// API Configuration
const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token management
const TOKEN_KEY = "driver_auth_token";

export const tokenManager = {
  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === "web") {
        return localStorage.getItem(TOKEN_KEY);
      } else {
        return await SecureStore.getItemAsync(TOKEN_KEY);
      }
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch (error) {
      console.error("Error setting token:", error);
    }
  },

  async removeToken(): Promise<void> {
    try {
      if (Platform.OS === "web") {
        localStorage.removeItem(TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (error) {
      console.error("Error removing token:", error);
    }
  },
};

// Add token to requests
api.interceptors.request.use(async (config: any) => {
  const token = await tokenManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response: any) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error: any) => {
    console.error(
      `❌ API Error: ${error.response?.status} ${error.config?.url}`
    );
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

export interface Driver extends User {
  vehicleType?: string;
  licenseNumber?: string;
  vehicleRegistration?: string;
  approvalStatus?: string;
  isAvailable?: boolean;
  rating?: number;
  totalDeliveries?: number;
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
  role: "DRIVER";
  vehicleType: string;
  licenseNumber: string;
  vehicleRegistration: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

// Order Types
export interface Order {
  id: number;
  orderNumber: string;
  restaurantId: number;
  restaurantName: string;
  restaurantAddress: string;
  restaurantLat: number;
  restaurantLng: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  driverEarning: number;
  tip: number;
  status: string;
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
  createdAt: Date;
}

export interface OrderItem {
  id: number;
  itemName: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

// Wallet Types
export interface DriverWallet {
  balance: number;
  totalEarnings: number;
  collateralAmount: number;
  pendingEarnings: number;
}

// API Functions

// Authentication API
export const authAPI = {
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", userData);
    return response.data;
  },

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", credentials);
    return response.data;
  },

  async getProfile(): Promise<{ success: boolean; user: Driver }> {
    const response = await api.get("/auth/me");
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async verifyToken(): Promise<{ success: boolean; user: Driver }> {
    const response = await api.post("/auth/verify-token");
    return response.data;
  },
};

// Driver API
export const driverAPI = {
  async getAvailableOrders(): Promise<{
    success: boolean;
    data: Order[];
    count: number;
  }> {
    const response = await api.get("/driver/orders/available");
    return response.data;
  },


  // New hybrid assignment system endpoints
  async acceptAssignmentOffer(
    assignmentId: string
  ): Promise<{ success: boolean; data: Order; message: string }> {
    const response = await api.post(`/driver/assignments/offers/${assignmentId}/accept`);
    return response.data;
  },

  async declineAssignmentOffer(
    assignmentId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.post(`/driver/assignments/offers/${assignmentId}/decline`, {
      reason,
    });
    return response.data;
  },

  async updateDriverState(
    state: 'online' | 'offline',
    location?: { latitude: number; longitude: number }
  ): Promise<{ success: boolean; data: any }> {
    const response = await api.post('/driver/assignments/state', {
      state,
      location,
    });
    return response.data;
  },

  async sendHeartbeat(
    location?: { latitude: number; longitude: number }
  ): Promise<{ success: boolean }> {
    const response = await api.post('/driver/assignments/heartbeat', {
      location,
      timestamp: new Date().toISOString(),
    });
    return response.data;
  },

  async getDriverDashboard(): Promise<{
    success: boolean;
    data: {
      activeAssignment: any | null;
      todayStats: {
        deliveries: number;
        earnings: number;
        hoursOnline: number;
        successRate: number;
      };
      recentActivity: any[];
    };
  }> {
    const response = await api.get('/driver/assignments/dashboard');
    return response.data;
  },

  async getDriverEarnings(
    period: 'today' | 'week' | 'month' = 'today'
  ): Promise<{
    success: boolean;
    data: {
      totalEarnings: number;
      deliveryFees: number;
      tips: number;
      bonuses: number;
      totalDeliveries: number;
      averageEarningPerDelivery: number;
      period: string;
    };
  }> {
    const response = await api.get(`/driver/assignments/dashboard/earnings?period=${period}`);
    return response.data;
  },

  async getDriverPerformance(): Promise<{
    success: boolean;
    data: {
      rating: number;
      totalDeliveries: number;
      successRate: number;
      onTimeRate: number;
      avgDeliveryTime: number;
      customerFeedback: any[];
    };
  }> {
    const response = await api.get('/driver/assignments/dashboard/performance');
    return response.data;
  },

  async getActiveOrder(): Promise<{ success: boolean; data: Order | null }> {
    const response = await api.get("/driver/orders/active");
    return response.data;
  },

  async updateOrderStatus(
    orderId: number,
    status: string
  ): Promise<{ success: boolean; data: Order }> {
    const response = await api.put(`/driver/orders/${orderId}/status`, {
      status,
    });
    return response.data;
  },

  async arriveAtRestaurant(
    orderId: number
  ): Promise<{ success: boolean; data: Order }> {
    const response = await api.post(`/driver/orders/${orderId}/arrive`);
    return response.data;
  },

  async pickupOrder(
    orderId: number
  ): Promise<{ success: boolean; data: Order }> {
    const response = await api.post(`/driver/orders/${orderId}/pickup`);
    return response.data;
  },

  async startDelivery(
    orderId: number
  ): Promise<{ success: boolean; data: Order }> {
    const response = await api.post(`/driver/orders/${orderId}/start-delivery`);
    return response.data;
  },

  async completeDelivery(
    orderId: number,
    proof?: any
  ): Promise<{ success: boolean; data: Order }> {
    const response = await api.post(`/driver/orders/${orderId}/complete`, {
      proof,
    });
    return response.data;
  },

  async getOrderHistory(params?: { limit?: number; offset?: number }): Promise<{
    success: boolean;
    data: Order[];
    total: number;
  }> {
    const response = await api.get("/driver/orders/history", { params });
    return response.data;
  },

  async updateLocation(
    latitude: number,
    longitude: number
  ): Promise<{ success: boolean }> {
    const response = await api.post("/driver/location", {
      latitude,
      longitude,
    });
    return response.data;
  },

  async updateAvailability(
    isAvailable: boolean
  ): Promise<{ success: boolean; data: Driver }> {
    const response = await api.put("/driver/availability", { isAvailable });
    return response.data;
  },

  async getProfile(): Promise<{ success: boolean; data: Driver }> {
    const response = await api.get("/driver/profile");
    return response.data;
  },

  async updateProfile(
    data: Partial<Driver>
  ): Promise<{ success: boolean; data: Driver }> {
    const response = await api.put("/driver/profile", data);
    return response.data;
  },
};

// Wallet API
export const walletAPI = {
  async getBalance(): Promise<{ success: boolean; data: DriverWallet }> {
    const response = await api.get("/driver/wallet/balance");
    return response.data;
  },

  async getTransactionHistory(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{
    success: boolean;
    data: any[];
    total: number;
  }> {
    const response = await api.get("/driver/wallet/transactions", { params });
    return response.data;
  },

  async requestWithdrawal(
    amount: number,
    method: string
  ): Promise<{
    success: boolean;
    message: string;
    transaction: any;
  }> {
    const response = await api.post("/driver/wallet/withdraw", {
      amount,
      method,
    });
    return response.data;
  },

  async getEarningsSummary(period?: "daily" | "weekly" | "monthly"): Promise<{
    success: boolean;
    data: {
      total: number;
      deliveries: number;
      tips: number;
      bonuses: number;
      period: string;
    };
  }> {
    const response = await api.get("/driver/earnings/summary", {
      params: { period },
    });
    return response.data;
  },
};

export default api;
