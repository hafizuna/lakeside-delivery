"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkDeleteMenuItems = exports.bulkUpdatePrice = exports.bulkUpdateCategory = exports.bulkUpdateAvailability = exports.toggleMenuItemAvailability = exports.deleteMenuItem = exports.updateMenuItem = exports.createMenuItem = exports.getMenuItems = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Get Restaurant Menu Items
 */
const getMenuItems = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        // Get restaurant profile to find restaurant ID
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { restaurantProfile: true },
        });
        if (!user || !user.restaurantProfile) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant profile not found',
            });
        }
        const menuItems = await prisma.menu.findMany({
            where: { restaurantId: user.restaurantProfile.id },
            include: {
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
            orderBy: [{ category: { sortOrder: 'asc' } }, { itemName: 'asc' }],
        });
        res.json({
            success: true,
            data: menuItems,
        });
    }
    catch (error) {
        console.error('Get menu items error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch menu items',
        });
    }
};
exports.getMenuItems = getMenuItems;
/**
 * Create Menu Item
 */
const createMenuItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { itemName, description, price, imageUrl, categoryId, isAvailable = true } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        // Validate required fields
        if (!itemName || !price) {
            return res.status(400).json({
                success: false,
                message: 'Item name and price are required',
            });
        }
        // Get restaurant profile
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { restaurantProfile: true },
        });
        if (!user || !user.restaurantProfile) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant profile not found',
            });
        }
        // Validate categoryId if provided
        if (categoryId) {
            const categoryExists = await prisma.category.findFirst({
                where: {
                    id: parseInt(categoryId),
                    restaurantId: user.restaurantProfile.id,
                    isActive: true,
                },
            });
            if (!categoryExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category selected',
                });
            }
        }
        const menuItem = await prisma.menu.create({
            data: {
                restaurantId: user.restaurantProfile.id,
                itemName,
                description,
                price: Number(price),
                imageUrl,
                categoryId: categoryId ? parseInt(categoryId) : null,
                isAvailable,
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        icon: true,
                        sortOrder: true,
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            data: menuItem,
            message: 'Menu item created successfully',
        });
    }
    catch (error) {
        console.error('Create menu item error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create menu item',
        });
    }
};
exports.createMenuItem = createMenuItem;
/**
 * Update Menu Item
 */
const updateMenuItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { itemName, description, price, imageUrl, categoryId, isAvailable } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        // Get restaurant profile
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { restaurantProfile: true },
        });
        if (!user || !user.restaurantProfile) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant profile not found',
            });
        }
        // Check if menu item belongs to this restaurant
        const existingMenuItem = await prisma.menu.findFirst({
            where: {
                id: parseInt(id),
                restaurantId: user.restaurantProfile.id,
            },
        });
        if (!existingMenuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found',
            });
        }
        // Validate categoryId if provided
        if (categoryId !== undefined && categoryId !== null) {
            const categoryExists = await prisma.category.findFirst({
                where: {
                    id: parseInt(categoryId),
                    restaurantId: user.restaurantProfile.id,
                    isActive: true,
                },
            });
            if (!categoryExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category selected',
                });
            }
        }
        const updatedMenuItem = await prisma.menu.update({
            where: { id: parseInt(id) },
            data: {
                itemName: itemName || existingMenuItem.itemName,
                description: description !== undefined ? description : existingMenuItem.description,
                price: price ? Number(price) : existingMenuItem.price,
                imageUrl: imageUrl !== undefined ? imageUrl : existingMenuItem.imageUrl,
                categoryId: categoryId !== undefined ? (categoryId ? parseInt(categoryId) : null) : existingMenuItem.categoryId,
                isAvailable: isAvailable !== undefined ? isAvailable : existingMenuItem.isAvailable,
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        icon: true,
                        sortOrder: true,
                    }
                }
            }
        });
        res.json({
            success: true,
            data: updatedMenuItem,
            message: 'Menu item updated successfully',
        });
    }
    catch (error) {
        console.error('Update menu item error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update menu item',
        });
    }
};
exports.updateMenuItem = updateMenuItem;
/**
 * Delete Menu Item
 */
const deleteMenuItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        // Get restaurant profile
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { restaurantProfile: true },
        });
        if (!user || !user.restaurantProfile) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant profile not found',
            });
        }
        // Check if menu item belongs to this restaurant
        const existingMenuItem = await prisma.menu.findFirst({
            where: {
                id: parseInt(id),
                restaurantId: user.restaurantProfile.id,
            },
        });
        if (!existingMenuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found',
            });
        }
        await prisma.menu.delete({
            where: { id: parseInt(id) },
        });
        res.json({
            success: true,
            message: 'Menu item deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete menu item error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete menu item',
        });
    }
};
exports.deleteMenuItem = deleteMenuItem;
/**
 * Toggle Menu Item Availability
 */
