import { PrismaClient } from '@prisma/client';
import hybridAssignmentService from './hybridAssignmentService';

const prisma = new PrismaClient();

/**
 * AUTOMATED MAINTENANCE SERVICE
 * 
 * Handles automated cleanup and maintenance tasks for the hybrid assignment system.
 * Runs background jobs to keep the system healthy and performant.
 * 
 * Key Functions:
 * - Clean up expired assignments
 * - Maintain driver state consistency
 * - Process stale heartbeats
 * - Assignment health monitoring
 * - Database optimization tasks
 */
class MaintenanceService {

  private cleanupInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  // =====================================================
  // CONFIGURATION
  // =====================================================

  private readonly MAINTENANCE_CONFIG = {
    // Cleanup intervals (in milliseconds)
    CLEANUP_INTERVAL: 2 * 60 * 1000,      // 2 minutes
    HEARTBEAT_CHECK_INTERVAL: 5 * 60 * 1000,  // 5 minutes
    
    // Timeouts and thresholds
    DRIVER_OFFLINE_THRESHOLD: 10 * 60 * 1000,  // 10 minutes no heartbeat = offline
    ASSIGNMENT_EXPIRE_BUFFER: 30 * 1000,       // 30 seconds buffer after expiry
    STALE_ASSIGNMENT_THRESHOLD: 24 * 60 * 60 * 1000, // 24 hours
    
    // Batch processing limits
    MAX_CLEANUP_BATCH_SIZE: 100,
    MAX_DRIVER_STATE_UPDATES: 50,
  };

  // =====================================================
  // MAIN MAINTENANCE ORCHESTRATOR
  // =====================================================

