import { AvailableDriver, CreateOffersRequest, AssignmentCreationResult, AcceptOfferRequest, AssignmentAcceptanceResult, UpdateDriverStateRequest, DriverHeartbeatRequest } from '../types/driverAssignment';
/**
 * HYBRID DRIVER ASSIGNMENT SERVICE
 *
 * This service manages the advanced driver assignment system while maintaining
 * full backwards compatibility with the existing order status flow.
 *
 * Key Features:
 * - TTL-based assignment offers with expiration
 * - Atomic acceptance with race condition protection
 * - Wave escalation for unassigned orders
 * - Real-time driver state management
 * - Full synchronization with existing orders table
 */
declare class HybridAssignmentService {
    /**
     * Initialize or update driver online state
     */
    updateDriverState(driverId: number, updates: UpdateDriverStateRequest): Promise<{
        success: boolean;
        driverState: {
            driverId: number;
            isOnline: boolean;
            activeAssignmentsCount: number;
            maxConcurrentAssignments: number;
            currentZoneId: number | null;
            lastHeartbeatAt: Date | null;
            onlineSince: Date | null;
            lastLocationUpdate: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        driverState?: undefined;
    }>;
    /**
     * Process driver heartbeat and location update
     */
    processDriverHeartbeat(request: DriverHeartbeatRequest): Promise<{
        success: boolean;
        driverState: {
            driverId: number;
            isOnline: boolean;
            activeAssignmentsCount: number;
            maxConcurrentAssignments: number;
            currentZoneId: number | null;
            lastHeartbeatAt: Date | null;
            onlineSince: Date | null;
            lastLocationUpdate: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        driverState?: undefined;
    }>;
    /**
     * Find available drivers for order assignment
     */
    findAvailableDrivers(orderId: number, maxDrivers?: number): Promise<AvailableDriver[]>;
    /**
     * Create TTL-based assignment offers for multiple drivers
     */
    createOffers(request: CreateOffersRequest): Promise<AssignmentCreationResult>;
    /**
     * Accept assignment offer with atomic transaction
     * This is the critical method that synchronizes the hybrid system with existing orders
     */
    acceptOffer(request: AcceptOfferRequest): Promise<AssignmentAcceptanceResult>;
    /**
     * Complete assignment when order is delivered (sync point)
     */
    completeAssignment(orderId: number): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
    }>;
    /**
     * Clean up expired assignments
     */
    cleanupExpiredAssignments(): Promise<{
        success: boolean;
        expiredCount: number;
        message: string;
    }>;
    /**
     * Get driver's current offers
     */
    getDriverOffers(driverId: number): Promise<{
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
    }>;
    /**
     * Get assignment wave configuration based on order urgency and wave number
     */
    private getWaveEscalationConfig;
    /**
     * Enhanced driver finding with wave-based radius expansion and scoring
     */
    findAvailableDriversForWave(orderId: number, wave: number, maxDrivers?: number): Promise<AvailableDriver[]>;
    /**
     * Calculate driver score for wave-based selection
     */
    private calculateDriverScore;
    /**
     * Create wave-based assignment offers with enhanced configuration
     */
    createWaveAssignmentOffers(orderId: number, wave?: number): Promise<{
        success: boolean;
        message: string;
        wave: number;
        assignmentsCreated: number;
        assignments: never[];
    } | {
        wave: number;
        waveConfig: {
            driverCount: number;
            ttlSeconds: number;
            radiusKm: number;
        } | {
            driverCount: number;
            ttlSeconds: number;
            radiusKm: number;
        } | {
            driverCount: number;
            ttlSeconds: number;
            radiusKm: number;
        } | {
            driverCount: number;
            ttlSeconds: number;
            radiusKm: number;
        };
        availableDrivers: number;
        success: boolean;
        assignmentsCreated: number;
        assignments: import("../types/driverAssignment").DriverAssignment[];
        expiresAt: Date;
        message?: undefined;
    }>;
    /**
     * Get wave escalation status for an order
     */
    getWaveEscalationStatus(orderId: number): Promise<{
        orderId: number;
        currentWave: number;
        hasActiveAssignment: boolean;
        totalAssignments: number;
        waves: any[];
        canEscalate: boolean;
    } | null>;
    /**
     * Decline assignment offer with reason tracking
     */
    declineOffer(assignmentId: string, driverId: number, reason?: string): Promise<{
        success: boolean;
        message: string;
        assignment?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        assignment: {
            assignmentId: string;
            orderId: number;
            status: import(".prisma/client").$Enums.DriverAssignmentStatus;
            declinedAt: Date | null;
            reason: string | null;
        };
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        assignment?: undefined;
    }>;
    /**
     * Get decline reasons analytics for insights
     */
    getDeclineReasonsAnalytics(timeframeHours?: number): Promise<{
        timeframeHours: number;
        totalDeclines: number;
        reasonCounts: {};
        waveDeclines: Record<number, number>;
        uniqueDrivers: number;
        uniqueOrders: number;
    }>;
}
declare const _default: HybridAssignmentService;
export default _default;
//# sourceMappingURL=hybridAssignmentService.d.ts.map