"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkWithdrawalEligibility = exports.checkTopUpLimits = exports.checkWalletOwnership = exports.validateUserTypeQuery = exports.validateBalanceCheck = exports.validatePagination = exports.validateRefund = exports.validateAdminAction = exports.validateTransactionId = exports.validateWithdrawal = exports.validateTopUp = void 0;
const express_validator_1 = require("express-validator");
// Top-up validation
exports.validateTopUp = [
    (0, express_validator_1.body)('amount')
        .isFloat({ min: 1, max: 50000 })
        .withMessage('Amount must be between ₹1 and ₹50,000'),
    (0, express_validator_1.body)('screenshotUrl')
        .optional()
        .isURL()
        .withMessage('Screenshot URL must be a valid URL')
];
// Withdrawal validation
exports.validateWithdrawal = [
    (0, express_validator_1.body)('amount')
        .isFloat({ min: 100 })
        .withMessage('Minimum withdrawal amount is ₹100')
];
// Transaction ID validation
exports.validateTransactionId = [
    (0, express_validator_1.param)('transactionId')
        .isInt({ min: 1 })
        .withMessage('Transaction ID must be a positive integer')
];
// Admin notes validation
exports.validateAdminAction = [
    (0, express_validator_1.body)('adminNotes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Admin notes cannot exceed 500 characters')
];
// Refund validation
exports.validateRefund = [
    (0, express_validator_1.body)('customerId')
        .isInt({ min: 1 })
        .withMessage('Customer ID must be a positive integer'),
    (0, express_validator_1.body)('amount')
        .isFloat({ min: 1, max: 50000 })
        .withMessage('Refund amount must be between ₹1 and ₹50,000'),
    (0, express_validator_1.body)('orderId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Order ID must be a positive integer')
];
// Pagination validation
exports.validatePagination = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
];
// Balance check validation
exports.validateBalanceCheck = [
    (0, express_validator_1.query)('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0')
];
// User type validation for admin stats
exports.validateUserTypeQuery = [
    (0, express_validator_1.query)('userType')
        .optional()
        .isIn(['customer', 'driver', 'all'])
        .withMessage('User type must be customer, driver, or all')
];
// Middleware to check wallet ownership
const checkWalletOwnership = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId || !userRole) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        // Only allow customers and drivers to access their own wallets
        if (!['CUSTOMER', 'DRIVER', 'ADMIN'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Invalid user role for wallet access'
            });
        }
        // For admin operations, they can access any wallet
        if (userRole === 'ADMIN') {
            return next();
        }
        // Store user info for controller use
        req.walletUser = { id: userId, role: userRole };
        next();
    }
    catch (error) {
        console.error('Wallet ownership check error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.checkWalletOwnership = checkWalletOwnership;
// Middleware to check minimum top-up amounts based on user tier
const checkTopUpLimits = async (req, res, next) => {
    try {
        const { amount } = req.body;
        const userRole = req.user?.role;
        if (userRole === 'CUSTOMER') {
            // Customer top-up limits
            if (amount < 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Minimum top-up amount is ₹10 for customers'
                });
            }
            if (amount > 50000) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum top-up amount is ₹50,000 for customers'
                });
            }
        }
        next();
    }
    catch (error) {
        console.error('Top-up limit check error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.checkTopUpLimits = checkTopUpLimits;
// Middleware to check withdrawal eligibility for drivers
const checkWithdrawalEligibility = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (userRole !== 'DRIVER') {
            return res.status(403).json({
                success: false,
                message: 'Only drivers can request withdrawals'
            });
        }
        // Additional checks can be added here:
        // - Check if driver has completed minimum deliveries
        // - Check if driver has been active for minimum duration
        // - Check collateral requirements
        next();
    }
    catch (error) {
        console.error('Withdrawal eligibility check error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.checkWithdrawalEligibility = checkWithdrawalEligibility;
//# sourceMappingURL=walletValidation.js.map