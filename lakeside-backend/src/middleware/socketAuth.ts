import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { 
  SocketAuthData, 
  SocketErrorCodes
} from '../types/socket';

const prisma = new PrismaClient();

/**
 * JWT Token verification for Socket.IO connections
 */
export const verifySocketToken = async (token: string): Promise<{ valid: boolean; userId?: number; error?: string }> => {
  try {
    if (!process.env.JWT_SECRET) {
      return { valid: false, error: 'JWT secret not configured' };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
    console.log('🔍 JWT token decoded:', { 
      id: decoded.id, 
      userId: decoded.userId,
      keys: Object.keys(decoded) 
    });
    
    // Handle both 'id' and 'userId' field names (our JWT uses 'id')
    const userId = decoded.userId || decoded.id;
    
    if (!decoded || !userId) {
      return { valid: false, error: 'Invalid token payload - no user ID found' };
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, role: true }
    });
    
    console.log('💭 User lookup result:', user ? { id: user.id, phone: user.phone } : 'User not found');

    if (!user) {
      return { valid: false, error: 'User not found' };
    }

    return { valid: true, userId: user.id };
  } catch (error) {
    console.error('Socket token verification error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Token expired' };
    } else if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: 'Invalid token' };
    }
    
    return { valid: false, error: 'Token verification failed' };
  }
};

/**
 * Socket.IO Authentication Middleware
 * Handles authentication for socket connections
 */
