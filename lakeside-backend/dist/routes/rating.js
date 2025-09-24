"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("../utils/database"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
/**
 * POST /api/ratings/restaurant
 * Rate a restaurant
 */
router.post('/restaurant', auth_1.authenticateToken, async (req, res) => {
    try {
        const { restaurantId, rating, comment } = req.body;
        const customerId = req.user?.id;
        // Validate input
        if (!restaurantId || !rating || !customerId) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID, rating, and customer authentication are required'
            });
        }
        // Validate rating value (1-5 stars)
        if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be an integer between 1 and 5'
            });
        }
        // Check if restaurant exists
        const restaurant = await database_1.default.restaurant.findUnique({
            where: { id: parseInt(restaurantId) }
        });
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }
        // Check if customer has already rated this restaurant
        const existingRating = await database_1.default.rating.findUnique({
            where: {
                unique_customer_restaurant_rating: {
                    customerId: customerId,
                    restaurantId: parseInt(restaurantId)
                }
            }
        });
        let ratingRecord;
        if (existingRating) {
            // Update existing rating
            ratingRecord = await database_1.default.rating.update({
                where: { id: existingRating.id },
                data: {
                    rating: parseInt(rating),
                    comment: comment || null,
                    updatedAt: new Date()
                }
            });
        }
        else {
            // Create new rating
            ratingRecord = await database_1.default.rating.create({
                data: {
                    customerId: customerId,
                    restaurantId: parseInt(restaurantId),
                    ratingType: 'RESTAURANT',
                    rating: parseInt(rating),
                    comment: comment || null
                }
            });
        }
        // Update restaurant's average rating
        const avgRatingResult = await database_1.default.rating.aggregate({
            where: {
                restaurantId: parseInt(restaurantId),
                ratingType: 'RESTAURANT'
            },
            _avg: {
                rating: true
            },
            _count: {
                rating: true
            }
        });
        // Update restaurant rating
        await database_1.default.restaurant.update({
            where: { id: parseInt(restaurantId) },
            data: {
                rating: avgRatingResult._avg.rating || 0.0
            }
        });
        res.status(200).json({
            success: true,
            message: existingRating ? 'Rating updated successfully' : 'Rating submitted successfully',
            data: ratingRecord
        });
    }
    catch (error) {
        console.error('Error rating restaurant:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit rating'
        });
    }
});
/**
 * POST /api/ratings/order
 * Rate an order
 */
router.post('/order', auth_1.authenticateToken, async (req, res) => {
    try {
        const { orderId, rating, comment } = req.body;
        const customerId = req.user?.id;
        // Validate input
        if (!orderId || !rating || !customerId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID, rating, and customer authentication are required'
            });
        }
        // Validate rating value (1-5 stars)
        if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be an integer between 1 and 5'
            });
        }
        // Check if order exists and belongs to the customer
        const order = await database_1.default.order.findFirst({
            where: {
                id: parseInt(orderId),
                customerId: customerId
            }
        });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or does not belong to this customer'
            });
        }
        // Check if order is delivered (customers can only rate delivered orders)
        if (order.status !== 'DELIVERED') {
            return res.status(400).json({
                success: false,
                message: 'You can only rate delivered orders'
            });
        }
        // Check if customer has already rated this order
        const existingRating = await database_1.default.rating.findUnique({
            where: {
                unique_customer_order_rating: {
                    customerId: customerId,
                    orderId: parseInt(orderId)
                }
            }
        });
        let ratingRecord;
        if (existingRating) {
            // Update existing rating
            ratingRecord = await database_1.default.rating.update({
                where: { id: existingRating.id },
                data: {
                    rating: parseInt(rating),
                    comment: comment || null,
                    updatedAt: new Date()
                }
            });
        }
        else {
            // Create new rating
            ratingRecord = await database_1.default.rating.create({
                data: {
                    customerId: customerId,
                    orderId: parseInt(orderId),
                    ratingType: 'ORDER',
                    rating: parseInt(rating),
                    comment: comment || null
                }
            });
        }
        // Update order's average rating
        const orderAvgRatingResult = await database_1.default.rating.aggregate({
            where: {
                orderId: parseInt(orderId),
                ratingType: 'ORDER'
            },
            _avg: {
                rating: true
            }
        });
        // Update order rating
        await database_1.default.order.update({
            where: { id: parseInt(orderId) },
            data: {
                orderRating: orderAvgRatingResult._avg.rating || 0.0
            }
        });
        res.status(200).json({
            success: true,
            message: existingRating ? 'Rating updated successfully' : 'Rating submitted successfully',
            data: ratingRecord
        });
    }
    catch (error) {
        console.error('Error rating order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit rating'
        });
    }
});
/**
 * GET /api/ratings/user
 * Get all ratings by the authenticated user
 */
