"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const hybridAssignmentService_1 = __importDefault(require("../services/hybridAssignmentService"));
const maintenanceService_1 = __importDefault(require("../services/maintenanceService"));
const driverDashboardService_1 = __importDefault(require("../services/driverDashboardService"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * HYBRID DRIVER ASSIGNMENT ROUTES
 *
 * These are the NEW enhanced APIs for TTL-based assignment system.
 * They work alongside existing driver routes for full backwards compatibility.
 */
// =====================================================
// DRIVER STATE MANAGEMENT
// =====================================================
/**
 * POST /api/driver/assignments/state
 * Update driver online state and availability
 */
router.post('/state', auth_1.authenticateToken, async (req, res) => {
    try {
        const driverId = req.user?.id;
        if (!driverId) {
            return res.status(401).json({ success: false, message: 'Driver not authenticated' });
        }
        const updates = req.body;
        const result = await hybridAssignmentService_1.default.updateDriverState(driverId, updates);
        if (result.success && result.driverState) {
            res.json({
                success: true,
                message: result.message,
                driverState: {
                    driverId: result.driverState.driverId,
                    isOnline: result.driverState.isOnline,
                    activeAssignmentsCount: result.driverState.activeAssignmentsCount,
                    maxConcurrentAssignments: result.driverState.maxConcurrentAssignments,
                    canAcceptNewAssignments: result.driverState.activeAssignmentsCount < result.driverState.maxConcurrentAssignments,
                    currentZone: result.driverState.currentZoneId ? {
                        zoneId: result.driverState.currentZoneId,
                        name: 'Zone Info' // TODO: Fetch from geofence table
                    } : null,
                    lastHeartbeat: result.driverState.lastHeartbeatAt,
                }
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }
    }
    catch (error) {
        console.error('Update driver state error:', error);
        res.status(500).json({ success: false, message: 'Failed to update driver state' });
    }
});
/**
 * POST /api/driver/assignments/heartbeat
 * Process driver heartbeat and location update
 */
router.post('/heartbeat', auth_1.authenticateToken, async (req, res) => {
    try {
        const driverId = req.user?.id;
        if (!driverId) {
            return res.status(401).json({ success: false, message: 'Driver not authenticated' });
        }
        const heartbeatData = {
            driverId,
            ...req.body
        };
        const result = await hybridAssignmentService_1.default.processDriverHeartbeat(heartbeatData);
        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                timestamp: new Date(),
                nextHeartbeatIn: 60 // seconds
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }
    }
    catch (error) {
        console.error('Process heartbeat error:', error);
        res.status(500).json({ success: false, message: 'Failed to process heartbeat' });
    }
});
// =====================================================
// TTL OFFERS AND ASSIGNMENTS
// =====================================================
/**
 * GET /api/driver/assignments/offers
 * Get current TTL offers for the driver
 */
router.get('/offers', auth_1.authenticateToken, async (req, res) => {
    try {
        const driverId = req.user?.id;
        if (!driverId) {
            return res.status(401).json({ success: false, message: 'Driver not authenticated' });
        }
        const result = await hybridAssignmentService_1.default.getDriverOffers(driverId);
        if (result.success) {
            res.json({
                success: true,
                offers: result.offers,
                count: result.offers.length,
                timestamp: new Date()
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Failed to fetch offers',
                offers: []
            });
        }
    }
    catch (error) {
        console.error('Get driver offers error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch offers' });
    }
});
/**
 * POST /api/driver/assignments/offers/:assignmentId/accept
 * Accept a TTL assignment offer (atomic operation)
 */
router.post('/offers/:assignmentId/accept', auth_1.authenticateToken, async (req, res) => {
    try {
        const driverId = req.user?.id;
        const assignmentId = req.params.assignmentId;
        if (!driverId) {
            return res.status(401).json({ success: false, message: 'Driver not authenticated' });
        }
        const acceptRequest = {
            assignmentId,
            driverId
        };
        const result = await hybridAssignmentService_1.default.acceptOffer(acceptRequest);
        if (result.success) {
            // Fetch complete order details for the frontend
            const orderDetails = await prisma.order.findUnique({
                where: { id: result.assignment.orderId },
                include: {
                    restaurant: true,
                    customer: true,
                    orderItems: {
                        include: {
                            menu: true
                        }
                    }
                }
            });
            if (!orderDetails) {
                return res.status(500).json({
                    success: false,
                    message: 'Assignment accepted but order details not found',
                    timestamp: new Date()
                });
            }
            // Format order data to match what the frontend expects
            const orderData = {
                id: orderDetails.id,
                orderNumber: `ORD-${orderDetails.id.toString().padStart(6, '0')}`,
                restaurantId: orderDetails.restaurantId,
                restaurantName: orderDetails.restaurant.name,
                restaurantAddress: orderDetails.restaurant.address,
                restaurantLat: orderDetails.restaurant.lat?.toNumber() || 0,
                restaurantLng: orderDetails.restaurant.lng?.toNumber() || 0,
                customerId: orderDetails.customerId,
                customerName: orderDetails.customer.name,
                customerPhone: orderDetails.customer.phone,
                deliveryAddress: orderDetails.deliveryAddress,
                deliveryLat: orderDetails.deliveryLat?.toNumber() || 0,
                deliveryLng: orderDetails.deliveryLng?.toNumber() || 0,
                items: orderDetails.orderItems.map(item => ({
                    id: item.id,
                    itemName: item.menu?.itemName || 'Unknown Item',
                    quantity: item.quantity,
                    price: item.price.toNumber(),
                    specialInstructions: '' // OrderItem model doesn't have this field
                })),
                totalAmount: orderDetails.totalPrice.toNumber(),
                deliveryFee: orderDetails.deliveryFee.toNumber(),
                driverEarning: orderDetails.driverEarning.toNumber(),
                tip: 0, // Tips are usually added after delivery
                status: orderDetails.status,
                estimatedPickupTime: orderDetails.estimatedPickupTime,
                estimatedDeliveryTime: orderDetails.estimatedDeliveryTime,
                createdAt: orderDetails.createdAt
            };
            res.json({
                success: true,
                message: 'Assignment accepted successfully!',
                data: orderData, // This is what the frontend expects
                assignment: {
                    assignmentId: result.assignment.id,
                    orderId: result.assignment.orderId,
                    status: result.assignment.status,
                    acceptedAt: result.assignment.acceptedAt,
                },
                stats: {
                    otherOffersExpired: result.otherAssignmentsExpired,
                    orderUpdated: result.orderUpdated,
                    driverStateUpdated: result.driverStateUpdated
                }
            });
        }
        else {
            // Handle specific error cases with appropriate HTTP status codes
            let statusCode = 400;
            const errorMessage = result.assignment.toString(); // This will contain the error from the service
            if (errorMessage.includes('expired')) {
                statusCode = 410; // Gone
            }
            else if (errorMessage.includes('already assigned')) {
                statusCode = 409; // Conflict
            }
            else if (errorMessage.includes('not found')) {
                statusCode = 404; // Not Found
            }
            res.status(statusCode).json({
                success: false,
                message: 'Failed to accept assignment',
                reason: errorMessage || 'Unknown error occurred',
                timestamp: new Date()
            });
        }
    }
    catch (error) {
        console.error('Accept offer error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to accept assignment',
            error: 'Internal server error'
        });
    }
});
/**
 * POST /api/driver/assignments/offers/:assignmentId/decline
 * Decline a TTL assignment offer
 */
router.post('/offers/:assignmentId/decline', auth_1.authenticateToken, async (req, res) => {
    try {
        const driverId = req.user?.id;
        const assignmentId = req.params.assignmentId;
        const { reason } = req.body;
        if (!driverId) {
            return res.status(401).json({ success: false, message: 'Driver not authenticated' });
        }
        const result = await hybridAssignmentService_1.default.declineOffer(assignmentId, driverId, reason);
        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                data: result.assignment, // Add data property for consistency with frontend expectations
                assignment: result.assignment,
                timestamp: new Date()
            });
        }
        else {
            // Handle specific error cases
            let statusCode = 400;
            if (result.message.includes('not found')) {
                statusCode = 404;
            }
            else if (result.message.includes('expired')) {
                statusCode = 410; // Gone
            }
            else if (result.message.includes('already')) {
                statusCode = 409; // Conflict
            }
            res.status(statusCode).json({
                success: false,
                message: result.message,
                timestamp: new Date()
            });
        }
    }
    catch (error) {
        console.error('Decline offer error:', error);
        res.status(500).json({ success: false, message: 'Failed to decline assignment' });
    }
});
// =====================================================
// UTILITY AND ADMIN ENDPOINTS
// =====================================================
/**
 * GET /api/driver/assignments/availability
 * Get driver's current availability status
 */
