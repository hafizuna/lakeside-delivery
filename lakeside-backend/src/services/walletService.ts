import { PrismaClient, WalletTransactionType, WalletTransactionStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

interface PaginationResult<T> {
  success: boolean;
  data: {
    transactions: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

class WalletService {
  // Customer Wallet Operations
  async createCustomerWallet(customerId: number): Promise<ServiceResponse> {
    try {
      const existingWallet = await prisma.customerWallet.findUnique({
        where: { customerId }
      });

      if (existingWallet) {
        return { success: false, message: 'Wallet already exists' };
      }

      const wallet = await prisma.customerWallet.create({
        data: { customerId }
      });

      return { success: true, data: wallet };
    } catch (error) {
      console.error('Error creating customer wallet:', error);
      return { success: false, message: 'Failed to create wallet' };
    }
  }

  async getCustomerWallet(customerId: number): Promise<ServiceResponse> {
    try {
      let wallet = await prisma.customerWallet.findUnique({
        where: { customerId },
        include: {
          customer: {
            select: { name: true, phone: true }
          }
        }
      });

      // Auto-create wallet if doesn't exist
      if (!wallet) {
        const createResult = await this.createCustomerWallet(customerId);
        if (createResult.success) {
          wallet = await prisma.customerWallet.findUnique({
            where: { customerId },
            include: {
              customer: {
                select: { name: true, phone: true }
              }
            }
          });
        }
      }

      return { success: true, data: wallet };
    } catch (error) {
      console.error('Error fetching customer wallet:', error);
      return { success: false, message: 'Failed to fetch wallet' };
    }
  }

  async requestCustomerTopUp(customerId: number, amount: number, screenshotUrl?: string): Promise<ServiceResponse> {
    try {
      if (amount <= 0) {
        return { success: false, message: 'Amount must be greater than 0' };
      }

      // Create pending transaction
      const transaction = await prisma.walletTransaction.create({
        data: {
          customerId,
          amount,
          type: 'CUSTOMER_TOPUP',
          status: 'PENDING',
          screenshotUrl,
          description: `Top-up request of ₹${amount}`
        }
      });

      return { success: true, data: transaction, message: 'Top-up request submitted for admin approval' };
    } catch (error) {
      console.error('Error requesting customer top-up:', error);
      return { success: false, message: 'Failed to submit top-up request' };
    }
  }

  async processCustomerPayment(customerId: number, amount: number, orderId?: number): Promise<ServiceResponse> {
    try {
      const wallet = await prisma.customerWallet.findUnique({
        where: { customerId }
      });

      if (!wallet || !wallet.isActive) {
        return { success: false, message: 'Wallet not found or inactive' };
      }

      if (wallet.balance.toNumber() < amount) {
        return { success: false, message: 'Insufficient wallet balance' };
      }

      // Process payment in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Deduct from wallet
        const updatedWallet = await tx.customerWallet.update({
          where: { customerId },
          data: {
            balance: { decrement: amount },
            totalSpent: { increment: amount }
          }
        });

        // Create transaction record
        const transaction = await tx.walletTransaction.create({
          data: {
            customerId,
            amount: -amount,
            type: 'CUSTOMER_ORDER_PAYMENT',
            status: 'APPROVED',
            description: orderId ? `Payment for order #${orderId}` : 'Order payment',
            processedAt: new Date()
          }
        });

        return { wallet: updatedWallet, transaction };
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('Error processing customer payment:', error);
      return { success: false, message: 'Payment processing failed' };
    }
  }

  // Driver Wallet Operations
  async createDriverWallet(driverId: number): Promise<ServiceResponse> {
    try {
      const existingWallet = await prisma.driverWallet.findUnique({
        where: { driverId }
      });

      if (existingWallet) {
        return { success: false, message: 'Driver wallet already exists' };
      }

      const wallet = await prisma.driverWallet.create({
        data: { driverId }
      });

      return { success: true, data: wallet };
    } catch (error) {
      console.error('Error creating driver wallet:', error);
      return { success: false, message: 'Failed to create driver wallet' };
    }
  }

  async getDriverWallet(driverId: number): Promise<ServiceResponse> {
    try {
      let wallet = await prisma.driverWallet.findUnique({
        where: { driverId },
        include: {
          driver: {
            include: {
              user: {
                select: { name: true, phone: true }
              }
            }
          }
        }
      });

      // Auto-create wallet if doesn't exist
      if (!wallet) {
        const createResult = await this.createDriverWallet(driverId);
        if (createResult.success) {
          wallet = await prisma.driverWallet.findUnique({
            where: { driverId },
            include: {
              driver: {
                include: {
                  user: {
                    select: { name: true, phone: true }
                  }
                }
              }
            }
          });
        }
      }

      return { success: true, data: wallet };
    } catch (error) {
      console.error('Error fetching driver wallet:', error);
      return { success: false, message: 'Failed to fetch driver wallet' };
    }
  }

  async addDriverEarning(driverId: number, amount: number, orderId?: number): Promise<ServiceResponse> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update driver wallet
        const wallet = await tx.driverWallet.upsert({
          where: { driverId },
          create: {
            driverId,
            balance: amount,
            totalEarnings: amount,
            lastEarningAt: new Date()
          },
          update: {
            balance: { increment: amount },
            totalEarnings: { increment: amount },
            lastEarningAt: new Date()
          }
        });

        // Create earning transaction
        const transaction = await tx.walletTransaction.create({
          data: {
            driverId,
            amount,
            type: 'DRIVER_EARNING',
            status: 'APPROVED',
            description: orderId ? `Delivery earning for order #${orderId}` : 'Delivery earning',
            processedAt: new Date()
          }
        });

        return { wallet, transaction };
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('Error adding driver earning:', error);
      return { success: false, message: 'Failed to add driver earning' };
    }
  }

  async requestDriverWithdrawal(driverId: number, amount: number): Promise<ServiceResponse> {
    try {
      const wallet = await prisma.driverWallet.findUnique({
        where: { driverId }
      });

      if (!wallet) {
        return { success: false, message: 'Driver wallet not found' };
      }

      if (!wallet.canWithdraw) {
        return { success: false, message: 'Withdrawal not allowed. Contact admin.' };
      }

      if (wallet.balance.toNumber() < amount) {
        return { success: false, message: 'Insufficient balance' };
      }

      // Create withdrawal request
      const transaction = await prisma.walletTransaction.create({
        data: {
          driverId,
          amount: -amount,
          type: 'DRIVER_WITHDRAWAL',
          status: 'PENDING',
          description: `Withdrawal request of ₹${amount}`
        }
      });

      return { success: true, data: transaction, message: 'Withdrawal request submitted for approval' };
    } catch (error) {
      console.error('Error requesting driver withdrawal:', error);
      return { success: false, message: 'Failed to submit withdrawal request' };
    }
  }

  async addCustomerRefund(customerId: number, amount: number, orderId?: number, reason?: string): Promise<ServiceResponse> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update customer wallet
        const wallet = await tx.customerWallet.upsert({
          where: { customerId },
          create: {
            customerId,
            balance: amount,
            totalTopUps: amount
          },
          update: {
            balance: { increment: amount }
          }
        });

        // Create refund transaction
        const transaction = await tx.walletTransaction.create({
          data: {
            customerId,
            amount,
            type: 'CUSTOMER_REFUND',
            status: 'APPROVED',
            description: orderId ? `Refund for order #${orderId}${reason ? ': ' + reason : ''}` : `Refund${reason ? ': ' + reason : ''}`,
            processedAt: new Date()
          }
        });

        return { wallet, transaction };
      });

      return { success: true, data: result, message: 'Refund processed successfully' };
    } catch (error) {
      console.error('Error processing customer refund:', error);
      return { success: false, message: 'Failed to process refund' };
    }
  }

  // Transaction Management
  async getTransactionHistory(userId: number, userType: 'customer' | 'driver' = 'customer', page: number = 1, limit: number = 20): Promise<ServiceResponse> {
    try {
      const skip = (page - 1) * limit;
      const where = userType === 'customer' 
        ? { customerId: userId }
        : { driverId: userId };

      const [transactions, total] = await Promise.all([
        prisma.walletTransaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            admin: {
              select: { name: true }
            }
          }
        }),
        prisma.walletTransaction.count({ where })
      ]);

      return {
        success: true,
        data: {
          transactions,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return { success: false, message: 'Failed to fetch transaction history' };
    }
  }

  // Admin Operations
  async getPendingTransactions(page: number = 1, limit: number = 20): Promise<ServiceResponse> {
    try {
      const skip = (page - 1) * limit;
      
      const [transactions, total] = await Promise.all([
        prisma.walletTransaction.findMany({
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            customer: {
              select: { name: true, phone: true }
            },
            driver: {
              include: {
                user: {
                  select: { name: true, phone: true }
                }
              }
            }
          }
        }),
        prisma.walletTransaction.count({ where: { status: 'PENDING' } })
      ]);

      return {
        success: true,
        data: {
          transactions,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      console.error('Error fetching pending transactions:', error);
      return { success: false, message: 'Failed to fetch pending transactions' };
    }
  }

  async approveTransaction(transactionId: number, adminId: number, adminNotes?: string): Promise<ServiceResponse> {
    try {
      const transaction = await prisma.walletTransaction.findUnique({
        where: { id: transactionId }
      });

      if (!transaction || transaction.status !== 'PENDING') {
        return { success: false, message: 'Transaction not found or already processed' };
      }

      const result = await prisma.$transaction(async (tx) => {
        // Update transaction status
        const updatedTransaction = await tx.walletTransaction.update({
          where: { id: transactionId },
          data: {
            status: 'APPROVED',
            adminId,
            adminNotes,
            processedAt: new Date()
          }
        });

        // Process the actual wallet update based on transaction type
        if (transaction.type === 'CUSTOMER_TOPUP' && transaction.customerId) {
          await tx.customerWallet.upsert({
            where: { customerId: transaction.customerId },
            create: {
              customerId: transaction.customerId,
              balance: transaction.amount,
              totalTopUps: transaction.amount,
              lastTopUpAt: new Date()
            },
            update: {
              balance: { increment: transaction.amount },
              totalTopUps: { increment: transaction.amount },
              lastTopUpAt: new Date()
            }
          });
        } else if (transaction.type === 'DRIVER_WITHDRAWAL' && transaction.driverId) {
          await tx.driverWallet.update({
            where: { driverId: transaction.driverId },
            data: {
              balance: { decrement: Math.abs(transaction.amount.toNumber()) },
              totalWithdrawn: { increment: Math.abs(transaction.amount.toNumber()) }
            }
          });
        }

        return updatedTransaction;
      });

      return { success: true, data: result, message: 'Transaction approved successfully' };
    } catch (error) {
      console.error('Error approving transaction:', error);
      return { success: false, message: 'Failed to approve transaction' };
    }
  }

  async rejectTransaction(transactionId: number, adminId: number, adminNotes?: string): Promise<ServiceResponse> {
    try {
      const updatedTransaction = await prisma.walletTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'REJECTED',
          adminId,
          adminNotes,
          processedAt: new Date()
        }
      });

      return { success: true, data: updatedTransaction, message: 'Transaction rejected' };
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      return { success: false, message: 'Failed to reject transaction' };
    }
  }

  // Utility Methods
  async getWalletStats(userType: 'customer' | 'driver' | 'all' = 'all'): Promise<ServiceResponse> {
    try {
      const stats: any = {};

      if (userType === 'customer' || userType === 'all') {
        const customerStats = await prisma.customerWallet.aggregate({
          _sum: {
            balance: true,
            totalTopUps: true,
            totalSpent: true
          },
          _count: {
            customerId: true
          }
        });
        stats.customer = customerStats;
      }

      if (userType === 'driver' || userType === 'all') {
        const driverStats = await prisma.driverWallet.aggregate({
          _sum: {
            balance: true,
            collateralAmount: true,
            totalEarnings: true,
            totalWithdrawn: true
          },
          _count: {
            driverId: true
          }
        });
        stats.driver = driverStats;
      }

      const transactionStats = await prisma.walletTransaction.groupBy({
        by: ['status', 'type'],
        _count: {
          id: true
        },
        _sum: {
          amount: true
        }
      });

      return {
        success: true,
        data: { ...stats, transactions: transactionStats }
      };
    } catch (error) {
      console.error('Error fetching wallet stats:', error);
      return { success: false, message: 'Failed to fetch wallet statistics' };
    }
  }

  async refundCustomer(customerId: number, amount: number, orderId?: number, adminId?: number): Promise<ServiceResponse> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update customer wallet
        const wallet = await tx.customerWallet.upsert({
          where: { customerId },
          create: {
            customerId,
            balance: amount
          },
          update: {
            balance: { increment: amount }
          }
        });

        // Create refund transaction
        const transaction = await tx.walletTransaction.create({
          data: {
            customerId,
            amount,
            type: 'CUSTOMER_REFUND',
            status: 'APPROVED',
            adminId,
            description: orderId ? `Refund for order #${orderId}` : 'Order refund',
            processedAt: new Date()
          }
        });

        return { wallet, transaction };
      });

      return { success: true, data: result, message: 'Refund processed successfully' };
    } catch (error) {
      console.error('Error processing refund:', error);
      return { success: false, message: 'Failed to process refund' };
    }
  }

  async checkSufficientBalance(customerId: number, amount: number): Promise<ServiceResponse<{ hasSufficientBalance: boolean; currentBalance: number }>> {
    try {
      const wallet = await prisma.customerWallet.findUnique({
        where: { customerId }
      });

      return {
        success: true,
        data: {
          hasSufficientBalance: wallet ? wallet.isActive && wallet.balance.toNumber() >= amount : false,
          currentBalance: wallet?.balance.toNumber() || 0
        }
      };
    } catch (error) {
      console.error('Error checking balance:', error);
      return { success: false, message: 'Failed to check balance' };
    }
  }
}

export default new WalletService();
