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
  restaurantPhone?: string; // Add restaurant phone for calling
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
  // Delivery tracking timestamps
  driverAssignedAt?: Date;
  arrivedAtRestaurantAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  // Pool order system fields
  isPoolOrder?: boolean;
  poolEntryTime?: string;
  orderType?: 'pool' | 'realtime';
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

// Helper function to transform backend order data to frontend Order interface
function transformBackendOrder(backendOrder: any, fallbackStatus?: string): Order {
  console.log('=== transformBackendOrder Debug ===');
  console.log('Backend order ID:', backendOrder.id);
  console.log('Backend orderItems type:', typeof backendOrder.orderItems);
  console.log('Backend orderItems isArray:', Array.isArray(backendOrder.orderItems));
  console.log('Backend orderItems:', backendOrder.orderItems);
  console.log('Backend orderItems length:', backendOrder.orderItems?.length);
  
  const transformedItems = Array.isArray(backendOrder.orderItems) ? backendOrder.orderItems.map((item: any) => ({
    id: item.id || 0,
    itemName: item.menu?.itemName || 'Unknown Item',
    quantity: item.quantity || 1,
    price: item.price?.toNumber ? item.price.toNumber() : (item.price || 0),
    specialInstructions: item.specialInstructions || undefined,
  })) : [];
  
  console.log('Transformed items type:', typeof transformedItems);
  console.log('Transformed items isArray:', Array.isArray(transformedItems));
  console.log('Transformed items length:', transformedItems.length);
  console.log('Transformed items:', transformedItems);
  console.log('=== End transformBackendOrder Debug ===');
  
  return {
    id: backendOrder.id,
    orderNumber: `ORD-${backendOrder.id.toString().padStart(6, '0')}`,
    restaurantId: backendOrder.restaurantId,
    restaurantName: backendOrder.restaurant?.name || 'Unknown Restaurant',
    restaurantAddress: backendOrder.restaurant?.address || 'Unknown Address',
    restaurantPhone: backendOrder.restaurant?.user?.phone || null,
    restaurantLat: backendOrder.restaurant?.lat?.toNumber ? backendOrder.restaurant.lat.toNumber() : (backendOrder.restaurant?.lat || 0),
    restaurantLng: backendOrder.restaurant?.lng?.toNumber ? backendOrder.restaurant.lng.toNumber() : (backendOrder.restaurant?.lng || 0),
    customerId: backendOrder.customerId,
    customerName: backendOrder.customer?.name || 'Unknown Customer',
    customerPhone: backendOrder.customer?.phone || '',
    deliveryAddress: backendOrder.deliveryAddress || '',
    deliveryLat: backendOrder.deliveryLat?.toNumber ? backendOrder.deliveryLat.toNumber() : (backendOrder.deliveryLat || 0),
    deliveryLng: backendOrder.deliveryLng?.toNumber ? backendOrder.deliveryLng.toNumber() : (backendOrder.deliveryLng || 0),
    items: transformedItems,
    totalAmount: backendOrder.totalPrice?.toNumber ? backendOrder.totalPrice.toNumber() : (backendOrder.totalPrice || 0),
    deliveryFee: backendOrder.deliveryFee?.toNumber ? backendOrder.deliveryFee.toNumber() : (backendOrder.deliveryFee || 0),
    driverEarning: backendOrder.driverEarning?.toNumber ? backendOrder.driverEarning.toNumber() : (backendOrder.driverEarning || 0),
    tip: 0, // Tips are usually added after delivery
    status: backendOrder.status || fallbackStatus || 'unknown',
    estimatedPickupTime: backendOrder.estimatedPickupTime ? new Date(backendOrder.estimatedPickupTime) : undefined,
    estimatedDeliveryTime: backendOrder.estimatedDeliveryTime ? new Date(backendOrder.estimatedDeliveryTime) : undefined,
    createdAt: backendOrder.createdAt ? new Date(backendOrder.createdAt) : new Date(),
    // Preserve delivery tracking timestamps
    driverAssignedAt: backendOrder.driverAssignedAt ? new Date(backendOrder.driverAssignedAt) : undefined,
    arrivedAtRestaurantAt: backendOrder.arrivedAtRestaurantAt ? new Date(backendOrder.arrivedAtRestaurantAt) : undefined,
    pickedUpAt: backendOrder.pickedUpAt ? new Date(backendOrder.pickedUpAt) : undefined,
    deliveredAt: backendOrder.deliveredAt ? new Date(backendOrder.deliveredAt) : undefined,
  };
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
    
    console.log('🔍 AVAILABLE ORDERS API - Full response structure:', response);
    console.log('🔍 AVAILABLE ORDERS API - Response data:', response.data);
    console.log('🔍 AVAILABLE ORDERS API - Response.data.data:', response.data?.data);
    console.log('🔍 AVAILABLE ORDERS API - Response.data.success:', response.data?.success);
    
    // Handle different possible API response structures
    if (response.data?.success) {
      let ordersArray = null;
      
      // Check different possible locations for the orders array
      if (Array.isArray(response.data.data)) {
        console.log('🔍 Found orders in response.data.data');
        ordersArray = response.data.data;
      } else if (Array.isArray(response.data)) {
        console.log('🔍 Found orders in response.data');
        ordersArray = response.data;
      } else if (response.data.orders && Array.isArray(response.data.orders)) {
        console.log('🔍 Found orders in response.data.orders');
        ordersArray = response.data.orders;
      } else {
        console.log('❌ No orders array found in available orders response');
        return {
          success: true,
          data: [],
          count: 0
        };
      }
      
      if (ordersArray && ordersArray.length > 0) {
        console.log('🔍 AVAILABLE ORDERS API - Raw orders array:', ordersArray);
        
        const transformedOrders = ordersArray.map((backendOrder: any) => {
          console.log('🔍 Transforming available order:', backendOrder);
          const transformed = transformBackendOrder(backendOrder);
          
          // Add pool order metadata
          const isPoolOrder = backendOrder.status === 'READY' && !backendOrder.driverAssignments?.length;
          const poolEntryTime = backendOrder.createdAt || backendOrder.updatedAt;
          
          return {
            ...transformed,
            isPoolOrder,
            poolEntryTime: isPoolOrder ? poolEntryTime : null,
            orderType: isPoolOrder ? 'pool' : 'realtime'
          };
        });
        
        console.log('🔍 AVAILABLE ORDERS API - Transformed orders with pool metadata:', transformedOrders);
        
        return {
          success: true,
          data: transformedOrders,
          count: response.data.count || transformedOrders.length
        };
      } else {
        console.log('🔍 AVAILABLE ORDERS API - Empty orders array');
        return {
          success: true,
          data: [],
          count: 0
        };
      }
    }
    
    console.log('❌ AVAILABLE ORDERS API - Request failed or unexpected structure');
    return {
      success: false,
      data: [],
      count: 0
    };
  },


  // Accept order assignment (uses orderId instead of assignmentId)
  async acceptOrder(
    orderId: number
  ): Promise<{ success: boolean; data: Order; message: string }> {
    const response = await api.post(`/driver/orders/${orderId}/accept`);
    return response.data;
  },

  // New hybrid assignment system endpoints
  async acceptAssignmentOffer(
    assignmentId: string
  ): Promise<{ success: boolean; data: Order; message: string }> {
    const response = await api.post(`/driver/assignments/offers/${assignmentId}/accept`);
    return response.data;
  },

  // Pool order direct acceptance (new endpoint)
  async acceptPoolOrder(
    orderId: number
  ): Promise<{ success: boolean; data: Order; message: string }> {
    console.log('🌊 POOL ORDER API: Accepting pool order directly', orderId);
    
    const response = await api.post(`/driver/orders/${orderId}/accept`);
    
    console.log('🌊 POOL ORDER API: Response received:', response);
    console.log('🌊 POOL ORDER API: Response data:', response.data);
    console.log('🌊 POOL ORDER API: Response success:', response.data?.success);
    console.log('🌊 POOL ORDER API: Response message:', response.data?.message);
    
    // Transform response if it contains order data
    if (response.data.success && response.data.data) {
      console.log('🌊 POOL ORDER API: Transforming order data...');
      const transformedOrder = transformBackendOrder(response.data.data);
      console.log('🌊 POOL ORDER API: Transformed order:', transformedOrder);
      
      return {
        success: true,
        data: transformedOrder,
        message: response.data.message || 'Pool order accepted successfully'
      };
    }
    
    console.log('🌊 POOL ORDER API: Returning raw response:', response.data);
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
    // Use the actual availability endpoint
    const response = await api.post('/driver/availability', {
      isAvailable: state === 'online',
    });
    return response.data;
  },

  async sendHeartbeat(
    location?: { latitude: number; longitude: number }
  ): Promise<{ success: boolean }> {
    // Backend doesn't have heartbeat endpoint, use location update if location provided
    if (location) {
      const response = await api.post('/driver/location', {
        lat: location.latitude,
        lng: location.longitude,
      });
      return response.data;
    }
    // If no location, just return success
    return { success: true };
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
    
    // Transform backend response to match frontend Order interface
    if (response.data.success && response.data.data) {
      const backendOrder = response.data.data;
      console.log('=== API Transformation Debug ===');
      console.log('Backend Order ID:', backendOrder.id);
      console.log('Backend Order Items Type:', typeof backendOrder.orderItems);
      console.log('Backend Order Items isArray:', Array.isArray(backendOrder.orderItems));
      console.log('Backend Order Items Length:', backendOrder.orderItems?.length || 'N/A');
      console.log('Backend Order Items:', backendOrder.orderItems);
      console.log('=== End API Debug ===');
      const transformedOrder = transformBackendOrder(backendOrder);
      
      return {
        success: true,
        data: transformedOrder
      };
    }
    
    return response.data;
  },

  async updateOrderStatus(
    orderId: number,
    status: string
  ): Promise<{ success: boolean; data: Order }> {
    const response = await api.patch(`/driver/orders/${orderId}/status`, {
      status,
    });
    
    // Transform response if it contains order data
    if (response.data.success && response.data.data) {
      const backendOrder = response.data.data;
      const transformedOrder = transformBackendOrder(backendOrder, status);
      
      return {
        success: true,
        data: transformedOrder
      };
    }
    
    return response.data;
  },

  async arriveAtRestaurant(
    orderId: number
  ): Promise<{ success: boolean; data: Order }> {
    const response = await api.patch(`/driver/orders/${orderId}/status`, {
      status: 'ARRIVE_AT_RESTAURANT',
    });
    
    // Transform response if it contains order data
    if (response.data.success && response.data.data) {
      const transformedOrder = transformBackendOrder(response.data.data, 'ARRIVE_AT_RESTAURANT');
      return {
        success: true,
        data: transformedOrder
      };
    }
    
    return response.data;
  },

  async pickupOrder(
    orderId: number
  ): Promise<{ success: boolean; data: Order }> {
    const response = await api.patch(`/driver/orders/${orderId}/status`, {
      status: 'PICKED_UP',
    });
    
    // Transform response if it contains order data
    if (response.data.success && response.data.data) {
      const transformedOrder = transformBackendOrder(response.data.data, 'PICKED_UP');
      return {
        success: true,
        data: transformedOrder
      };
    }
    
    return response.data;
  },

  async startDelivery(
    orderId: number
  ): Promise<{ success: boolean; data: Order }> {
    const response = await api.patch(`/driver/orders/${orderId}/status`, {
      status: 'DELIVERING',
    });
    
    // Transform response if it contains order data
    if (response.data.success && response.data.data) {
      const transformedOrder = transformBackendOrder(response.data.data, 'DELIVERING');
      return {
        success: true,
        data: transformedOrder
      };
    }
    
    return response.data;
  },

  async completeDelivery(
    orderId: number,
    proof?: any
  ): Promise<{ success: boolean; data: Order }> {
    const response = await api.patch(`/driver/orders/${orderId}/status`, {
      status: 'DELIVERED',
      proof,
    });
    
    // Transform response if it contains order data
    if (response.data.success && response.data.data) {
      const transformedOrder = transformBackendOrder(response.data.data, 'DELIVERED');
      return {
        success: true,
        data: transformedOrder
      };
    }
    
    return response.data;
  },

  async getOrderHistory(params?: { limit?: number; offset?: number }): Promise<{
    success: boolean;
    data: Order[];
    total: number;
  }> {
    const response = await api.get("/driver/orders/history", { params });
    
    console.log('📋 ORDER HISTORY API - Full response structure:', response);
    console.log('📋 ORDER HISTORY API - Response data:', response.data);
    console.log('📋 ORDER HISTORY API - Response data type:', typeof response.data);
    console.log('📋 ORDER HISTORY API - Response.data.data:', response.data?.data);
    console.log('📋 ORDER HISTORY API - Response.data.success:', response.data?.success);
    
    // Handle different possible API response structures
    if (response.data?.success) {
      let ordersArray = null;
      
      // Check different possible locations for the orders array
      if (Array.isArray(response.data.data)) {
        console.log('📋 Found orders in response.data.data');
        ordersArray = response.data.data;
      } else if (Array.isArray(response.data)) {
        console.log('📋 Found orders in response.data');
        ordersArray = response.data;
      } else if (response.data.orders && Array.isArray(response.data.orders)) {
        console.log('📋 Found orders in response.data.orders');
        ordersArray = response.data.orders;
      } else {
        console.log('❌ No orders array found in response');
        return {
          success: true,
          data: [],
          total: 0
        };
      }
      
      if (ordersArray && ordersArray.length > 0) {
        console.log('📋 ORDER HISTORY API - Raw orders array:', ordersArray);
        
        const transformedOrders = ordersArray.map((backendOrder: any) => {
          console.log('📋 Transforming history order:', backendOrder);
          return transformBackendOrder(backendOrder, 'DELIVERED');
        });
        
        console.log('📋 ORDER HISTORY API - Transformed orders:', transformedOrders);
        
        return {
          success: true,
          data: transformedOrders,
          total: response.data.total || transformedOrders.length
        };
      } else {
        console.log('📋 ORDER HISTORY API - Empty orders array');
        return {
          success: true,
          data: [],
          total: 0
        };
      }
    }
    
    console.log('❌ ORDER HISTORY API - Request failed or unexpected structure');
    return {
      success: false,
      data: [],
      total: 0
    };
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
    const response = await api.post("/driver/availability", { isAvailable });
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
