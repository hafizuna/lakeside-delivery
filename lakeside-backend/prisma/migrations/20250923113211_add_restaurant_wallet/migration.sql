-- AlterTable
ALTER TABLE `wallet_transactions` MODIFY `type` ENUM('CUSTOMER_TOPUP', 'CUSTOMER_ORDER_PAYMENT', 'CUSTOMER_REFUND', 'DRIVER_COLLATERAL_DEPOSIT', 'DRIVER_EARNING', 'DRIVER_WITHDRAWAL', 'DRIVER_PENALTY', 'RESTAURANT_ORDER_EARNING', 'RESTAURANT_COMMISSION_DEDUCTION', 'RESTAURANT_PAYOUT', 'CREDIT', 'DEBIT', 'TOPUP', 'COMMISSION') NOT NULL;

-- CreateTable
CREATE TABLE `restaurant_wallets` (
    `restaurant_id` INTEGER NOT NULL,
    `balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total_earnings` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total_commission_paid` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total_payouts` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_earning_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`restaurant_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `restaurant_wallets` ADD CONSTRAINT `restaurant_wallets_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`restaurant_id`) ON DELETE CASCADE ON UPDATE CASCADE;
