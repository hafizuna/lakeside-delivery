"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRestaurantAnalytics = exports.getOrderDetails = exports.updateOrderStatus = exports.getRestaurantOrders = void 0;
const client_1 = require("@prisma/client");
const socketService_1 = __importDefault(require("../services/socketService"));
const assignmentTriggerService_1 = __importDefault(require("../services/assignmentTriggerService"));
const prisma = new client_1.PrismaClient();
/**
 * Get Restaurant Orders
 */
const getRestaurantOrders = async (req, res) => {
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
        const whereClause = {
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
            take: parseInt(limit),
            skip: parseInt(offset),
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
    }
    catch (error) {
        console.error('Get restaurant orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
        });
    }
};
exports.getRestaurantOrders = getRestaurantOrders;
/**
 * Update Order Status
 */
const updateOrderStatus = async (req, res) => {
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
        // Update order status with proper timestamp fields
        const updateData = {
            status,
            updatedAt: new Date(),
        };
        // Set appropriate timestamp fields based on status
        switch (status) {
            case 'ACCEPTED':
                updateData.acceptedAt = new Date();
                break;
            case 'PREPARING':
                updateData.preparingAt = new Date();
                break;
            case 'READY':
                updateData.readyAt = new Date();
                break;
            case 'PICKED_UP':
                updateData.pickedUpAt = new Date();
                break;
            case 'DELIVERED':
                updateData.deliveredAt = new Date();
                break;
        }
        console.log(`📝 [ORDER-UPDATE] Updating order ${id} to status: ${status}`);
        console.log(`📝 [ORDER-UPDATE] Update data:`, updateData);
        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(id) },
            data: updateData,
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
        socketService_1.default.emitOrderUpdate(updatedOrder, `Order status updated to ${status}`);
        console.log('📡 Socket event emitted for order status update:', {
            orderId: updatedOrder.id,
            newStatus: status,
            customerId: updatedOrder.customerId
        });
        // 🎯 HYBRID ASSIGNMENT SYSTEM: Trigger assignment process for relevant status changes
        console.log(`🎯 [ORDER-UPDATE] About to call assignment trigger service...`);
        console.log(`🎯 [ORDER-UPDATE] Order ID: ${updatedOrder.id}`);
        console.log(`🎯 [ORDER-UPDATE] New Status: ${status}`);
        console.log(`🎯 [ORDER-UPDATE] Previous Status: ${existingOrder.status}`);
        console.log(`🎯 [ORDER-UPDATE] Current timestamp: ${new Date().toISOString()}`);
        try {
            const assignmentResult = await assignmentTriggerService_1.default.handleOrderStatusChange(updatedOrder.id, status, existingOrder.status);
            console.log(`🎯 [ORDER-UPDATE] Assignment trigger completed with result:`, assignmentResult);
            if (assignmentResult.success) {
                console.log('🚀 [ORDER-UPDATE] Assignment trigger successful:', assignmentResult.message);
            }
            else {
                console.log('⚠️ [ORDER-UPDATE] Assignment trigger info:', assignmentResult.message);
            }
        }
        catch (assignmentError) {
            console.error('❌ [ORDER-UPDATE] Assignment trigger error (non-blocking):', assignmentError);
            console.error('❌ [ORDER-UPDATE] Error stack:', assignmentError instanceof Error ? assignmentError.stack : 'No stack trace');
            // Don't fail the order status update if assignment trigger fails
        }
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
    }
    catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status',
        });
    }
};
exports.updateOrderStatus = updateOrderStatus;
/**
 * Get Order Details
 */
const getOrderDetails = async (req, res) => {
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
    }
    catch (error) {
        console.error('Get order details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order details',
        });
    }
};
exports.getOrderDetails = getOrderDetails;
/**
 * Get Restaurant Analytics
 */
const getRestaurantAnalytics = async (req, res) => {
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
        let startDate;
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
    }
    catch (error) {
        console.error('Get restaurant analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics',
        });
    }
};
exports.getRestaurantAnalytics = getRestaurantAnalytics;
//# sourceMappingURL=ordersController.js.map