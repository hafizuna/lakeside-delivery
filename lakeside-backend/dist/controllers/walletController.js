"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const walletService_1 = __importDefault(require("../services/walletService"));
class WalletController {
    // Customer Wallet Endpoints
    async getWallet(req, res) {
        try {
            const userId = req.user?.id;
            const userRole = req.user?.role;
            // Validate user authentication
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User ID not found. Please log in again.'
                });
            }
            if (!userRole) {
                return res.status(401).json({
                    success: false,
                    message: 'User role not found. Please log in again.'
                });
            }
            let result;
            if (userRole === 'CUSTOMER') {
                result = await walletService_1.default.getCustomerWallet(userId);
            }
            else if (userRole === 'DRIVER') {
                // Get driver profile ID from user ID
                result = await walletService_1.default.getDriverWallet(userId);
            }
            else {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid user role for wallet access'
                });
            }
            if (!result.success) {
                return res.status(400).json(result);
            }
            res.json(result);
        }
        catch (error) {
            console.error('Get wallet error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async requestTopUp(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            const userId = req.user?.id;
            const userRole = req.user?.role;
            const { amount, screenshotUrl } = req.body;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User ID not found. Please log in again.'
                });
            }
            if (userRole !== 'CUSTOMER') {
                return res.status(403).json({
                    success: false,
                    message: 'Only customers can request wallet top-ups'
                });
            }
            const result = await walletService_1.default.requestCustomerTopUp(userId, parseFloat(amount), screenshotUrl);
            if (!result.success) {
                return res.status(400).json(result);
            }
            res.status(201).json(result);
        }
        catch (error) {
            console.error('Request top-up error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async getTransactionHistory(req, res) {
        try {
            const userId = req.user?.id;
            const userRole = req.user?.role;
            const { page = '1', limit = '20' } = req.query;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User ID not found. Please log in again.'
                });
            }
            if (!userRole) {
                return res.status(401).json({
                    success: false,
                    message: 'User role not found. Please log in again.'
                });
            }
            let result;
            if (userRole === 'CUSTOMER') {
                result = await walletService_1.default.getTransactionHistory(userId, 'customer', parseInt(page), parseInt(limit));
            }
            else if (userRole === 'DRIVER') {
                result = await walletService_1.default.getTransactionHistory(userId, 'driver', parseInt(page), parseInt(limit));
            }
            else {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid user role'
                });
            }
            if (!result.success) {
                return res.status(400).json(result);
            }
            res.json(result);
        }
        catch (error) {
            console.error('Get transaction history error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    // Driver Specific Endpoints
    async requestWithdrawal(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            const userId = req.user?.id;
            const userRole = req.user?.role;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User ID not found. Please log in again.'
                });
            }
            if (userRole !== 'DRIVER') {
                return res.status(403).json({
                    success: false,
                    message: 'Only drivers can request withdrawals'
                });
            }
            const { amount } = req.body;
            const result = await walletService_1.default.requestDriverWithdrawal(userId, parseFloat(amount));
            if (!result.success) {
                return res.status(400).json(result);
            }
            res.status(201).json(result);
        }
        catch (error) {
            console.error('Request withdrawal error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    // Admin Endpoints
    async getPendingTransactions(req, res) {
        try {
            const userRole = req.user?.role;
            if (!userRole) {
                return res.status(401).json({
                    success: false,
                    message: 'User role not found. Please log in again.'
                });
            }
            if (userRole !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required'
                });
            }
            const { page = '1', limit = '20' } = req.query;
            const result = await walletService_1.default.getPendingTransactions(parseInt(page), parseInt(limit));
            if (!result.success) {
                return res.status(400).json(result);
            }
            res.json(result);
        }
        catch (error) {
            console.error('Get pending transactions error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async approveTransaction(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            const adminId = req.user?.id;
            const userRole = req.user?.role;
            if (!adminId) {
                return res.status(401).json({
                    success: false,
                    message: 'User ID not found. Please log in again.'
                });
            }
            if (userRole !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required'
                });
            }
            const { transactionId } = req.params;
            const { adminNotes } = req.body;
            const result = await walletService_1.default.approveTransaction(parseInt(transactionId), adminId, adminNotes);
            if (!result.success) {
                return res.status(400).json(result);
            }
            res.json(result);
        }
        catch (error) {
            console.error('Approve transaction error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async rejectTransaction(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            const adminId = req.user?.id;
            const userRole = req.user?.role;
            if (!adminId) {
                return res.status(401).json({
                    success: false,
                    message: 'User ID not found. Please log in again.'
                });
            }
            if (userRole !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required'
                });
            }
            const { transactionId } = req.params;
            const { adminNotes } = req.body;
            const result = await walletService_1.default.rejectTransaction(parseInt(transactionId), adminId, adminNotes);
            if (!result.success) {
                return res.status(400).json(result);
            }
            res.json(result);
        }
        catch (error) {
            console.error('Reject transaction error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async getWalletStats(req, res) {
        try {
            const userRole = req.user?.role;
            if (!userRole) {
                return res.status(401).json({
                    success: false,
                    message: 'User role not found. Please log in again.'
                });
            }
            if (userRole !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required'
                });
            }
            const { userType = 'all' } = req.query;
            const result = await walletService_1.default.getWalletStats(userType);
            if (!result.success) {
                return res.status(400).json(result);
            }
            res.json(result);
        }
        catch (error) {
            console.error('Get wallet stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async refundCustomer(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }
            const adminId = req.user?.id;
            const userRole = req.user?.role;
            if (!adminId) {
                return res.status(401).json({
                    success: false,
                    message: 'User ID not found. Please log in again.'
                });
            }
            if (userRole !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required'
                });
            }
            const { customerId, amount, orderId } = req.body;
            const result = await walletService_1.default.refundCustomer(customerId, parseFloat(amount), orderId, adminId);
            if (!result.success) {
                return res.status(400).json(result);
            }
            res.status(201).json(result);
        }
        catch (error) {
            console.error('Refund customer error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async checkBalance(req, res) {
        try {
            const userId = req.user?.id;
            const userRole = req.user?.role;
            const { amount } = req.query;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User ID not found. Please log in again.'
                });
            }
            if (userRole !== 'CUSTOMER') {
                return res.status(403).json({
                    success: false,
                    message: 'Only customers can check balance'
                });
            }
            const result = await walletService_1.default.checkSufficientBalance(userId, parseFloat(amount));
            if (!result.success) {
                return res.status(400).json(result);
            }
            res.json(result);
        }
        catch (error) {
            console.error('Check balance error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
exports.default = new WalletController();
//# sourceMappingURL=walletController.js.map