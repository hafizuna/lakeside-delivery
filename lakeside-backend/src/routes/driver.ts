import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/driver/orders/available
 * Get available orders for driver assignment (status: ACCEPTED, no driver assigned)
 */
router.get('/orders/available', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user?.id;
    
    if (!driverId) {
      return res.status(401).json({ success: false, message: 'Driver not authenticated' });
    }

    // Check if driver is approved and available
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true }
    });

    if (!driver || driver.approvalStatus !== 'APPROVED' || !driver.isAvailable) {
      return res.status(403).json({ 
        success: false, 
        message: 'Driver not approved or unavailable' 
      });
    }

    // Get orders for early assignment (PREPARING) or immediate assignment (READY)
    // PREPARING = Early assignment while food is cooking (OPTIMAL)
    // READY = Immediate assignment when food is done
    const availableOrders = await prisma.order.findMany({
      where: {
        status: { in: ['PREPARING', 'READY'] },
        driverId: null // No driver assigned yet
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            lat: true,
            lng: true,
            logoUrl: true,
            user: {
              select: {
                name: true,
                phone: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        orderItems: {
          include: {
            menu: {
              select: {
                itemName: true,
                price: true,
                imageUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' } // First in, first out
    });

    // Calculate distance and earnings for each order
    const ordersWithDetails = availableOrders.map(order => ({
      ...order,
      // Calculate driver earnings (80% of delivery fee)
      calculatedDriverEarning: order.deliveryFee.toNumber() * 0.8,
      // Calculate distance between restaurant and delivery (mock for now)
      calculatedDistance: calculateDistance(
        order.pickupLat?.toNumber() || order.restaurant.lat.toNumber(),
        order.pickupLng?.toNumber() || order.restaurant.lng.toNumber(),
        order.deliveryLat?.toNumber() || 0,
        order.deliveryLng?.toNumber() || 0
      ),
      // Estimated time for delivery
      estimatedTime: 25 // minutes - can be calculated based on distance
    }));

    res.json({
      success: true,
      data: ordersWithDetails,
      count: ordersWithDetails.length
    });

  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch available orders' });
  }
});

/**
 * POST /api/driver/orders/:id/accept
 * Accept a delivery assignment
 */
router.post('/orders/:id/accept', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user?.id;
    const orderId = parseInt(req.params.id);
    
    if (!driverId) {
      return res.status(401).json({ success: false, message: 'Driver not authenticated' });
    }

    // Verify driver is available and approved
    const driver = await prisma.driver.findUnique({
      where: { id: driverId }
    });

    if (!driver || driver.approvalStatus !== 'APPROVED' || !driver.isAvailable) {
      return res.status(403).json({ 
        success: false, 
        message: 'Driver not available for assignments' 
      });
    }

    // Calculate driver earnings and distance
    const driverEarning = 40; // Base delivery fee
    const platformCommission = 10; // Platform commission
    
    // ATOMIC ASSIGNMENT: Assign driver to order without changing status
    // This prevents race conditions - only one driver can be assigned
    const assignmentResult = await prisma.order.updateMany({
      where: {
        id: orderId,
        status: { in: ['PREPARING', 'READY'] }, // Order must be PREPARING or READY
        driverId: null // Must not be assigned yet
      },
      data: {
        driverId: driverId,
        driverEarning: driverEarning,
        platformCommission: platformCommission,
        // No status change - stays PREPARING or READY
        estimatedPickupTime: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
      }
    });

    // Check if assignment was successful
    if (assignmentResult.count === 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Order already assigned to another driver or no longer available' 
      });
    }

    // Fetch the complete assigned order
    const assignedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            lat: true,
            lng: true,
            user: { select: { name: true, phone: true } }
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        orderItems: {
          include: {
            menu: {
              select: {
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
      data: assignedOrder,
      message: 'Order accepted successfully'
    });

  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept order' });
  }
});

/**
 * PATCH /api/driver/orders/:id/status
 * Update order status during delivery
 * Supports: READY → PICKED_UP → DELIVERING → DELIVERED
 */
router.patch('/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user?.id;
    const orderId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!driverId) {
      return res.status(401).json({ success: false, message: 'Driver not authenticated' });
    }

    // Validate status
    const validStatuses = ['READY', 'PICKED_UP', 'DELIVERING', 'DELIVERED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Allowed: ${validStatuses.join(', ')}` 
      });
    }

    // Get current order
    const currentOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        driverId: driverId
      }
    });

    if (!currentOrder) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found or not assigned to you' 
      });
    }

    // Validate status transition - Enhanced for early driver assignment
    const statusTransitions: Record<string, string[]> = {
      'PREPARING': ['READY', 'PICKED_UP'], // Driver assigned early can wait, then pickup
      'READY': ['PICKED_UP'],              // Traditional flow
      'PICKED_UP': ['DELIVERING'],
      'DELIVERING': ['DELIVERED'],
      'DELIVERED': [] // Final state
    };

    const allowedNextStatuses = statusTransitions[currentOrder.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot change status from ${currentOrder.status} to ${status}` 
      });
    }

    // Prepare update data with timestamps
    let updateData: any = { status };
    
    switch (status) {
      case 'PICKED_UP':
        updateData.pickedUpAt = new Date();
        break;
      case 'DELIVERING':
        // No specific timestamp, but could add deliveringAt if needed
        break;
      case 'DELIVERED':
        updateData.deliveredAt = new Date();
        updateData.paymentStatus = 'PAID';
        break;
    }

    // Handle DELIVERED status - credit driver earnings
    if (status === 'DELIVERED') {
      const result = await prisma.$transaction(async (tx) => {
        // Update order status
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: updateData
        });

        // Credit driver wallet with earnings
        const driverEarning = currentOrder.driverEarning.toNumber();
        if (driverEarning > 0) {
          // Update driver wallet
          await tx.driverWallet.upsert({
            where: { driverId: driverId },
            create: {
              driverId: driverId,
              balance: driverEarning,
              totalEarnings: driverEarning,
              lastEarningAt: new Date()
            },
            update: {
              balance: { increment: driverEarning },
              totalEarnings: { increment: driverEarning },
              lastEarningAt: new Date()
            }
          });

          // Create earnings transaction record
          await tx.walletTransaction.create({
            data: {
              driverId: driverId,
              amount: driverEarning,
              type: 'DRIVER_EARNING',
              status: 'APPROVED',
              description: `Delivery earning for order #${orderId}`,
              processedAt: new Date()
            }
          });

          // Update driver performance stats
          await tx.driver.update({
            where: { id: driverId },
            data: {
              totalDeliveries: { increment: 1 },
              lastDeliveryAt: new Date()
            }
          });
        }

        return updatedOrder;
      });

      res.json({
        success: true,
        data: result,
        message: `Order ${status.toLowerCase()} successfully. ₹${currentOrder.driverEarning} credited to your wallet.`
      });
    } else {
      // Regular status update
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: updateData
      });

      res.json({
        success: true,
        data: updatedOrder,
        message: `Order status updated to ${status.toLowerCase()}`
      });
    }

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
});

