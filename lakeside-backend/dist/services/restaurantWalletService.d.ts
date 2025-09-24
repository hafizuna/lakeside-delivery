import { Prisma } from '@prisma/client';
interface RestaurantWalletService {
    getOrCreateWallet(restaurantId: number): Promise<any>;
    addRestaurantEarning(restaurantId: number, orderTotal: number, commission: number, orderId?: number): Promise<any>;
    getWalletBalance(restaurantId: number): Promise<any>;
    getWalletTransactions(restaurantId: number, limit?: number): Promise<any>;
}
declare class RestaurantWalletServiceImpl implements RestaurantWalletService {
    /**
     * Get or create restaurant wallet
     */
    getOrCreateWallet(restaurantId: number): Promise<{
        success: boolean;
        data: {
            wallet: {
                createdAt: Date;
                restaurantId: number;
                updatedAt: Date;
                balance: Prisma.Decimal;
                totalEarnings: Prisma.Decimal;
                isActive: boolean;
                lastEarningAt: Date | null;
                totalCommissionPaid: Prisma.Decimal;
                totalPayouts: Prisma.Decimal;
            };
            balance: number;
            totalEarnings: number;
            totalCommissionPaid: number;
            totalPayouts: number;
        };
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        data?: undefined;
    }>;
    /**
     * Add restaurant earning from order (food price - commission)
     */
    addRestaurantEarning(restaurantId: number, orderTotal: number, commission: number, orderId?: number): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        data: {
            wallet: {
                createdAt: Date;
                restaurantId: number;
                updatedAt: Date;
                balance: Prisma.Decimal;
                totalEarnings: Prisma.Decimal;
                isActive: boolean;
                lastEarningAt: Date | null;
                totalCommissionPaid: Prisma.Decimal;
                totalPayouts: Prisma.Decimal;
            };
            transaction: {
                id: number;
                status: import(".prisma/client").$Enums.WalletTransactionStatus;
                createdAt: Date;
                customerId: number | null;
                driverId: number | null;
                adminId: number | null;
                amount: Prisma.Decimal;
                type: import(".prisma/client").$Enums.WalletTransactionType;
                description: string | null;
                screenshotUrl: string | null;
                adminNotes: string | null;
                processedAt: Date | null;
            };
            netEarning: number;
            commission: number;
        };
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        data?: undefined;
    }>;
    /**
     * Get restaurant wallet balance
     */
    getWalletBalance(restaurantId: number): Promise<{
        success: boolean;
        data: {
            balance: number;
            totalEarnings: number;
            totalCommissionPaid: number;
            totalPayouts: number;
            wallet: {
                createdAt: Date;
                restaurantId: number;
                updatedAt: Date;
                balance: Prisma.Decimal;
                totalEarnings: Prisma.Decimal;
                isActive: boolean;
                lastEarningAt: Date | null;
                totalCommissionPaid: Prisma.Decimal;
                totalPayouts: Prisma.Decimal;
            };
        };
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        data?: undefined;
    }>;
    /**
     * Get restaurant wallet transactions
     */
    getWalletTransactions(restaurantId: number, limit?: number): Promise<{
        success: boolean;
        data: {
            balance: number;
            totalEarnings: number;
            totalCommissionPaid: number;
            totalPayouts: number;
            wallet: {
                createdAt: Date;
                restaurantId: number;
                updatedAt: Date;
                balance: Prisma.Decimal;
                totalEarnings: Prisma.Decimal;
                isActive: boolean;
                lastEarningAt: Date | null;
                totalCommissionPaid: Prisma.Decimal;
                totalPayouts: Prisma.Decimal;
            };
        };
        message?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            wallet: {
                balance: number;
                totalEarnings: number;
                totalCommissionPaid: number;
                totalPayouts: number;
                wallet: {
                    createdAt: Date;
                    restaurantId: number;
                    updatedAt: Date;
                    balance: Prisma.Decimal;
                    totalEarnings: Prisma.Decimal;
                    isActive: boolean;
                    lastEarningAt: Date | null;
                    totalCommissionPaid: Prisma.Decimal;
                    totalPayouts: Prisma.Decimal;
                };
            } | undefined;
            transactions: {
                amount: number;
                id: number;
                status: import(".prisma/client").$Enums.WalletTransactionStatus;
                createdAt: Date;
                customerId: number | null;
                driverId: number | null;
                adminId: number | null;
                type: import(".prisma/client").$Enums.WalletTransactionType;
                description: string | null;
                screenshotUrl: string | null;
                adminNotes: string | null;
                processedAt: Date | null;
            }[];
        };
    }>;
}
declare const restaurantWalletService: RestaurantWalletServiceImpl;
export default restaurantWalletService;
//# sourceMappingURL=restaurantWalletService.d.ts.map