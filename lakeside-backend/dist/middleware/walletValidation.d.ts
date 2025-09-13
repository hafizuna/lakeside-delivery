import { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        role: string;
        phone: string;
    };
    walletUser?: {
        id: number;
        role: string;
    };
}
export declare const validateTopUp: import("express-validator").ValidationChain[];
export declare const validateWithdrawal: import("express-validator").ValidationChain[];
export declare const validateTransactionId: import("express-validator").ValidationChain[];
export declare const validateAdminAction: import("express-validator").ValidationChain[];
export declare const validateRefund: import("express-validator").ValidationChain[];
export declare const validatePagination: import("express-validator").ValidationChain[];
export declare const validateBalanceCheck: import("express-validator").ValidationChain[];
export declare const validateUserTypeQuery: import("express-validator").ValidationChain[];
export declare const checkWalletOwnership: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const checkTopUpLimits: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const checkWithdrawalEligibility: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=walletValidation.d.ts.map