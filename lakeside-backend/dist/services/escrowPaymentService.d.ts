interface EscrowPaymentService {
    canCancelOrder(orderId: number): Promise<any>;
    processEscrowPayment(orderId: number): Promise<any>;
    cancelOrderWithRefund(orderId: number, reason: string): Promise<any>;
    releaseEscrowOnDelivery(orderId: number, driverId: number): Promise<any>;
    checkRestaurantTimeout(orderId: number): Promise<any>;
    processTimeoutRefund(orderId: number): Promise<any>;
}
declare class EscrowPaymentServiceImpl implements EscrowPaymentService {
    /**
     * Check if customer can cancel order based on escrow model rules
     */
    canCancelOrder(orderId: number): Promise<{
        success: boolean;
        message: string;
        canCancel?: undefined;
        reason?: undefined;
        timeRemaining?: undefined;
        timeoutOccurred?: undefined;
        restaurantTimeRemaining?: undefined;
        acceptedAt?: undefined;
        currentStatus?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        canCancel: boolean;
        reason: string;
        message: string;
        timeRemaining: number;
        timeoutOccurred?: undefined;
        restaurantTimeRemaining?: undefined;
        acceptedAt?: undefined;
        currentStatus?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        canCancel: boolean;
        reason: string;
        message: string;
        timeoutOccurred: boolean;
        timeRemaining?: undefined;
        restaurantTimeRemaining?: undefined;
        acceptedAt?: undefined;
        currentStatus?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        canCancel: boolean;
        reason: string;
        message: string;
        restaurantTimeRemaining: number;
        timeRemaining?: undefined;
        timeoutOccurred?: undefined;
        acceptedAt?: undefined;
        currentStatus?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        canCancel: boolean;
        reason: string;
        message: string;
        acceptedAt: Date | null;
        currentStatus: import(".prisma/client").$Enums.OrderStatus;
        timeRemaining?: undefined;
        timeoutOccurred?: undefined;
        restaurantTimeRemaining?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        canCancel: boolean;
        reason: string;
        message: string;
        currentStatus: import(".prisma/client").$Enums.OrderStatus;
        timeRemaining?: undefined;
        timeoutOccurred?: undefined;
        restaurantTimeRemaining?: undefined;
        acceptedAt?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        canCancel?: undefined;
        reason?: undefined;
        timeRemaining?: undefined;
        timeoutOccurred?: undefined;
        restaurantTimeRemaining?: undefined;
        acceptedAt?: undefined;
        currentStatus?: undefined;
    }>;
    /**
     * Process escrow payment (called after 1-minute grace period)
     */
    processEscrowPayment(orderId: number): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
        data?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string | undefined;
        data?: undefined;
    } | {
        success: boolean;
        message: string;
        data: {
            amount: number;
            paymentMethod: string;
            status: string;
        };
        error?: undefined;
    }>;
    /**
     * Cancel order with proper refund based on escrow rules
     */
    cancelOrderWithRefund(orderId: number, reason: string): Promise<{
        success: boolean;
        message: string;
        reason: string | undefined;
        data?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        reason?: undefined;
        data?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        data: {
            refundProcessed: boolean;
            amount: number;
            requiresManualProcessing?: undefined;
            orderId: number;
            refundAmount: number;
            reason: string;
        } | {
            refundProcessed: boolean;
            amount: number;
            requiresManualProcessing: boolean;
            orderId: number;
            refundAmount: number;
            reason: string;
        };
        reason?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        reason?: undefined;
        data?: undefined;
    }>;
    /**
     * Release escrow funds on successful delivery
     */
    releaseEscrowOnDelivery(orderId: number, driverId: number): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        data: {
            restaurantCredited: number;
            driverCredited: number;
            platformEarnings: number;
            totalReleased: number;
        };
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        data?: undefined;
    }>;
    /**
     * Check if restaurant has timed out (15 minutes to accept)
     */
    checkRestaurantTimeout(orderId: number): Promise<{
        success: boolean;
        message: string;
        hasTimedOut?: undefined;
        orderAge?: undefined;
        timeoutThreshold?: undefined;
        canRefund?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        hasTimedOut: boolean;
        orderAge: number;
        timeoutThreshold: number;
        canRefund: boolean;
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        hasTimedOut?: undefined;
        orderAge?: undefined;
        timeoutThreshold?: undefined;
        canRefund?: undefined;
    }>;
    /**
     * Process automatic refund for restaurant timeout
     */
    processTimeoutRefund(orderId: number): Promise<{
        success: boolean;
        message: string;
        reason: string | undefined;
        data?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        reason?: undefined;
        data?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        data: {
            refundProcessed: boolean;
            amount: number;
            requiresManualProcessing?: undefined;
            orderId: number;
            refundAmount: number;
            reason: string;
        } | {
            refundProcessed: boolean;
            amount: number;
            requiresManualProcessing: boolean;
            orderId: number;
            refundAmount: number;
            reason: string;
        };
        reason?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        reason?: undefined;
        data?: undefined;
    }>;
}
declare const escrowPaymentService: EscrowPaymentServiceImpl;
export default escrowPaymentService;
//# sourceMappingURL=escrowPaymentService.d.ts.map