"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const walletService_1 = __importDefault(require("../services/walletService"));
const restaurantWalletService_1 = __importDefault(require("../services/restaurantWalletService"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Get user orders
router.get('/user', auth_1.authenticateToken, async (req, res) => {
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
    }
    catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch orders' });
    }
});
// Get order by ID
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
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
    }
    catch (error) {
        console.error('Get order by ID error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch order' });
    }
});
// Create new order
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        console.log('🚀 CREATE ORDER - Full Debug Info:');
        console.log('👤 User ID:', userId);
        console.log('📋 Request Body:', JSON.stringify(req.body, null, 2));
        if (!userId) {
            console.error('❌ User not authenticated');
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        const { restaurantId, items, totalPrice, deliveryFee, deliveryAddress, deliveryLat = 34.0522, // Default LA coordinates
        deliveryLng = -118.2437, deliveryInstructions, paymentMethod } = req.body;
        console.log('🏪 Restaurant ID:', restaurantId);
        console.log('🛒 Items:', JSON.stringify(items, null, 2));
        console.log('💰 Payment Method:', paymentMethod);
        console.log('💸 Total Price:', totalPrice);
        console.log('💸 Delivery Fee:', deliveryFee);
        // Validate required fields
        console.log('🔍 Starting validation...');
        console.log('🔍 restaurantId:', restaurantId, 'type:', typeof restaurantId);
        console.log('🔍 items:', items, 'isArray:', Array.isArray(items), 'length:', items?.length);
        console.log('🔍 deliveryAddress:', deliveryAddress);
        console.log('🔍 totalPrice:', totalPrice, 'type:', typeof totalPrice);
        console.log('🔍 paymentMethod:', paymentMethod);
        if (!restaurantId || !items || !Array.isArray(items) || items.length === 0) {
            console.error('❌ Validation failed: Restaurant ID and items are required');
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID and items are required'
            });
        }
        if (!deliveryAddress || !totalPrice || !paymentMethod) {
            console.error('❌ Validation failed: Delivery address, total price, and payment method are required');
            return res.status(400).json({
                success: false,
                message: 'Delivery address, total price, and payment method are required'
            });
        }
        console.log('✅ Basic validation passed');
        // Verify restaurant exists and get commission rate
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: restaurantId },
            select: {
                id: true,
                name: true,
                address: true,
                lat: true,
                lng: true,
                commissionRate: true
            }
        });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }
        // Calculate pricing structure
        const itemsSubtotal = parseFloat(totalPrice.toString()); // Current totalPrice from frontend is actually items subtotal
        const deliveryFeeAmount = parseFloat(deliveryFee?.toString() || '0');
        const newTotalPrice = itemsSubtotal + deliveryFeeAmount; // True total = items + delivery
        const restaurantCommission = itemsSubtotal * (restaurant.commissionRate.toNumber() / 100);
        const deliveryCommissionAmount = deliveryFeeAmount * 0.1; // 10% of delivery fee
        const platformEarningsAmount = restaurantCommission + deliveryCommissionAmount;
        console.log('💰 PRICING BREAKDOWN:');
        console.log('📦 Items Subtotal:', itemsSubtotal);
        console.log('🚚 Delivery Fee:', deliveryFeeAmount);
        console.log('💳 New Total Price:', newTotalPrice);
        console.log('🏪 Restaurant Commission ({}%):', restaurant.commissionRate.toNumber(), restaurantCommission);
        console.log('📦 Delivery Commission (10%):', deliveryCommissionAmount);
        console.log('💼 Platform Earnings:', platformEarningsAmount);
        // Handle wallet payment if selected
        if (paymentMethod.toUpperCase() === 'WALLET') {
            // Check wallet balance against the TRUE total (items + delivery)
            const balanceCheck = await walletService_1.default.checkSufficientBalance(userId, newTotalPrice);
            if (!balanceCheck.success || !balanceCheck.data?.hasSufficientBalance) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient wallet balance. Please top up your wallet.',
                    currentBalance: balanceCheck.data?.currentBalance || 0,
                    requiredAmount: newTotalPrice
                });
            }
        }
        // Create order with order items in a transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create the order with NEW PRICING STRUCTURE
            const newOrder = await tx.order.create({
                data: {
                    customerId: userId,
                    restaurantId,
                    // NEW PRICING FIELDS
                    itemsSubtotal: itemsSubtotal,
                    deliveryFee: deliveryFeeAmount,
                    totalPrice: newTotalPrice, // itemsSubtotal + deliveryFee
                    // COMMISSION FIELDS
                    restaurantCommission: restaurantCommission, // Restaurant commission (15%)
                    deliveryCommission: deliveryCommissionAmount, // Delivery commission (10%)
                    platformEarnings: platformEarningsAmount, // Total company earnings
                    // Pickup address (from restaurant)
                    pickupAddress: restaurant.address,
                    pickupLat: restaurant.lat,
                    pickupLng: restaurant.lng,
                    // Delivery address (from customer)
                    deliveryAddress,
                    deliveryLat: parseFloat(deliveryLat.toString()),
                    deliveryLng: parseFloat(deliveryLng.toString()),
                    deliveryInstructions: deliveryInstructions || null,
                    // Driver earnings (90% of delivery fee)
                    driverEarning: deliveryFeeAmount * 0.9,
                    paymentMethod: paymentMethod.toUpperCase(),
                    paymentStatus: 'PENDING',
                    status: 'PENDING'
                }
            });
            // Create order items
            const orderItems = await Promise.all(items.map((item) => tx.orderItem.create({
                data: {
                    orderId: newOrder.id,
                    menuId: item.menuId,
                    quantity: parseInt(item.quantity.toString()),
                    price: parseFloat(item.price.toString())
                }
            })));
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
        // Schedule escrow processing after 1 minute (for wallet payments)
        if (paymentMethod.toUpperCase() === 'WALLET') {
            console.log(`\ud83d\udd52 Scheduling escrow processing for order ${order.id} in 1 minute...`);
            setTimeout(async () => {
                try {
                    console.log(`\ud83d\udcb0 Processing escrow payment for order ${order.id}...`);
                    const escrowPaymentService = (await Promise.resolve().then(() => __importStar(require('../services/escrowPaymentService')))).default;
                    const result = await escrowPaymentService.processEscrowPayment(order.id);
                    if (result.success) {
                        console.log(`\u2705 Escrow payment processed for order ${order.id}:`, result.message);
                    }
                    else {
                        console.error(`\u274c Failed to process escrow payment for order ${order.id}:`, result.message);
                    }
                }
                catch (error) {
                    console.error(`\u274c Error processing escrow payment for order ${order.id}:`, error);
                }
            }, process.env.NODE_ENV === 'development' ? 10000 : 60000); // 10 seconds in dev, 1 minute in production
        }
        res.status(201).json({
            success: true,
            data: completeOrder,
            message: 'Order created successfully'
        });
    }
    catch (error) {
        console.error('❌ CREATE ORDER ERROR - Full Debug Info:');
        console.error('🔴 Error Object:', error);
        console.error('🔴 Error Message:', error instanceof Error ? error.message : 'Unknown error');
        console.error('🔴 Error Stack:', error instanceof Error ? error.stack : 'No stack trace');
        res.status(500).json({ success: false, message: 'Failed to create order' });
    }
});
// Process wallet payment for order
router.post('/:id/pay-wallet', auth_1.authenticateToken, async (req, res) => {
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
        // With NEW PRICING STRUCTURE: totalPrice already includes delivery fee
        const totalAmount = order.totalPrice.toNumber();
        console.log('💳 WALLET PAYMENT DEBUG:');
        console.log('📦 Items Subtotal:', order.itemsSubtotal?.toNumber() || 0);
        console.log('🚚 Delivery Fee:', order.deliveryFee.toNumber());
        console.log('💰 Total Amount (to deduct):', totalAmount);
        // Process wallet payment
        const paymentResult = await walletService_1.default.processCustomerPayment(userId, totalAmount, orderId);
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
    }
    catch (error) {
        console.error('Process wallet payment error:', error);
        res.status(500).json({ success: false, message: 'Failed to process wallet payment' });
    }
});
// NOTE: Order cancellation is handled by the escrow system
// Use POST /api/escrow-orders/:id/cancel for cancellation
// Mark order as delivered (for drivers)
router.patch('/:id/deliver', auth_1.authenticateToken, async (req, res) => {
    try {
        const driverId = req.user?.id;
        const orderId = parseInt(req.params.id);
        if (!driverId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        // Get order details with restaurant info
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                driverId: driverId,
                status: 'DELIVERING'
            },
            include: {
                restaurant: true,
                customer: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or cannot be marked as delivered'
            });
        }
        // Calculate amounts with NEW PRICING STRUCTURE
        const totalOrderAmount = order.totalPrice.toNumber(); // Already includes delivery fee
        const itemsSubtotal = order.itemsSubtotal?.toNumber() || 0;
        const restaurantCommission = order.restaurantCommission.toNumber();
        const deliveryCommission = order.deliveryCommission.toNumber();
        const platformEarnings = order.platformEarnings.toNumber();
        const restaurantEarning = itemsSubtotal - restaurantCommission;
        const driverEarning = order.driverEarning.toNumber(); // Use calculated value from order
        console.log('💰 DELIVERY PAYMENT BREAKDOWN:');
        console.log('📦 Items Subtotal:', itemsSubtotal);
        console.log('🚚 Delivery Fee:', order.deliveryFee.toNumber());
        console.log('💳 Total Order Amount:', totalOrderAmount);
        console.log('🏪 Restaurant Commission:', restaurantCommission);
        console.log('📦 Delivery Commission:', deliveryCommission);
        console.log('💼 Platform Earnings:', platformEarnings);
        console.log('🏪 Restaurant Earning:', restaurantEarning);
        console.log('🚚 Driver Earning:', driverEarning);
        // Process all payments on delivery in a single transaction
        const result = await prisma.$transaction(async (tx) => {
            // Mark order as delivered first
            const deliveredOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'DELIVERED',
                    deliveredAt: new Date(),
                    paymentStatus: order.paymentMethod === 'WALLET' ? 'PAID' : order.paymentStatus
                }
            });
            // If wallet payment, process customer wallet deduction
            if (order.paymentMethod === 'WALLET') {
                const customerPayment = await walletService_1.default.processCustomerPayment(order.customerId, totalOrderAmount, orderId);
                if (!customerPayment.success) {
                    throw new Error(`Customer wallet payment failed: ${customerPayment.message}`);
                }
            }
            // Credit restaurant wallet (items subtotal - restaurant commission)
            if (restaurantEarning > 0) {
                const restaurantCredit = await restaurantWalletService_1.default.addRestaurantEarning(order.restaurantId, itemsSubtotal, restaurantCommission, orderId);
                if (!restaurantCredit.success) {
                    throw new Error(`Restaurant wallet credit failed: ${restaurantCredit.message}`);
                }
            }
            // Credit driver wallet (90% of delivery fee)
            if (driverEarning > 0) {
                const driverCredit = await walletService_1.default.addDriverEarning(driverId, driverEarning, orderId);
                if (!driverCredit.success) {
                    throw new Error(`Driver wallet credit failed: ${driverCredit.message}`);
                }
            }
            return deliveredOrder;
        });
        res.json({
            success: true,
            data: {
                order: result,
                paymentBreakdown: {
                    totalAmount: totalOrderAmount,
                    itemsSubtotal: itemsSubtotal,
                    deliveryFee: order.deliveryFee.toNumber(),
                    restaurantEarning: restaurantEarning,
                    restaurantCommission: restaurantCommission,
                    deliveryCommission: deliveryCommission,
                    platformEarnings: platformEarnings,
                    driverEarning: driverEarning
                }
            },
            message: `Order delivered successfully! Payments processed: Restaurant ₹${restaurantEarning.toFixed(2)}, Driver ₹${driverEarning.toFixed(2)}, Platform Earnings ₹${platformEarnings.toFixed(2)}`
        });
    }
    catch (error) {
        console.error('Deliver order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark order as delivered',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Manual escrow processing endpoint for testing
router.post('/:id/process-escrow-manual', auth_1.authenticateToken, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        // Verify order belongs to customer (for testing)
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                customerId: userId
            }
        });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        // Import and use escrow service
        const escrowPaymentService = (await Promise.resolve().then(() => __importStar(require('../services/escrowPaymentService')))).default;
        const result = await escrowPaymentService.processEscrowPayment(orderId);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json({
            success: true,
            data: result.data,
            message: result.message
        });
    }
    catch (error) {
        console.error('Manual escrow processing error:', error);
        res.status(500).json({ success: false, message: 'Failed to process escrow payment' });
    }
});
exports.default = router;
//# sourceMappingURL=order.js.map