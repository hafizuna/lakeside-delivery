/**
 * ENHANCED DRIVER DASHBOARD SERVICE
 *
 * Provides comprehensive driver analytics, earnings tracking, performance metrics,
 * and assignment history for the driver mobile app dashboard.
 *
 * Key Features:
 * - Real-time earnings and statistics
 * - Assignment history and performance
 * - Online time tracking
 * - Delivery metrics and ratings
 * - Weekly/monthly earning reports
 */
declare class DriverDashboardService {
    /**
     * Get comprehensive driver dashboard data
     */
    getDriverDashboard(driverId: number, timeframe?: 'today' | 'week' | 'month'): Promise<{
        success: boolean;
        data: {
            profile: {
                driverId: number;
                name: string;
                phone: string;
                rating: number;
                totalDeliveries: number;
                completionRate: number;
                memberSince: Date;
                vehicleType: "BIKE";
                approvalStatus: import(".prisma/client").$Enums.DriverApprovalStatus;
                licenseNumber: string;
                vehicleRegistration: string;
            } | null;
            currentStatus: {
                isOnline: boolean;
                onlineSince: Date | null | undefined;
                activeAssignments: number;
                lastHeartbeat: Date | null | undefined;
                currentZone: number | null | undefined;
            };
            activeAssignment: {
                assignmentId: string;
                orderId: number;
                acceptedAt: Date | null;
                order: {
                    id: number;
                    status: import(".prisma/client").$Enums.OrderStatus;
                    totalPrice: number;
                    driverEarning: number;
                    deliveryAddress: string;
                    deliveryInstructions: string | null;
                    restaurant: {
                        name: string;
                        address: string;
                        lat: import("@prisma/client/runtime/library").Decimal;
                        lng: import("@prisma/client/runtime/library").Decimal;
                    };
                    customer: {
                        name: string;
                        phone: string;
                    };
                    estimatedPickupTime: Date | null;
                };
            } | null;
            todayStats: {
                timeframe: "week" | "month" | "today";
                period: {
                    startDate: Date;
                    endDate: Date;
                };
                deliveries: {
                    count: number;
                    totalEarnings: number;
                    averagePerOrder: number;
                    totalDistance: number;
                };
                assignments: {
                    totalOffers: number;
                    accepted: number;
                    declined: number;
                    expired: number;
                    averageResponseTime: number;
                    waveBreakdown: Record<number, number>;
                };
                onlineTime: {
                    estimatedOnlineTimeMs: number;
                    estimatedOnlineTimeHours: number;
                    isCurrentlyOnline: boolean;
                };
                performance: {
                    averageDeliveryTime: number;
                    successRate: number;
                };
            };
            periodStats: {
                timeframe: "week" | "month" | "today";
                period: {
                    startDate: Date;
                    endDate: Date;
                };
                deliveries: {
                    count: number;
                    totalEarnings: number;
                    averagePerOrder: number;
                    totalDistance: number;
                };
                assignments: {
                    totalOffers: number;
                    accepted: number;
                    declined: number;
                    expired: number;
                    averageResponseTime: number;
                    waveBreakdown: Record<number, number>;
                };
                onlineTime: {
                    estimatedOnlineTimeMs: number;
                    estimatedOnlineTimeHours: number;
                    isCurrentlyOnline: boolean;
                };
                performance: {
                    averageDeliveryTime: number;
                    successRate: number;
                };
            } | null;
            recentAssignments: {
                assignmentId: string;
                orderId: number;
                status: import(".prisma/client").$Enums.DriverAssignmentStatus;
                wave: number;
                offeredAt: Date;
                respondedAt: Date | null;
                acceptedAt: Date | null;
                restaurant: {
                    name: string;
                    address: string;
                };
                customerAddress: string;
                estimatedEarning: number;
                orderStatus: import(".prisma/client").$Enums.OrderStatus;
            }[];
            performanceMetrics: {
                rating: number;
                completionRate: number;
                deliveryTimes: {
                    averageDeliveryTimeMinutes: number;
                    totalDeliveries: number;
                };
                customerSatisfaction: string;
            };
            timeframe: "week" | "month" | "today";
            timestamp: Date;
        };
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        data?: undefined;
    }>;
    /**
     * Get driver profile information
     */
    private getDriverProfile;
    /**
     * Get current driver state
     */
    private getDriverState;
    /**
     * Get driver statistics for a specific timeframe
     */
    private getDriverStats;
    /**
     * Get earnings from wallet transactions
     */
    private getEarningsFromTransactions;
    /**
     * Get assignment statistics
     */
    private getAssignmentStats;
    /**
     * Get online time statistics
     */
    private getOnlineTimeStats;
    /**
     * Get recent assignment history
     */
    private getRecentAssignments;
    /**
     * Get currently active assignment
     */
    private getActiveAssignment;
    /**
     * Get performance metrics
     */
    private getPerformanceMetrics;
    /**
     * Get current driver rating
     */
    private getCurrentRating;
    /**
     * Get completion rate for timeframe
     */
    private getCompletionRate;
    /**
     * Get delivery time metrics
     */
    private getDeliveryTimeMetrics;
    /**
     * Get average delivery time for a driver
     */
    private getAverageDeliveryTime;
    /**
     * Get detailed earnings report
     */
    getEarningsReport(driverId: number, timeframe?: 'week' | 'month'): Promise<{
        success: boolean;
        data: {
            timeframe: "week" | "month";
            period: {
                startDate: Date;
                endDate: Date;
            };
            summary: {
                totalEarnings: number;
                totalOrders: number;
                averagePerOrder: number;
                walletEarnings: number;
            };
            orders: {
                orderId: number;
                restaurantName: string;
                earning: number;
                deliveredAt: Date | null;
            }[];
            walletTransactions: {
                amount: number;
                status: import(".prisma/client").$Enums.WalletTransactionStatus;
                date: Date;
            }[];
        };
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        data?: undefined;
    }>;
    /**
     * Get start and end dates for timeframe
     */
    private getTimeframeDates;
}
declare const _default: DriverDashboardService;
export default _default;
//# sourceMappingURL=driverDashboardService.d.ts.map