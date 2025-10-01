// Driver Types
export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  profileImage?: string;
  vehicleType: 'Bike' | 'Car' | 'Scooter';
  vehiclePlate: string;
  licenseNumber: string;
  rating: number;
  totalRatings: number;
  status: 'online' | 'offline' | 'busy';
  isVerified: boolean;
  createdAt: Date;
}

export interface DriverStats {
  todayEarnings: number;
  todayDeliveries: number;
  weekEarnings: number;
  weekDeliveries: number;
  monthEarnings: number;
  monthDeliveries: number;
  acceptanceRate: number;
  completionRate: number;
  onTimeRate: number;
  averageRating: number;
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantLocation: Location;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerLocation: Location;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  tip: number;
  status: OrderStatus;
  estimatedPickupTime: Date;
  estimatedDeliveryTime: Date;
  actualPickupTime?: Date;
  actualDeliveryTime?: Date;
  distance: number;
  createdAt: Date;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export type OrderStatus = 
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

// Wallet Types
export interface Wallet {
  balance: number;
  pendingEarnings: number;
  totalEarnings: number;
  lastTransaction?: Transaction;
}

export interface Transaction {
  id: string;
  type: 'earning' | 'withdrawal' | 'bonus' | 'penalty';
  amount: number;
  description: string;
  orderId?: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}

// Notification Types
export interface Notification {
  id: string;
  type: 'order' | 'earning' | 'system' | 'promotion';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  timestamp: Date;
}

// Performance Types
export interface Performance {
  acceptanceRate: number;
  completionRate: number;
  onTimeDeliveryRate: number;
  customerRating: number;
  totalDeliveries: number;
  totalDistance: number;
  averageDeliveryTime: number;
}

// Incentive Types
export interface Incentive {
  id: string;
  type: 'peak_hour' | 'distance' | 'streak' | 'rating';
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  reward: number;
  expiresAt: Date;
  isActive: boolean;
}