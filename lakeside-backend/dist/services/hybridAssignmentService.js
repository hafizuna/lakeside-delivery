"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * HYBRID DRIVER ASSIGNMENT SERVICE
 *
 * This service manages the advanced driver assignment system while maintaining
 * full backwards compatibility with the existing order status flow.
 *
 * Key Features:
 * - TTL-based assignment offers with expiration
 * - Atomic acceptance with race condition protection
 * - Wave escalation for unassigned orders
 * - Real-time driver state management
 * - Full synchronization with existing orders table
 */
class HybridAssignmentService {
    // =====================================================
    // DRIVER STATE MANAGEMENT
    // =====================================================
    /**
     * Initialize or update driver online state
     */
    async updateDriverState(driverId, updates) {
        try {
            const now = new Date();
            const driverState = await prisma.driverState.upsert({
                where: { driverId },
                create: {
                    driverId,
                    isOnline: updates.isOnline ?? false,
                    maxConcurrentAssignments: updates.maxConcurrentAssignments ?? 1,
                    currentZoneId: updates.currentZoneId,
                    onlineSince: updates.isOnline ? now : null,
                    lastHeartbeatAt: now,
                    lastLocationUpdate: now,
                },
                update: {
                    isOnline: updates.isOnline ?? undefined,
                    maxConcurrentAssignments: updates.maxConcurrentAssignments ?? undefined,
                    currentZoneId: updates.currentZoneId,
                    onlineSince: updates.isOnline === true ? now : updates.isOnline === false ? null : undefined,
                    lastHeartbeatAt: now,
                    updatedAt: now,
                },
            });
            return {
                success: true,
                driverState,
                message: `Driver state updated successfully`
            };
        }
        catch (error) {
            console.error('Update driver state error:', error);
            return {
                success: false,
                message: 'Failed to update driver state',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Process driver heartbeat and location update
     */
    async processDriverHeartbeat(request) {
        try {
            const now = new Date();
            // Update driver location in main drivers table
            if (request.currentLat && request.currentLng) {
                await prisma.driver.update({
                    where: { id: request.driverId },
                    data: {
                        currentLat: request.currentLat,
                        currentLng: request.currentLng,
                    },
                });
            }
            // Update driver state heartbeat
            const driverState = await prisma.driverState.upsert({
                where: { driverId: request.driverId },
                create: {
                    driverId: request.driverId,
                    isOnline: true,
                    lastHeartbeatAt: now,
                    lastLocationUpdate: now,
                    currentZoneId: request.currentZoneId,
                },
                update: {
                    lastHeartbeatAt: now,
                    lastLocationUpdate: now,
                    currentZoneId: request.currentZoneId,
                    updatedAt: now,
                },
            });
            return {
                success: true,
                driverState,
                message: 'Heartbeat processed successfully'
            };
        }
        catch (error) {
            console.error('Process heartbeat error:', error);
            return {
                success: false,
                message: 'Failed to process heartbeat',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // =====================================================
    // ASSIGNMENT CREATION (TTL OFFERS)
    // =====================================================
    /**
     * Find available drivers for order assignment
     */
    async findAvailableDrivers(orderId, maxDrivers = 5) {
        try {
            console.log(`🔍 [HYBRID-ASSIGNMENT] Finding available drivers for order ${orderId}, maxDrivers: ${maxDrivers}`);
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { restaurant: true }
            });
            if (!order || !order.restaurant) {
                console.log(`❌ [HYBRID-ASSIGNMENT] Order ${orderId} or restaurant not found`);
                throw new Error('Order or restaurant not found');
            }
            console.log(`📦 [HYBRID-ASSIGNMENT] Order found: ${order.id} from restaurant ${order.restaurant.name}`);
            console.log(`📍 [HYBRID-ASSIGNMENT] Restaurant location: ${order.restaurant.address}`);
            console.log(`🎯 [HYBRID-ASSIGNMENT] Order status: ${order.status}, Total: $${order.totalPrice}`);
            // Query available drivers with hybrid system state
            console.log(`🔍 [HYBRID-ASSIGNMENT] Querying database for available drivers...`);
            const heartbeatCutoff = new Date(Date.now() - 5 * 60 * 1000);
            console.log(`⏰ [HYBRID-ASSIGNMENT] Heartbeat cutoff time: ${heartbeatCutoff.toISOString()} (5 minutes ago)`);
            const drivers = await prisma.driver.findMany({
                where: {
                    approvalStatus: 'APPROVED',
                    user: {
                        status: 'ACTIVE'
                    },
                    driverState: {
                        isOnline: true,
                        activeAssignmentsCount: {
                            lt: 99 // Will be properly filtered by the map below
                        },
                        lastHeartbeatAt: {
                            gte: heartbeatCutoff // Active in last 5 minutes
                        }
                    }
                },
                include: {
                    user: true,
                    driverState: true,
                },
                take: maxDrivers,
                orderBy: [
                    { rating: 'desc' },
                    { totalDeliveries: 'desc' }
                ]
            });
            console.log(`📊 [HYBRID-ASSIGNMENT] Database query returned ${drivers.length} potential drivers`);
            if (drivers.length > 0) {
                console.log(`👥 [HYBRID-ASSIGNMENT] Raw driver results from database:`);
                drivers.forEach((driver, index) => {
                    const state = driver.driverState;
                    console.log(`   ${index + 1}. Driver ${driver.id} (${driver.user.name}) - Phone: ${driver.user.phone}`);
                    console.log(`       - Approval: ${driver.approvalStatus}, User Status: ${driver.user.status}`);
                    console.log(`       - Online: ${state?.isOnline}, Active assignments: ${state?.activeAssignmentsCount || 0}/${state?.maxConcurrentAssignments || 1}`);
                    console.log(`       - Last heartbeat: ${state?.lastHeartbeatAt || 'Never'}`);
                    console.log(`       - Rating: ${driver.rating}, Total deliveries: ${driver.totalDeliveries}`);
                });
            }
            else {
                console.log(`⚠️ [HYBRID-ASSIGNMENT] No drivers found in database query - checking why:`);
                // Debug: Check how many drivers exist at all
                const totalDrivers = await prisma.driver.count();
                console.log(`📊 [DEBUG] Total drivers in system: ${totalDrivers}`);
                const approvedDrivers = await prisma.driver.count({ where: { approvalStatus: 'APPROVED' } });
                console.log(`📊 [DEBUG] Approved drivers: ${approvedDrivers}`);
                const activeUsers = await prisma.driver.count({
                    where: {
                        approvalStatus: 'APPROVED',
                        user: { status: 'ACTIVE' }
                    }
                });
                console.log(`📊 [DEBUG] Approved drivers with active user accounts: ${activeUsers}`);
                const onlineDrivers = await prisma.driver.count({
                    where: {
                        approvalStatus: 'APPROVED',
                        user: { status: 'ACTIVE' },
                        driverState: { isOnline: true }
                    }
                });
                console.log(`📊 [DEBUG] Online drivers: ${onlineDrivers}`);
                const recentHeartbeatDrivers = await prisma.driver.count({
                    where: {
                        approvalStatus: 'APPROVED',
                        user: { status: 'ACTIVE' },
                        driverState: {
                            isOnline: true,
                            lastHeartbeatAt: { gte: heartbeatCutoff }
                        }
                    }
                });
                console.log(`📊 [DEBUG] Drivers with recent heartbeat (last 5 min): ${recentHeartbeatDrivers}`);
            }
            const availableDrivers = drivers
                .filter(driver => {
                const state = driver.driverState;
                return state && state.activeAssignmentsCount < state.maxConcurrentAssignments;
            })
                .map(driver => ({
                driverId: driver.id,
                name: driver.user.name,
                currentLat: driver.currentLat?.toNumber(),
                currentLng: driver.currentLng?.toNumber(),
                rating: driver.rating || 5.0,
                totalDeliveries: driver.totalDeliveries,
                completionRate: driver.completionRate || 100.0,
                currentZoneId: driver.driverState?.currentZoneId || undefined,
                activeAssignmentsCount: driver.driverState?.activeAssignmentsCount || 0,
                maxConcurrentAssignments: driver.driverState?.maxConcurrentAssignments || 1,
                isOnline: driver.driverState?.isOnline || false,
                lastHeartbeatAt: driver.driverState?.lastHeartbeatAt || undefined,
            }));
            return availableDrivers;
        }
        catch (error) {
            console.error('Find available drivers error:', error);
            return [];
        }
    }
    /**
     * Create TTL-based assignment offers for multiple drivers
     */
    async createOffers(request) {
        try {
            const { orderId, driverIds, expiresInSeconds = 30, wave = 1 } = request;
            const now = new Date();
            const expiresAt = new Date(now.getTime() + (expiresInSeconds * 1000));
            // Verify order exists and is in correct state
            const order = await prisma.order.findUnique({
                where: { id: orderId }
            });
            if (!order) {
                return {
                    success: false,
                    assignmentsCreated: 0,
                    assignments: [],
                    expiresAt,
                    wave
                };
            }
            if (order.status !== 'PREPARING') {
                return {
                    success: false,
                    assignmentsCreated: 0,
                    assignments: [],
                    expiresAt,
                    wave
                };
            }
            // Create assignments for all drivers
            const assignmentPromises = driverIds.map(driverId => prisma.driverAssignment.create({
                data: {
                    orderId,
                    driverId,
                    status: 'OFFERED',
                    wave,
                    offeredAt: now,
                    expiresAt,
                }
            }));
            const assignments = await Promise.all(assignmentPromises);
            return {
                success: true,
                assignmentsCreated: assignments.length,
                assignments: assignments.map(assignment => ({
                    id: assignment.id,
                    orderId: assignment.orderId,
                    driverId: assignment.driverId,
                    status: assignment.status,
                    wave: assignment.wave,
                    offeredAt: assignment.offeredAt,
                    respondedAt: assignment.respondedAt,
                    acceptedAt: assignment.acceptedAt,
                    expiresAt: assignment.expiresAt,
                    reason: assignment.reason,
                    createdAt: assignment.createdAt,
                    updatedAt: assignment.updatedAt,
                })),
                expiresAt,
                wave
            };
        }
        catch (error) {
            console.error('Create offers error:', error);
            return {
                success: false,
                assignmentsCreated: 0,
                assignments: [],
                expiresAt: new Date(),
                wave: 1
            };
        }
    }
    // =====================================================
    // ASSIGNMENT ACCEPTANCE (ATOMIC OPERATIONS)
    // =====================================================
    /**
     * Accept assignment offer with atomic transaction
     * This is the critical method that synchronizes the hybrid system with existing orders
     */
    async acceptOffer(request) {
        const { assignmentId, driverId } = request;
        const now = new Date();
        try {
            // Use transaction for atomic operations
            const result = await prisma.$transaction(async (tx) => {
                // 1. Verify and accept the specific assignment
                const assignment = await tx.driverAssignment.findUnique({
                    where: { id: assignmentId },
                    include: { order: true }
                });
                if (!assignment) {
                    throw new Error('Assignment not found');
                }
                if (assignment.driverId !== driverId) {
                    throw new Error('Assignment does not belong to this driver');
                }
                if (assignment.status !== 'OFFERED') {
                    throw new Error(`Assignment already ${assignment.status.toLowerCase()}`);
                }
                if (assignment.expiresAt && assignment.expiresAt < now) {
                    throw new Error('Assignment has expired');
                }
                // 2. Check if order is still available (race condition protection)
                if (assignment.order.driverId) {
                    throw new Error('Order has already been assigned to another driver');
                }
                // 3. Accept this assignment
                const acceptedAssignment = await tx.driverAssignment.update({
                    where: { id: assignmentId },
                    data: {
                        status: 'ACCEPTED',
                        respondedAt: now,
                        acceptedAt: now,
                    }
                });
                // 4. CRITICAL: Sync with existing orders table (backwards compatibility)
                await tx.order.update({
                    where: { id: assignment.orderId },
                    data: {
                        driverId: driverId,
                        driverAssignedAt: now,
                    }
                });
                // 5. Update driver state (increment active assignments)
                await tx.driverState.upsert({
                    where: { driverId },
                    create: {
                        driverId,
                        isOnline: true,
                        activeAssignmentsCount: 1,
                        lastHeartbeatAt: now,
                    },
                    update: {
                        activeAssignmentsCount: {
                            increment: 1
                        },
                        updatedAt: now,
                    }
                });
                // 6. Expire all other offers for this order
                const expiredCount = await tx.driverAssignment.updateMany({
                    where: {
                        orderId: assignment.orderId,
                        id: { not: assignmentId },
                        status: 'OFFERED'
                    },
                    data: {
                        status: 'EXPIRED',
                        respondedAt: now,
                    }
                });
                return {
                    acceptedAssignment,
                    expiredCount: expiredCount.count
                };
            });
            return {
                success: true,
                assignment: {
                    id: result.acceptedAssignment.id,
                    orderId: result.acceptedAssignment.orderId,
                    driverId: result.acceptedAssignment.driverId,
                    status: result.acceptedAssignment.status,
                    wave: result.acceptedAssignment.wave,
                    offeredAt: result.acceptedAssignment.offeredAt,
                    respondedAt: result.acceptedAssignment.respondedAt,
                    acceptedAt: result.acceptedAssignment.acceptedAt,
                    expiresAt: result.acceptedAssignment.expiresAt,
                    reason: result.acceptedAssignment.reason,
                    createdAt: result.acceptedAssignment.createdAt,
                    updatedAt: result.acceptedAssignment.updatedAt,
                },
                orderUpdated: true,
                driverStateUpdated: true,
                otherAssignmentsExpired: result.expiredCount
            };
        }
        catch (error) {
            console.error('Accept offer error:', error);
            return {
                success: false,
                assignment: {},
                orderUpdated: false,
                driverStateUpdated: false,
                otherAssignmentsExpired: 0
            };
        }
    }
    // =====================================================
    // ORDER LIFECYCLE SYNCHRONIZATION
    // =====================================================
    /**
     * Complete assignment when order is delivered (sync point)
     */
    async completeAssignment(orderId) {
        try {
            const now = new Date();
            // Find active assignment for this order
            const assignment = await prisma.driverAssignment.findFirst({
                where: {
                    orderId,
                    status: 'ACCEPTED'
                }
            });
            if (!assignment) {
                return { success: true, message: 'No active assignment to complete' };
            }
            await prisma.$transaction(async (tx) => {
                // Mark assignment as completed
                await tx.driverAssignment.update({
                    where: { id: assignment.id },
                    data: {
                        status: 'COMPLETED',
                        updatedAt: now,
                    }
                });
                // Release driver capacity
                await tx.driverState.update({
                    where: { driverId: assignment.driverId },
                    data: {
                        activeAssignmentsCount: {
                            decrement: 1
                        },
                        updatedAt: now,
                    }
                });
            });
            return {
                success: true,
                message: 'Assignment completed successfully'
            };
        }
        catch (error) {
            console.error('Complete assignment error:', error);
            return {
                success: false,
                message: 'Failed to complete assignment',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // =====================================================
    // CLEANUP AND MAINTENANCE
    // =====================================================
    /**
     * Clean up expired assignments
     */
    async cleanupExpiredAssignments() {
        try {
            const now = new Date();
            const expiredCount = await prisma.driverAssignment.updateMany({
                where: {
                    status: 'OFFERED',
                    expiresAt: { lt: now }
                },
                data: {
                    status: 'EXPIRED',
                    respondedAt: now,
                }
            });
            return {
                success: true,
                expiredCount: expiredCount.count,
                message: `Expired ${expiredCount.count} assignments`
            };
        }
        catch (error) {
            console.error('Cleanup expired assignments error:', error);
            return {
                success: false,
                expiredCount: 0,
                message: 'Failed to cleanup expired assignments'
            };
        }
    }
    /**
     * Get driver's current offers
     */
    async getDriverOffers(driverId) {
        try {
            const now = new Date();
            const offers = await prisma.driverAssignment.findMany({
                where: {
                    driverId,
                    status: 'OFFERED',
                    expiresAt: { gt: now }
                },
                include: {
                    order: {
                        include: {
                            restaurant: true
                        }
                    }
                },
                orderBy: {
                    offeredAt: 'desc'
                }
            });
            const formattedOffers = offers.map(offer => ({
                assignmentId: offer.id,
                orderId: offer.orderId,
                restaurantName: offer.order.restaurant.name,
                restaurantAddress: offer.order.restaurant.address,
                customerAddress: offer.order.deliveryAddress,
                deliveryDistance: offer.order.deliveryDistance?.toNumber() || 0,
                estimatedEarning: offer.order.driverEarning.toNumber(),
                expiresAt: offer.expiresAt,
                secondsRemaining: Math.max(0, Math.floor((offer.expiresAt.getTime() - now.getTime()) / 1000)),
                wave: offer.wave,
            }));
            return {
                success: true,
                offers: formattedOffers
            };
        }
        catch (error) {
            console.error('Get driver offers error:', error);
            return {
                success: false,
                offers: []
            };
        }
    }
    // =====================================================
    // ENHANCED WAVE ESCALATION SYSTEM
    // =====================================================
    /**
     * Get assignment wave configuration based on order urgency and wave number
     */
    getWaveEscalationConfig(orderId, currentWave) {
        // Dynamic configuration based on wave progression
        const baseConfig = {
            wave1: { driverCount: 3, ttlSeconds: 30, radiusKm: 3 },
            wave2: { driverCount: 5, ttlSeconds: 25, radiusKm: 5 },
            wave3: { driverCount: 8, ttlSeconds: 20, radiusKm: 10 },
            wave4: { driverCount: 12, ttlSeconds: 15, radiusKm: 15 }
        };
        const waveKey = `wave${Math.min(currentWave, 4)}`;
        return baseConfig[waveKey] || baseConfig.wave4;
    }
    /**
     * Enhanced driver finding with wave-based radius expansion and scoring
     */
    async findAvailableDriversForWave(orderId, wave, maxDrivers = 5) {
        try {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                include: { restaurant: true }
            });
            if (!order || !order.restaurant) {
                throw new Error('Order or restaurant not found');
            }
            const waveConfig = this.getWaveEscalationConfig(orderId, wave);
            const expandedDriverCount = Math.min(maxDrivers, waveConfig.driverCount);
            console.log(`🌊 Wave ${wave} driver search: ${expandedDriverCount} drivers, ${waveConfig.radiusKm}km radius`);
            // Get previously assigned drivers for this order to exclude them
            const previousAssignments = await prisma.driverAssignment.findMany({
                where: {
                    orderId,
                    status: { in: ['OFFERED', 'DECLINED', 'EXPIRED'] }
                },
                select: { driverId: true }
            });
            const excludedDriverIds = previousAssignments.map(a => a.driverId);
            // Enhanced query with wave-based filtering
            const drivers = await prisma.driver.findMany({
                where: {
                    approvalStatus: 'APPROVED',
                    user: { status: 'ACTIVE' },
                    id: excludedDriverIds.length > 0 ? { notIn: excludedDriverIds } : undefined,
                    driverState: {
                        isOnline: true,
                        lastHeartbeatAt: {
                            gte: new Date(Date.now() - 5 * 60 * 1000) // Active in last 5 minutes
                        }
                    }
                },
                include: {
                    user: true,
                    driverState: true,
                },
                take: expandedDriverCount * 2, // Get more for scoring and filtering
                orderBy: [
                    { rating: 'desc' },
                    { totalDeliveries: 'desc' }
                ]
            });
            // Score drivers based on multiple factors
            const scoredDrivers = drivers
                .filter(driver => {
                const state = driver.driverState;
                return state && state.activeAssignmentsCount < state.maxConcurrentAssignments;
            })
                .map(driver => {
                const baseScore = this.calculateDriverScore(driver, order, wave);
                return {
                    driver,
                    score: baseScore
                };
            })
                .sort((a, b) => b.score - a.score)
                .slice(0, expandedDriverCount);
            const availableDrivers = scoredDrivers.map(({ driver }) => ({
                driverId: driver.id,
                name: driver.user.name,
                currentLat: driver.currentLat?.toNumber(),
                currentLng: driver.currentLng?.toNumber(),
                rating: driver.rating || 5.0,
                totalDeliveries: driver.totalDeliveries,
                completionRate: driver.completionRate || 100.0,
                currentZoneId: driver.driverState?.currentZoneId || undefined,
                activeAssignmentsCount: driver.driverState?.activeAssignmentsCount || 0,
                maxConcurrentAssignments: driver.driverState?.maxConcurrentAssignments || 1,
                isOnline: driver.driverState?.isOnline || false,
                lastHeartbeatAt: driver.driverState?.lastHeartbeatAt || undefined,
            }));
            return availableDrivers;
        }
        catch (error) {
            console.error('Find available drivers for wave error:', error);
            return [];
        }
    }
    /**
     * Calculate driver score for wave-based selection
     */
    calculateDriverScore(driver, order, wave) {
        let score = 0;
        // Rating score (0-50 points)
        score += (driver.rating || 5.0) * 10;
        // Experience score (0-30 points)
        const deliveryScore = Math.min(driver.totalDeliveries / 100 * 30, 30);
        score += deliveryScore;
        // Completion rate score (0-20 points)
        score += (driver.completionRate || 100) * 0.2;
        // Availability bonus (0-10 points)
        const state = driver.driverState;
        if (state && state.activeAssignmentsCount === 0) {
            score += 10; // Bonus for completely available drivers
        }
        // Wave urgency multiplier (higher waves get slight preference for available drivers)
        if (wave > 1) {
            score *= 1 + (wave - 1) * 0.1;
        }
        // Distance penalty (if location data available)
        // TODO: Implement distance calculation when lat/lng available
        return score;
    }
    /**
     * Create wave-based assignment offers with enhanced configuration
     */
    async createWaveAssignmentOffers(orderId, wave = 1) {
        try {
            const waveConfig = this.getWaveEscalationConfig(orderId, wave);
            // Find drivers using wave-enhanced selection
            const availableDrivers = await this.findAvailableDriversForWave(orderId, wave, waveConfig.driverCount);
            if (availableDrivers.length === 0) {
                return {
                    success: false,
                    message: `No available drivers found for wave ${wave}`,
                    wave,
                    assignmentsCreated: 0,
                    assignments: []
                };
            }
            console.log(`🌊 Creating Wave ${wave} assignments: ${availableDrivers.length} drivers, ${waveConfig.ttlSeconds}s TTL`);
            // Create offers with wave-specific TTL
            const assignmentResult = await this.createOffers({
                orderId,
                driverIds: availableDrivers.map(d => d.driverId),
                expiresInSeconds: waveConfig.ttlSeconds,
                wave
            });
            return {
                ...assignmentResult,
                wave,
                waveConfig,
                availableDrivers: availableDrivers.length
            };
        }
        catch (error) {
            console.error('Create wave assignment offers error:', error);
            return {
                success: false,
                message: 'Failed to create wave assignments',
                wave,
                assignmentsCreated: 0,
                assignments: []
            };
        }
    }
    /**
     * Get wave escalation status for an order
     */
    async getWaveEscalationStatus(orderId) {
        try {
            const assignments = await prisma.driverAssignment.findMany({
                where: { orderId },
                orderBy: { wave: 'asc' }
            });
            const waves = {};
            assignments.forEach(assignment => {
                const waveKey = `wave${assignment.wave}`;
                if (!waves[waveKey]) {
                    waves[waveKey] = {
                        wave: assignment.wave,
                        totalOffers: 0,
                        accepted: 0,
                        declined: 0,
                        expired: 0,
                        pending: 0
                    };
                }
                waves[waveKey].totalOffers++;
                waves[waveKey][assignment.status.toLowerCase()]++;
            });
            const currentWave = assignments.length > 0 ? Math.max(...assignments.map(a => a.wave)) : 0;
            const hasActiveAssignment = assignments.some(a => a.status === 'ACCEPTED');
            return {
                orderId,
                currentWave,
                hasActiveAssignment,
                totalAssignments: assignments.length,
                waves: Object.values(waves),
                canEscalate: !hasActiveAssignment && currentWave < 4
            };
        }
        catch (error) {
            console.error('Get wave escalation status error:', error);
            return null;
        }
    }
    // =====================================================
    // ASSIGNMENT DECLINE FUNCTIONALITY
    // =====================================================
    /**
     * Decline assignment offer with reason tracking
     */
    async declineOffer(assignmentId, driverId, reason) {
        try {
            const now = new Date();
            // Find and validate the assignment
            const assignment = await prisma.driverAssignment.findUnique({
                where: { id: assignmentId },
                include: { order: true }
            });
            if (!assignment) {
                return {
                    success: false,
                    message: 'Assignment not found'
                };
            }
            if (assignment.driverId !== driverId) {
                return {
                    success: false,
                    message: 'Assignment does not belong to this driver'
                };
            }
            if (assignment.status !== 'OFFERED') {
                return {
                    success: false,
                    message: `Assignment already ${assignment.status.toLowerCase()}`
                };
            }
            if (assignment.expiresAt && assignment.expiresAt < now) {
                return {
                    success: false,
                    message: 'Assignment has expired'
                };
            }
            // Update assignment to DECLINED
            const declinedAssignment = await prisma.driverAssignment.update({
                where: { id: assignmentId },
                data: {
                    status: 'DECLINED',
                    respondedAt: now,
                    reason: reason || 'Driver declined'
                }
            });
            console.log(`❌ Driver ${driverId} declined assignment ${assignmentId} for order ${assignment.orderId}`);
            return {
                success: true,
                message: 'Assignment declined successfully',
                assignment: {
                    assignmentId: declinedAssignment.id,
                    orderId: declinedAssignment.orderId,
                    status: declinedAssignment.status,
                    declinedAt: declinedAssignment.respondedAt,
                    reason: declinedAssignment.reason
                }
            };
        }
        catch (error) {
            console.error('Decline offer error:', error);
            return {
                success: false,
                message: 'Failed to decline assignment',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Get decline reasons analytics for insights
     */
    async getDeclineReasonsAnalytics(timeframeHours = 24) {
        try {
            const startTime = new Date(Date.now() - timeframeHours * 60 * 60 * 1000);
            const declinedAssignments = await prisma.driverAssignment.findMany({
                where: {
                    status: 'DECLINED',
                    respondedAt: { gte: startTime }
                },
                select: {
                    reason: true,
                    wave: true,
                    driverId: true,
                    orderId: true
                }
            });
            // Group by reasons
            const reasonCounts = {};
            const waveDeclines = {};
            declinedAssignments.forEach(assignment => {
                const reason = assignment.reason || 'No reason provided';
                reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
                const wave = assignment.wave;
                waveDeclines[wave] = (waveDeclines[wave] || 0) + 1;
            });
            return {
                timeframeHours,
                totalDeclines: declinedAssignments.length,
                reasonCounts: Object.entries(reasonCounts)
                    .sort(([, a], [, b]) => b - a)
                    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}),
                waveDeclines,
                uniqueDrivers: new Set(declinedAssignments.map(a => a.driverId)).size,
                uniqueOrders: new Set(declinedAssignments.map(a => a.orderId)).size
            };
        }
        catch (error) {
            console.error('Get decline reasons analytics error:', error);
            return {
                timeframeHours,
                totalDeclines: 0,
                reasonCounts: {},
                waveDeclines: {},
                uniqueDrivers: 0,
                uniqueOrders: 0
            };
        }
    }
}
exports.default = new HybridAssignmentService();
//# sourceMappingURL=hybridAssignmentService.js.map