/**
 * POST /api/driver/availability
 * Toggle driver online/offline status
 */
router.post('/availability', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user?.id;
    const { isAvailable } = req.body;
    
    if (!driverId) {
      return res.status(401).json({ success: false, message: 'Driver not authenticated' });
    }

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        message: 'isAvailable must be a boolean value' 
      });
    }

    // Check if driver exists and is approved
    const driver = await prisma.driver.findUnique({
      where: { id: driverId }
    });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    if (driver.approvalStatus !== 'APPROVED') {
      return res.status(403).json({ 
        success: false, 
        message: 'Driver not approved for deliveries' 
      });
    }

    // Update driver availability
    const updatedDriver = await prisma.driver.update({
      where: { id: driverId },
      data: {
        isAvailable: isAvailable,
        onlineAt: isAvailable ? new Date() : null
      }
    });

    res.json({
      success: true,
      data: {
        driverId: updatedDriver.id,
        isAvailable: updatedDriver.isAvailable,
        onlineAt: updatedDriver.onlineAt
      },
      message: `Driver is now ${isAvailable ? 'online' : 'offline'}`
    });

  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({ success: false, message: 'Failed to update availability' });
  }
});

/**
 * POST /api/driver/location
 * Update driver's current location (during deliveries)
 */
router.post('/location', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user?.id;
    const { lat, lng } = req.body;
    
    if (!driverId) {
      return res.status(401).json({ success: false, message: 'Driver not authenticated' });
    }

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ 
        success: false, 
        message: 'Latitude and longitude must be numbers' 
      });
    }

    // Update driver location
    const updatedDriver = await prisma.driver.update({
      where: { id: driverId },
      data: {
        currentLat: lat,
        currentLng: lng
      }
    });

    // If driver has an active delivery, also update order tracking
    const activeOrder = await prisma.order.findFirst({
      where: {
        driverId: driverId,
        status: { in: ['PICKED_UP', 'DELIVERING'] }
      }
    });

    if (activeOrder) {
      await prisma.orderTracking.create({
        data: {
          orderId: activeOrder.id,
          driverId: driverId,
          lat: lat,
          lng: lng
        }
      });
    }

    res.json({
      success: true,
      data: {
        driverId: updatedDriver.id,
        currentLat: updatedDriver.currentLat,
        currentLng: updatedDriver.currentLng,
        activeOrderId: activeOrder?.id || null
      },
      message: 'Location updated successfully'
    });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ success: false, message: 'Failed to update location' });
  }
});

