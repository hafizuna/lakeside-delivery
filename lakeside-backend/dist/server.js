"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const socketService_1 = __importDefault(require("./services/socketService"));
// Load environment variables first
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const restaurant_1 = __importDefault(require("./routes/restaurant"));
const restaurantManagement_1 = __importDefault(require("./routes/restaurantManagement"));
const order_1 = __importDefault(require("./routes/order"));
const wallet_1 = __importDefault(require("./routes/wallet"));
const driver_1 = __importDefault(require("./routes/driver"));
const rating_1 = __importDefault(require("./routes/rating"));
const escrowOrderRoutes_1 = __importDefault(require("./routes/escrowOrderRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const httpServer = (0, http_1.createServer)(app);
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/restaurants', restaurant_1.default);
app.use('/api/restaurant', restaurantManagement_1.default);
app.use('/api/orders', order_1.default);
app.use('/api/wallet', wallet_1.default);
app.use('/api/driver', driver_1.default);
app.use('/api/ratings', rating_1.default);
app.use('/api/escrow-orders', escrowOrderRoutes_1.default);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Lakeside Delivery Backend is running',
        timestamp: new Date().toISOString()
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});
// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// Initialize Socket.IO
socketService_1.default.initialize(httpServer);
// Start server
httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Lakeside Backend running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
    console.log(`📱 Mobile access: http://192.168.1.4:${PORT}/api/auth/*`);
    console.log(`🔌 Socket.IO server ready at ws://localhost:${PORT}`);
    console.log(`📡 Real-time updates enabled`);
});
//# sourceMappingURL=server.js.map