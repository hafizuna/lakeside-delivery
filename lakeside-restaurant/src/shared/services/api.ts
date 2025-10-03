import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// API Configuration
// Use localhost for web, your computer's IP for mobile devices
const getApiBaseUrl = () => {
  if (Platform.OS === "web") {
    return "http://localhost:3001/api";
  } else {
    // For mobile devices, use your computer's IP address
    // You may need to update this IP if your network changes
    return "http://192.168.1.2:3001/api";
  }
};

const API_BASE_URL = getApiBaseUrl();

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private async loadToken() {
    try {
      this.token = await AsyncStorage.getItem("restaurant_token");
    } catch (error) {
      console.error("Error loading token:", error);
    }
  }

  private async saveToken(token: string) {
    try {
      await AsyncStorage.setItem("restaurant_token", token);
      this.token = token;
    } catch (error) {
      console.error("Error saving token:", error);
    }
  }

  private async removeToken() {
    try {
      await AsyncStorage.removeItem("restaurant_token");
      this.token = null;
    } catch (error) {
      console.error("Error removing token:", error);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    // Ensure token is loaded
    await this.loadToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    console.log("API Request Debug:", {
      url,
      method: options.method || "GET",
      hasToken: !!this.token,
      tokenPreview: this.token
        ? `${this.token.substring(0, 20)}...`
        : "No token",
      headers: {
        ...headers,
        Authorization: headers.Authorization ? "Bearer ***" : "No auth",
      },
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      console.log("API Response Debug:", {
        status: response.status,
        ok: response.ok,
        data: data,
      });

      if (!response.ok) {
        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  }

  // Authentication
  async login(
    phone: string,
    password: string
  ): Promise<ApiResponse<{ token: string; restaurant: any }>> {
    const response = await this.request<{ token: string; restaurant: any }>(
      "/restaurant/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ phone, password }),
      }
    );

    if (response.success && response.data?.token) {
      await this.saveToken(response.data.token);
    }

    return response;
  }

  async register(
    signupData: any
  ): Promise<ApiResponse<{ token: string; restaurant: any }>> {
    const response = await this.request<{ token: string; restaurant: any }>(
      "/restaurant/auth/register",
      {
        method: "POST",
        body: JSON.stringify(signupData),
      }
    );

    if (response.success && response.data?.token) {
      await this.saveToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    await this.removeToken();
  }

  async getProfile(): Promise<ApiResponse<any>> {
    return this.request("/restaurant/auth/profile");
  }

  // Menu Management
  async getMenuItems(): Promise<ApiResponse<any[]>> {
    return this.request("/restaurant/menu");
  }

  async createMenuItem(menuItem: any): Promise<ApiResponse<any>> {
    return this.request("/restaurant/menu", {
      method: "POST",
      body: JSON.stringify(menuItem),
    });
  }

  async updateMenuItem(id: number, menuItem: any): Promise<ApiResponse<any>> {
    return this.request(`/restaurant/menu/${id}`, {
      method: "PUT",
      body: JSON.stringify(menuItem),
    });
  }

  async deleteMenuItem(id: number): Promise<ApiResponse<any>> {
    return this.request(`/restaurant/menu/${id}`, {
      method: "DELETE",
    });
  }

  async toggleMenuItemAvailability(
    id: number,
    isAvailable: boolean
  ): Promise<ApiResponse<any>> {
    return this.request(`/restaurant/menu/${id}/availability`, {
      method: "PATCH",
      body: JSON.stringify({ isAvailable }),
    });
  }

  // Profile Management
  async updateProfile(profileData: any): Promise<ApiResponse<any>> {
    return this.request("/restaurant/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  // Orders Management
  async getOrders(
    status?: string,
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());

    return this.request(`/restaurant/orders?${params.toString()}`);
  }

  async getOrderDetails(orderId: string): Promise<ApiResponse<any>> {
    return this.request(`/restaurant/orders/${orderId}`);
  }

  async updateOrderStatus(
    orderId: number,
    status: string
  ): Promise<ApiResponse<any>> {
    console.log("updateOrderStatus called with:", { orderId, status });
    return this.request(`/restaurant/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async acceptOrder(orderId: number): Promise<ApiResponse<any>> {
    return this.request(`/restaurant/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "ACCEPTED" }),
    });
  }

  // Analytics
  async getAnalytics(period?: string): Promise<ApiResponse<any>> {
    const params = period ? `?period=${period}` : "";
    return this.request(`/restaurant/analytics${params}`);
  }

  // Category Management
  async getCategories(): Promise<ApiResponse<any[]>> {
    return this.request("/restaurant/categories");
  }

  async createCategory(categoryData: any): Promise<ApiResponse<any>> {
    return this.request("/restaurant/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(
    id: number,
    categoryData: any
  ): Promise<ApiResponse<any>> {
    return this.request(`/restaurant/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(id: number): Promise<ApiResponse<any>> {
    return this.request(`/restaurant/categories/${id}`, {
      method: "DELETE",
    });
  }

  async reorderCategories(categoryOrders: any[]): Promise<ApiResponse<any>> {
    return this.request("/restaurant/categories/reorder", {
      method: "PATCH",
      body: JSON.stringify({ categoryOrders }),
    });
  }

  // Bulk Operations
  async bulkUpdateAvailability(
    menuIds: number[],
    isAvailable: boolean
  ): Promise<ApiResponse<any>> {
    return this.request("/restaurant/menu/bulk/availability", {
      method: "PATCH",
      body: JSON.stringify({ menuIds, isAvailable }),
    });
  }

  async bulkUpdateCategory(
    menuIds: number[],
    categoryId: number | null
  ): Promise<ApiResponse<any>> {
    return this.request("/restaurant/menu/bulk/category", {
      method: "PATCH",
      body: JSON.stringify({ menuIds, categoryId }),
    });
  }

  async bulkUpdatePrice(
    menuIds: number[],
    type: "percentage" | "fixed",
    value: number
  ): Promise<ApiResponse<any>> {
    return this.request("/restaurant/menu/bulk/price", {
      method: "PATCH",
      body: JSON.stringify({ menuIds, type, value }),
    });
  }

  // Unified bulk operations methods for BulkOperationsScreen
  async bulkUpdateMenuItems({
    itemIds,
    updates,
  }: {
    itemIds: number[];
    updates: any;
  }): Promise<ApiResponse<any>> {
    // Handle different types of updates
    if ("isAvailable" in updates) {
      return this.request("/restaurant/menu/bulk/availability", {
        method: "PATCH",
        body: JSON.stringify({
          menuIds: itemIds,
          isAvailable: updates.isAvailable,
        }),
      });
    } else if ("categoryId" in updates) {
      return this.request("/restaurant/menu/bulk/category", {
        method: "PATCH",
        body: JSON.stringify({
          menuIds: itemIds,
          categoryId: updates.categoryId,
        }),
      });
    } else if ("priceAdjustment" in updates) {
      return this.request("/restaurant/menu/bulk/price", {
        method: "PATCH",
        body: JSON.stringify({
          menuIds: itemIds,
          type: "fixed",
          value: updates.priceAdjustment,
        }),
      });
    } else {
      throw new Error("Unsupported bulk update operation");
    }
  }

  async bulkDeleteMenuItems({
    itemIds,
  }: {
    itemIds: number[];
  }): Promise<ApiResponse<any>> {
    return this.request("/restaurant/menu/bulk", {
      method: "DELETE",
      body: JSON.stringify({ menuIds: itemIds }),
    });
  }
}

export const apiService = new ApiService(API_BASE_URL);
export default apiService;