/**
 * GET /api/driver/earnings
 * Get driver earnings breakdown by period
 */
router.get('/earnings', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user?.id;
    const { period = 'day' } = req.query;
    
    if (!driverId) {
      return res.status(401).json({ success: false, message: 'Driver not authenticated' });
    }

    // Get driver wallet
    const driverWallet = await prisma.driverWallet.findUnique({
      where: { driverId: driverId }
    });

    if (!driverWallet) {
      return res.status(404).json({ success: false, message: 'Driver wallet not found' });
    }

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // Get earnings for the period
    const earnings = await prisma.walletTransaction.findMany({
      where: {
        driverId: driverId,
        type: 'DRIVER_EARNING',
        status: 'APPROVED',
        createdAt: {
          gte: startDate
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get completed deliveries for the period
    const deliveries = await prisma.order.findMany({
      where: {
        driverId: driverId,
        status: 'DELIVERED',
        deliveredAt: {
          gte: startDate
        }
      },
      include: {
        restaurant: { select: { name: true } }
      }
    });

    const totalEarnings = earnings.reduce((sum, earning) => sum + earning.amount.toNumber(), 0);
    const averagePerDelivery = deliveries.length > 0 ? totalEarnings / deliveries.length : 0;

    res.json({
      success: true,
      data: {
        period: period,
        startDate: startDate,
        endDate: now,
        totalEarnings: totalEarnings,
        deliveryCount: deliveries.length,
        averagePerDelivery: averagePerDelivery,
        walletBalance: driverWallet.balance.toNumber(),
        totalLifetimeEarnings: driverWallet.totalEarnings.toNumber(),
        earnings: earnings,
        deliveries: deliveries
      }
    });

  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch earnings' });
  }
});

/**
 * GET /api/driver/profile
 * Get driver profile and performance stats
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user?.id;
    
    if (!driverId) {
      return res.status(401).json({ success: false, message: 'Driver not authenticated' });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true
          }
        },
        driverWallet: true
      }
    });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found' });
    }

    // Calculate performance metrics
    const totalOrders = await prisma.order.count({
      where: { driverId: driverId }
    });

    const completedOrders = await prisma.order.count({
      where: { 
        driverId: driverId,
        status: 'DELIVERED'
      }
    });

    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 100;

    res.json({
      success: true,
      data: {
        ...driver,
        performance: {
          totalOrders: totalOrders,
          completedOrders: completedOrders,
          completionRate: completionRate,
          avgRating: driver.avgRating || 5.0
        }
      }
    });

  } catch (error) {
    console.error('Get driver profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch driver profile' });
  }
});

/**
 * PUT /api/driver/profile
 * Update driver profile information
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user?.id;
    const { name, vehicleType, vehicleRegistration } = req.body;
    
    if (!driverId) {
      return res.status(401).json({ success: false, message: 'Driver not authenticated' });
    }

    // Update user name if provided
    const updates: any = {};
    if (vehicleType) updates.vehicleType = vehicleType;
    if (vehicleRegistration) updates.vehicleRegistration = vehicleRegistration;

    const updatedDriver = await prisma.$transaction(async (tx) => {
      // Update user name if provided
      if (name) {
        await tx.user.update({
          where: { id: driverId },
          data: { name: name.trim() }
        });
      }

      // Update driver profile
      if (Object.keys(updates).length > 0) {
        return await tx.driver.update({
          where: { id: driverId },
          data: updates,
          include: {
            user: { select: { name: true, phone: true } }
          }
        });
      }

      // If no driver updates, just fetch current data
      return await tx.driver.findUnique({
        where: { id: driverId },
        include: {
          user: { select: { name: true, phone: true } }
        }
      });
    });

    res.json({
      success: true,
      data: updatedDriver,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update driver profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

/**
 * GET /api/driver/orders/active
 * Get driver's currently assigned order
 */
router.get('/orders/active', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user?.id;
    
    if (!driverId) {
      return res.status(401).json({ success: false, message: 'Driver not authenticated' });
    }

    // Get assigned orders (including early assignment during PREPARING/READY)
    const activeOrder = await prisma.order.findFirst({
      where: {
        driverId: driverId,
        status: { in: ['PREPARING', 'READY', 'PICKED_UP', 'DELIVERING'] }
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            lat: true,
            lng: true,
            user: { select: { name: true, phone: true } }
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        orderItems: {
          include: {
            menu: {
              select: {
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
      data: activeOrder,
      hasActiveOrder: !!activeOrder
    });

  } catch (error) {
    console.error('Get active order error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active order' });
  }
});

/**
 * POST /api/driver/approve
 * Approve a driver for testing purposes (should be admin-only in production)
 */
router.post('/approve', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user?.id;
    
    if (!driverId) {
      return res.status(401).json({ success: false, message: 'Driver not authenticated' });
    }

    // Update driver approval status and user status
    const [updatedDriver, updatedUser] = await prisma.$transaction([
      prisma.driver.update({
        where: { id: driverId },
        data: {
          approvalStatus: 'APPROVED',
          isAvailable: true
        }
      }),
      prisma.user.update({
        where: { id: driverId },
        data: {
          status: 'ACTIVE'
        }
      })
    ]);

    res.json({
      success: true,
      data: { 
        driverId: updatedDriver.id,
        approvalStatus: updatedDriver.approvalStatus,
        isAvailable: updatedDriver.isAvailable,
        userStatus: updatedUser.status
      },
      message: 'Driver approved successfully'
    });

  } catch (error) {
    console.error('Driver approval error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve driver' });
  }
});

/**
 * GET /api/driver/debug
 * Get driver debug information
 */
router.get('/debug', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        driverProfile: {
          include: {
            driverWallet: true
          }
        }
      }
    });

    res.json({
      success: true,
      debug: {
        userId: userId,
        userExists: !!user,
        userRole: user?.role,
        userStatus: user?.status,
        hasDriverProfile: !!user?.driverProfile,
        driverApprovalStatus: user?.driverProfile?.approvalStatus,
        driverIsAvailable: user?.driverProfile?.isAvailable,
        hasDriverWallet: !!user?.driverProfile?.driverWallet
      },
      data: user
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Debug failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * GET /api/driver/dashboard
 * Get driver dashboard data (stats, earnings, orders)
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user?.id;
    
    if (!driverId) {
      return res.status(401).json({ success: false, message: 'Driver not authenticated' });
    }

    // Get driver data
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: { select: { name: true } },
        driverWallet: true
      }
    });

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayEarnings, todayDeliveries, weeklyStats, availableOrdersCount] = await Promise.all([
      // Today's earnings
      prisma.walletTransaction.aggregate({
        where: {
          driverId: driverId,
          type: 'DRIVER_EARNING',
          status: 'APPROVED',
          createdAt: { gte: today }
        },
        _sum: { amount: true },
        _count: true
      }),
      
      // Today's completed deliveries
      prisma.order.count({
        where: {
          driverId: driverId,
          status: 'DELIVERED',
          deliveredAt: { gte: today }
        }
      }),
      
      // Weekly stats (last 7 days)
      prisma.walletTransaction.aggregate({
        where: {
          driverId: driverId,
          type: 'DRIVER_EARNING',
          status: 'APPROVED',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        _sum: { amount: true }
      }),
      
      // Available orders count (PREPARING + READY orders)
      prisma.order.count({
        where: {
          status: { in: ['PREPARING', 'READY'] },
          driverId: null
        }
      })
    ]);

    const dashboardData = {
      driver: {
        id: driver.id,
        name: driver.user.name,
        isAvailable: driver.isAvailable,
        onlineAt: driver.onlineAt,
        rating: driver.avgRating || 5.0,
        totalDeliveries: driver.totalDeliveries,
        approvalStatus: driver.approvalStatus
      },
      todayStats: {
        earnings: todayEarnings._sum.amount?.toNumber() || 0,
        deliveries: todayDeliveries,
        onlineTime: driver.onlineAt ? 
          Math.floor((Date.now() - driver.onlineAt.getTime()) / (1000 * 60)) : 0 // minutes
      },
      weeklyStats: {
        earnings: weeklyStats._sum.amount?.toNumber() || 0
      },
      wallet: {
        balance: driver.driverWallet?.balance.toNumber() || 0,
        totalEarnings: driver.driverWallet?.totalEarnings.toNumber() || 0,
        canWithdraw: driver.driverWallet?.canWithdraw || false
      },
      availableOrdersCount: availableOrdersCount
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
});

