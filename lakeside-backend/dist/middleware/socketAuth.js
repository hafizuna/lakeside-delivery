"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketUserId = exports.requireAuth = exports.socketAuthMiddleware = exports.verifySocketToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const socket_1 = require("../types/socket");
const prisma = new client_1.PrismaClient();
/**
 * JWT Token verification for Socket.IO connections
 */
const verifySocketToken = async (token) => {
    try {
        if (!process.env.JWT_SECRET) {
            return { valid: false, error: 'JWT secret not configured' };
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.userId) {
            return { valid: false, error: 'Invalid token payload' };
        }
        // Verify user exists in database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, phone: true, role: true }
        });
        if (!user) {
            return { valid: false, error: 'User not found' };
        }
        return { valid: true, userId: user.id };
    }
    catch (error) {
        console.error('Socket token verification error:', error);
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return { valid: false, error: 'Token expired' };
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return { valid: false, error: 'Invalid token' };
        }
        return { valid: false, error: 'Token verification failed' };
    }
};
exports.verifySocketToken = verifySocketToken;
/**
 * Socket.IO Authentication Middleware
 * Handles authentication for socket connections
 */
const socketAuthMiddleware = (socket, next) => {
    // Initialize socket data (Socket.IO 2.x style)
    socket.data = {
        isAuthenticated: false,
        joinedRooms: []
    };
    console.log('🔌 New socket connection attempt:', socket.id);
    // Set up authentication handler
    socket.on('authenticate', async (authData) => {
        console.log('🔐 Socket authentication attempt for user:', authData.userId);
        try {
            const { valid, userId, error } = await (0, exports.verifySocketToken)(authData.token);
            if (valid && userId) {
                // Authentication successful
                socket.data.isAuthenticated = true;
                socket.data.userId = userId;
                console.log('✅ Socket authenticated successfully:', { socketId: socket.id, userId });
                // Join user-specific room
                const userRoom = `user_${userId}`;
                await socket.join(userRoom);
                socket.data.joinedRooms.push(userRoom);
                // Emit authentication success
                socket.emit('authenticated', {
                    success: true,
                    message: 'Authentication successful',
                    userId
                });
                console.log(`👥 Socket ${socket.id} joined room: ${userRoom}`);
            }
            else {
                // Authentication failed
                console.log('❌ Socket authentication failed:', { socketId: socket.id, error });
                const errorCode = error?.includes('expired') ? socket_1.SocketErrorCodes.TOKEN_EXPIRED :
                    error?.includes('Invalid') ? socket_1.SocketErrorCodes.INVALID_TOKEN :
                        socket_1.SocketErrorCodes.AUTHENTICATION_FAILED;
                socket.emit('error', {
                    message: error || 'Authentication failed',
                    code: errorCode
                });
                // Disconnect unauthenticated socket after a delay
                setTimeout(() => {
                    if (!socket.data.isAuthenticated) {
                        console.log('🔌 Disconnecting unauthenticated socket:', socket.id);
                        socket.disconnect();
                    }
                }, 5000);
            }
        }
        catch (error) {
            console.error('🔐 Socket authentication error:', error);
            socket.emit('error', {
                message: 'Authentication error occurred',
                code: socket_1.SocketErrorCodes.AUTHENTICATION_FAILED
            });
        }
    });
    // Handle room joining (requires authentication)
    socket.on('join_user_room', async (data) => {
        if (!socket.data.isAuthenticated) {
            socket.emit('error', {
                message: 'Authentication required',
                code: socket_1.SocketErrorCodes.UNAUTHORIZED
            });
            return;
        }
        // Verify user can join this room (only their own room)
        if (data.userId !== socket.data.userId) {
            socket.emit('error', {
                message: 'Cannot join another user\'s room',
                code: socket_1.SocketErrorCodes.UNAUTHORIZED
            });
            return;
        }
        const userRoom = `user_${data.userId}`;
        await socket.join(userRoom);
        if (!socket.data.joinedRooms.includes(userRoom)) {
            socket.data.joinedRooms.push(userRoom);
        }
        console.log(`👥 Socket ${socket.id} joined user room: ${userRoom}`);
    });
    socket.on('leave_user_room', async (data) => {
        if (!socket.data.isAuthenticated) {
            return;
        }
        const userRoom = `user_${data.userId}`;
        await socket.leave(userRoom);
        socket.data.joinedRooms = socket.data.joinedRooms.filter((room) => room !== userRoom);
        console.log(`👥 Socket ${socket.id} left user room: ${userRoom}`);
    });
    socket.on('join_order', async (data) => {
        if (!socket.data.isAuthenticated) {
            socket.emit('error', {
                message: 'Authentication required',
                code: socket_1.SocketErrorCodes.UNAUTHORIZED
            });
            return;
        }
        try {
            // Verify user has access to this order
            const order = await prisma.order.findFirst({
                where: {
                    id: data.orderId,
                    OR: [
                        { customerId: socket.data.userId }, // Customer can join their order
                        {
                            restaurant: {
                                user: { id: socket.data.userId }
                            }
                        }, // Restaurant owner can join their orders
                        // TODO: Add driver access when driver functionality is added
                    ]
                }
            });
            if (!order) {
                socket.emit('error', {
                    message: 'Order not found or access denied',
                    code: socket_1.SocketErrorCodes.UNAUTHORIZED
                });
                return;
            }
            const orderRoom = `order_${data.orderId}`;
            await socket.join(orderRoom);
            if (!socket.data.joinedRooms.includes(orderRoom)) {
                socket.data.joinedRooms.push(orderRoom);
            }
            console.log(`📦 Socket ${socket.id} joined order room: ${orderRoom}`);
        }
        catch (error) {
            console.error('Error joining order room:', error);
            socket.emit('error', {
                message: 'Failed to join order room',
                code: socket_1.SocketErrorCodes.ROOM_JOIN_FAILED
            });
        }
    });
    socket.on('leave_order', async (data) => {
        if (!socket.data.isAuthenticated) {
            return;
        }
        const orderRoom = `order_${data.orderId}`;
        await socket.leave(orderRoom);
        socket.data.joinedRooms = socket.data.joinedRooms.filter((room) => room !== orderRoom);
        console.log(`📦 Socket ${socket.id} left order room: ${orderRoom}`);
    });
    // Handle ping for connection health
    socket.on('ping', () => {
        socket.emit('connection_status', {
            connected: true,
            userId: socket.data.userId,
            timestamp: new Date().toISOString()
        });
    });
    // Handle disconnection cleanup
    socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', {
            socketId: socket.id,
            userId: socket.data.userId,
            reason,
            rooms: socket.data.joinedRooms
        });
    });
    // Continue with connection (don't require immediate auth)
    next();
};
exports.socketAuthMiddleware = socketAuthMiddleware;
/**
 * Utility function to check if socket is authenticated
 */
const requireAuth = (socket) => {
    return socket.data.isAuthenticated || false;
};
exports.requireAuth = requireAuth;
/**
 * Get authenticated user ID from socket
 */
const getSocketUserId = (socket) => {
    return socket.data.userId;
};
exports.getSocketUserId = getSocketUserId;
//# sourceMappingURL=socketAuth.js.map