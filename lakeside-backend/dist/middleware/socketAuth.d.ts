/**
 * JWT Token verification for Socket.IO connections
 */
export declare const verifySocketToken: (token: string) => Promise<{
    valid: boolean;
    userId?: number;
    error?: string;
}>;
/**
 * Socket.IO Authentication Middleware
 * Handles authentication for socket connections
 */
export declare const socketAuthMiddleware: (socket: SocketIO.Socket, next: (err?: Error) => void) => void;
/**
 * Utility function to check if socket is authenticated
 */
export declare const requireAuth: (socket: SocketIO.Socket) => boolean;
/**
 * Get authenticated user ID from socket
 */
export declare const getSocketUserId: (socket: SocketIO.Socket) => number | undefined;
//# sourceMappingURL=socketAuth.d.ts.map