export const socketAuthMiddleware = (
  socket: SocketIO.Socket, 
  next: (err?: Error) => void
) => {
  // Initialize socket data (Socket.IO 2.x style)
  (socket as any).data = {
    isAuthenticated: false,
    joinedRooms: []
  };

  console.log('🔌 New socket connection attempt:', socket.id);
  
  // Check for token in query parameters (for driver app auto-authentication)
  const queryToken = (socket as any).handshake?.query?.token;
  const queryDriverId = (socket as any).handshake?.query?.driverId;
  const queryUserType = (socket as any).handshake?.query?.userType;
  
  console.log('🔍 Socket handshake query:', { 
    hasToken: !!queryToken, 
    driverId: queryDriverId, 
    userType: queryUserType 
  });
  
  // Auto-authenticate if token provided in query (driver app flow)
  if (queryToken) {
    (async () => {
      try {
        console.log('🔐 Auto-authenticating with query token...');
        
        const { valid, userId, error } = await verifySocketToken(queryToken);
        
        if (valid && userId) {
          // Authentication successful
          (socket as any).data.isAuthenticated = true;
          (socket as any).data.userId = userId;
          
          console.log('✅ Socket auto-authenticated successfully:', { socketId: socket.id, userId });
          
          // Join user-specific room
          const userRoom = `user_${userId}`;
          await socket.join(userRoom);
          (socket as any).data.joinedRooms.push(userRoom);
          
          // For drivers, also join driver room
          if (queryUserType === 'driver') {
            const driverRoom = `driver_${userId}`;
            await socket.join(driverRoom);
            (socket as any).data.joinedRooms.push(driverRoom);
            console.log(`🚗 Auto-joined driver room: ${driverRoom}`);
          }
          
          // Emit authentication success
          socket.emit('authenticated', {
            success: true,
            message: 'Auto-authentication successful',
            userId
          });
          
          console.log(`👥 Socket ${socket.id} joined room: ${userRoom}`);
          
        } else {
          // Auto-authentication failed, continue with manual auth flow
          console.log('❌ Auto-authentication failed:', { socketId: socket.id, error });
          
          socket.emit('authentication_required', {
            message: 'Please authenticate manually',
            error: error || 'Auto-authentication failed'
          });
        }
      } catch (error) {
        console.error('🔐 Auto-authentication error:', error);
        socket.emit('authentication_required', {
          message: 'Auto-authentication error, please authenticate manually'
        });
      }
    })();
  }
  
  // Set up manual authentication handler (fallback)
  socket.on('authenticate', async (authData: SocketAuthData) => {
    console.log('🔐 Manual socket authentication attempt:', { hasToken: !!authData.token });
    
    try {
      const { valid, userId, error } = await verifySocketToken(authData.token);
      
      if (valid && userId) {
        // Authentication successful
        (socket as any).data.isAuthenticated = true;
        (socket as any).data.userId = userId;
        
        console.log('✅ Socket authenticated successfully:', { socketId: socket.id, userId });
        
        // Join user-specific room
        const userRoom = `user_${userId}`;
        await socket.join(userRoom);
        (socket as any).data.joinedRooms.push(userRoom);
        
        // Emit authentication success
        socket.emit('authenticated', {
          success: true,
          message: 'Authentication successful',
          userId
        });
        
        console.log(`👥 Socket ${socket.id} joined room: ${userRoom}`);
        
      } else {
        // Authentication failed
        console.log('❌ Socket authentication failed:', { socketId: socket.id, error });
        
        const errorCode = error?.includes('expired') ? SocketErrorCodes.TOKEN_EXPIRED :
                         error?.includes('Invalid') ? SocketErrorCodes.INVALID_TOKEN :
                         SocketErrorCodes.AUTHENTICATION_FAILED;
        
        socket.emit('error', {
          message: error || 'Authentication failed',
          code: errorCode
        });
        
        // Disconnect unauthenticated socket after a delay
        setTimeout(() => {
          if (!(socket as any).data.isAuthenticated) {
            console.log('🔌 Disconnecting unauthenticated socket:', socket.id);
            socket.disconnect();
          }
        }, 5000);
      }
    } catch (error) {
      console.error('🔐 Socket authentication error:', error);
      socket.emit('error', {
        message: 'Authentication error occurred',
        code: SocketErrorCodes.AUTHENTICATION_FAILED
      });
    }
  });

  // Handle room joining (requires authentication)
  socket.on('join_user_room', async (data) => {
    if (!(socket as any).data.isAuthenticated) {
      socket.emit('error', {
        message: 'Authentication required',
        code: SocketErrorCodes.UNAUTHORIZED
      });
      return;
    }

    // Verify user can join this room (only their own room)
    if (data.userId !== (socket as any).data.userId) {
      socket.emit('error', {
        message: 'Cannot join another user\'s room',
        code: SocketErrorCodes.UNAUTHORIZED
      });
      return;
    }

    const userRoom = `user_${data.userId}`;
    await socket.join(userRoom);
    
    if (!(socket as any).data.joinedRooms.includes(userRoom)) {
      (socket as any).data.joinedRooms.push(userRoom);
    }
    
    console.log(`👥 Socket ${socket.id} joined user room: ${userRoom}`);
  });

  socket.on('leave_user_room', async (data) => {
    if (!(socket as any).data.isAuthenticated) {
      return;
    }

    const userRoom = `user_${data.userId}`;
    await socket.leave(userRoom);
    
    (socket as any).data.joinedRooms = (socket as any).data.joinedRooms.filter((room: string) => room !== userRoom);
    
    console.log(`👥 Socket ${socket.id} left user room: ${userRoom}`);
  });

  socket.on('join_order', async (data) => {
    if (!(socket as any).data.isAuthenticated) {
      socket.emit('error', {
        message: 'Authentication required',
        code: SocketErrorCodes.UNAUTHORIZED
      });
      return;
    }

    try {
      // Verify user has access to this order
      const order = await prisma.order.findFirst({
        where: {
          id: data.orderId,
          OR: [
            { customerId: (socket as any).data.userId }, // Customer can join their order
            { 
              restaurant: { 
                user: { id: (socket as any).data.userId } 
              } 
            }, // Restaurant owner can join their orders
            // TODO: Add driver access when driver functionality is added
          ]
        }
      });

      if (!order) {
        socket.emit('error', {
          message: 'Order not found or access denied',
          code: SocketErrorCodes.UNAUTHORIZED
        });
        return;
      }

      const orderRoom = `order_${data.orderId}`;
      await socket.join(orderRoom);
      
      if (!(socket as any).data.joinedRooms.includes(orderRoom)) {
        (socket as any).data.joinedRooms.push(orderRoom);
      }
      
      console.log(`📦 Socket ${socket.id} joined order room: ${orderRoom}`);
      
    } catch (error) {
      console.error('Error joining order room:', error);
      socket.emit('error', {
        message: 'Failed to join order room',
        code: SocketErrorCodes.ROOM_JOIN_FAILED
      });
    }
  });

  socket.on('leave_order', async (data) => {
    if (!(socket as any).data.isAuthenticated) {
      return;
    }

    const orderRoom = `order_${data.orderId}`;
    await socket.leave(orderRoom);
    
    (socket as any).data.joinedRooms = (socket as any).data.joinedRooms.filter((room: string) => room !== orderRoom);
    
    console.log(`📦 Socket ${socket.id} left order room: ${orderRoom}`);
  });

  // Handle driver-specific events
  socket.on('driver_status_update', async (data) => {
    if (!(socket as any).data.isAuthenticated) {
      socket.emit('error', {
        message: 'Authentication required',
        code: SocketErrorCodes.UNAUTHORIZED
      });
      return;
    }

    try {
      const userId = (socket as any).data.userId;
      console.log('📡 Driver status update received:', { userId, status: data.status, timestamp: data.timestamp });
      
      // Update driver online status in the hybrid assignment system
      const hybridAssignmentService = (await import('../services/hybridAssignmentService')).default;
      
      const isOnline = data.status === 'online';
      const result = await hybridAssignmentService.updateDriverState(userId, {
        isOnline,
        maxConcurrentAssignments: 1
      });
      
      if (result.success) {
        console.log('✅ Driver state updated successfully via socket:', { userId, isOnline });
        
        // Also update the driver table for backward compatibility
        await prisma.driver.update({
          where: { id: userId },
          data: {
            isAvailable: isOnline,
            onlineAt: isOnline ? new Date() : null
          }
        }).catch(error => {
          console.warn('Failed to update driver table:', error.message);
        });
        
        socket.emit('driver_status_updated', {
          success: true,
          status: data.status,
          isOnline,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error('❌ Failed to update driver state:', result.message);
        socket.emit('driver_status_update_error', {
          success: false,
          message: result.message || 'Failed to update driver state'
        });
      }
    } catch (error) {
      console.error('Driver status update error:', error);
      socket.emit('driver_status_update_error', {
        success: false,
        message: 'Failed to process status update'
      });
    }
  });

  socket.on('driver_location_update', async (data) => {
    if (!(socket as any).data.isAuthenticated) {
      socket.emit('error', {
        message: 'Authentication required',
        code: SocketErrorCodes.UNAUTHORIZED
      });
      return;
    }

    try {
      const userId = (socket as any).data.userId;
      console.log('📍 Driver location update received:', { 
        userId, 
        lat: data.latitude, 
        lng: data.longitude, 
        timestamp: data.timestamp 
      });
      
      // Process heartbeat with location in the hybrid assignment system
      const hybridAssignmentService = (await import('../services/hybridAssignmentService')).default;
      
      const result = await hybridAssignmentService.processDriverHeartbeat({
        driverId: userId,
        currentLat: data.latitude,
        currentLng: data.longitude,
        currentZoneId: undefined // TODO: implement zone detection
      });
      
      if (result.success) {
        console.log('✅ Driver location updated successfully via socket:', { userId });
        
        socket.emit('driver_location_updated', {
          success: true,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error('❌ Failed to update driver location:', result.message);
        socket.emit('driver_location_update_error', {
          success: false,
          message: result.message || 'Failed to update driver location'
        });
      }
    } catch (error) {
      console.error('Driver location update error:', error);
      socket.emit('driver_location_update_error', {
        success: false,
        message: 'Failed to process location update'
      });
    }
  });

  socket.on('join_driver_room', async (data) => {
    if (!(socket as any).data.isAuthenticated) {
      socket.emit('error', {
        message: 'Authentication required',
        code: SocketErrorCodes.UNAUTHORIZED
      });
      return;
    }

    try {
      const userId = (socket as any).data.userId;
      const requestedDriverId = parseInt(data.driverId);
      
      // Verify the user is requesting to join their own driver room
      if (userId !== requestedDriverId) {
        socket.emit('error', {
          message: 'Cannot join another driver\'s room',
          code: SocketErrorCodes.UNAUTHORIZED
        });
        return;
      }
      
      const driverRoom = `driver_${requestedDriverId}`;
      await socket.join(driverRoom);
      
      if (!(socket as any).data.joinedRooms.includes(driverRoom)) {
        (socket as any).data.joinedRooms.push(driverRoom);
      }
      
      console.log(`🚗 Socket ${socket.id} joined driver room: ${driverRoom}`);
      
      socket.emit('driver_room_joined', {
        success: true,
        room: driverRoom,
        driverId: requestedDriverId
      });
      
    } catch (error) {
      console.error('Error joining driver room:', error);
      socket.emit('error', {
        message: 'Failed to join driver room',
        code: SocketErrorCodes.ROOM_JOIN_FAILED
      });
    }
  });

  socket.on('leave_driver_room', async (data) => {
    if (!(socket as any).data.isAuthenticated) {
      return;
    }

    const requestedDriverId = parseInt(data.driverId);
    const driverRoom = `driver_${requestedDriverId}`;
    
    await socket.leave(driverRoom);
    
    (socket as any).data.joinedRooms = (socket as any).data.joinedRooms.filter((room: string) => room !== driverRoom);
    
    console.log(`🚗 Socket ${socket.id} left driver room: ${driverRoom}`);
  });

  // Handle ping for connection health
  socket.on('ping', () => {
    socket.emit('connection_status', {
      connected: true,
      userId: (socket as any).data.userId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnection cleanup
  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', { 
      socketId: socket.id, 
      userId: (socket as any).data.userId, 
      reason,
      rooms: (socket as any).data.joinedRooms 
    });
  });

  // Continue with connection (don't require immediate auth)
  next();
};

/**
 * Utility function to check if socket is authenticated
 */
export const requireAuth = (
  socket: SocketIO.Socket
): boolean => {
  return (socket as any).data.isAuthenticated || false;
};

/**
 * Get authenticated user ID from socket
 */
export const getSocketUserId = (
  socket: SocketIO.Socket
): number | undefined => {
  return (socket as any).data.userId;
};
