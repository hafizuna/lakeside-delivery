import { PrismaClient, Prisma } from '@prisma/client';
import walletService from './walletService';
import restaurantWalletService from './restaurantWalletService';

const prisma = new PrismaClient();

interface EscrowPaymentService {
  // Core escrow functions
  canCancelOrder(orderId: number): Promise<any>;
  processEscrowPayment(orderId: number): Promise<any>;
  cancelOrderWithRefund(orderId: number, reason: string): Promise<any>;
  releaseEscrowOnDelivery(orderId: number, driverId: number): Promise<any>;
  
  // Timeout handling
  checkRestaurantTimeout(orderId: number): Promise<any>;
  processTimeoutRefund(orderId: number): Promise<any>;
}

class EscrowPaymentServiceImpl implements EscrowPaymentService {
  
  /**
   * Check if customer can cancel order based on escrow model rules
   */
  async canCancelOrder(orderId: number) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { restaurant: true }
      });

      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      const now = new Date();
      const orderAge = now.getTime() - order.createdAt.getTime();
      const oneMinute = 60 * 1000; // 1 minute in milliseconds
      const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds

      // RULE 1: Within 1 minute - always can cancel (free cancellation)
      if (orderAge < oneMinute) {
        return {
          success: true,
          canCancel: true,
          reason: 'FREE_CANCELLATION_WINDOW',
          message: 'Order can be cancelled for free (within 1 minute)',
          timeRemaining: Math.max(0, oneMinute - orderAge)
        };
      }

      // RULE 2: After 1 minute but before restaurant accepts - can cancel with refund
      if (order.status === 'PENDING' && !order.acceptedAt) {
        // Check if restaurant has timed out (15 minutes)
        if (orderAge > fifteenMinutes) {
          return {
            success: true,
            canCancel: true,
            reason: 'RESTAURANT_TIMEOUT',
            message: 'Restaurant took too long to accept. Order can be cancelled with full refund.',
            timeoutOccurred: true
          };
        }

        // Restaurant still has time to accept, but payment is escrowed
        if (order.paymentStatus === 'ESCROWED') {
          return {
            success: true,
            canCancel: true,
            reason: 'BEFORE_RESTAURANT_ACCEPTANCE',
            message: 'Payment escrowed but restaurant hasn\'t accepted yet. Can cancel with refund.',
            restaurantTimeRemaining: Math.max(0, fifteenMinutes - orderAge)
          };
        }
      }

      // RULE 3: After restaurant accepts - cannot cancel
      if (order.acceptedAt || ['ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERING'].includes(order.status)) {
        return {
          success: true,
          canCancel: false,
          reason: 'RESTAURANT_ACCEPTED',
          message: 'Restaurant has accepted your order and is preparing it. Order cannot be cancelled.',
          acceptedAt: order.acceptedAt,
          currentStatus: order.status
        };
      }

      // RULE 4: Order completed/delivered - cannot cancel
      if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
        return {
          success: true,
          canCancel: false,
          reason: 'ORDER_COMPLETED',
          message: `Order has been ${order.status.toLowerCase()}.`,
          currentStatus: order.status
        };
      }

      // RULE 5: Handle any remaining PENDING orders without acceptance
      if (order.status === 'PENDING') {
        // If we reach here, it means we're past 1 minute, no restaurant acceptance,
        // but also not escrowed yet or other edge cases
        return {
          success: true,
          canCancel: true,
          reason: 'PENDING_ORDER',
          message: 'Order is still pending. You can cancel with refund.',
          currentStatus: order.status
        };
      }

      // Default case - should rarely happen now
      return {
        success: true,
        canCancel: false,
        reason: 'UNKNOWN_STATE',
        message: `Order status: ${order.status}. Please contact support if you need to cancel.`,
        currentStatus: order.status
      };

    } catch (error) {
      console.error('Can cancel order error:', error);
      return {
        success: false,
        message: 'Failed to check cancellation status',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process escrow payment (called after 1-minute grace period)
   */
  async processEscrowPayment(orderId: number) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      // Only process if payment is still pending
      if (order.paymentStatus !== 'PENDING') {
        return {
          success: false,
          message: `Payment already processed. Status: ${order.paymentStatus}`
        };
      }

      // With NEW PRICING STRUCTURE: totalPrice already includes delivery fee
      const totalAmount = order.totalPrice.toNumber();
      

      // Process payment based on method
      if (order.paymentMethod === 'WALLET') {
        // For wallet payments, deduct from customer wallet and hold in escrow
        const customerPayment = await walletService.processCustomerPayment(
          order.customerId,
          totalAmount,
          orderId
        );

        if (!customerPayment.success) {
          return {
            success: false,
            message: 'Customer wallet payment failed',
            error: customerPayment.message
          };
        }

        // Update order to ESCROWED status
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'ESCROWED' as const }
        });

        return {
          success: true,
          message: 'Payment escrowed successfully',
          data: {
            amount: totalAmount,
            paymentMethod: 'WALLET',
            status: 'ESCROWED'
          }
        };
      }

      // For other payment methods (CARD, UPI), just mark as escrowed
      // In real implementation, you'd process the actual payment here
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'ESCROWED' as const }
      });

      return {
        success: true,
        message: `Payment escrowed successfully via ${order.paymentMethod}`,
        data: {
          amount: totalAmount,
          paymentMethod: order.paymentMethod,
          status: 'ESCROWED'
        }
      };

    } catch (error) {
      console.error('Process escrow payment error:', error);
      return {
        success: false,
        message: 'Failed to process escrow payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cancel order with proper refund based on escrow rules
   */
  async cancelOrderWithRefund(orderId: number, reason: string) {
    try {
      // First check if cancellation is allowed
      const canCancel = await this.canCancelOrder(orderId);
      if (!canCancel.success || !canCancel.canCancel) {
        return {
          success: false,
          message: canCancel.message || 'Order cannot be cancelled',
          reason: canCancel.reason
        };
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      // With NEW PRICING STRUCTURE: totalPrice already includes delivery fee
      const totalAmount = order.totalPrice.toNumber();
      

      
      // Process cancellation in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update order status and reset financial fields
        const cancelledOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'CANCELLED' as const,
            paymentStatus: 'REFUNDED' as const,
            // Reset platform earnings to 0 since no service was provided
            platformEarnings: new Prisma.Decimal(0),
            restaurantCommission: new Prisma.Decimal(0),
            deliveryCommission: new Prisma.Decimal(0)
          }
        });
        
      
        // Process refund based on payment status
        if (order.paymentStatus === ('ESCROWED' as const) && order.paymentMethod === 'WALLET') {
          // For escrowed wallet payments, add refund to customer wallet
          const refund = await walletService.addCustomerRefund(
            order.customerId,
            totalAmount,
            orderId,
            `Order cancelled: ${reason}`
          );

          if (!refund.success) {
            throw new Error('Refund processing failed');
          }

          return { refundProcessed: true, amount: totalAmount };
        }

        // For non-wallet or pending payments, just mark as refunded
        // Actual refund processing would depend on payment gateway
        return { refundProcessed: true, amount: totalAmount, requiresManualProcessing: true };
      });

      return {
        success: true,
        message: 'Order cancelled and refund processed',
        data: {
          orderId,
          refundAmount: totalAmount,
          reason: canCancel.reason,
          ...result
        }
      };

    } catch (error) {
      console.error('Cancel order with refund error:', error);
      return {
        success: false,
        message: 'Failed to cancel order and process refund',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Release escrow funds on successful delivery
   */
  async releaseEscrowOnDelivery(orderId: number, driverId: number) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          customerId: true,
          restaurantId: true,
          paymentStatus: true,
          paymentMethod: true,
          totalPrice: true,
          itemsSubtotal: true,
          restaurantCommission: true,
          deliveryCommission: true,
          platformEarnings: true,
          driverEarning: true,
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
              lat: true,
              lng: true,
              logoUrl: true,
              rating: true,
              status: true,
              commissionRate: true
            }
          }
        }
      });

      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      if (order.paymentStatus !== ('ESCROWED' as const)) {
        return {
          success: false,
          message: `Cannot release funds. Payment status: ${order.paymentStatus}`
        };
      }

      // NEW PRICING STRUCTURE
      const itemsSubtotal = order.itemsSubtotal?.toNumber() || 0;
      const restaurantCommission = order.restaurantCommission.toNumber();
      const restaurantEarning = itemsSubtotal - restaurantCommission;
      const driverEarning = order.driverEarning.toNumber();
      const platformEarnings = order.platformEarnings.toNumber();
      

      // Release funds in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update order status
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'DELIVERED' as const,
            paymentStatus: 'PAID' as const,
            deliveredAt: new Date()
          }
        });

        // Credit restaurant wallet (items subtotal - restaurant commission)
        const restaurantCredit = await restaurantWalletService.addRestaurantEarning(
          order.restaurantId,
          itemsSubtotal,
          restaurantCommission,
          orderId
        );

        if (!restaurantCredit.success) {
          throw new Error('Restaurant credit failed');
        }

        // Credit driver wallet
        const driverCredit = await walletService.addDriverEarning(driverId, driverEarning, orderId);

        if (!driverCredit.success) {
          throw new Error('Driver credit failed');
        }

        return {
          restaurantCredited: restaurantEarning,
          driverCredited: driverEarning,
          platformEarnings: platformEarnings,
          totalReleased: order.totalPrice.toNumber() // Already includes delivery fee
        };
      });

      return {
        success: true,
        message: 'Escrow funds released successfully on delivery',
        data: result
      };

    } catch (error) {
      console.error('Release escrow on delivery error:', error);
      return {
        success: false,
        message: 'Failed to release escrow funds',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if restaurant has timed out (15 minutes to accept)
   */
  async checkRestaurantTimeout(orderId: number) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      const now = new Date();
      const orderAge = now.getTime() - order.createdAt.getTime();
      const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds

      const hasTimedOut = (
        orderAge > fifteenMinutes &&
        order.status === 'PENDING' &&
        !order.acceptedAt
      );

      return {
        success: true,
        hasTimedOut,
        orderAge: Math.floor(orderAge / 1000), // in seconds
        timeoutThreshold: fifteenMinutes,
        canRefund: hasTimedOut
      };

    } catch (error) {
      console.error('Check restaurant timeout error:', error);
      return {
        success: false,
        message: 'Failed to check restaurant timeout',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process automatic refund for restaurant timeout
   */
  async processTimeoutRefund(orderId: number) {
    try {
      const timeoutCheck = await this.checkRestaurantTimeout(orderId);
      if (!timeoutCheck.success || !timeoutCheck.hasTimedOut) {
        return {
          success: false,
          message: 'Restaurant has not timed out or order is not eligible for timeout refund'
        };
      }

      // Process refund due to restaurant timeout
      return await this.cancelOrderWithRefund(orderId, 'Restaurant failed to accept within 15 minutes');

    } catch (error) {
      console.error('Process timeout refund error:', error);
      return {
        success: false,
        message: 'Failed to process timeout refund',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

const escrowPaymentService = new EscrowPaymentServiceImpl();
export default escrowPaymentService;
