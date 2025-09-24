interface ServiceResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
}
declare class WalletService {
    createCustomerWallet(customerId: number): Promise<ServiceResponse>;
    getCustomerWallet(customerId: number): Promise<ServiceResponse>;
    requestCustomerTopUp(customerId: number, amount: number, screenshotUrl?: string): Promise<ServiceResponse>;
    processCustomerPayment(customerId: number, amount: number, orderId?: number): Promise<ServiceResponse>;
    createDriverWallet(driverId: number): Promise<ServiceResponse>;
    getDriverWallet(driverId: number): Promise<ServiceResponse>;
    addDriverEarning(driverId: number, amount: number, orderId?: number): Promise<ServiceResponse>;
    requestDriverWithdrawal(driverId: number, amount: number): Promise<ServiceResponse>;
    addCustomerRefund(customerId: number, amount: number, orderId?: number, reason?: string): Promise<ServiceResponse>;
    getTransactionHistory(userId: number, userType?: 'customer' | 'driver', page?: number, limit?: number): Promise<ServiceResponse>;
    getPendingTransactions(page?: number, limit?: number): Promise<ServiceResponse>;
    approveTransaction(transactionId: number, adminId: number, adminNotes?: string): Promise<ServiceResponse>;
    rejectTransaction(transactionId: number, adminId: number, adminNotes?: string): Promise<ServiceResponse>;
    getWalletStats(userType?: 'customer' | 'driver' | 'all'): Promise<ServiceResponse>;
    refundCustomer(customerId: number, amount: number, orderId?: number, adminId?: number): Promise<ServiceResponse>;
    checkSufficientBalance(customerId: number, amount: number): Promise<ServiceResponse<{
        hasSufficientBalance: boolean;
        currentBalance: number;
    }>>;
}
declare const _default: WalletService;
export default _default;
//# sourceMappingURL=walletService.d.ts.map