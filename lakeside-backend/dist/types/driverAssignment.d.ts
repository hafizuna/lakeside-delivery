import { DriverAssignmentStatus, CancelledBy, CancelReason, DriverCancelReason } from '@prisma/client';
/**
 * Driver Assignment - Core entity for TTL-based offers
 */
export interface DriverAssignment {
    id: string;
    orderId: number;
    driverId: number;
    status: DriverAssignmentStatus;
    wave: number;
    offeredAt: Date;
    respondedAt?: Date | null;
    acceptedAt?: Date | null;
    expiresAt?: Date | null;
    reason?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Driver State - Real-time driver availability and status
 */
export interface DriverState {
    driverId: number;
    isOnline: boolean;
    activeAssignmentsCount: number;
    maxConcurrentAssignments: number;
    currentZoneId?: number | null;
    lastHeartbeatAt?: Date | null;
    onlineSince?: Date | null;
    lastLocationUpdate?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Enhanced Order fields for hybrid system
 */
export interface OrderHybridFields {
    driverAssignedAt?: Date | null;
    readyAt?: Date | null;
    driverArrivedAt?: Date | null;
    cancelledBy?: CancelledBy | null;
    cancelReason?: CancelReason | null;
    driverCancelReason?: DriverCancelReason | null;
}
/**
 * Create assignment offers request
 */
export interface CreateOffersRequest {
    orderId: number;
    driverIds: number[];
    expiresInSeconds?: number;
    wave?: number;
}
/**
 * Accept assignment offer request
 */
export interface AcceptOfferRequest {
    assignmentId: string;
    driverId: number;
}
/**
 * Driver state update request
 */
export interface UpdateDriverStateRequest {
    isOnline?: boolean;
    currentZoneId?: number | null;
    maxConcurrentAssignments?: number;
}
/**
 * Driver heartbeat request
 */
export interface DriverHeartbeatRequest {
    driverId: number;
    currentLat?: number;
    currentLng?: number;
    currentZoneId?: number | null;
}
/**
 * Driver offers response - what drivers see
 */
export interface DriverOffersResponse {
    success: boolean;
    offers: {
        assignmentId: string;
        orderId: number;
        restaurantName: string;
        restaurantAddress: string;
        customerAddress: string;
        deliveryDistance: number;
        estimatedEarning: number;
        expiresAt: Date;
        secondsRemaining: number;
        wave: number;
    }[];
}
/**
 * Assignment acceptance response
 */
export interface AcceptOfferResponse {
    success: boolean;
    message: string;
    assignment?: {
        assignmentId: string;
        orderId: number;
        status: DriverAssignmentStatus;
        acceptedAt: Date;
    };
    order?: {
        orderId: number;
        restaurantName: string;
        restaurantAddress: string;
        customerAddress: string;
        totalPrice: number;
        driverEarning: number;
    };
}
/**
 * Driver availability response
 */
export interface DriverAvailabilityResponse {
    driverId: number;
    isOnline: boolean;
    activeAssignmentsCount: number;
    maxConcurrentAssignments: number;
    canAcceptNewAssignments: boolean;
    currentZone?: {
        zoneId: number;
        name: string;
    } | null;
    lastHeartbeat?: Date | null;
}
/**
 * Available driver query result
 */
export interface AvailableDriver {
    driverId: number;
    name: string;
    currentLat?: number;
    currentLng?: number;
    rating: number;
    totalDeliveries: number;
    completionRate: number;
    distanceFromRestaurant?: number;
    currentZoneId?: number;
    activeAssignmentsCount: number;
    maxConcurrentAssignments: number;
    isOnline: boolean;
    lastHeartbeatAt?: Date;
}
/**
 * Assignment creation result
 */
export interface AssignmentCreationResult {
    success: boolean;
    assignmentsCreated: number;
    assignments: DriverAssignment[];
    expiresAt: Date;
    wave: number;
}
/**
 * Assignment acceptance result (atomic transaction)
 */
export interface AssignmentAcceptanceResult {
    success: boolean;
    assignment: DriverAssignment;
    orderUpdated: boolean;
    driverStateUpdated: boolean;
    otherAssignmentsExpired: number;
}
/**
 * Wave escalation config
 */
export interface WaveEscalationConfig {
    maxWaves: number;
    waveIntervalSeconds: number;
    driversPerWave: number;
    expandRadiusKm: number;
}
/**
 * Assignment analytics data
 */
export interface AssignmentAnalytics {
    orderId: number;
    totalOffers: number;
    totalWaves: number;
    acceptanceRate: number;
    averageResponseTime: number;
    finalAssignedDriverId?: number;
    timeToAssignment?: number;
    reasonForFailure?: string;
}
/**
 * Real-time assignment offer socket event
 */
export interface AssignmentOfferEvent {
    type: 'ASSIGNMENT_OFFER';
    assignmentId: string;
    orderId: number;
    restaurantName: string;
    restaurantAddress: string;
    customerAddress: string;
    deliveryDistance: number;
    estimatedEarning: number;
    expiresAt: Date;
    secondsRemaining: number;
    wave: number;
    order: {
        id: number;
        orderNumber: string;
        restaurantName: string;
        restaurantAddress: string;
        restaurantLat: number;
        restaurantLng: number;
        customerName: string;
        deliveryAddress: string;
        deliveryLat: number;
        deliveryLng: number;
        totalAmount: number;
        deliveryFee: number;
        driverEarning: number;
        estimatedPickupTime?: string;
        estimatedDeliveryTime?: string;
        items: Array<{
            itemName: string;
            quantity: number;
            price: number;
        }>;
    };
}
/**
 * Assignment status change socket event
 */
export interface AssignmentStatusEvent {
    type: 'ASSIGNMENT_STATUS_CHANGE';
    assignmentId: string;
    orderId: number;
    status: DriverAssignmentStatus;
    reason?: string;
}
/**
 * Driver state change socket event
 */
export interface DriverStateChangeEvent {
    type: 'DRIVER_STATE_CHANGE';
    driverId: number;
    isOnline: boolean;
    activeAssignmentsCount: number;
    canAcceptNewAssignments: boolean;
}
//# sourceMappingURL=driverAssignment.d.ts.map