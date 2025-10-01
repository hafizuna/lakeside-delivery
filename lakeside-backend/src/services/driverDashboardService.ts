import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * ENHANCED DRIVER DASHBOARD SERVICE
 * 
 * Provides comprehensive driver analytics, earnings tracking, performance metrics,
 * and assignment history for the driver mobile app dashboard.
 * 
 * Key Features:
 * - Real-time earnings and statistics
 * - Assignment history and performance
 * - Online time tracking
 * - Delivery metrics and ratings
 * - Weekly/monthly earning reports
 */
class DriverDashboardService {

  // =====================================================
  // DRIVER OVERVIEW DASHBOARD
  // =====================================================

  /**
   * Get comprehensive driver dashboard data
   */
  async getDriverDashboard(driverId: number, timeframe: 'today' | 'week' | 'month' = 'today') {
    try {
      const now = new Date();
      const { startDate, endDate } = this.getTimeframeDates(timeframe);

      const [
        driverProfile,
        driverState,
        todayStats,
        periodStats,
        recentAssignments,
        activeAssignment,
        performanceMetrics
      ] = await Promise.all([
        this.getDriverProfile(driverId),
        this.getDriverState(driverId),
        this.getDriverStats(driverId, 'today'),
        this.getDriverStats(driverId, timeframe),
        this.getRecentAssignments(driverId, 10),
        this.getActiveAssignment(driverId),
        this.getPerformanceMetrics(driverId, timeframe)
      ]);

      return {
        success: true,
        data: {
          profile: driverProfile,
          currentStatus: {
            isOnline: driverState?.isOnline || false,
            onlineSince: driverState?.onlineSince,
            activeAssignments: driverState?.activeAssignmentsCount || 0,
            lastHeartbeat: driverState?.lastHeartbeatAt,
            currentZone: driverState?.currentZoneId
          },
          activeAssignment,
          todayStats,
          periodStats: timeframe !== 'today' ? periodStats : null,
          recentAssignments,
          performanceMetrics,
          timeframe,
          timestamp: now
        }
      };
    } catch (error) {
      console.error('Get driver dashboard error:', error);
      return {
        success: false,
        message: 'Failed to get driver dashboard',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // =====================================================
  // DRIVER PROFILE AND STATE
  // =====================================================

  /**
   * Get driver profile information
   */
  private async getDriverProfile(driverId: number) {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
            createdAt: true
          }
        }
      }
    });

    if (!driver) return null;

    return {
      driverId: driver.id,
      name: driver.user.name,
      phone: driver.user.phone,
      rating: driver.rating || 5.0,
      totalDeliveries: driver.totalDeliveries,
      completionRate: driver.completionRate || 100.0,
      memberSince: driver.user.createdAt,
      vehicleType: driver.vehicleType,
      approvalStatus: driver.approvalStatus,
      licenseNumber: driver.licenseNumber,
      vehicleRegistration: driver.vehicleRegistration
    };
  }

  /**
   * Get current driver state
   */
  private async getDriverState(driverId: number) {
    return await prisma.driverState.findUnique({
      where: { driverId }
    });
  }

  // =====================================================
  // EARNINGS AND STATISTICS
  // =====================================================

  /**
   * Get driver statistics for a specific timeframe
   */
  private async getDriverStats(driverId: number, timeframe: 'today' | 'week' | 'month') {
    const { startDate, endDate } = this.getTimeframeDates(timeframe);

    const [
      ordersDelivered,
      totalEarnings,
      assignmentStats,
      onlineTimeStats
    ] = await Promise.all([
      // Orders delivered in timeframe
      prisma.order.findMany({
        where: {
          driverId,
          status: 'DELIVERED',
          deliveredAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          id: true,
          driverEarning: true,
          deliveredAt: true,
          deliveryDistance: true,
          restaurant: { select: { name: true } }
        }
      }),

      // Total earnings from wallet transactions
      this.getEarningsFromTransactions(driverId, startDate, endDate),

      // Assignment statistics
      this.getAssignmentStats(driverId, startDate, endDate),

      // Online time tracking
      this.getOnlineTimeStats(driverId, startDate, endDate)
    ]);

    const totalOrderEarnings = ordersDelivered.reduce((sum, order) => 
      sum + order.driverEarning.toNumber(), 0
    );

    const totalDistance = ordersDelivered.reduce((sum, order) => 
      sum + (order.deliveryDistance?.toNumber() || 0), 0
    );

    const averageEarningsPerOrder = ordersDelivered.length > 0 
      ? totalOrderEarnings / ordersDelivered.length 
      : 0;

    return {
      timeframe,
      period: { startDate, endDate },
      deliveries: {
        count: ordersDelivered.length,
        totalEarnings: totalOrderEarnings,
        averagePerOrder: Math.round(averageEarningsPerOrder * 100) / 100,
        totalDistance: Math.round(totalDistance * 100) / 100
      },
      assignments: assignmentStats,
      onlineTime: onlineTimeStats,
      performance: {
        averageDeliveryTime: await this.getAverageDeliveryTime(driverId, startDate, endDate),
        successRate: assignmentStats.totalOffers > 0 
          ? Math.round((assignmentStats.accepted / assignmentStats.totalOffers) * 100 * 100) / 100
          : 100
      }
    };
  }

  /**
   * Get earnings from wallet transactions
   */
  private async getEarningsFromTransactions(driverId: number, startDate: Date, endDate: Date) {
    const transactions = await prisma.walletTransaction.findMany({
      where: {
        driverId,
        type: 'DRIVER_EARNING',
        status: 'APPROVED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: { amount: true }
    });

    return transactions.reduce((sum, tx) => sum + tx.amount.toNumber(), 0);
  }

  /**
   * Get assignment statistics
   */
  private async getAssignmentStats(driverId: number, startDate: Date, endDate: Date) {
    const assignments = await prisma.driverAssignment.findMany({
      where: {
        driverId,
        offeredAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        status: true,
        offeredAt: true,
        respondedAt: true,
        wave: true
      }
    });

    const stats = {
      totalOffers: assignments.length,
      accepted: 0,
      declined: 0,
      expired: 0,
      averageResponseTime: 0,
      waveBreakdown: {} as Record<number, number>
    };

    let totalResponseTime = 0;
    let responseCount = 0;

    assignments.forEach(assignment => {
      const statusKey = assignment.status.toLowerCase() as keyof typeof stats;
      if (typeof stats[statusKey] === 'number') {
        (stats[statusKey] as number)++;
      }

      // Track wave distribution
      stats.waveBreakdown[assignment.wave] = (stats.waveBreakdown[assignment.wave] || 0) + 1;

      // Calculate response time for declined/accepted assignments
      if (assignment.respondedAt && assignment.status !== 'EXPIRED') {
        const responseTime = assignment.respondedAt.getTime() - assignment.offeredAt.getTime();
        totalResponseTime += responseTime;
        responseCount++;
      }
    });

    stats.averageResponseTime = responseCount > 0 
      ? Math.round(totalResponseTime / responseCount / 1000 * 100) / 100 // Convert to seconds
      : 0;

    return stats;
  }

  /**
   * Get online time statistics
   */
  private async getOnlineTimeStats(driverId: number, startDate: Date, endDate: Date) {
    // This is a simplified version - in a full implementation,
    // you'd track actual online/offline session times
    const driverState = await prisma.driverState.findUnique({
      where: { driverId }
    });

    const todayOnlineTime = driverState?.onlineSince 
      ? Math.max(0, Date.now() - driverState.onlineSince.getTime())
      : 0;

    return {
      estimatedOnlineTimeMs: todayOnlineTime,
      estimatedOnlineTimeHours: Math.round(todayOnlineTime / (1000 * 60 * 60) * 100) / 100,
      isCurrentlyOnline: driverState?.isOnline || false
    };
  }

  // =====================================================
  // ASSIGNMENT HISTORY
  // =====================================================

  /**
   * Get recent assignment history
   */
  private async getRecentAssignments(driverId: number, limit: number = 10) {
    const assignments = await prisma.driverAssignment.findMany({
      where: { driverId },
      include: {
        order: {
          include: {
            restaurant: { select: { name: true, address: true } }
          }
        }
      },
      orderBy: { offeredAt: 'desc' },
      take: limit
    });

    return assignments.map(assignment => ({
      assignmentId: assignment.id,
      orderId: assignment.orderId,
      status: assignment.status,
      wave: assignment.wave,
      offeredAt: assignment.offeredAt,
      respondedAt: assignment.respondedAt,
      acceptedAt: assignment.acceptedAt,
      restaurant: {
        name: assignment.order.restaurant.name,
        address: assignment.order.restaurant.address
      },
      customerAddress: assignment.order.deliveryAddress,
      estimatedEarning: assignment.order.driverEarning.toNumber(),
      orderStatus: assignment.order.status
    }));
  }

  /**
   * Get currently active assignment
   */
  private async getActiveAssignment(driverId: number) {
    const activeAssignment = await prisma.driverAssignment.findFirst({
      where: {
        driverId,
        status: 'ACCEPTED'
      },
      include: {
        order: {
          include: {
            restaurant: {
              select: { name: true, address: true, lat: true, lng: true }
            },
            customer: {
              select: { name: true, phone: true }
            }
          }
        }
      },
      orderBy: { acceptedAt: 'desc' }
    });

    if (!activeAssignment) return null;

    return {
      assignmentId: activeAssignment.id,
      orderId: activeAssignment.orderId,
      acceptedAt: activeAssignment.acceptedAt,
      order: {
        id: activeAssignment.order.id,
        status: activeAssignment.order.status,
        totalPrice: activeAssignment.order.totalPrice.toNumber(),
        driverEarning: activeAssignment.order.driverEarning.toNumber(),
        deliveryAddress: activeAssignment.order.deliveryAddress,
        deliveryInstructions: activeAssignment.order.deliveryInstructions,
        restaurant: activeAssignment.order.restaurant,
        customer: activeAssignment.order.customer,
        estimatedPickupTime: activeAssignment.order.estimatedPickupTime,
      }
    };
  }

  // =====================================================
  // PERFORMANCE METRICS
  // =====================================================

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(driverId: number, timeframe: 'today' | 'week' | 'month') {
    const { startDate, endDate } = this.getTimeframeDates(timeframe);

    const [rating, completionRate, deliveryTimes] = await Promise.all([
      this.getCurrentRating(driverId),
      this.getCompletionRate(driverId, startDate, endDate),
      this.getDeliveryTimeMetrics(driverId, startDate, endDate)
    ]);

    return {
      rating,
      completionRate,
      deliveryTimes,
      customerSatisfaction: rating >= 4.5 ? 'Excellent' : rating >= 4.0 ? 'Good' : 'Needs Improvement'
    };
  }

  /**
   * Get current driver rating
   */
  private async getCurrentRating(driverId: number) {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: { rating: true }
    });

    return driver?.rating || 5.0;
  }

  /**
   * Get completion rate for timeframe
   */
  private async getCompletionRate(driverId: number, startDate: Date, endDate: Date) {
    const [totalAssigned, completed] = await Promise.all([
      prisma.driverAssignment.count({
        where: {
          driverId,
          status: 'ACCEPTED',
          acceptedAt: { gte: startDate, lte: endDate }
        }
      }),
      prisma.order.count({
        where: {
          driverId,
          status: 'DELIVERED',
          acceptedAt: { gte: startDate, lte: endDate }
        }
      })
    ]);

    return totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100 * 100) / 100 : 100;
  }

  /**
   * Get delivery time metrics
   */
  private async getDeliveryTimeMetrics(driverId: number, startDate: Date, endDate: Date) {
    const deliveries = await prisma.order.findMany({
      where: {
        driverId,
        status: 'DELIVERED',
        pickedUpAt: { not: null },
        deliveredAt: { 
          not: null,
          gte: startDate, 
          lte: endDate 
        }
      },
      select: {
        pickedUpAt: true,
        deliveredAt: true
      }
    });

    if (deliveries.length === 0) {
      return {
        averageDeliveryTimeMinutes: 0,
        totalDeliveries: 0
      };
    }

    const deliveryTimes = deliveries
      .filter(d => d.pickedUpAt && d.deliveredAt)
      .map(d => d.deliveredAt!.getTime() - d.pickedUpAt!.getTime());

    const averageMs = deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length;
    const averageMinutes = Math.round(averageMs / (1000 * 60) * 100) / 100;

    return {
      averageDeliveryTimeMinutes: averageMinutes,
      totalDeliveries: deliveries.length
    };
  }

  /**
   * Get average delivery time for a driver
   */
  private async getAverageDeliveryTime(driverId: number, startDate: Date, endDate: Date) {
    const result = await this.getDeliveryTimeMetrics(driverId, startDate, endDate);
    return result.averageDeliveryTimeMinutes;
  }

  // =====================================================
  // EARNINGS REPORTS
  // =====================================================

  /**
   * Get detailed earnings report
   */
  async getEarningsReport(driverId: number, timeframe: 'week' | 'month' = 'week') {
    try {
      const { startDate, endDate } = this.getTimeframeDates(timeframe);

      const [orders, walletTransactions] = await Promise.all([
        prisma.order.findMany({
          where: {
            driverId,
            status: 'DELIVERED',
            deliveredAt: { gte: startDate, lte: endDate }
          },
          select: {
            id: true,
            driverEarning: true,
            deliveredAt: true,
            restaurant: { select: { name: true } }
          },
          orderBy: { deliveredAt: 'desc' }
        }),

        prisma.walletTransaction.findMany({
          where: {
            driverId,
            type: 'DRIVER_EARNING',
            createdAt: { gte: startDate, lte: endDate }
          },
          select: {
            amount: true,
            createdAt: true,
            status: true
          },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      const totalFromOrders = orders.reduce((sum, order) => 
        sum + order.driverEarning.toNumber(), 0
      );

      const totalFromWallet = walletTransactions
        .filter(tx => tx.status === 'APPROVED')
        .reduce((sum, tx) => sum + tx.amount.toNumber(), 0);

      return {
        success: true,
        data: {
          timeframe,
          period: { startDate, endDate },
          summary: {
            totalEarnings: totalFromOrders,
            totalOrders: orders.length,
            averagePerOrder: orders.length > 0 ? totalFromOrders / orders.length : 0,
            walletEarnings: totalFromWallet
          },
          orders: orders.map(order => ({
            orderId: order.id,
            restaurantName: order.restaurant.name,
            earning: order.driverEarning.toNumber(),
            deliveredAt: order.deliveredAt
          })),
          walletTransactions: walletTransactions.map(tx => ({
            amount: tx.amount.toNumber(),
            status: tx.status,
            date: tx.createdAt
          }))
        }
      };
    } catch (error) {
      console.error('Get earnings report error:', error);
      return {
        success: false,
        message: 'Failed to get earnings report',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * Get start and end dates for timeframe
   */
  private getTimeframeDates(timeframe: 'today' | 'week' | 'month') {
    const now = new Date();
    let startDate: Date;
    const endDate = new Date(now);

    switch (timeframe) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    return { startDate, endDate };
  }
}

export default new DriverDashboardService();