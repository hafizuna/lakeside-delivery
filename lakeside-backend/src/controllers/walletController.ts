import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import walletService from '../services/walletService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
    phone: string;
  };
}

class WalletController {
  // Customer Wallet Endpoints
  async getWallet(req: AuthenticatedRequest, res: Response) {
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
        result = await walletService.getCustomerWallet(userId);
      } else if (userRole === 'DRIVER') {
        // Get driver profile ID from user ID
        result = await walletService.getDriverWallet(userId);
      } else {
        return res.status(403).json({
          success: false,
          message: 'Invalid user role for wallet access'
        });
      }

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Get wallet error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async requestTopUp(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
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

      const result = await walletService.requestCustomerTopUp(userId, parseFloat(amount), screenshotUrl);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Request top-up error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getTransactionHistory(req: AuthenticatedRequest, res: Response) {
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
        result = await walletService.getTransactionHistory(userId, 'customer', parseInt(page as string), parseInt(limit as string));
      } else if (userRole === 'DRIVER') {
        result = await walletService.getTransactionHistory(userId, 'driver', parseInt(page as string), parseInt(limit as string));
      } else {
        return res.status(403).json({
          success: false,
          message: 'Invalid user role'
        });
      }

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Get transaction history error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Driver Specific Endpoints
  async requestWithdrawal(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
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

      const result = await walletService.requestDriverWithdrawal(userId, parseFloat(amount));

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Request withdrawal error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Admin Endpoints
  async getPendingTransactions(req: AuthenticatedRequest, res: Response) {
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
      const result = await walletService.getPendingTransactions(parseInt(page as string), parseInt(limit as string));

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Get pending transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async approveTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
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

      const result = await walletService.approveTransaction(parseInt(transactionId), adminId, adminNotes);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Approve transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async rejectTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
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

      const result = await walletService.rejectTransaction(parseInt(transactionId), adminId, adminNotes);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Reject transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getWalletStats(req: AuthenticatedRequest, res: Response) {
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
      const result = await walletService.getWalletStats(userType as 'customer' | 'driver' | 'all');

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Get wallet stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async refundCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
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

      const result = await walletService.refundCustomer(customerId, parseFloat(amount), orderId, adminId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Refund customer error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async checkBalance(req: AuthenticatedRequest, res: Response) {
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

      const result = await walletService.checkSufficientBalance(userId, parseFloat(amount as string));

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Check balance error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export default new WalletController();
