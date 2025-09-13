import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        role: string;
        phone: string;
    };
}
declare class WalletController {
    getWallet(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    requestTopUp(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getTransactionHistory(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    requestWithdrawal(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getPendingTransactions(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    approveTransaction(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    rejectTransaction(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    getWalletStats(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    refundCustomer(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    checkBalance(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
declare const _default: WalletController;
export default _default;
//# sourceMappingURL=walletController.d.ts.map