router.get('/user', auth_1.authenticateToken, async (req, res) => {
    try {
        const customerId = req.user?.id;
        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        const ratings = await database_1.default.rating.findMany({
            where: {
                customerId: customerId
            },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        logoUrl: true
                    }
                },
                order: {
                    select: {
                        id: true,
                        totalPrice: true,
                        createdAt: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json({
            success: true,
            data: ratings
        });
    }
    catch (error) {
        console.error('Error fetching user ratings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ratings'
        });
    }
});
/**
 * GET /api/ratings/restaurant/:restaurantId
 * Get all ratings for a specific restaurant
 */
router.get('/restaurant/:restaurantId', async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const ratings = await database_1.default.rating.findMany({
            where: {
                restaurantId: parseInt(restaurantId),
                ratingType: 'RESTAURANT'
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: skip,
            take: parseInt(limit)
        });
        const totalRatings = await database_1.default.rating.count({
            where: {
                restaurantId: parseInt(restaurantId),
                ratingType: 'RESTAURANT'
            }
        });
        // Get rating distribution
        const ratingDistribution = await database_1.default.rating.groupBy({
            by: ['rating'],
            where: {
                restaurantId: parseInt(restaurantId),
                ratingType: 'RESTAURANT'
            },
            _count: {
                rating: true
            }
        });
        // Get average rating
        const avgRating = await database_1.default.rating.aggregate({
            where: {
                restaurantId: parseInt(restaurantId),
                ratingType: 'RESTAURANT'
            },
            _avg: {
                rating: true
            }
        });
        res.status(200).json({
            success: true,
            data: {
                ratings,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalRatings / parseInt(limit)),
                    totalRatings,
                    hasMore: skip + ratings.length < totalRatings
                },
                statistics: {
                    averageRating: avgRating._avg.rating || 0,
                    totalRatings,
                    distribution: ratingDistribution
                }
            }
        });
    }
    catch (error) {
        console.error('Error fetching restaurant ratings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch restaurant ratings'
        });
    }
});
/**
 * GET /api/ratings/check/:type/:targetId
 * Check if user has already rated a specific restaurant, order, or driver
 */
router.get('/check/:type/:targetId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { type, targetId } = req.params;
        const customerId = req.user?.id;
        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        let whereClause = {
            customerId: customerId
        };
        // Set the appropriate ID based on type
        switch (type.toUpperCase()) {
            case 'RESTAURANT':
                whereClause.restaurantId = parseInt(targetId);
                whereClause.ratingType = 'RESTAURANT';
                break;
            case 'ORDER':
                whereClause.orderId = parseInt(targetId);
                whereClause.ratingType = 'ORDER';
                break;
            case 'DRIVER':
                whereClause.driverId = parseInt(targetId);
                whereClause.ratingType = 'DRIVER';
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid rating type. Must be RESTAURANT, ORDER, or DRIVER'
                });
        }
        const existingRating = await database_1.default.rating.findFirst({
            where: whereClause,
            select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true
            }
        });
        res.status(200).json({
            success: true,
            data: {
                hasRated: !!existingRating,
                rating: existingRating
            }
        });
    }
    catch (error) {
        console.error('Error checking existing rating:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check rating status'
        });
    }
});
/**
 * POST /api/ratings/driver
 * Rate a driver
 */
router.post('/driver', auth_1.authenticateToken, async (req, res) => {
    try {
        const { driverId, rating, comment } = req.body;
        const customerId = req.user?.id;
        // Validate input
        if (!driverId || !rating || !customerId) {
            return res.status(400).json({
                success: false,
                message: 'Driver ID, rating, and customer authentication are required'
            });
        }
        // Validate rating value (1-5 stars)
        if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be an integer between 1 and 5'
            });
        }
        // Check if driver exists
        const driver = await database_1.default.driver.findUnique({
            where: { id: parseInt(driverId) }
        });
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }
        // Check if customer has already rated this driver
        const existingRating = await database_1.default.rating.findUnique({
            where: {
                unique_customer_driver_rating: {
                    customerId: customerId,
                    driverId: parseInt(driverId)
                }
            }
        });
        let ratingRecord;
        if (existingRating) {
            // Update existing rating
            ratingRecord = await database_1.default.rating.update({
                where: { id: existingRating.id },
                data: {
                    rating: parseInt(rating),
                    comment: comment || null,
                    updatedAt: new Date()
                }
            });
        }
        else {
            // Create new rating
            ratingRecord = await database_1.default.rating.create({
                data: {
                    customerId: customerId,
                    driverId: parseInt(driverId),
                    ratingType: 'DRIVER',
                    rating: parseInt(rating),
                    comment: comment || null
                }
            });
        }
        // Update driver's average rating
        const avgRatingResult = await database_1.default.rating.aggregate({
            where: {
                driverId: parseInt(driverId),
                ratingType: 'DRIVER'
            },
            _avg: {
                rating: true
            }
        });
        // Update driver rating
        await database_1.default.driver.update({
            where: { id: parseInt(driverId) },
            data: {
                rating: avgRatingResult._avg.rating || 5.0
            }
        });
        res.status(200).json({
            success: true,
            message: existingRating ? 'Driver rating updated successfully' : 'Driver rating submitted successfully',
            data: ratingRecord
        });
    }
    catch (error) {
        console.error('Error rating driver:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit driver rating'
        });
    }
});
exports.default = router;
//# sourceMappingURL=rating.js.map