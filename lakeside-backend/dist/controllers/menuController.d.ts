import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
/**
 * Get Restaurant Menu Items
 */
export declare const getMenuItems: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Create Menu Item
 */
export declare const createMenuItem: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update Menu Item
 */
export declare const updateMenuItem: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete Menu Item
 */
export declare const deleteMenuItem: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Toggle Menu Item Availability
 */
export declare const toggleMenuItemAvailability: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Bulk Update Menu Item Availability
 * PATCH /restaurant/menu/bulk/availability
 */
export declare const bulkUpdateAvailability: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Bulk Update Menu Item Category
 * PATCH /restaurant/menu/bulk/category
 */
export declare const bulkUpdateCategory: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Bulk Update Menu Item Prices
 * PATCH /restaurant/menu/bulk/price
 */
export declare const bulkUpdatePrice: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Bulk Delete Menu Items
 * DELETE /restaurant/menu/bulk
 */
export declare const bulkDeleteMenuItems: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=menuController.d.ts.map