/**
 * GET /api/driver/orders/history
 * Get driver's completed orders history
 */
router.get('/orders/history', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;
    
    if (!driverId) {
      return res.status(401).json({ success: false, message: 'Driver not authenticated' });
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;

    // Get completed orders for this driver
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: {
          driverId: driverId,
          status: 'DELIVERED' // Only completed orders
        },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
              logoUrl: true
            }
          },
          customer: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          },
          orderItems: {
            include: {
              menu: {
                select: {
                  itemName: true,
                  price: true,
                  imageUrl: true
                }
              }
            }
          }
        },
        orderBy: { deliveredAt: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.order.count({
        where: {
          driverId: driverId,
          status: 'DELIVERED'
        }
      })
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: {
        orders: orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalCount: totalCount,
          totalPages: totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order history' });
  }
});

/**
 * GET /api/driver/wallet
 * Get driver wallet details and transactions
 */
router.get('/wallet', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user?.id;
    
    if (!driverId) {
      return res.status(401).json({ success: false, message: 'Driver not authenticated' });
    }

    // Get or create driver wallet
    const driverWallet = await prisma.driverWallet.upsert({
      where: { driverId: driverId },
      create: { 
        driverId: driverId,
        balance: 0.00,
        totalEarnings: 0.00,
        collateralAmount: 0.00
      },
      update: {}
    });

    // Get recent transactions
    const transactions = await prisma.walletTransaction.findMany({
      where: { driverId: driverId },
      orderBy: { createdAt: 'desc' },
      take: 20 // Last 20 transactions
    });

    res.json({
      success: true,
      data: {
        wallet: driverWallet,
        transactions: transactions
      }
    });

  } catch (error) {
    console.error('Get driver wallet error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch wallet data' });
  }
});

