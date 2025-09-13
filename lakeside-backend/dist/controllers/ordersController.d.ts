import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
/**
 * Get Restaurant Orders
 */
export declare const getRestaurantOrders: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update Order Status
 */
export declare const updateOrderStatus: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get Order Details
 */
export declare const getOrderDetails: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get Restaurant Analytics
 */
export declare const getRestaurantAnalytics: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=ordersController.d.ts.map