  /**
   * Start automated maintenance tasks
   */
  startAutomatedMaintenance() {
    if (this.isRunning) {
      console.log('🔧 Maintenance service already running');
      return;
    }

    console.log('🚀 Starting automated maintenance service');
    this.isRunning = true;

    // Run immediate cleanup
    this.runMaintenanceCycle().catch(error => {
      console.error('Initial maintenance cycle error:', error);
    });

    // Schedule recurring maintenance
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.runMaintenanceCycle();
      } catch (error) {
        console.error('Scheduled maintenance cycle error:', error);
      }
    }, this.MAINTENANCE_CONFIG.CLEANUP_INTERVAL);

    console.log(`✅ Maintenance service started - running every ${this.MAINTENANCE_CONFIG.CLEANUP_INTERVAL / 1000}s`);
  }

  /**
   * Stop automated maintenance tasks
   */
  stopAutomatedMaintenance() {
    if (!this.isRunning) {
      console.log('🔧 Maintenance service not running');
      return;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.isRunning = false;
    console.log('🛑 Maintenance service stopped');
  }

  /**
   * Run a complete maintenance cycle
   */
  async runMaintenanceCycle() {
    const startTime = Date.now();
    console.log('🔧 Starting maintenance cycle...');

    try {
      const results = await Promise.allSettled([
        this.cleanupExpiredAssignments(),
        this.updateStaleDriverStates(),
        this.cleanupOldAssignments(),
        this.validateDriverStateConsistency(),
      ]);

      // Log results
      const duration = Date.now() - startTime;
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - successful;

      console.log(`✅ Maintenance cycle completed in ${duration}ms - ${successful}/${results.length} tasks successful`);

      if (failed > 0) {
        console.warn(`⚠️ ${failed} maintenance tasks failed`);
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Task ${index} failed:`, result.reason);
          }
        });
      }

      return {
        success: true,
        duration,
        tasksCompleted: successful,
        tasksFailed: failed
      };

    } catch (error) {
      console.error('❌ Maintenance cycle failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // =====================================================
  // ASSIGNMENT CLEANUP TASKS
  // =====================================================

  /**
   * Clean up expired assignments
   */
  private async cleanupExpiredAssignments() {
    try {
      const cutoffTime = new Date(Date.now() - this.MAINTENANCE_CONFIG.ASSIGNMENT_EXPIRE_BUFFER);

      const result = await prisma.driverAssignment.updateMany({
        where: {
          status: 'OFFERED',
          expiresAt: { lt: cutoffTime }
        },
        data: {
          status: 'EXPIRED',
          respondedAt: new Date(),
        }
      });

      if (result.count > 0) {
        console.log(`🧹 Expired ${result.count} stale assignment offers`);
      }

      return { expiredCount: result.count };
    } catch (error) {
      console.error('Cleanup expired assignments error:', error);
      throw error;
    }
  }

  /**
   * Clean up very old assignment records for database optimization
   */
  private async cleanupOldAssignments() {
    try {
      const cutoffTime = new Date(Date.now() - this.MAINTENANCE_CONFIG.STALE_ASSIGNMENT_THRESHOLD);

      const result = await prisma.driverAssignment.deleteMany({
        where: {
          status: { in: ['EXPIRED', 'DECLINED', 'COMPLETED'] },
          updatedAt: { lt: cutoffTime }
        }
      });

      if (result.count > 0) {
        console.log(`🗑️ Cleaned up ${result.count} old assignment records`);
      }

      return { cleanedCount: result.count };
    } catch (error) {
      console.error('Cleanup old assignments error:', error);
      throw error;
    }
  }

  // =====================================================
  // DRIVER STATE MAINTENANCE
  // =====================================================

  /**
   * Update stale driver states based on heartbeat activity
   */
  private async updateStaleDriverStates() {
    try {
      const offlineThreshold = new Date(Date.now() - this.MAINTENANCE_CONFIG.DRIVER_OFFLINE_THRESHOLD);

      // Find drivers that should be marked offline
      const staleDrivers = await prisma.driverState.findMany({
        where: {
          isOnline: true,
          lastHeartbeatAt: { lt: offlineThreshold }
        },
        select: { driverId: true },
        take: this.MAINTENANCE_CONFIG.MAX_DRIVER_STATE_UPDATES
      });

      if (staleDrivers.length === 0) {
        return { driversMarkedOffline: 0 };
      }

      // Mark them offline
      const result = await prisma.driverState.updateMany({
        where: {
          driverId: { in: staleDrivers.map(d => d.driverId) }
        },
        data: {
          isOnline: false,
          onlineSince: null,
        }
      });

      console.log(`📴 Marked ${result.count} drivers offline due to stale heartbeats`);

      return { driversMarkedOffline: result.count };
    } catch (error) {
      console.error('Update stale driver states error:', error);
      throw error;
    }
  }

  /**
   * Validate and fix driver state consistency issues
   */
  private async validateDriverStateConsistency() {
    try {
      // Find drivers with active assignments but no driver state record
      const driversNeedingState = await prisma.driver.findMany({
        where: {
          driverAssignments: {
            some: { status: 'ACCEPTED' }
          },
          driverState: null
        },
        select: { id: true },
        take: this.MAINTENANCE_CONFIG.MAX_DRIVER_STATE_UPDATES
      });

      // Create missing driver states
      const createdStates = [];
      for (const driver of driversNeedingState) {
        try {
          const created = await prisma.driverState.create({
            data: {
              driverId: driver.id,
              isOnline: true,
              activeAssignmentsCount: 1, // They have at least one accepted assignment
              lastHeartbeatAt: new Date(),
            }
          });
          createdStates.push(created);
        } catch (error) {
          // Driver state might have been created by another process - ignore unique constraint errors
          if (error instanceof Error && !error.message?.includes('Unique constraint')) {
            console.error(`Error creating driver state for driver ${driver.id}:`, error);
          }
        }
      }

      if (createdStates.length > 0) {
        console.log(`🔧 Created ${createdStates.length} missing driver state records`);
      }

      // Validate active assignment counts
      await this.validateActiveAssignmentCounts();

      return { 
        statesCreated: createdStates.length,
        consistencyChecksCompleted: true 
      };
    } catch (error) {
      console.error('Driver state consistency validation error:', error);
      throw error;
    }
  }

  /**
   * Validate and correct active assignment counts
   */
  private async validateActiveAssignmentCounts() {
    try {
      // Get all driver states with their actual assignment counts
      const driverStatesWithCounts = await prisma.driverState.findMany({
        select: {
          driverId: true,
          activeAssignmentsCount: true,
          driver: {
            select: {
              driverAssignments: {
                where: { status: 'ACCEPTED' },
                select: { id: true }
              }
            }
          }
        }
      });

      const updatesNeeded = [];
      for (const state of driverStatesWithCounts) {
        const actualCount = state.driver.driverAssignments.length;
        if (state.activeAssignmentsCount !== actualCount) {
          updatesNeeded.push({
            driverId: state.driverId,
            currentCount: state.activeAssignmentsCount,
            actualCount
          });
        }
      }

      // Update inconsistent counts
      let updatedCount = 0;
      for (const update of updatesNeeded) {
        await prisma.driverState.update({
          where: { driverId: update.driverId },
          data: { activeAssignmentsCount: update.actualCount }
        });
        updatedCount++;
      }

      if (updatedCount > 0) {
        console.log(`🔢 Fixed ${updatedCount} inconsistent assignment counts`);
      }

      return { countsFixed: updatedCount };
    } catch (error) {
      console.error('Assignment count validation error:', error);
      throw error;
    }
  }

  // =====================================================
  // HEALTH MONITORING
  // =====================================================

  /**
   * Get system health metrics
   */
  async getSystemHealth() {
    try {
      const [
        totalDrivers,
        onlineDrivers,
        activeAssignments,
        pendingOffers,
        expiredOffers,
        totalOrders,
        ordersNeedingDrivers
      ] = await Promise.all([
        // Total approved drivers
        prisma.driver.count({
          where: { approvalStatus: 'APPROVED' }
        }),

        // Online drivers
        prisma.driverState.count({
          where: { isOnline: true }
        }),

        // Active assignments
        prisma.driverAssignment.count({
          where: { status: 'ACCEPTED' }
        }),

        // Pending offers
        prisma.driverAssignment.count({
          where: { 
            status: 'OFFERED',
            expiresAt: { gt: new Date() }
          }
        }),

        // Expired offers
        prisma.driverAssignment.count({
          where: { status: 'EXPIRED' }
        }),

        // Total orders today
        prisma.order.count({
          where: {
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        }),

        // Orders needing drivers
        prisma.order.count({
          where: {
            status: { in: ['PREPARING', 'READY'] },
            driverId: null
          }
        })
      ]);

      const driverUtilization = totalDrivers > 0 ? (onlineDrivers / totalDrivers * 100) : 0;
      const assignmentEfficiency = (pendingOffers + activeAssignments) > 0 
        ? (activeAssignments / (pendingOffers + activeAssignments) * 100) 
        : 100;

      return {
        timestamp: new Date().toISOString(),
        drivers: {
          total: totalDrivers,
          online: onlineDrivers,
          utilization: Math.round(driverUtilization * 100) / 100
        },
        assignments: {
          active: activeAssignments,
          pendingOffers,
          expired: expiredOffers,
          efficiency: Math.round(assignmentEfficiency * 100) / 100
        },
        orders: {
          total: totalOrders,
          needingDrivers: ordersNeedingDrivers
        },
        systemHealth: {
          status: ordersNeedingDrivers > 5 ? 'WARNING' : 'HEALTHY',
          maintenanceRunning: this.isRunning
        }
      };
    } catch (error) {
      console.error('Get system health error:', error);
      return {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        systemHealth: {
          status: 'ERROR',
          maintenanceRunning: this.isRunning
        }
      };
    }
  }

  /**
   * Run emergency cleanup (for critical system issues)
   */
  async emergencyCleanup() {
    try {
      console.log('🚨 Running emergency cleanup...');

      const results = await Promise.allSettled([
        // Force expire ALL pending offers
        prisma.driverAssignment.updateMany({
          where: { status: 'OFFERED' },
          data: { 
            status: 'EXPIRED',
            respondedAt: new Date()
          }
        }),

        // Reset all driver states to consistent state
        prisma.driverState.updateMany({
          where: {},
          data: {
            activeAssignmentsCount: 0,
            isOnline: false,
            onlineSince: null
          }
        }),

        // Clean up very old records (last 7 days)
        prisma.driverAssignment.deleteMany({
          where: {
            status: { in: ['EXPIRED', 'DECLINED'] },
            updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        })
      ]);

      console.log('✅ Emergency cleanup completed');
      return {
        success: true,
        results: results.map(r => r.status === 'fulfilled' ? 'success' : 'failed')
      };
    } catch (error) {
      console.error('❌ Emergency cleanup failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // =====================================================
  // MANUAL MAINTENANCE TRIGGERS
  // =====================================================

  /**
   * Manual trigger for immediate maintenance (admin use)
   */
  async runManualMaintenance() {
    console.log('🔧 Manual maintenance triggered');
    return await this.runMaintenanceCycle();
  }

  /**
   * Check if maintenance service is running
   */
  isMaintenanceRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get maintenance service status
   */
  getMaintenanceStatus() {
    return {
      isRunning: this.isRunning,
      cleanupInterval: this.MAINTENANCE_CONFIG.CLEANUP_INTERVAL,
      lastRunTime: new Date().toISOString(),
      config: this.MAINTENANCE_CONFIG
    };
  }
}

export default new MaintenanceService();