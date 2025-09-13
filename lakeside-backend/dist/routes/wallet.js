"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const walletController_1 = __importDefault(require("../controllers/walletController"));
const auth_1 = require("../middleware/auth");
const walletValidation_1 = require("../middleware/walletValidation");
const router = express_1.default.Router();
// Customer & Driver Wallet Routes
router.get('/', auth_1.authenticateToken, walletValidation_1.checkWalletOwnership, walletController_1.default.getWallet);
router.get('/transactions', auth_1.authenticateToken, walletValidation_1.validatePagination, walletValidation_1.checkWalletOwnership, walletController_1.default.getTransactionHistory);
router.get('/check-balance', auth_1.authenticateToken, walletValidation_1.validateBalanceCheck, walletController_1.default.checkBalance);
// Customer Specific Routes
router.post('/topup', auth_1.authenticateToken, walletValidation_1.validateTopUp, walletValidation_1.checkTopUpLimits, walletController_1.default.requestTopUp);
// Driver Specific Routes  
router.post('/withdraw', auth_1.authenticateToken, walletValidation_1.validateWithdrawal, walletValidation_1.checkWithdrawalEligibility, walletController_1.default.requestWithdrawal);
// Admin Routes
router.get('/admin/pending', auth_1.authenticateToken, walletValidation_1.validatePagination, walletController_1.default.getPendingTransactions);
router.put('/admin/approve/:transactionId', auth_1.authenticateToken, walletValidation_1.validateTransactionId, walletValidation_1.validateAdminAction, walletController_1.default.approveTransaction);
router.put('/admin/reject/:transactionId', auth_1.authenticateToken, walletValidation_1.validateTransactionId, walletValidation_1.validateAdminAction, walletController_1.default.rejectTransaction);
router.post('/admin/refund', auth_1.authenticateToken, walletValidation_1.validateRefund, walletController_1.default.refundCustomer);
router.get('/admin/stats', auth_1.authenticateToken, walletValidation_1.validateUserTypeQuery, walletController_1.default.getWalletStats);
exports.default = router;
//# sourceMappingURL=wallet.js.map