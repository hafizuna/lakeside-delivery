export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  PICKED_UP = 'PICKED_UP',
  DELIVERING = 'DELIVERING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  WALLET = 'WALLET',
  UPI = 'UPI'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export interface Order {
  id: number;
  customerId: number;
  restaurantId: number;
  driverId?: number;
  totalPrice: number;
  deliveryFee: number;
  commission: number;
  status: OrderStatus;
  
  // Restaurant Pickup Information
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  pickupInstructions?: string;
  estimatedPickupTime?: string;
  
  // Delivery Address Information
  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryInstructions?: string;
  
  // Driver Earnings & Distance
  driverEarning: number;
  platformCommission: number;
  deliveryDistance?: number;
  estimatedDeliveryTime?: number;
  
  // Payment Information
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  
  // Order Lifecycle Timestamps
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  preparingAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  estimatedDelivery?: string;
  
  // Relations
  restaurant: {
    id: number;
    name: string;
    logoUrl?: string;
    address: string;
    phone?: string;
  };
  driver?: {
    id: number;
    name: string;
    phone?: string;
    vehicleType?: string;
  };
  orderItems: OrderItem[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  menuId: number;
  quantity: number;
  price: number;
  
  // Relations
  menu: {
    id: number;
    itemName: string;
    imageUrl?: string;
  };
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  message?: string;
}
