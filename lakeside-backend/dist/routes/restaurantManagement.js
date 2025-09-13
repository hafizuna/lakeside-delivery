"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const restaurantController_1 = require("../controllers/restaurantController");
const menuController_1 = require("../controllers/menuController");
const ordersController_1 = require("../controllers/ordersController");
const router = express_1.default.Router();
// Authentication routes
router.post('/auth/login', restaurantController_1.restaurantLogin);
router.get('/auth/profile', auth_1.authenticateToken, restaurantController_1.getRestaurantProfile);
// Profile management
router.put('/profile', auth_1.authenticateToken, restaurantController_1.updateRestaurantProfile);
// Menu management routes
router.get('/menu', auth_1.authenticateToken, menuController_1.getMenuItems);
router.post('/menu', auth_1.authenticateToken, menuController_1.createMenuItem);
router.put('/menu/:id', auth_1.authenticateToken, menuController_1.updateMenuItem);
router.delete('/menu/:id', auth_1.authenticateToken, menuController_1.deleteMenuItem);
router.patch('/menu/:id/availability', auth_1.authenticateToken, menuController_1.toggleMenuItemAvailability);
// Orders management routes
router.get('/orders', auth_1.authenticateToken, ordersController_1.getRestaurantOrders);
router.get('/orders/:id', auth_1.authenticateToken, ordersController_1.getOrderDetails);
router.patch('/orders/:id/status', auth_1.authenticateToken, ordersController_1.updateOrderStatus);
// Analytics routes
router.get('/analytics', auth_1.authenticateToken, ordersController_1.getRestaurantAnalytics);
exports.default = router;
//# sourceMappingURL=restaurantManagement.js.map