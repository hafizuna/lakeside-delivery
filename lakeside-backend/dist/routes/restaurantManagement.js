"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const restaurantController_1 = require("../controllers/restaurantController");
const menuController_1 = require("../controllers/menuController");
const categoryController_1 = require("../controllers/categoryController");
const ordersController_1 = require("../controllers/ordersController");
const router = express_1.default.Router();
// Authentication routes
router.post('/auth/register', restaurantController_1.restaurantRegister);
router.post('/auth/login', restaurantController_1.restaurantLogin);
router.get('/auth/profile', auth_1.authenticateToken, restaurantController_1.getRestaurantProfile);
// Profile management
router.put('/profile', auth_1.authenticateToken, restaurantController_1.updateRestaurantProfile);
// Category management routes
router.get('/categories', auth_1.authenticateToken, categoryController_1.getCategories);
router.post('/categories', auth_1.authenticateToken, categoryController_1.createCategory);
router.put('/categories/:id', auth_1.authenticateToken, categoryController_1.updateCategory);
router.delete('/categories/:id', auth_1.authenticateToken, categoryController_1.deleteCategory);
router.patch('/categories/reorder', auth_1.authenticateToken, categoryController_1.reorderCategories);
// Menu management routes
router.get('/menu', auth_1.authenticateToken, menuController_1.getMenuItems);
router.post('/menu', auth_1.authenticateToken, menuController_1.createMenuItem);
// Bulk operations routes (must come before parameterized routes)
router.patch('/menu/bulk/availability', auth_1.authenticateToken, menuController_1.bulkUpdateAvailability);
router.patch('/menu/bulk/category', auth_1.authenticateToken, menuController_1.bulkUpdateCategory);
router.patch('/menu/bulk/price', auth_1.authenticateToken, menuController_1.bulkUpdatePrice);
router.delete('/menu/bulk', auth_1.authenticateToken, menuController_1.bulkDeleteMenuItems);
// Individual menu item routes (parameterized routes come after bulk routes)
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