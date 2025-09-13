import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
/**
 * Restaurant Authentication Controller
 */
export declare const restaurantLogin: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get Restaurant Profile
 */
export declare const getRestaurantProfile: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update Restaurant Profile
 */
export declare const updateRestaurantProfile: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=restaurantController.d.ts.map