/**
 * POST /api/driver/wallet/withdraw
 * Request withdrawal from driver wallet
 */
router.post('/wallet/withdraw', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user?.id;
    const { amount } = req.body;
    
    if (!driverId) {
      return res.status(401).json({ success: false, message: 'Driver not authenticated' });
    }

    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid withdrawal amount' 
      });
    }

    // Get driver wallet
    const driverWallet = await prisma.driverWallet.findUnique({
      where: { driverId: driverId }
    });

    if (!driverWallet) {
      return res.status(404).json({ success: false, message: 'Driver wallet not found' });
    }

    if (!driverWallet.canWithdraw) {
      return res.status(403).json({ 
        success: false, 
        message: 'Withdrawal not allowed. Please complete minimum deliveries.' 
      });
    }

    if (driverWallet.balance.toNumber() < withdrawAmount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance for withdrawal' 
      });
    }

    // Create withdrawal transaction (pending admin approval)
    const withdrawalTransaction = await prisma.walletTransaction.create({
      data: {
        driverId: driverId,
        amount: withdrawAmount,
        type: 'DRIVER_WITHDRAWAL',
        status: 'PENDING',
        description: `Withdrawal request for ₹${withdrawAmount}`
      }
    });

    res.json({
      success: true,
      data: withdrawalTransaction,
      message: 'Withdrawal request submitted. Pending admin approval.'
    });

  } catch (error) {
    console.error('Driver withdrawal error:', error);
    res.status(500).json({ success: false, message: 'Failed to process withdrawal request' });
  }
});

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export default router;
