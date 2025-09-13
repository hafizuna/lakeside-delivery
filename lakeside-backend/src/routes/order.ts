import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import walletService from '../services/walletService';

const router = Router();
const prisma = new PrismaClient();

// Get user orders
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const orders = await prisma.order.findMany({
      where: { customerId: userId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            address: true
          }
        },
        orderItems: {
          include: {
            menu: {
              select: {
                id: true,
                itemName: true,
                price: true,
                imageUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const orderId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const order = await prisma.order.findFirst({
      where: { 
        id: orderId,
        customerId: userId 
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            address: true,
            user: {
              select: {
                name: true,
                phone: true
              }
            }
          }
        },
        orderItems: {
          include: {
            menu: {
              select: {
                id: true,
                itemName: true,
                price: true,
                imageUrl: true,
                description: true
              }
            }
          }
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
});

// Create new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const {
      restaurantId,
      items,
      totalPrice,
      deliveryFee,
      deliveryAddress,
      deliveryLat = 34.0522, // Default LA coordinates
      deliveryLng = -118.2437,
      deliveryInstructions,
      paymentMethod
    } = req.body;

    // Validate required fields
    if (!restaurantId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Restaurant ID and items are required' 
      });
    }

    if (!deliveryAddress || !totalPrice || !paymentMethod) {
      return res.status(400).json({ 
        success: false, 
        message: 'Delivery address, total price, and payment method are required' 
      });
    }

    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId }
    });

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    // Handle wallet payment if selected
    if (paymentMethod.toUpperCase() === 'WALLET') {
      const totalAmount = parseFloat(totalPrice.toString()) + parseFloat(deliveryFee?.toString() || '0');
      
      // Check wallet balance
      const balanceCheck = await walletService.checkSufficientBalance(userId, totalAmount);
      if (!balanceCheck.success || !balanceCheck.data?.hasSufficientBalance) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance. Please top up your wallet.',
          currentBalance: balanceCheck.data?.currentBalance || 0
        });
      }
    }

    // Create order with order items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          customerId: userId,
          restaurantId,
          totalPrice: parseFloat(totalPrice.toString()),
          deliveryFee: parseFloat(deliveryFee?.toString() || '0'),
          commission: parseFloat((totalPrice * 0.15).toString()), // 15% commission
          // Pickup address (from restaurant)
          pickupAddress: restaurant.address,
          pickupLat: restaurant.lat,
          pickupLng: restaurant.lng,
          // Delivery address (from customer)
          deliveryAddress,
          deliveryLat: parseFloat(deliveryLat.toString()),
          deliveryLng: parseFloat(deliveryLng.toString()),
          deliveryInstructions: deliveryInstructions || null,
          // Driver earnings (80% of delivery fee)
          driverEarning: parseFloat(deliveryFee?.toString() || '0') * 0.8,
          platformCommission: parseFloat(deliveryFee?.toString() || '0') * 0.2,
          paymentMethod: paymentMethod.toUpperCase(),
          paymentStatus: 'PENDING',
          status: 'PENDING'
        }
      });

      // Create order items
      const orderItems = await Promise.all(
        items.map((item: any) =>
          tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              menuId: item.menuId,
              quantity: parseInt(item.quantity.toString()),
              price: parseFloat(item.price.toString())
            }
          })
        )
      );

      return { ...newOrder, orderItems };
    });

    // Fetch the complete order with relations
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            address: true
          }
        },
        orderItems: {
          include: {
            menu: {
              select: {
                id: true,
                itemName: true,
                price: true,
                imageUrl: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: completeOrder,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

// Process wallet payment for order
router.post('/:id/pay-wallet', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const orderId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Get order details
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId,
        customerId: userId,
        paymentMethod: 'WALLET',
        paymentStatus: 'PENDING'
      }
    });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found or payment already processed' 
      });
    }

    const totalAmount = order.totalPrice.toNumber() + order.deliveryFee.toNumber();

    // Process wallet payment
    const paymentResult = await walletService.processCustomerPayment(userId, totalAmount, orderId);
    
    if (!paymentResult.success) {
      return res.status(400).json(paymentResult);
    }

    // Update order payment status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        paymentStatus: 'PAID',
        status: 'ACCEPTED' // Move to accepted after payment
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            address: true
          }
        },
        orderItems: {
          include: {
            menu: {
              select: {
                id: true,
                itemName: true,
                price: true,
                imageUrl: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        order: updatedOrder,
        payment: paymentResult.data
      },
      message: 'Payment processed successfully'
    });
  } catch (error) {
    console.error('Process wallet payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to process wallet payment' });
  }
});

// Cancel order
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const orderId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Check if order exists and belongs to user
    const existingOrder = await prisma.order.findFirst({
      where: { 
        id: orderId,
        customerId: userId 
      }
    });

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if order can be cancelled
    if (!['PENDING', 'ACCEPTED'].includes(existingOrder.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order cannot be cancelled at this stage' 
      });
    }

    // Update order status to cancelled
    const cancelledOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED'
      }
    });

    res.json({
      success: true,
      data: cancelledOrder,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
});

// Mark order as delivered (for drivers)
router.patch('/:id/deliver', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user?.id;
    const orderId = parseInt(req.params.id);
    
    if (!driverId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Get order details
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
        message: 'Order not found or cannot be marked as delivered' 
      });
    }

    // Calculate driver earning (delivery fee - commission)
    const driverEarning = order.deliveryFee.toNumber() * 0.8; // Driver gets 80% of delivery fee

    // Update order and credit driver in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mark order as delivered
      const deliveredOrder = await tx.order.update({
        where: { id: orderId },
        data: { 
          status: 'DELIVERED',
          deliveredAt: new Date()
        }
      });

      // Credit driver wallet
      await walletService.addDriverEarning(driverId, driverEarning, orderId);

      return deliveredOrder;
    });

    res.json({
      success: true,
      data: result,
      message: `Order delivered successfully. ₹${driverEarning} credited to your wallet.`
    });
  } catch (error) {
    console.error('Deliver order error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark order as delivered' });
  }
});

export default router;
