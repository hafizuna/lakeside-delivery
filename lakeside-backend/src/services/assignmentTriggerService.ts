import { PrismaClient, OrderStatus } from '@prisma/client';
import hybridAssignmentService from './hybridAssignmentService';
import socketService from './socketService';
import { AssignmentOfferEvent } from '../types/driverAssignment';

const prisma = new PrismaClient();

/**
 * AUTOMATIC ASSIGNMENT TRIGGER SERVICE
 * 
 * This service automatically creates driver assignment offers when orders
 * transition to specific statuses, seamlessly integrating the hybrid system
 * with the existing restaurant workflow.
 * 
 * Key Integration Points:
 * - PREPARING: Creates initial wave of assignment offers
 * - READY: Escalates if no driver assigned yet
 * - Restaurant status updates trigger assignment workflow
 */
class AssignmentTriggerService {

  // =====================================================
  // CONFIGURATION
  // =====================================================

  private readonly ASSIGNMENT_CONFIG = {
    // When to trigger assignments
    TRIGGER_STATUSES: ['PREPARING', 'READY'] as OrderStatus[],
    
    // TTL settings per status
    TTL_SECONDS: {
      PREPARING: 30,  // Early assignment with 30s TTL
      READY: 20,      // Urgent assignment with shorter TTL
    } as Record<OrderStatus, number>,
    
    // Driver selection limits per wave
    DRIVERS_PER_WAVE: {
      PREPARING: 3,   // Start with 3 best drivers
      READY: 5,       // Expand to 5 drivers if urgent
    } as Record<OrderStatus, number>,
    
    // Auto-escalation settings
    ESCALATION_INTERVAL: 45, // seconds between waves
    MAX_WAVES: 3,
  };

  // =====================================================
  // MAIN TRIGGER LOGIC
  // =====================================================