const toggleMenuItemAvailability = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { isAvailable } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        // Get restaurant profile
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { restaurantProfile: true },
        });
        if (!user || !user.restaurantProfile) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant profile not found',
            });
        }
        // Check if menu item belongs to this restaurant
        const existingMenuItem = await prisma.menu.findFirst({
            where: {
                id: parseInt(id),
                restaurantId: user.restaurantProfile.id,
            },
        });
        if (!existingMenuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found',
            });
        }
        const updatedMenuItem = await prisma.menu.update({
            where: { id: parseInt(id) },
            data: { isAvailable },
        });
        res.json({
            success: true,
            data: updatedMenuItem,
            message: `Menu item ${isAvailable ? 'enabled' : 'disabled'} successfully`,
        });
    }
    catch (error) {
        console.error('Toggle menu item availability error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update menu item availability',
        });
    }
};
exports.toggleMenuItemAvailability = toggleMenuItemAvailability;
/**
 * Bulk Update Menu Item Availability
 * PATCH /restaurant/menu/bulk/availability
 */
const bulkUpdateAvailability = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { menuIds, isAvailable } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        // Validate input
        if (!menuIds || !Array.isArray(menuIds) || menuIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'menuIds array is required',
            });
        }
        if (typeof isAvailable !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isAvailable must be a boolean',
            });
        }
        // Get restaurant profile
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { restaurantProfile: true },
        });
        if (!user || !user.restaurantProfile) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant profile not found',
            });
        }
        // Verify all menu items belong to this restaurant
        const existingItems = await prisma.menu.findMany({
            where: {
                id: { in: menuIds.map(id => parseInt(id)) },
                restaurantId: user.restaurantProfile.id,
            },
        });
        if (existingItems.length !== menuIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more menu items not found or do not belong to this restaurant',
            });
        }
        // Bulk update availability
        const updateResult = await prisma.menu.updateMany({
            where: {
                id: { in: menuIds.map(id => parseInt(id)) },
                restaurantId: user.restaurantProfile.id,
            },
            data: { isAvailable },
        });
        res.json({
            success: true,
            data: {
                updatedCount: updateResult.count,
                isAvailable,
            },
            message: `${updateResult.count} menu items ${isAvailable ? 'enabled' : 'disabled'} successfully`,
        });
    }
    catch (error) {
        console.error('Bulk update availability error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update menu item availability',
        });
    }
};
exports.bulkUpdateAvailability = bulkUpdateAvailability;
/**
 * Bulk Update Menu Item Category
 * PATCH /restaurant/menu/bulk/category
 */
const bulkUpdateCategory = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { menuIds, categoryId } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        // Validate input
        if (!menuIds || !Array.isArray(menuIds) || menuIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'menuIds array is required',
            });
        }
        // Get restaurant profile
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { restaurantProfile: true },
        });
        if (!user || !user.restaurantProfile) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant profile not found',
            });
        }
        // Validate categoryId if provided
        if (categoryId !== null && categoryId !== undefined) {
            const categoryExists = await prisma.category.findFirst({
                where: {
                    id: parseInt(categoryId),
                    restaurantId: user.restaurantProfile.id,
                    isActive: true,
                },
            });
            if (!categoryExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category selected',
                });
            }
        }
        // Verify all menu items belong to this restaurant
        const existingItems = await prisma.menu.findMany({
            where: {
                id: { in: menuIds.map(id => parseInt(id)) },
                restaurantId: user.restaurantProfile.id,
            },
        });
        if (existingItems.length !== menuIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more menu items not found or do not belong to this restaurant',
            });
        }
        // Bulk update category
        const updateResult = await prisma.menu.updateMany({
            where: {
                id: { in: menuIds.map(id => parseInt(id)) },
                restaurantId: user.restaurantProfile.id,
            },
            data: { categoryId: categoryId ? parseInt(categoryId) : null },
        });
        // Get category name for response
        const categoryName = categoryId
            ? (await prisma.category.findUnique({ where: { id: parseInt(categoryId) } }))?.name
            : 'Uncategorized';
        res.json({
            success: true,
            data: {
                updatedCount: updateResult.count,
                categoryId: categoryId ? parseInt(categoryId) : null,
                categoryName,
            },
            message: `${updateResult.count} menu items moved to ${categoryName} successfully`,
        });
    }
    catch (error) {
        console.error('Bulk update category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update menu item categories',
        });
    }
};
exports.bulkUpdateCategory = bulkUpdateCategory;
/**
 * Bulk Update Menu Item Prices
 * PATCH /restaurant/menu/bulk/price
 */
