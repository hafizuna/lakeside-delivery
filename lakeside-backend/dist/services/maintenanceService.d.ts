/**
 * AUTOMATED MAINTENANCE SERVICE
 *
 * Handles automated cleanup and maintenance tasks for the hybrid assignment system.
 * Runs background jobs to keep the system healthy and performant.
 *
 * Key Functions:
 * - Clean up expired assignments
 * - Maintain driver state consistency
 * - Process stale heartbeats
 * - Assignment health monitoring
 * - Database optimization tasks
 */
declare class MaintenanceService {
    private cleanupInterval;
    private isRunning;
    private readonly MAINTENANCE_CONFIG;
    /**
     * Start automated maintenance tasks
     */
    startAutomatedMaintenance(): void;
    /**
     * Stop automated maintenance tasks
     */
    stopAutomatedMaintenance(): void;
    /**
     * Run a complete maintenance cycle
     */
    runMaintenanceCycle(): Promise<{
        success: boolean;
        duration: number;
        tasksCompleted: number;
        tasksFailed: number;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        duration?: undefined;
        tasksCompleted?: undefined;
        tasksFailed?: undefined;
    }>;
    /**
     * Clean up expired assignments
     */
    private cleanupExpiredAssignments;
    /**
     * Clean up very old assignment records for database optimization
     */
    private cleanupOldAssignments;
    /**
     * Update stale driver states based on heartbeat activity
     */
    private updateStaleDriverStates;
    /**
     * Validate and fix driver state consistency issues
     */
    private validateDriverStateConsistency;
    /**
     * Validate and correct active assignment counts
     */
    private validateActiveAssignmentCounts;
    /**
     * Get system health metrics
     */
    getSystemHealth(): Promise<{
        timestamp: string;
        drivers: {
            total: number;
            online: number;
            utilization: number;
        };
        assignments: {
            active: number;
            pendingOffers: number;
            expired: number;
            efficiency: number;
        };
        orders: {
            total: number;
            needingDrivers: number;
        };
        systemHealth: {
            status: string;
            maintenanceRunning: boolean;
        };
        error?: undefined;
    } | {
        timestamp: string;
        error: string;
        systemHealth: {
            status: string;
            maintenanceRunning: boolean;
        };
        drivers?: undefined;
        assignments?: undefined;
        orders?: undefined;
    }>;
    /**
     * Run emergency cleanup (for critical system issues)
     */
    emergencyCleanup(): Promise<{
        success: boolean;
        results: ("success" | "failed")[];
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        results?: undefined;
    }>;
    /**
     * Manual trigger for immediate maintenance (admin use)
     */
    runManualMaintenance(): Promise<{
        success: boolean;
        duration: number;
        tasksCompleted: number;
        tasksFailed: number;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        duration?: undefined;
        tasksCompleted?: undefined;
        tasksFailed?: undefined;
    }>;
    /**
     * Check if maintenance service is running
     */
    isMaintenanceRunning(): boolean;
    /**
     * Get maintenance service status
     */
    getMaintenanceStatus(): {
        isRunning: boolean;
        cleanupInterval: number;
        lastRunTime: string;
        config: {
            CLEANUP_INTERVAL: number;
            HEARTBEAT_CHECK_INTERVAL: number;
            DRIVER_OFFLINE_THRESHOLD: number;
            ASSIGNMENT_EXPIRE_BUFFER: number;
            STALE_ASSIGNMENT_THRESHOLD: number;
            MAX_CLEANUP_BATCH_SIZE: number;
            MAX_DRIVER_STATE_UPDATES: number;
        };
    };
}
declare const _default: MaintenanceService;
export default _default;
//# sourceMappingURL=maintenanceService.d.ts.map