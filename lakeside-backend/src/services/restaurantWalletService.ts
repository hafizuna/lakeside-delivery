import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface RestaurantWalletService {
  getOrCreateWallet(restaurantId: number): Promise<any>;
  addRestaurantEarning(restaurantId: number, orderTotal: number, commission: number, orderId?: number): Promise<any>;
  getWalletBalance(restaurantId: number): Promise<any>;
  getWalletTransactions(restaurantId: number, limit?: number): Promise<any>;
}

class RestaurantWalletServiceImpl implements RestaurantWalletService {
  /**
   * Get or create restaurant wallet
   */
  async getOrCreateWallet(restaurantId: number) {
    try {
      // Try to find existing wallet
      let wallet = await prisma.restaurantWallet.findUnique({
        where: { restaurantId }
      });

      // Create wallet if it doesn't exist
      if (!wallet) {
        wallet = await prisma.restaurantWallet.create({
          data: {
            restaurantId,
            balance: 0.00,
            totalEarnings: 0.00,
            totalCommissionPaid: 0.00,
            totalPayouts: 0.00,
            isActive: true
          }
        });
      }

      return {
        success: true,
        data: {
          wallet,
          balance: wallet.balance.toNumber(),
          totalEarnings: wallet.totalEarnings.toNumber(),
          totalCommissionPaid: wallet.totalCommissionPaid.toNumber(),
          totalPayouts: wallet.totalPayouts.toNumber()
        }
      };
    } catch (error) {
      console.error('Get or create restaurant wallet error:', error);
      return {
        success: false,
        message: 'Failed to get or create restaurant wallet',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Add restaurant earning from order (food price - commission)
   */
  async addRestaurantEarning(restaurantId: number, orderTotal: number, commission: number, orderId?: number) {
    try {
      const netEarning = orderTotal - commission;

      if (netEarning <= 0) {
        return {
          success: false,
          message: 'Net earning must be positive'
        };
      }

      // Update restaurant wallet in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Get or create wallet
        let wallet = await tx.restaurantWallet.findUnique({
          where: { restaurantId }
        });

        if (!wallet) {
          wallet = await tx.restaurantWallet.create({
            data: {
              restaurantId,
              balance: 0.00,
              totalEarnings: 0.00,
              totalCommissionPaid: 0.00,
              totalPayouts: 0.00,
              isActive: true
            }
          });
        }

        // Update wallet balances
        const updatedWallet = await tx.restaurantWallet.update({
          where: { restaurantId },
          data: {
            balance: {
              increment: netEarning
            },
            totalEarnings: {
              increment: netEarning
            },
            totalCommissionPaid: {
              increment: commission
            },
            lastEarningAt: new Date()
          }
        });

        // Create wallet transaction for earning
        const transaction = await tx.walletTransaction.create({
          data: {
            customerId: null, // Not a customer transaction
            driverId: null,   // Not a driver transaction
            amount: netEarning,
            type: 'RESTAURANT_ORDER_EARNING',
            status: 'APPROVED',
            description: `Order earning (Order #${orderId || 'Unknown'}) - ₹${orderTotal} - ₹${commission} commission`
          }
        });

        // If commission > 0, create a separate transaction for commission deduction
        if (commission > 0) {
          await tx.walletTransaction.create({
            data: {
              customerId: null,
              driverId: null,
              amount: -commission,
              type: 'RESTAURANT_COMMISSION_DEDUCTION',
              status: 'APPROVED',
              description: `Commission deduction (Order #${orderId || 'Unknown'}) - ${commission > 0 ? (commission/orderTotal*100).toFixed(1) : 0}% of ₹${orderTotal}`
            }
          });
        }

        return {
          wallet: updatedWallet,
          transaction
        };
      });

      return {
        success: true,
        data: {
          wallet: result.wallet,
          transaction: result.transaction,
          netEarning,
          commission
        },
        message: `₹${netEarning.toFixed(2)} credited to restaurant wallet (₹${commission.toFixed(2)} commission deducted)`
      };
    } catch (error) {
      console.error('Add restaurant earning error:', error);
      return {
        success: false,
        message: 'Failed to credit restaurant wallet',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get restaurant wallet balance
   */
  async getWalletBalance(restaurantId: number) {
    try {
      const wallet = await prisma.restaurantWallet.findUnique({
        where: { restaurantId }
      });

      if (!wallet) {
        // Create wallet if it doesn't exist
        const newWallet = await prisma.restaurantWallet.create({
          data: {
            restaurantId,
            balance: 0.00,
            totalEarnings: 0.00,
            totalCommissionPaid: 0.00,
            totalPayouts: 0.00,
            isActive: true
          }
        });

        return {
          success: true,
          data: {
            balance: 0.00,
            totalEarnings: 0.00,
            totalCommissionPaid: 0.00,
            totalPayouts: 0.00,
            wallet: newWallet
          }
        };
      }

      return {
        success: true,
        data: {
          balance: wallet.balance.toNumber(),
          totalEarnings: wallet.totalEarnings.toNumber(),
          totalCommissionPaid: wallet.totalCommissionPaid.toNumber(),
          totalPayouts: wallet.totalPayouts.toNumber(),
          wallet
        }
      };
    } catch (error) {
      console.error('Get restaurant wallet balance error:', error);
      return {
        success: false,
        message: 'Failed to get restaurant wallet balance',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get restaurant wallet transactions
   */
  async getWalletTransactions(restaurantId: number, limit: number = 50) {
    try {
      // Note: Since restaurant transactions don't have direct restaurant reference,
      // we'll need to fetch them differently. For now, let's return transactions
      // related to restaurant orders or create a separate tracking mechanism.
      
      const wallet = await this.getWalletBalance(restaurantId);
      
      if (!wallet.success) {
        return wallet;
      }

      // Get all transactions (this is a simplified approach)
      // In a real-world scenario, you might want to add restaurantId to WalletTransaction model
      const transactions = await prisma.walletTransaction.findMany({
        where: {
          OR: [
            { type: 'RESTAURANT_ORDER_EARNING' },
            { type: 'RESTAURANT_COMMISSION_DEDUCTION' },
            { type: 'RESTAURANT_PAYOUT' }
          ]
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      return {
        success: true,
        data: {
          wallet: wallet.data,
          transactions: transactions.map(tx => ({
            ...tx,
            amount: tx.amount.toNumber()
          }))
        }
      };
    } catch (error) {
      console.error('Get restaurant wallet transactions error:', error);
      return {
        success: false,
        message: 'Failed to get restaurant wallet transactions',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

const restaurantWalletService = new RestaurantWalletServiceImpl();
export default restaurantWalletService;