router.get('/availability', auth_1.authenticateToken, async (req, res) => {
    try {
        const driverId = req.user?.id;
        if (!driverId) {
            return res.status(401).json({ success: false, message: 'Driver not authenticated' });
        }
        // This could be enhanced to use the service, but for now we'll use a simple query
        // TODO: Implement getDriverAvailability in service
        res.json({
            success: true,
            availability: {
                driverId,
                isOnline: true, // TODO: Get from driver state
                activeAssignmentsCount: 0,
                maxConcurrentAssignments: 1,
                canAcceptNewAssignments: true,
                lastHeartbeat: new Date(),
                currentZone: null
            },
            message: 'Availability status retrieved successfully'
        });
    }
    catch (error) {
        console.error('Get availability error:', error);
        res.status(500).json({ success: false, message: 'Failed to get availability status' });
    }
});
/**
 * POST /api/driver/assignments/cleanup-expired
 * Manual cleanup of expired assignments (admin/debugging)
 */
router.post('/cleanup-expired', auth_1.authenticateToken, async (req, res) => {
    try {
        const result = await hybridAssignmentService_1.default.cleanupExpiredAssignments();
        res.json({
            success: result.success,
            message: result.message,
            expiredCount: result.expiredCount,
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Cleanup expired assignments error:', error);
        res.status(500).json({ success: false, message: 'Failed to cleanup expired assignments' });
    }
});
/**
 * GET /api/driver/assignments/orders/:orderId/waves
 * Get wave escalation status for an order
 */
router.get('/orders/:orderId/waves', auth_1.authenticateToken, async (req, res) => {
    try {
        const orderId = parseInt(req.params.orderId);
        const waveStatus = await hybridAssignmentService_1.default.getWaveEscalationStatus(orderId);
        if (waveStatus) {
            res.json({
                success: true,
                data: waveStatus,
                timestamp: new Date()
            });
        }
        else {
            res.status(404).json({
                success: false,
                message: 'Wave status not found for order'
            });
        }
    }
    catch (error) {
        console.error('Get wave status error:', error);
        res.status(500).json({ success: false, message: 'Failed to get wave status' });
    }
});
/**
 * POST /api/driver/assignments/orders/:orderId/escalate
 * Manually escalate order to next wave (admin/testing)
 */
router.post('/orders/:orderId/escalate', auth_1.authenticateToken, async (req, res) => {
    try {
        const orderId = parseInt(req.params.orderId);
        const { wave } = req.body;
        const result = await hybridAssignmentService_1.default.createWaveAssignmentOffers(orderId, wave || undefined);
        res.json({
            success: result.success,
            message: result.message || 'Wave escalation completed',
            data: {
                orderId,
                wave: result.wave,
                assignmentsCreated: result.assignmentsCreated,
                availableDrivers: result.availableDrivers || 0
            },
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Manual escalation error:', error);
        res.status(500).json({ success: false, message: 'Failed to escalate order' });
    }
});
/**
 * GET /api/driver/assignments/analytics/declines
 * Get decline reasons analytics
 */
router.get('/analytics/declines', auth_1.authenticateToken, async (req, res) => {
    try {
        const timeframeHours = parseInt(req.query.hours) || 24;
        const analytics = await hybridAssignmentService_1.default.getDeclineReasonsAnalytics(timeframeHours);
        res.json({
            success: true,
            data: analytics,
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Get decline analytics error:', error);
        res.status(500).json({ success: false, message: 'Failed to get decline analytics' });
    }
});
// =====================================================
// MAINTENANCE AND HEALTH MONITORING
// =====================================================
/**
 * GET /api/driver/assignments/system/health
 * Get system health metrics
 */
router.get('/system/health', auth_1.authenticateToken, async (req, res) => {
    try {
        const health = await maintenanceService_1.default.getSystemHealth();
        res.json({
            success: true,
            data: health,
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Get system health error:', error);
        res.status(500).json({ success: false, message: 'Failed to get system health' });
    }
});
/**
 * GET /api/driver/assignments/system/maintenance
 * Get maintenance service status
 */
router.get('/system/maintenance', auth_1.authenticateToken, async (req, res) => {
    try {
        const status = maintenanceService_1.default.getMaintenanceStatus();
        res.json({
            success: true,
            data: status,
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Get maintenance status error:', error);
        res.status(500).json({ success: false, message: 'Failed to get maintenance status' });
    }
});
/**
 * POST /api/driver/assignments/system/maintenance/run
 * Trigger manual maintenance cycle
 */
router.post('/system/maintenance/run', auth_1.authenticateToken, async (req, res) => {
    try {
        const result = await maintenanceService_1.default.runManualMaintenance();
        res.json({
            success: result.success,
            data: result,
            message: result.success ? 'Manual maintenance completed' : 'Manual maintenance failed',
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Run manual maintenance error:', error);
        res.status(500).json({ success: false, message: 'Failed to run manual maintenance' });
    }
});
/**
 * POST /api/driver/assignments/system/emergency-cleanup
 * Emergency cleanup for critical issues (admin only)
 */
router.post('/system/emergency-cleanup', auth_1.authenticateToken, async (req, res) => {
    try {
        // TODO: Add admin role check here
        const result = await maintenanceService_1.default.emergencyCleanup();
        res.json({
            success: result.success,
            data: result,
            message: result.success ? 'Emergency cleanup completed' : 'Emergency cleanup failed',
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Emergency cleanup error:', error);
        res.status(500).json({ success: false, message: 'Failed to run emergency cleanup' });
    }
});
// =====================================================
// ENHANCED DRIVER DASHBOARD
// =====================================================
/**
 * GET /api/driver/assignments/dashboard
 * Get comprehensive driver dashboard data
 */
router.get('/dashboard', auth_1.authenticateToken, async (req, res) => {
    try {
        const driverId = req.user?.id;
        if (!driverId) {
            return res.status(401).json({ success: false, message: 'Driver not authenticated' });
        }
        const timeframe = req.query.timeframe || 'today';
        const dashboard = await driverDashboardService_1.default.getDriverDashboard(driverId, timeframe);
        if (dashboard.success) {
            res.json({
                success: true,
                data: dashboard.data,
                timestamp: new Date()
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: dashboard.message,
                error: dashboard.error
            });
        }
    }
    catch (error) {
        console.error('Get driver dashboard error:', error);
        res.status(500).json({ success: false, message: 'Failed to get driver dashboard' });
    }
});
/**
 * GET /api/driver/assignments/dashboard/earnings
 * Get detailed earnings report
 */
router.get('/dashboard/earnings', auth_1.authenticateToken, async (req, res) => {
    try {
        const driverId = req.user?.id;
        if (!driverId) {
            return res.status(401).json({ success: false, message: 'Driver not authenticated' });
        }
        const timeframe = req.query.timeframe || 'week';
        const earningsReport = await driverDashboardService_1.default.getEarningsReport(driverId, timeframe);
        if (earningsReport.success) {
            res.json({
                success: true,
                data: earningsReport.data,
                timestamp: new Date()
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: earningsReport.message,
                error: earningsReport.error
            });
        }
    }
    catch (error) {
        console.error('Get earnings report error:', error);
        res.status(500).json({ success: false, message: 'Failed to get earnings report' });
    }
});
/**
 * GET /api/driver/assignments/dashboard/performance
 * Get driver performance metrics (quick endpoint)
 */
router.get('/dashboard/performance', auth_1.authenticateToken, async (req, res) => {
    try {
        const driverId = req.user?.id;
        if (!driverId) {
            return res.status(401).json({ success: false, message: 'Driver not authenticated' });
        }
        // Get basic performance metrics from driver profile
        const driver = await prisma.driver.findUnique({
            where: { id: driverId },
            select: {
                rating: true,
                totalDeliveries: true,
                completionRate: true,
                user: { select: { name: true } },
                driverState: {
                    select: {
                        isOnline: true,
                        activeAssignmentsCount: true,
                        onlineSince: true
                    }
                }
            }
        });
        if (!driver) {
            return res.status(404).json({ success: false, message: 'Driver not found' });
        }
        res.json({
            success: true,
            data: {
                driverName: driver.user.name,
                rating: driver.rating || 5.0,
                totalDeliveries: driver.totalDeliveries,
                completionRate: driver.completionRate || 100.0,
                currentStatus: {
                    isOnline: driver.driverState?.isOnline || false,
                    activeAssignments: driver.driverState?.activeAssignmentsCount || 0,
                    onlineSince: driver.driverState?.onlineSince
                }
            },
            timestamp: new Date()
        });
    }
    catch (error) {
        console.error('Get performance metrics error:', error);
        res.status(500).json({ success: false, message: 'Failed to get performance metrics' });
    }
});
// =====================================================
// BACKWARDS COMPATIBILITY NOTES
// =====================================================
/*
 * IMPORTANT: These new routes work alongside the existing driver routes:
 *
 * EXISTING ROUTES (Still supported):
 * - GET  /api/driver/orders/available    -> Simple order list
 * - POST /api/driver/orders/:id/accept   -> Direct order acceptance
 *
 * NEW ENHANCED ROUTES (This file):
 * - POST /api/driver/assignments/state           -> Driver state management
 * - GET  /api/driver/assignments/offers          -> TTL offers with expiration
 * - POST /api/driver/assignments/offers/:id/accept -> Atomic assignment with race protection
 *
 * Driver apps can gradually migrate from old to new endpoints as features are ready.
 * Customer and restaurant apps are completely unaffected.
 */
exports.default = router;
//# sourceMappingURL=driverAssignments.js.map