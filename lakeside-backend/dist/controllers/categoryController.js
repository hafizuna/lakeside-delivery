"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderCategories = exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategories = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Get Categories for Restaurant
 * GET /restaurant/categories
 */
const getCategories = async (req, res) => {
    try {
        const userId = req.user?.id;
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
        // Get categories with menu item counts
        const categories = await prisma.category.findMany({
            where: {
                restaurantId: user.restaurantProfile.id,
                isActive: true
            },
            include: {
                _count: {
                    select: { menus: true }
                }
            },
            orderBy: { sortOrder: 'asc' },
        });
        res.json({
            success: true,
            data: categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                icon: cat.icon,
                sortOrder: cat.sortOrder,
                isActive: cat.isActive,
                menuItemCount: cat._count.menus,
                createdAt: cat.createdAt,
                updatedAt: cat.updatedAt,
            })),
        });
    }
    catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories',
        });
    }
};
exports.getCategories = getCategories;
/**
 * Create Category
 * POST /restaurant/categories
 */
const createCategory = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { name, icon, sortOrder } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        // Validate required fields
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required',
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
        // Check if category name already exists for this restaurant
        const existingCategory = await prisma.category.findFirst({
            where: {
                restaurantId: user.restaurantProfile.id,
                name: name.trim(),
            },
        });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category name already exists',
            });
        }
        // Generate slug from name
        const slug = `${user.restaurantProfile.id}-${name.toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')}`;
        // Get next sort order if not provided
        let nextSortOrder = sortOrder;
        if (!nextSortOrder) {
            const maxSortOrder = await prisma.category.findFirst({
                where: { restaurantId: user.restaurantProfile.id },
                orderBy: { sortOrder: 'desc' },
                select: { sortOrder: true },
            });
            nextSortOrder = (maxSortOrder?.sortOrder || 0) + 1;
        }
        const category = await prisma.category.create({
            data: {
                restaurantId: user.restaurantProfile.id,
                name: name.trim(),
                slug,
                icon: icon || null,
                sortOrder: nextSortOrder,
                isActive: true,
            },
            include: {
                _count: {
                    select: { menus: true }
                }
            }
        });
        res.status(201).json({
            success: true,
            data: {
                id: category.id,
                name: category.name,
                slug: category.slug,
                icon: category.icon,
                sortOrder: category.sortOrder,
                isActive: category.isActive,
                menuItemCount: category._count.menus,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            },
            message: 'Category created successfully',
        });
    }
    catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create category',
        });
    }
};
exports.createCategory = createCategory;
/**
 * Update Category
 * PUT /restaurant/categories/:id
 */
const updateCategory = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { name, icon, isActive, sortOrder } = req.body;
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
        // Check if category exists and belongs to this restaurant
        const existingCategory = await prisma.category.findFirst({
            where: {
                id: parseInt(id),
                restaurantId: user.restaurantProfile.id,
            },
        });
        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }
        // If updating name, check for duplicates
        if (name && name.trim() !== existingCategory.name) {
            const duplicateCategory = await prisma.category.findFirst({
                where: {
                    restaurantId: user.restaurantProfile.id,
                    name: name.trim(),
                    id: { not: parseInt(id) },
                },
            });
            if (duplicateCategory) {
                return res.status(400).json({
                    success: false,
                    message: 'Category name already exists',
                });
            }
        }
        // Update category
        const updateData = {};
        if (name !== undefined) {
            updateData.name = name.trim();
            // Update slug if name changed
            updateData.slug = `${user.restaurantProfile.id}-${name.toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')}`;
        }
        if (icon !== undefined)
            updateData.icon = icon;
        if (isActive !== undefined)
            updateData.isActive = isActive;
        if (sortOrder !== undefined)
            updateData.sortOrder = sortOrder;
        const updatedCategory = await prisma.category.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                _count: {
                    select: { menus: true }
                }
            }
        });
        res.json({
            success: true,
            data: {
                id: updatedCategory.id,
                name: updatedCategory.name,
                slug: updatedCategory.slug,
                icon: updatedCategory.icon,
                sortOrder: updatedCategory.sortOrder,
                isActive: updatedCategory.isActive,
                menuItemCount: updatedCategory._count.menus,
                createdAt: updatedCategory.createdAt,
                updatedAt: updatedCategory.updatedAt,
            },
            message: 'Category updated successfully',
        });
    }
    catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update category',
        });
    }
};
exports.updateCategory = updateCategory;
/**
 * Delete Category
 * DELETE /restaurant/categories/:id
 */
const deleteCategory = async (req, res) => {
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
        // Check if category exists and belongs to this restaurant
        const existingCategory = await prisma.category.findFirst({
            where: {
                id: parseInt(id),
                restaurantId: user.restaurantProfile.id,
            },
            include: {
                _count: {
                    select: { menus: true }
                }
            }
        });
        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }
        // Check if category has menu items
        if (existingCategory._count.menus > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category with ${existingCategory._count.menus} menu items. Please move or delete the menu items first.`,
            });
        }
        // Delete category
        await prisma.category.delete({
            where: { id: parseInt(id) },
        });
        res.json({
            success: true,
            message: 'Category deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete category',
        });
    }
};
exports.deleteCategory = deleteCategory;
/**
 * Reorder Categories
 * PATCH /restaurant/categories/reorder
 */
const reorderCategories = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { categoryOrders } = req.body; // Array of { id, sortOrder }
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        if (!categoryOrders || !Array.isArray(categoryOrders)) {
            return res.status(400).json({
                success: false,
                message: 'categoryOrders array is required',
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
        // Verify all categories belong to this restaurant
        const categoryIds = categoryOrders.map(item => item.id);
        const existingCategories = await prisma.category.findMany({
            where: {
                id: { in: categoryIds },
                restaurantId: user.restaurantProfile.id,
            },
        });
        if (existingCategories.length !== categoryIds.length) {
            return res.status(400).json({
                success: false,
                message: 'One or more categories not found or do not belong to this restaurant',
            });
        }
        // Update sort orders
        const updatePromises = categoryOrders.map(item => prisma.category.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
        }));
        await Promise.all(updatePromises);
        // Return updated categories
        const updatedCategories = await prisma.category.findMany({
            where: {
                restaurantId: user.restaurantProfile.id,
                isActive: true
            },
            include: {
                _count: {
                    select: { menus: true }
                }
            },
            orderBy: { sortOrder: 'asc' },
        });
        res.json({
            success: true,
            data: updatedCategories.map(cat => ({
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                icon: cat.icon,
                sortOrder: cat.sortOrder,
                isActive: cat.isActive,
                menuItemCount: cat._count.menus,
                createdAt: cat.createdAt,
                updatedAt: cat.updatedAt,
            })),
            message: 'Categories reordered successfully',
        });
    }
    catch (error) {
        console.error('Reorder categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reorder categories',
        });
    }
};
exports.reorderCategories = reorderCategories;
//# sourceMappingURL=categoryController.js.map