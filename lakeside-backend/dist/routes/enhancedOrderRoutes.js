"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const paymentDistributionService_1 = __importDefault(require("../services/paymentDistributionService"));
const router = (0, express_1.Router)();
/**
 * ENHANCED PAYMENT TRIGGERS
 * Following industry best practices from DoorDash, Uber, Swiggy models
 */
// 1. TRIGGER: Order Placement (DoorDash Model)
// Customer is charged immediately when order is placed
router.post('/:id/charge-customer', auth_1.authenticateToken, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        const result = await paymentDistributionService_1.default.processOrderPlacement(orderId);
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
        console.error('Charge customer error:', error);
        res.status(500).json({ success: false, message: 'Failed to charge customer' });
    }
});
// 2. TRIGGER: Order Confirmation (Swiggy Model)
// Restaurant is credited immediately when they accept the order
router.post('/:id/credit-restaurant', auth_1.authenticateToken, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        const result = await paymentDistributionService_1.default.processOrderConfirmation(orderId);
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
        console.error('Credit restaurant error:', error);
        res.status(500).json({ success: false, message: 'Failed to credit restaurant' });
    }
});
// 3. TRIGGER: Order Delivery (Your Current Model)
// Driver is credited when order is delivered
router.post('/:id/credit-driver', auth_1.authenticateToken, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const driverId = req.user?.id;
        if (!driverId) {
            return res.status(401).json({ success: false, message: 'Driver not authenticated' });
        }
        const result = await paymentDistributionService_1.default.processOrderDelivery(orderId, driverId);
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
        console.error('Credit driver error:', error);
        res.status(500).json({ success: false, message: 'Failed to credit driver' });
    }
});
// 4. TRIGGER: Batch Settlement (Enterprise Model)
// Admin can process multiple orders in batches
router.post('/batch-settlement', auth_1.authenticateToken, async (req, res) => {
    try {
        const { orderIds } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Order IDs array is required' });
        }
        const result = await paymentDistributionService_1.default.processBatchSettlement(orderIds);
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
        console.error('Batch settlement error:', error);
        res.status(500).json({ success: false, message: 'Failed to process batch settlement' });
    }
});
// REFUND ENDPOINTS
// Full Refund
router.post('/:id/refund', auth_1.authenticateToken, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { reason } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        if (!reason) {
            return res.status(400).json({ success: false, message: 'Refund reason is required' });
        }
        const result = await paymentDistributionService_1.default.processRefund(orderId, reason);
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
        console.error('Refund error:', error);
        res.status(500).json({ success: false, message: 'Failed to process refund' });
    }
});
// Partial Refund
router.post('/:id/partial-refund', auth_1.authenticateToken, async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { amount, reason } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        if (!amount || !reason) {
            return res.status(400).json({ success: false, message: 'Amount and reason are required' });
        }
        const result = await paymentDistributionService_1.default.processPartialRefund(orderId, parseFloat(amount), reason);
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
        console.error('Partial refund error:', error);
        res.status(500).json({ success: false, message: 'Failed to process partial refund' });
    }
});
exports.default = router;
//# sourceMappingURL=enhancedOrderRoutes.js.map