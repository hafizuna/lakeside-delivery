// Restaurant types based on Prisma schema

export interface Restaurant {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  geofenceZoneId?: number;
  commissionRate: number;
  status: 'OPEN' | 'CLOSED' | 'SUSPENDED';
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
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface RestaurantListResponse {
  success: boolean;
  data: Restaurant[];
  total: number;
}

export interface RestaurantDetailResponse {
  success: boolean;
  data: Restaurant;
}

export interface CategoriesResponse {
  success: boolean;
  data: string[];
}
