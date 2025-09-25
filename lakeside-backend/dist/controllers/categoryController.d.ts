import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
/**
 * Get Categories for Restaurant
 * GET /restaurant/categories
 */
export declare const getCategories: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Create Category
 * POST /restaurant/categories
 */
export declare const createCategory: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update Category
 * PUT /restaurant/categories/:id
 */
export declare const updateCategory: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete Category
 * DELETE /restaurant/categories/:id
 */
export declare const deleteCategory: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Reorder Categories
 * PATCH /restaurant/categories/reorder
 */
export declare const reorderCategories: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=categoryController.d.ts.map