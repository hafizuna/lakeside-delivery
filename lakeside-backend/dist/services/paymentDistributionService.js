"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const walletService_1 = __importDefault(require("./walletService"));
const restaurantWalletService_1 = __importDefault(require("./restaurantWalletService"));
const prisma = new client_1.PrismaClient();
class PaymentDistributionServiceImpl {
    /**
     * TRIGGER 1: Order Placement (DoorDash Model)
     * - Customer payment authorization/charge immediately
     * - Hold funds in platform escrow
     */
    async processOrderPlacement(orderId) {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { customer: true, restaurant: true }
            });
            if (!order) {
                return { success: false, message: 'Order not found' };
            }
            const totalAmount = order.totalPrice.toNumber() + order.deliveryFee.toNumber();
            // For wallet payments, charge customer immediately
            if (order.paymentMethod === 'WALLET') {
                const customerPayment = await walletService_1.default.processCustomerPayment(order.customerId, totalAmount, orderId);
                if (!customerPayment.success) {
                    return {
                        success: false,
                        message: 'Customer payment failed',
                        error: customerPayment.message
                    };
                }
                // Update order status to paid
                await prisma.order.update({
                    where: { id: orderId },
                    data: { paymentStatus: 'PAID' }
                });
                return {
                    success: true,
                    message: 'Customer payment processed on order placement',
                    data: { customerCharged: totalAmount }
                };
            }
            // For other payment methods, just authorize
            return {
                success: true,
                message: 'Payment authorized, will be captured later',
                data: { paymentMethod: order.paymentMethod }
            };
        }
        catch (error) {
            console.error('Process order placement error:', error);
            return {
                success: false,
                message: 'Failed to process order placement payment',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * TRIGGER 2: Order Confirmation (Swiggy Model)
     * - Credit restaurant immediately when they accept order
     * - Reduces restaurant cash flow issues
     */
    async processOrderConfirmation(orderId) {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { restaurant: true }
            });
            if (!order) {
                return { success: false, message: 'Order not found' };
            }
            // Only process if payment is already captured
            if (order.paymentStatus !== 'PAID') {
                return {
                    success: false,
                    message: 'Cannot credit restaurant - payment not confirmed'
                };
            }
            const commission = order.commission.toNumber();
            const restaurantEarning = order.totalPrice.toNumber() - commission;
            // Credit restaurant wallet immediately
            const restaurantCredit = await restaurantWalletService_1.default.addRestaurantEarning(order.restaurantId, order.totalPrice.toNumber(), commission, orderId);
            if (!restaurantCredit.success) {
                return {
                    success: false,
                    message: 'Failed to credit restaurant',
                    error: restaurantCredit.message
                };
            }
            return {
                success: true,
                message: 'Restaurant credited on order confirmation',
                data: {
                    restaurantCredited: restaurantEarning,
                    commissionDeducted: commission
                }
            };
        }
        catch (error) {
            console.error('Process order confirmation error:', error);
            return {
                success: false,
                message: 'Failed to process order confirmation payment',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * TRIGGER 3: Order Delivery (Your Current Model)
     * - Credit driver on successful delivery
     * - Final settlement completion
     */
    async processOrderDelivery(orderId, driverId) {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { customer: true, restaurant: true }
            });
            if (!order) {
                return { success: false, message: 'Order not found' };
            }
            const driverEarning = order.driverEarning.toNumber();
            // Credit driver wallet
            const driverCredit = await walletService_1.default.addDriverEarning(driverId, driverEarning, orderId);
            if (!driverCredit.success) {
                return {
                    success: false,
                    message: 'Failed to credit driver',
                    error: driverCredit.message
                };
            }
            // Mark order as fully settled
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: 'DELIVERED',
                    deliveredAt: new Date()
                }
            });
            return {
                success: true,
                message: 'Driver credited on delivery completion',
                data: { driverCredited: driverEarning }
            };
        }
        catch (error) {
            console.error('Process order delivery error:', error);
            return {
                success: false,
                message: 'Failed to process delivery payment',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * TRIGGER 4: Batch Settlement (Enterprise Model)
     * - Process multiple orders in batches
     * - Lower transaction costs
     * - Better for high-volume operations
     */
    async processBatchSettlement(orderIds) {
        try {
            const results = [];
            // Process in transaction to ensure consistency
            const batchResult = await prisma.$transaction(async (tx) => {
                const settlements = [];
                for (const orderId of orderIds) {
                    const order = await tx.order.findUnique({
                        where: { id: orderId },
                        include: { customer: true, restaurant: true }
                    });
                    if (!order || order.paymentStatus === 'SETTLED') {
                        continue; // Skip already settled orders
                    }
                    const totalAmount = order.totalPrice.toNumber() + order.deliveryFee.toNumber();
                    const commission = order.commission.toNumber();
                    const restaurantEarning = order.totalPrice.toNumber() - commission;
                    const driverEarning = order.driverEarning.toNumber();
                    // Process all payments for this order
                    const settlementResult = {
                        orderId,
                        customerCharged: 0,
                        restaurantCredited: 0,
                        driverCredited: 0,
                        status: 'failed'
                    };
                    try {
                        // Customer payment (if not already processed)
                        if (order.paymentMethod === 'WALLET' && order.paymentStatus !== 'PAID') {
                            const customerPayment = await walletService_1.default.processCustomerPayment(order.customerId, totalAmount, orderId);
                            if (customerPayment.success) {
                                settlementResult.customerCharged = totalAmount;
                            }
                        }
                        // Restaurant credit
                        const restaurantCredit = await restaurantWalletService_1.default.addRestaurantEarning(order.restaurantId, order.totalPrice.toNumber(), commission, orderId);
                        if (restaurantCredit.success) {
                            settlementResult.restaurantCredited = restaurantEarning;
                        }
                        // Driver credit
                        if (order.driverId) {
                            const driverCredit = await walletService_1.default.addDriverEarning(order.driverId, driverEarning, orderId);
                            if (driverCredit.success) {
                                settlementResult.driverCredited = driverEarning;
                            }
                        }
                        // Mark as settled
                        await tx.order.update({
                            where: { id: orderId },
                            data: { paymentStatus: 'SETTLED' }
                        });
                        settlementResult.status = 'success';
                    }
                    catch (orderError) {
                        console.error(`Failed to settle order ${orderId}:`, orderError);
                        settlementResult.status = 'failed';
                    }
                    settlements.push(settlementResult);
                }
                return settlements;
            });
            return {
                success: true,
                message: `Batch settlement completed for ${orderIds.length} orders`,
                data: {
                    totalOrders: orderIds.length,
                    successful: batchResult.filter(r => r.status === 'success').length,
                    failed: batchResult.filter(r => r.status === 'failed').length,
                    details: batchResult
                }
            };
        }
        catch (error) {
            console.error('Batch settlement error:', error);
            return {
                success: false,
                message: 'Batch settlement failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Refund Processing
     */
    async processRefund(orderId, reason) {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { customer: true, restaurant: true }
            });
            if (!order) {
                return { success: false, message: 'Order not found' };
            }
            const totalAmount = order.totalPrice.toNumber() + order.deliveryFee.toNumber();
            // Process refund in transaction
            const refundResult = await prisma.$transaction(async (tx) => {
                // Refund to customer wallet
                const customerRefund = await walletService_1.default.addCustomerRefund(order.customerId, totalAmount, orderId, reason);
                if (!customerRefund.success) {
                    throw new Error('Customer refund failed');
                }
                // Deduct from restaurant wallet if already credited
                if (order.paymentStatus === 'PAID' || order.paymentStatus === 'SETTLED') {
                    const restaurantDeduction = await restaurantWalletService_1.default.deductRestaurantEarning(order.restaurantId, order.totalPrice.toNumber(), orderId, reason);
                    if (!restaurantDeduction.success) {
                        console.warn('Restaurant deduction failed, manual intervention required');
                    }
                }
                // Update order status
                await tx.order.update({
                    where: { id: orderId },
                    data: {
                        status: 'CANCELLED',
                        paymentStatus: 'REFUNDED'
                    }
                });
                return { customerRefund };
            });
            return {
                success: true,
                message: 'Refund processed successfully',
                data: {
                    refundAmount: totalAmount,
                    reason
                }
            };
        }
        catch (error) {
            console.error('Process refund error:', error);
            return {
                success: false,
                message: 'Refund processing failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Partial Refund (for damaged/missing items)
     */
    async processPartialRefund(orderId, amount, reason) {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId }
            });
            if (!order) {
                return { success: false, message: 'Order not found' };
            }
            // Add partial refund to customer wallet
            const partialRefund = await walletService_1.default.addCustomerRefund(order.customerId, amount, orderId, `Partial refund: ${reason}`);
            if (!partialRefund.success) {
                return {
                    success: false,
                    message: 'Partial refund failed',
                    error: partialRefund.message
                };
            }
            return {
                success: true,
                message: 'Partial refund processed successfully',
                data: {
                    refundAmount: amount,
                    reason
                }
            };
        }
        catch (error) {
            console.error('Process partial refund error:', error);
            return {
                success: false,
                message: 'Partial refund processing failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
const paymentDistributionService = new PaymentDistributionServiceImpl();
exports.default = paymentDistributionService;
//# sourceMappingURL=paymentDistributionService.js.map