const bulkUpdatePrice = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { menuIds, type, value } = req.body; // type: 'percentage' | 'fixed', value: number
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        // Validate input
        if (!menuIds || !Array.isArray(menuIds) || menuIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'menuIds array is required',
            });
        }
        if (!type || !['percentage', 'fixed'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'type must be either "percentage" or "fixed"',
            });
        }
        if (typeof value !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'value must be a number',
            });
        }
        // Get restaurant profile
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { restaurantProfile: true },
        });
        if (!user || !user.restaurantProfile) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant profile not found',
            });
        }
        // Get existing menu items to calculate new prices
        const existingItems = await prisma.menu.findMany({
            where: {
                id: { in: menuIds.map(id => parseInt(id)) },
                restaurantId: user.restaurantProfile.id,
            },
        });
        if (existingItems.length !== menuIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more menu items not found or do not belong to this restaurant',
            });
        }
        // Update prices individually (since we need to calculate new prices)
        const updatePromises = existingItems.map(item => {
            let newPrice;
            if (type === 'percentage') {
                // Increase/decrease by percentage
                newPrice = Number(item.price) * (1 + value / 100);
            }
            else {
                // Fixed amount increase/decrease
                newPrice = Number(item.price) + value;
            }
            // Ensure price is not negative and round to 2 decimal places
            newPrice = Math.max(0.01, Math.round(newPrice * 100) / 100);
            return prisma.menu.update({
                where: { id: item.id },
                data: { price: newPrice },
            });
        });
        const updatedItems = await Promise.all(updatePromises);
        res.json({
            success: true,
            data: {
                updatedCount: updatedItems.length,
                type,
                value,
                updatedItems: updatedItems.map(item => ({
                    id: item.id,
                    itemName: item.itemName,
                    newPrice: Number(item.price),
                })),
            },
            message: `${updatedItems.length} menu item prices updated successfully`,
        });
    }
    catch (error) {
        console.error('Bulk update price error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update menu item prices',
        });
    }
};
exports.bulkUpdatePrice = bulkUpdatePrice;
/**
 * Bulk Delete Menu Items
 * DELETE /restaurant/menu/bulk
 */
const bulkDeleteMenuItems = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { menuIds } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        // Validate input
        if (!menuIds || !Array.isArray(menuIds) || menuIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'menuIds array is required',
            });
        }
        // Get restaurant profile
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { restaurantProfile: true },
        });
        if (!user || !user.restaurantProfile) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant profile not found',
            });
        }
        // Verify all menu items belong to this restaurant
        const existingItems = await prisma.menu.findMany({
            where: {
                id: { in: menuIds.map(id => parseInt(id)) },
                restaurantId: user.restaurantProfile.id,
            },
        });
        if (existingItems.length !== menuIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more menu items not found or do not belong to this restaurant',
            });
        }
        // Check if any items are in active orders (optional safety check)
        const activeOrderItems = await prisma.orderItem.findMany({
            where: {
                menuId: { in: menuIds.map(id => parseInt(id)) },
                order: {
                    status: { in: ['PENDING', 'ACCEPTED', 'PREPARING'] }
                }
            },
            include: {
                menu: { select: { itemName: true } },
                order: { select: { id: true, status: true } }
            }
        });
        if (activeOrderItems.length > 0) {
            const activeItems = activeOrderItems.map(item => item.menu.itemName).join(', ');
            return res.status(400).json({
                success: false,
                message: `Cannot delete menu items that are in active orders: ${activeItems}`,
            });
        }
        // Bulk delete menu items
        const deleteResult = await prisma.menu.deleteMany({
            where: {
                id: { in: menuIds.map(id => parseInt(id)) },
                restaurantId: user.restaurantProfile.id,
            },
        });
        res.json({
            success: true,
            data: {
                deletedCount: deleteResult.count,
            },
            message: `${deleteResult.count} menu items deleted successfully`,
        });
    }
    catch (error) {
        console.error('Bulk delete menu items error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete menu items',
        });
    }
};
exports.bulkDeleteMenuItems = bulkDeleteMenuItems;
//# sourceMappingURL=menuController.js.map