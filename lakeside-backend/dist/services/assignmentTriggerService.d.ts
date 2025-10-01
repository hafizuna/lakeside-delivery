import { OrderStatus } from '@prisma/client';
/**
 * AUTOMATIC ASSIGNMENT TRIGGER SERVICE
 *
 * This service automatically creates driver assignment offers when orders
 * transition to specific statuses, seamlessly integrating the hybrid system
 * with the existing restaurant workflow.
 *
 * Key Integration Points:
 * - PREPARING: Creates initial wave of assignment offers
 * - READY: Escalates if no driver assigned yet
 * - Restaurant status updates trigger assignment workflow
 */
declare class AssignmentTriggerService {
    private readonly ASSIGNMENT_CONFIG;
    /**
     * Handle order status change and trigger assignments if needed
     * This is the main integration point with restaurant workflow
     */
    handleOrderStatusChange(orderId: number, newStatus: OrderStatus, previousStatus?: OrderStatus): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
    }>;
    /**
     * Determine if assignment should be triggered based on status change
     */
    private shouldTriggerAssignment;
    /**
     * Get order details needed for assignment process
     */
    private getOrderForAssignment;
    /**
     * Main assignment process - finds drivers and creates offers
     */
    private triggerAssignmentProcess;
    /**
     * Determine wave number for this order
     */
    private determineWaveNumber;
    /**
     * Send real-time notifications to drivers about new assignment offers
     */
    private notifyDriversOfAssignment;
    /**
     * Schedule escalation for unassigned orders
     */
    private scheduleEscalation;
    /**
     * Cleanup expired assignments and potentially escalate
     */
    private cleanupAndEscalate;
    /**
     * Get assignment status for an order
     */
    getOrderAssignmentStatus(orderId: number): Promise<{
        orderId: number;
        hasActiveAssignment: boolean;
        activeDriver: {
            id: number;
            name: string;
        } | null;
        totalOffers: number;
        currentWave: number;
        assignments: {
            id: string;
            driverId: number;
            driverName: string;
            status: import(".prisma/client").$Enums.DriverAssignmentStatus;
            wave: number;
            offeredAt: Date;
            respondedAt: Date | null;
        }[];
    } | null>;
    /**
     * Manual trigger for testing/admin use
     */
    manualTriggerAssignment(orderId: number, forceStatus?: OrderStatus): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
    }>;
}
declare const _default: AssignmentTriggerService;
export default _default;
//# sourceMappingURL=assignmentTriggerService.d.ts.map