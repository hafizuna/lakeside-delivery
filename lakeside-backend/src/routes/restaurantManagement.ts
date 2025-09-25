import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { restaurantLogin, restaurantRegister, getRestaurantProfile, updateRestaurantProfile } from '../controllers/restaurantController';
import { 
  getMenuItems, 
  createMenuItem, 
  updateMenuItem, 
  deleteMenuItem, 
  toggleMenuItemAvailability,
  bulkUpdateAvailability,
  bulkUpdateCategory,
  bulkUpdatePrice,
  bulkDeleteMenuItems
} from '../controllers/menuController';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories
} from '../controllers/categoryController';
import {
  getRestaurantOrders,
  updateOrderStatus,
  getOrderDetails,
  getRestaurantAnalytics
} from '../controllers/ordersController';

const router = express.Router();

// Authentication routes
router.post('/auth/register', restaurantRegister);
router.post('/auth/login', restaurantLogin);
router.get('/auth/profile', authenticateToken, getRestaurantProfile);

// Profile management
router.put('/profile', authenticateToken, updateRestaurantProfile);

// Category management routes
router.get('/categories', authenticateToken, getCategories);
router.post('/categories', authenticateToken, createCategory);
router.put('/categories/:id', authenticateToken, updateCategory);
router.delete('/categories/:id', authenticateToken, deleteCategory);
router.patch('/categories/reorder', authenticateToken, reorderCategories);

// Menu management routes
router.get('/menu', authenticateToken, getMenuItems);
router.post('/menu', authenticateToken, createMenuItem);

// Bulk operations routes (must come before parameterized routes)
router.patch('/menu/bulk/availability', authenticateToken, bulkUpdateAvailability);
router.patch('/menu/bulk/category', authenticateToken, bulkUpdateCategory);
router.patch('/menu/bulk/price', authenticateToken, bulkUpdatePrice);
router.delete('/menu/bulk', authenticateToken, bulkDeleteMenuItems);

// Individual menu item routes (parameterized routes come after bulk routes)
router.put('/menu/:id', authenticateToken, updateMenuItem);
router.delete('/menu/:id', authenticateToken, deleteMenuItem);
router.patch('/menu/:id/availability', authenticateToken, toggleMenuItemAvailability);

// Orders management routes
router.get('/orders', authenticateToken, getRestaurantOrders);
router.get('/orders/:id', authenticateToken, getOrderDetails);
router.patch('/orders/:id/status', authenticateToken, updateOrderStatus);

// Analytics routes
router.get('/analytics', authenticateToken, getRestaurantAnalytics);

export default router;
