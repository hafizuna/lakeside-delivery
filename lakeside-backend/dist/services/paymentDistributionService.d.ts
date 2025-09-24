interface PaymentDistributionService {
    processOrderPlacement(orderId: number): Promise<any>;
    processOrderConfirmation(orderId: number): Promise<any>;
    processOrderDelivery(orderId: number): Promise<any>;
    processBatchSettlement(orderIds: number[]): Promise<any>;
    processRefund(orderId: number, reason: string): Promise<any>;
    processPartialRefund(orderId: number, amount: number, reason: string): Promise<any>;
}
declare class PaymentDistributionServiceImpl implements PaymentDistributionService {
    /**
     * TRIGGER 1: Order Placement (DoorDash Model)
     * - Customer payment authorization/charge immediately
     * - Hold funds in platform escrow
     */
    processOrderPlacement(orderId: number): Promise<{
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
            customerCharged: number;
            paymentMethod?: undefined;
        };
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        data: {
            paymentMethod: "CASH" | "CARD" | "UPI";
            customerCharged?: undefined;
        };
        error?: undefined;
    }>;
    /**
     * TRIGGER 2: Order Confirmation (Swiggy Model)
     * - Credit restaurant immediately when they accept order
     * - Reduces restaurant cash flow issues
     */
    processOrderConfirmation(orderId: number): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
        data?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        data?: undefined;
    } | {
        success: boolean;
        message: string;
        data: {
            restaurantCredited: number;
            commissionDeducted: number;
        };
        error?: undefined;
    }>;
    /**
     * TRIGGER 3: Order Delivery (Your Current Model)
     * - Credit driver on successful delivery
     * - Final settlement completion
     */
    processOrderDelivery(orderId: number, driverId: number): Promise<{
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
            driverCredited: number;
        };
        error?: undefined;
    }>;
    /**
     * TRIGGER 4: Batch Settlement (Enterprise Model)
     * - Process multiple orders in batches
     * - Lower transaction costs
     * - Better for high-volume operations
     */
    processBatchSettlement(orderIds: number[]): Promise<{
        success: boolean;
        message: string;
        data: {
            totalOrders: number;
            successful: number;
            failed: number;
            details: {
                orderId: number;
                customerCharged: number;
                restaurantCredited: number;
                driverCredited: number;
                status: string;
            }[];
        };
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        data?: undefined;
    }>;
    /**
     * Refund Processing
     */
    processRefund(orderId: number, reason: string): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        data: {
            refundAmount: number;
            reason: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        data?: undefined;
    }>;
    /**
     * Partial Refund (for damaged/missing items)
     */
    processPartialRefund(orderId: number, amount: number, reason: string): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
        data?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    } | {
        success: boolean;
        message: string;
        data: {
            refundAmount: number;
            reason: string;
        };
        error?: undefined;
    }>;
}
declare const paymentDistributionService: PaymentDistributionServiceImpl;
export default paymentDistributionService;
//# sourceMappingURL=paymentDistributionService.d.ts.map