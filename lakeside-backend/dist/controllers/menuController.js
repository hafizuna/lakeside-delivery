"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleMenuItemAvailability = exports.deleteMenuItem = exports.updateMenuItem = exports.createMenuItem = exports.getMenuItems = void 0;
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
            orderBy: { itemName: 'asc' },
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
        const { itemName, description, price, imageUrl, category, isAvailable = true } = req.body;
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
        const menuItem = await prisma.menu.create({
            data: {
                restaurantId: user.restaurantProfile.id,
                itemName,
                description,
                price: Number(price),
                imageUrl,
                category: category || 'Other',
                isAvailable,
            },
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
        const { itemName, description, price, imageUrl, category, isAvailable } = req.body;
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
            data: {
                itemName: itemName || existingMenuItem.itemName,
                description: description !== undefined ? description : existingMenuItem.description,
                price: price ? Number(price) : existingMenuItem.price,
                imageUrl: imageUrl !== undefined ? imageUrl : existingMenuItem.imageUrl,
                category: category || existingMenuItem.category,
                isAvailable: isAvailable !== undefined ? isAvailable : existingMenuItem.isAvailable,
            },
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
//# sourceMappingURL=menuController.js.map