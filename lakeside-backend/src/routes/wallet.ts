import express from 'express';
import walletController from '../controllers/walletController';
import { authenticateToken } from '../middleware/auth';
import {
  validatePagination,
  validateBalanceCheck,
  validateTopUp,
  validateWithdrawal,
  validateTransactionId,
  validateAdminAction,
  validateRefund,
  validateUserTypeQuery,
  checkWalletOwnership,
  checkTopUpLimits,
  checkWithdrawalEligibility
} from '../middleware/walletValidation';

const router = express.Router();

// Customer & Driver Wallet Routes
router.get('/', 
  authenticateToken, 
  checkWalletOwnership, 
  walletController.getWallet
);

router.get('/transactions', 
  authenticateToken, 
  validatePagination,
  checkWalletOwnership, 
  walletController.getTransactionHistory
);

router.get('/check-balance', 
  authenticateToken,
  validateBalanceCheck,
  walletController.checkBalance
);

// Customer Specific Routes
router.post('/topup', 
  authenticateToken,
  validateTopUp,
  checkTopUpLimits,
  walletController.requestTopUp
);

// Driver Specific Routes  
router.post('/withdraw', 
  authenticateToken,
  validateWithdrawal,
  checkWithdrawalEligibility,
  walletController.requestWithdrawal
);

// Admin Routes
router.get('/admin/pending', 
  authenticateToken,
  validatePagination,
  walletController.getPendingTransactions
);

router.put('/admin/approve/:transactionId', 
  authenticateToken,
  validateTransactionId,
  validateAdminAction,
  walletController.approveTransaction
);

router.put('/admin/reject/:transactionId', 
  authenticateToken,
  validateTransactionId,
  validateAdminAction,
  walletController.rejectTransaction
);

router.post('/admin/refund', 
  authenticateToken,
  validateRefund,
  walletController.refundCustomer
);

router.get('/admin/stats', 
  authenticateToken,
  validateUserTypeQuery,
  walletController.getWalletStats
);

export default router;
