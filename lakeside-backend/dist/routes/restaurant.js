"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("../utils/database"));
const router = express_1.default.Router();
/**
 * GET /api/restaurants
 * Get list of restaurants with optional search filter
 */
router.get('/', async (req, res) => {
    console.log('GET /api/restaurants called');
    try {
        const { search, limit = '20', offset = '0' } = req.query;
        const whereClause = {
            status: 'OPEN',
        };
        // Add search filter
        if (search && typeof search === 'string') {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
            ];
        }
        const restaurants = await database_1.default.restaurant.findMany({
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
                        isAvailable: true,
                        description: true,
                        categoryId: true,
                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                icon: true,
                                sortOrder: true,
                            }
                        }
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
            take: parseInt(limit),
            skip: parseInt(offset),
        });
        // Transform response to include calculated order count and backward compatibility
        const restaurantsWithStats = restaurants.map(restaurant => ({
            ...restaurant,
            totalOrders: restaurant._count.orders,
            // Transform menu items for backward compatibility
            menus: restaurant.menus.map(menu => ({
                ...menu,
                // Add legacy category string field for backward compatibility
                category: menu.category?.name || null,
                // Keep the new category object structure as well
                categoryObject: menu.category
            })),
            // Remove _count from response
            _count: undefined,
        }));
        res.json({
            success: true,
            data: restaurantsWithStats,
            total: restaurantsWithStats.length,
        });
    }
    catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch restaurants',
        });
    }
});
/**
 * GET /api/restaurants/categories
 * Get list of food categories (backward compatible)
 */
router.get('/categories', async (req, res) => {
    console.log('GET /api/restaurants/categories called');
    try {
        // Get all active categories from database
        let categories = [];
        try {
            categories = await database_1.default.category.findMany({
                where: {
                    isActive: true
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    icon: true,
                    sortOrder: true
                },
                orderBy: {
                    sortOrder: 'asc'
                }
            });
        }
        catch (dbError) {
            console.log('Categories table might not exist or be empty:', dbError?.message || dbError);
            categories = [];
        }
        // For backward compatibility, return both formats
        // Legacy format: array of strings
        const legacyCategories = categories.map(cat => cat.name);
        // Add some fallback categories if database is empty
        const fallbackCategories = [
            'Burgers', 'Pizza', 'Cookies', 'Chicken',
            'Seafood', 'Vegetarian', 'Desserts', 'Beverages'
        ];
        const categoryNames = legacyCategories.length > 0 ? legacyCategories : fallbackCategories;
        console.log('Returning categories:', categoryNames);
        console.log('Full category objects:', categories);
        res.json({
            success: true,
            data: categoryNames, // Legacy format for backward compatibility
            categories: categories // New format with full objects
        });
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to static categories on error
        const fallbackCategories = [
            'Burgers', 'Pizza', 'Cookies', 'Chicken',
            'Seafood', 'Vegetarian', 'Desserts', 'Beverages'
        ];
        res.json({
            success: true,
            data: fallbackCategories
        });
    }
});
/**
 * GET /api/restaurants/:id
 * Get restaurant details with full menu
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await database_1.default.restaurant.findUnique({
            where: { id: parseInt(id) },
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
                        description: true,
                        price: true,
                        imageUrl: true,
                        isAvailable: true,
                        categoryId: true,
                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                icon: true,
                                sortOrder: true,
                            }
                        }
                    },
                    where: {
                        isAvailable: true,
                    },
                    orderBy: {
                        itemName: 'asc'
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
        // Transform response to include calculated order count and backward compatibility
        const restaurantWithStats = {
            ...restaurant,
            totalOrders: restaurant._count.orders,
            // Transform menu items for backward compatibility
            menus: restaurant.menus.map(menu => ({
                ...menu,
                // Add legacy category string field for backward compatibility
                category: menu.category?.name || null,
                // Keep the new category object structure as well
                categoryObject: menu.category
            })),
            // Remove _count from response
            _count: undefined,
        };
        res.json({
            success: true,
            data: restaurantWithStats,
        });
    }
    catch (error) {
        console.error('Error fetching restaurant details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch restaurant details',
        });
    }
});
exports.default = router;
//# sourceMappingURL=restaurant.js.map