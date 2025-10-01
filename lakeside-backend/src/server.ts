import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";
import { createServer } from "http";
import socketService from "./services/socketService";

// Load environment variables first
dotenv.config({ path: path.join(__dirname, "../.env") });

// Import routes
import authRoutes from "./routes/auth";
import restaurantRoutes from "./routes/restaurant";
import restaurantManagementRoutes from "./routes/restaurantManagement";
import orderRoutes from "./routes/order";
import walletRoutes from "./routes/wallet";
import driverRoutes from "./routes/driver";
import driverAssignmentRoutes from "./routes/driverAssignments";
import ratingRoutes from "./routes/rating";
import escrowOrderRoutes from "./routes/escrowOrderRoutes";

const app = express();
const PORT = process.env.PORT || 3001;
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/restaurant", restaurantManagementRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/driver/assignments", driverAssignmentRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/escrow-orders", escrowOrderRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Lakeside Delivery Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

// Initialize Socket.IO
socketService.initialize(httpServer);

// Initialize automated maintenance service
import maintenanceService from "./services/maintenanceService";
maintenanceService.startAutomatedMaintenance();

// Start server
httpServer.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 Lakeside Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`📱 Mobile access: http://192.168.1.5:${PORT}/api/auth/*`);
  console.log(`🔌 Socket.IO server ready at ws://localhost:${PORT}`);
  console.log(`📡 Real-time updates enabled`);
});