  /**
   * Handle order status change and trigger assignments if needed
   * This is the main integration point with restaurant workflow
   */
  async handleOrderStatusChange(orderId: number, newStatus: OrderStatus, previousStatus?: OrderStatus) {
    try {
      console.log(`🎯 [ASSIGNMENT-TRIGGER] Order ${orderId} changed from ${previousStatus} to ${newStatus}`);
      console.log(`🎯 [ASSIGNMENT-TRIGGER] Current timestamp: ${new Date().toISOString()}`);

      // Only process relevant status transitions
      if (!this.shouldTriggerAssignment(newStatus, previousStatus)) {
        console.log(`⏭️ [ASSIGNMENT-TRIGGER] Skipping assignment trigger for status: ${newStatus}`);
        return { success: true, message: 'No assignment trigger needed' };
      }
      
      console.log(`✅ [ASSIGNMENT-TRIGGER] Status change qualifies for assignment trigger`);
      console.log(`📋 [ASSIGNMENT-TRIGGER] Trigger statuses: ${this.ASSIGNMENT_CONFIG.TRIGGER_STATUSES.join(', ')}`);
      console.log(`🔍 [ASSIGNMENT-TRIGGER] Should trigger for ${newStatus}: ${this.ASSIGNMENT_CONFIG.TRIGGER_STATUSES.includes(newStatus)}`);
      console.log(`🔍 [ASSIGNMENT-TRIGGER] Previous status was: ${previousStatus}`);
      console.log(`⚙️ [ASSIGNMENT-TRIGGER] READY always triggers: ${newStatus === 'READY'}`);
      console.log(`⚙️ [ASSIGNMENT-TRIGGER] PREPARING triggers when not from PREPARING: ${newStatus === 'PREPARING' && previousStatus !== 'PREPARING'}`);
      

      // Get order details for assignment
      const order = await this.getOrderForAssignment(orderId);
      if (!order) {
        console.log(`❌ Order ${orderId} not found or not eligible for assignment`);
        return { success: false, message: 'Order not eligible for assignment' };
      }

      // Check if order is already assigned
      if (order.driverId) {
        console.log(`✅ Order ${orderId} already assigned to driver ${order.driverId}`);
        return { success: true, message: 'Order already assigned' };
      }

      // Trigger assignment process
      await this.triggerAssignmentProcess(order, newStatus);

      return { success: true, message: 'Assignment process triggered successfully' };

    } catch (error) {
      console.error('Assignment trigger error:', error);
      return {
        success: false,
        message: 'Failed to trigger assignment process',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Determine if assignment should be triggered based on status change
   */
  private shouldTriggerAssignment(newStatus: OrderStatus, previousStatus?: OrderStatus): boolean {
    // Must be a trigger status
    if (!this.ASSIGNMENT_CONFIG.TRIGGER_STATUSES.includes(newStatus)) {
      return false;
    }

    // PREPARING: Trigger on first entry or re-entry
    if (newStatus === 'PREPARING') {
      return previousStatus !== 'PREPARING'; // Avoid duplicate triggers
    }

    // READY: Always trigger (escalation scenario)
    if (newStatus === 'READY') {
      return true;
    }

    return false;
  }

  /**
   * Get order details needed for assignment process
   */
  private async getOrderForAssignment(orderId: number) {
    try {
      return await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
              lat: true,
              lng: true,
            }
          },
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            }
          }
        }
      });
    } catch (error) {
      console.error('Get order for assignment error:', error);
      return null;
    }
  }

  // =====================================================
  // ASSIGNMENT PROCESS
  // =====================================================

  /**
   * Main assignment process - finds drivers and creates offers
   */
  private async triggerAssignmentProcess(order: any, status: OrderStatus) {
    try {
      console.log(`🚀 Starting assignment process for Order ${order.id} (${status})`);

      // Find available drivers
      const maxDrivers = this.ASSIGNMENT_CONFIG.DRIVERS_PER_WAVE[status] || 3;
      console.log(`🔍 [ASSIGNMENT-TRIGGER] Looking for available drivers. Max: ${maxDrivers}, Status: ${status}`);
      
      const availableDrivers = await hybridAssignmentService.findAvailableDrivers(order.id, maxDrivers);
      console.log(`📊 [ASSIGNMENT-TRIGGER] Driver search results: ${availableDrivers.length} drivers found`);
      
      if (availableDrivers.length > 0) {
        console.log(`👥 [ASSIGNMENT-TRIGGER] Available drivers:`);
        availableDrivers.forEach((driver, index) => {
          console.log(`   ${index + 1}. Driver ${driver.driverId} (${driver.name}) - Rating: ${driver.rating}, Online: ${driver.isOnline}, Active assignments: ${driver.activeAssignmentsCount}/${driver.maxConcurrentAssignments}`);
        });
      }

      if (availableDrivers.length === 0) {
        console.log(`❌ [ASSIGNMENT-TRIGGER] No available drivers found for Order ${order.id}`);
        console.log(`⏰ [ASSIGNMENT-TRIGGER] Scheduling escalation for later...`);
        await this.scheduleEscalation(order.id, status);
        return;
      }

      // Create TTL offers
      const ttlSeconds = this.ASSIGNMENT_CONFIG.TTL_SECONDS[status] || 30;
      const wave = await this.determineWaveNumber(order.id);

      const assignmentResult = await hybridAssignmentService.createOffers({
        orderId: order.id,
        driverIds: availableDrivers.map(d => d.driverId),
        expiresInSeconds: ttlSeconds,
        wave: wave
      });

      if (assignmentResult.success) {
        console.log(`✅ Created ${assignmentResult.assignmentsCreated} assignment offers for Order ${order.id}`);

        // Send real-time notifications to drivers
        await this.notifyDriversOfAssignment(order, assignmentResult.assignments, ttlSeconds);

        // Schedule cleanup and escalation
        setTimeout(() => {
          this.cleanupAndEscalate(order.id, wave);
        }, ttlSeconds * 1000 + 5000); // 5 seconds buffer after TTL expiry

      } else {
        console.log(`❌ Failed to create assignment offers for Order ${order.id}`);
      }

    } catch (error) {
      console.error('Assignment process error:', error);
    }
  }

  /**
   * Determine wave number for this order
   */
  private async determineWaveNumber(orderId: number): Promise<number> {
    try {
      const lastAssignment = await prisma.driverAssignment.findFirst({
        where: { orderId },
        orderBy: { wave: 'desc' }
      });

      return (lastAssignment?.wave || 0) + 1;
    } catch (error) {
      console.error('Determine wave number error:', error);
      return 1;
    }
  }

  // =====================================================
  // REAL-TIME NOTIFICATIONS
  // =====================================================

  /**
   * Send real-time notifications to drivers about new assignment offers
   */
  private async notifyDriversOfAssignment(order: any, assignments: any[], ttlSeconds: number) {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      for (const assignment of assignments) {
        // Create order object matching driver app's expected structure
        const orderForDriver = {
          id: order.id,
          orderNumber: `ORD-${order.id.toString().padStart(6, '0')}`,
          restaurantName: order.restaurant.name,
          restaurantAddress: order.restaurant.address,
          restaurantLat: order.restaurant.lat?.toNumber() || 0,
          restaurantLng: order.restaurant.lng?.toNumber() || 0,
          customerName: order.customer?.name || 'Customer',
          deliveryAddress: order.deliveryAddress,
          deliveryLat: order.deliveryLat?.toNumber() || 0,
          deliveryLng: order.deliveryLng?.toNumber() || 0,
          totalAmount: order.totalPrice?.toNumber() || 0,
          deliveryFee: order.deliveryFee?.toNumber() || 0,
          driverEarning: order.driverEarning?.toNumber() || 0,
          estimatedPickupTime: order.estimatedPickupTime?.toISOString(),
          estimatedDeliveryTime: order.estimatedDeliveryTime?.toISOString(),
          items: order.items ? order.items.map((item: any) => ({
            itemName: item.itemName || item.name || 'Item',
            quantity: item.quantity,
            price: item.price?.toNumber ? item.price.toNumber() : item.price || 0
          })) : [] // Map actual order items to expected structure
        };

        const offerEvent: AssignmentOfferEvent = {
          type: 'ASSIGNMENT_OFFER',
          assignmentId: assignment.id,
          orderId: order.id,
          restaurantName: order.restaurant.name,
          restaurantAddress: order.restaurant.address,
          customerAddress: order.deliveryAddress,
          deliveryDistance: order.deliveryDistance?.toNumber() || 0,
          estimatedEarning: order.driverEarning.toNumber(),
          expiresAt: expiresAt,
          secondsRemaining: ttlSeconds,
          wave: assignment.wave,
          // Add the complete order object
          order: orderForDriver,
        };

        // Send Socket.IO notification to specific driver
        console.log(`🔊 [SOCKET-EMIT] Sending 'offer_received' event to driver ${assignment.driverId}`);
        console.log(`📱 [SOCKET-EMIT] Event data:`, {
          eventType: 'offer_received',
          assignmentId: offerEvent.assignmentId,
          orderId: offerEvent.orderId,
          restaurantName: offerEvent.restaurantName,
          estimatedEarning: offerEvent.estimatedEarning,
          expiresAt: offerEvent.expiresAt,
          secondsRemaining: offerEvent.secondsRemaining
        });
        
        socketService.emitToDriver(assignment.driverId, 'offer_received', offerEvent);
        console.log(`✅ [SOCKET-EMIT] Socket emission completed for driver ${assignment.driverId}`);
        console.log(`📱 [ASSIGNMENT-TRIGGER] Assignment offer sent to driver ${assignment.driverId} for order ${order.id}`);
      }

    } catch (error) {
      console.error('Notify drivers error:', error);
    }
  }

  // =====================================================
  // ESCALATION AND CLEANUP
  // =====================================================

  /**
   * Schedule escalation for unassigned orders
   */
  private async scheduleEscalation(orderId: number, currentStatus: OrderStatus) {
    try {
      console.log(`⏰ Scheduling escalation for Order ${orderId} in ${this.ASSIGNMENT_CONFIG.ESCALATION_INTERVAL} seconds`);

      setTimeout(async () => {
        // Check if order still needs assignment
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { driverId: true, status: true }
        });

        if (!order || order.driverId) {
          console.log(`✅ Order ${orderId} already assigned, skipping escalation`);
          return;
        }

        // Escalate to next wave or status
        if (currentStatus === 'PREPARING') {
          // Try escalating to READY status assignment
          console.log(`🔄 Escalating Order ${orderId} to READY assignment`);
          await this.handleOrderStatusChange(orderId, 'READY', currentStatus);
        } else {
          console.log(`🆘 Order ${orderId} failed final escalation - may need manual intervention`);
        }

      }, this.ASSIGNMENT_CONFIG.ESCALATION_INTERVAL * 1000);

    } catch (error) {
      console.error('Schedule escalation error:', error);
    }
  }

  /**
   * Cleanup expired assignments and potentially escalate
   */
  private async cleanupAndEscalate(orderId: number, currentWave: number) {
    try {
      console.log(`🧹 Cleaning up assignments for Order ${orderId}, Wave ${currentWave}`);

      // Cleanup expired assignments
      await hybridAssignmentService.cleanupExpiredAssignments();

      // Check if order still needs assignment
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { driverId: true, status: true }
      });

      if (!order || order.driverId) {
        console.log(`✅ Order ${orderId} assigned during cleanup, no escalation needed`);
        return;
      }

      // Escalate if within wave limit
      if (currentWave < this.ASSIGNMENT_CONFIG.MAX_WAVES) {
        console.log(`🔄 Escalating Order ${orderId} to Wave ${currentWave + 1}`);
        await this.triggerAssignmentProcess(
          await this.getOrderForAssignment(orderId),
          order.status as OrderStatus
        );
      } else {
        console.log(`🆘 Order ${orderId} exceeded max waves (${this.ASSIGNMENT_CONFIG.MAX_WAVES})`);
      }

    } catch (error) {
      console.error('Cleanup and escalate error:', error);
    }
  }

  // =====================================================
  // UTILITY AND STATUS
  // =====================================================

  /**
   * Get assignment status for an order
   */
  async getOrderAssignmentStatus(orderId: number) {
    try {
      const assignments = await prisma.driverAssignment.findMany({
        where: { orderId },
        orderBy: { createdAt: 'desc' },
        include: {
          driver: {
            include: { user: { select: { name: true } } }
          }
        }
      });

      const activeAssignment = assignments.find(a => a.status === 'ACCEPTED');
      const totalOffers = assignments.length;
      const maxWave = Math.max(...assignments.map(a => a.wave), 0);

      return {
        orderId,
        hasActiveAssignment: !!activeAssignment,
        activeDriver: activeAssignment ? {
          id: activeAssignment.driverId,
          name: activeAssignment.driver.user.name
        } : null,
        totalOffers,
        currentWave: maxWave,
        assignments: assignments.map(a => ({
          id: a.id,
          driverId: a.driverId,
          driverName: a.driver.user.name,
          status: a.status,
          wave: a.wave,
          offeredAt: a.offeredAt,
          respondedAt: a.respondedAt,
        }))
      };

    } catch (error) {
      console.error('Get assignment status error:', error);
      return null;
    }
  }

  /**
   * Manual trigger for testing/admin use
   */
  async manualTriggerAssignment(orderId: number, forceStatus?: OrderStatus) {
    try {
      const order = await this.getOrderForAssignment(orderId);
      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      const status = forceStatus || order.status as OrderStatus;
      await this.triggerAssignmentProcess(order, status);

      return { success: true, message: 'Assignment manually triggered' };

    } catch (error) {
      console.error('Manual trigger error:', error);
      return {
        success: false,
        message: 'Failed to manually trigger assignment',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default new AssignmentTriggerService();