import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import escrowPaymentService from '../services/escrowPaymentService';
import socketService from '../services/socketService';

const router = Router();
const prisma = new PrismaClient();

/**
 * ESCROW MODEL ENDPOINTS
 * Following your specified model:
 * 1. Order Placed → Hold payment in escrow (1-min free cancel)
 * 2. After 1 minute → Deduct payment but hold in escrow
 * 3. Restaurant Accepts → Block customer cancellation
 * 4. Order Delivered → Release funds to restaurant + driver
 * 5. Restaurant Timeout (15 min) → Allow customer cancellation with refund
 */

// 1. Check if order can be cancelled (Customer/Admin use)
router.get('/:id/can-cancel', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Verify order belongs to customer
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: userId
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const canCancelResult = await escrowPaymentService.canCancelOrder(orderId);

    res.json({
      success: true,
      data: canCancelResult
    });
  } catch (error) {
    console.error('Check can cancel error:', error);
    res.status(500).json({ success: false, message: 'Failed to check cancellation status' });
  }
});

// 2. Process escrow payment (called automatically after 1-minute grace period)
router.post('/:id/process-escrow', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    
    // This endpoint can be called by system cron job or manually for testing
    const result = await escrowPaymentService.processEscrowPayment(orderId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    console.error('Process escrow error:', error);
    res.status(500).json({ success: false, message: 'Failed to process escrow payment' });
  }
});

// 3. Cancel order with refund (Customer use - only if allowed)
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Verify order belongs to customer
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: userId
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const cancelReason = reason || 'Customer requested cancellation';
    const result = await escrowPaymentService.cancelOrderWithRefund(orderId, cancelReason);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Emit real-time order cancellation event
    socketService.emitOrderCancellation(
      orderId, 
      order.customerId, 
      cancelReason,
      result.data?.refundAmount
    );
    
    // Also emit order status update with CANCELLED status
    const cancelledOrder = {
      ...order,
      status: 'CANCELLED',
      restaurant: { name: 'Restaurant' } // Fallback name
    };
    socketService.emitOrderUpdate(cancelledOrder, `Order cancelled: ${cancelReason}`);
    
    console.log('📡 Socket events emitted for order cancellation:', {
      orderId,
      customerId: order.customerId,
      reason: cancelReason,
      refundAmount: result.data?.refundAmount
    });

    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
});

// 4. Restaurant accepts order (blocks customer cancellation)
router.post('/:id/accept', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Verify user is restaurant owner for this order
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        restaurant: {
          user: {
            id: userId
          }
        }
      },
      include: {
        restaurant: true
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({ 
        success: false, 
        message: `Order cannot be accepted. Current status: ${order.status}` 
      });
    }

    // Check if restaurant has timed out (15 minutes)
    const timeoutCheck = await escrowPaymentService.checkRestaurantTimeout(orderId);
    if (timeoutCheck.hasTimedOut) {
      return res.status(400).json({
        success: false,
        message: 'Order acceptance window has expired (15 minutes)',
        timeoutOccurred: true
      });
    }

    // Accept the order
    const acceptedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date()
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true
          }
        },
        customer: {
          select: {
            name: true,
            phone: true
          }
        }
      }
    });

    // Emit real-time order status update for acceptance
    socketService.emitOrderUpdate(acceptedOrder, 'Your order has been accepted by the restaurant!');
    console.log('📡 Socket event emitted for order acceptance:', {
      orderId: acceptedOrder.id,
      customerId: acceptedOrder.customerId,
      restaurantName: acceptedOrder.restaurant.name
    });

    res.json({
      success: true,
      data: {
        order: acceptedOrder,
        message: 'Order accepted successfully. Customer can no longer cancel.'
      }
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept order' });
  }
});

// 5. Release escrow funds on delivery (Driver use)
router.post('/:id/deliver', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({ success: false, message: 'Driver not authenticated' });
    }

    // Verify driver is assigned to this order
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        driverId: driverId,
        status: 'DELIVERING'
      }
    });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found or not assigned to you, or not in DELIVERING status' 
      });
    }

    // Release escrow funds and complete delivery
    const result = await escrowPaymentService.releaseEscrowOnDelivery(orderId, driverId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    console.error('Deliver order error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete delivery' });
  }
});

// 6. Check restaurant timeout (Admin/System use)
router.get('/:id/timeout-check', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    
    const timeoutCheck = await escrowPaymentService.checkRestaurantTimeout(orderId);

    if (!timeoutCheck.success) {
      return res.status(400).json(timeoutCheck);
    }

    res.json({
      success: true,
      data: timeoutCheck
    });
  } catch (error) {
    console.error('Timeout check error:', error);
    res.status(500).json({ success: false, message: 'Failed to check timeout' });
  }
});

// 7. Process timeout refund (Admin/System use)
router.post('/:id/timeout-refund', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    
    const result = await escrowPaymentService.processTimeoutRefund(orderId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  } catch (error) {
    console.error('Timeout refund error:', error);
    res.status(500).json({ success: false, message: 'Failed to process timeout refund' });
  }
});

// 8. Get order cancellation info for frontend (Customer use)
router.get('/:id/cancellation-info', authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Verify order belongs to customer
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: userId
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const canCancelResult = await escrowPaymentService.canCancelOrder(orderId);
    const timeoutCheck = await escrowPaymentService.checkRestaurantTimeout(orderId);

    res.json({
      success: true,
      data: {
        order: {
          id: order.id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt,
          acceptedAt: order.acceptedAt,
          totalAmount: order.totalPrice.toNumber() + order.deliveryFee.toNumber()
        },
        cancellation: canCancelResult,
        timeout: timeoutCheck,
        userFriendlyMessage: canCancelResult.canCancel 
          ? `You can cancel this order. ${canCancelResult.message}`
          : `Order cannot be cancelled. ${canCancelResult.message}`
      }
    });
  } catch (error) {
    console.error('Get cancellation info error:', error);
    res.status(500).json({ success: false, message: 'Failed to get cancellation info' });
  }
});

export default router;
