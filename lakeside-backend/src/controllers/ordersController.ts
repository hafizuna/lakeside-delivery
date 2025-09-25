import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types/auth';
import socketService from '../services/socketService';

const prisma = new PrismaClient();

/**
 * Get Restaurant Orders
 */
export const getRestaurantOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { status, limit = '20', offset = '0' } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Get restaurant profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurantProfile: true },
    });

    if (!user || !user.restaurantProfile) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found',
      });
    }

    // Build where clause
    const whereClause: any = {
      restaurantId: user.restaurantProfile.id,
    };

    if (status && typeof status === 'string') {
      whereClause.status = status;
    }

    // Get orders with order items and customer info
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        orderItems: {
          include: {
            menu: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    // Transform orders to include calculated fields
    const transformedOrders = orders.map(order => ({
      ...order,
      totalPrice: Number(order.totalPrice),
      deliveryFee: Number(order.deliveryFee),
      orderItems: order.orderItems.map(item => ({
        ...item,
        price: Number(item.price),
        menu: item.menu ? {
          ...item.menu,
          price: Number(item.menu.price),
        } : null,
      })),
    }));

    res.json({
      success: true,
      data: transformedOrders,
    });
  } catch (error) {
    console.error('Get restaurant orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
    });
  }
};

/**
 * Update Order Status
 */
export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Validate status
    const validStatuses = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERING', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status',
      });
    }

    // Get restaurant profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurantProfile: true },
    });

    if (!user || !user.restaurantProfile) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found',
      });
    }

    // Check if order belongs to this restaurant
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: parseInt(id),
        restaurantId: user.restaurantProfile.id,
      },
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { 
        status,
        updatedAt: new Date(),
      },
      include: {
        orderItems: {
          include: {
            menu: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Emit real-time order status update
    socketService.emitOrderUpdate(updatedOrder, `Order status updated to ${status}`);
    console.log('📡 Socket event emitted for order status update:', {
      orderId: updatedOrder.id,
      newStatus: status,
      customerId: updatedOrder.customerId
    });

    // Transform order to include calculated fields
    const transformedOrder = {
      ...updatedOrder,
      totalPrice: Number(updatedOrder.totalPrice),
      deliveryFee: Number(updatedOrder.deliveryFee),
      orderItems: updatedOrder.orderItems.map(item => ({
        ...item,
        price: Number(item.price),
        menu: item.menu ? {
          ...item.menu,
          price: Number(item.menu.price),
        } : null,
      })),
    };

    res.json({
      success: true,
      data: transformedOrder,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
    });
  }
};

/**
 * Get Order Details
 */
export const getOrderDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Get restaurant profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurantProfile: true },
    });

    if (!user || !user.restaurantProfile) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found',
      });
    }

    // Get order details
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(id),
        restaurantId: user.restaurantProfile.id,
      },
      include: {
        orderItems: {
          include: {
            menu: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Transform order to include calculated fields
    const transformedOrder = {
      ...order,
      totalPrice: Number(order.totalPrice),
      deliveryFee: Number(order.deliveryFee),
      orderItems: order.orderItems.map(item => ({
        ...item,
        price: Number(item.price),
        menu: item.menu ? {
          ...item.menu,
          price: Number(item.menu.price),
        } : null,
      })),
    };

    res.json({
      success: true,
      data: transformedOrder,
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
    });
  }
};

/**
 * Get Restaurant Analytics
 */
export const getRestaurantAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { period = 'week' } = req.query; // week, month, year

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Get restaurant profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurantProfile: true },
    });

    if (!user || !user.restaurantProfile) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant profile not found',
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // week
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get analytics data
    const [totalOrders, totalRevenue, avgOrderValue] = await Promise.all([
      // Total orders in period
      prisma.order.count({
        where: {
          restaurantId: user.restaurantProfile.id,
          createdAt: {
            gte: startDate,
          },
          status: {
            not: 'CANCELLED',
          },
        },
      }),
      
      // Total revenue in period
      prisma.order.aggregate({
        where: {
          restaurantId: user.restaurantProfile.id,
          createdAt: {
            gte: startDate,
          },
          status: {
            not: 'CANCELLED',
          },
        },
        _sum: {
          totalPrice: true,
        },
      }),
      
      // Average order value
      prisma.order.aggregate({
        where: {
          restaurantId: user.restaurantProfile.id,
          createdAt: {
            gte: startDate,
          },
          status: {
            not: 'CANCELLED',
          },
        },
        _avg: {
          totalPrice: true,
        },
      }),
    ]);

    // Get order status breakdown
    const orderStatusBreakdown = await prisma.order.groupBy({
      by: ['status'],
      where: {
        restaurantId: user.restaurantProfile.id,
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        status: true,
      },
    });

    res.json({
      success: true,
      data: {
        period,
        totalOrders,
        totalRevenue: Number(totalRevenue._sum.totalPrice || 0),
        avgOrderValue: Number(avgOrderValue._avg.totalPrice || 0),
        orderStatusBreakdown: orderStatusBreakdown.map(item => ({
          status: item.status,
          count: item._count.status,
        })),
      },
    });
  } catch (error) {
    console.error('Get restaurant analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
    });
  }
};
