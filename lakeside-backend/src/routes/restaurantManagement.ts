import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { restaurantLogin, getRestaurantProfile, updateRestaurantProfile } from '../controllers/restaurantController';
import { 
  getMenuItems, 
  createMenuItem, 
  updateMenuItem, 
  deleteMenuItem, 
  toggleMenuItemAvailability 
} from '../controllers/menuController';
import {
  getRestaurantOrders,
  updateOrderStatus,
  getOrderDetails,
  getRestaurantAnalytics
} from '../controllers/ordersController';

const router = express.Router();

// Authentication routes
router.post('/auth/login', restaurantLogin);
router.get('/auth/profile', authenticateToken, getRestaurantProfile);

// Profile management
router.put('/profile', authenticateToken, updateRestaurantProfile);

// Menu management routes
router.get('/menu', authenticateToken, getMenuItems);
router.post('/menu', authenticateToken, createMenuItem);
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
