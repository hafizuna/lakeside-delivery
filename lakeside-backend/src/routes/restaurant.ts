import express from 'express';
import { Request, Response } from 'express';
import prisma from '../utils/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/restaurants
 * Get list of restaurants with optional search filter
 */
router.get('/', async (req: Request, res: Response) => {
  console.log('GET /api/restaurants called');
  try {
    const { search, limit = '20', offset = '0' } = req.query;
    
    const whereClause: any = {
      status: 'OPEN',
    };

    // Add search filter
    if (search && typeof search === 'string') {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const restaurants = await prisma.restaurant.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
          },
        },
        menus: {
          select: {
            id: true,
            itemName: true,
            price: true,
            imageUrl: true,
          },
          where: {
            isAvailable: true,
          },
          take: 3, // Just a few items for preview
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    // Transform response to include calculated order count
    const restaurantsWithStats = restaurants.map(restaurant => ({
      ...restaurant,
      totalOrders: restaurant._count.orders,
      // Remove _count from response
      _count: undefined,
    }));

    res.json({
      success: true,
      data: restaurantsWithStats,
      total: restaurantsWithStats.length,
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurants',
    });
  }
});

/**
 * GET /api/restaurants/:id
 * Get restaurant details with full menu
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        menus: {
          where: {
            isAvailable: true,
          },
          orderBy: {
            itemName: 'asc',
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found',
      });
    }

    // Transform response to include calculated order count
    const restaurantWithStats = {
      ...restaurant,
      totalOrders: restaurant._count.orders,
      // Remove _count from response
      _count: undefined,
    };

    res.json({
      success: true,
      data: restaurantWithStats,
    });
  } catch (error) {
    console.error('Error fetching restaurant details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant details',
    });
  }
});

/**
 * GET /api/restaurants/categories
 * Get list of food categories
 */
router.get('/categories', async (req: Request, res: Response) => {
  console.log('GET /api/restaurants/categories called');
  try {
    // Static categories for now since the schema doesn't have a categories table
    const categories = [
      'Burgers',
      'Pizza', 
      'Cookies',
      'Chicken',
      'Seafood',
      'Vegetarian',
      'Desserts',
      'Beverages'
    ];

    console.log('Returning categories:', categories);
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

export default router;
