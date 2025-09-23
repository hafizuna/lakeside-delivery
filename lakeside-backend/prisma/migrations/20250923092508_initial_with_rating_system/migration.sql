-- CreateTable
CREATE TABLE `users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role` ENUM('CUSTOMER', 'DRIVER', 'RESTAURANT', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    `status` ENUM('ACTIVE', 'BLOCKED', 'PENDING') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_phone_key`(`phone`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `drivers` (
    `driver_id` INTEGER NOT NULL,
    `vehicle_type` ENUM('BIKE') NOT NULL DEFAULT 'BIKE',
    `current_lat` DECIMAL(10, 6) NULL,
    `current_lng` DECIMAL(10, 6) NULL,
    `is_available` BOOLEAN NOT NULL DEFAULT true,
    `wallet_balance` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `rating` DOUBLE NULL DEFAULT 5.0,
    `license_number` VARCHAR(191) NOT NULL,
    `vehicle_registration` VARCHAR(191) NOT NULL,
    `document_urls` JSON NULL,
    `approval_status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'PENDING',
    `online_at` DATETIME(3) NULL,
    `total_deliveries` INTEGER NOT NULL DEFAULT 0,
    `avg_rating` DOUBLE NULL DEFAULT 5.0,
    `completion_rate` DOUBLE NULL DEFAULT 100.0,
    `last_delivery_at` DATETIME(3) NULL,

    PRIMARY KEY (`driver_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `restaurants` (
    `restaurant_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `lat` DECIMAL(10, 6) NOT NULL,
    `lng` DECIMAL(10, 6) NOT NULL,
    `logo_url` VARCHAR(191) NULL,
    `banner_url` VARCHAR(191) NULL,
    `rating` DOUBLE NULL DEFAULT 0.0,
    `total_orders` INTEGER NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NULL,
    `geofence_zone_id` INTEGER NULL,
    `commission_rate` DECIMAL(5, 2) NOT NULL DEFAULT 15.0,
    `status` ENUM('OPEN', 'CLOSED', 'SUSPENDED') NOT NULL DEFAULT 'OPEN',

    PRIMARY KEY (`restaurant_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menus` (
    `menu_id` INTEGER NOT NULL AUTO_INCREMENT,
    `restaurant_id` INTEGER NOT NULL,
    `item_name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `image_url` VARCHAR(191) NULL,
    `is_available` BOOLEAN NOT NULL DEFAULT true,
    `category` VARCHAR(191) NOT NULL DEFAULT 'Other',

    PRIMARY KEY (`menu_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `order_id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `restaurant_id` INTEGER NOT NULL,
    `driver_id` INTEGER NULL,
    `total_price` DECIMAL(10, 2) NOT NULL,
    `delivery_fee` DECIMAL(10, 2) NOT NULL,
    `commission` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERING', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `pickup_address` VARCHAR(191) NULL,
    `pickup_lat` DECIMAL(10, 6) NULL,
    `pickup_lng` DECIMAL(10, 6) NULL,
    `pickup_instructions` VARCHAR(191) NULL,
    `estimated_pickup_time` DATETIME(3) NULL,
    `delivery_address` VARCHAR(191) NOT NULL,
    `delivery_lat` DECIMAL(10, 6) NULL,
    `delivery_lng` DECIMAL(10, 6) NULL,
    `delivery_instructions` VARCHAR(191) NULL,
    `driver_earning` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `platform_commission` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `delivery_distance` DECIMAL(8, 2) NULL,
    `estimated_delivery_time` INTEGER NULL,
    `payment_method` ENUM('CASH', 'CARD', 'WALLET', 'UPI') NOT NULL DEFAULT 'CASH',
    `payment_status` ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `accepted_at` DATETIME(3) NULL,
    `preparing_at` DATETIME(3) NULL,
    `picked_up_at` DATETIME(3) NULL,
    `delivered_at` DATETIME(3) NULL,
    `estimated_delivery` DATETIME(3) NULL,

    PRIMARY KEY (`order_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `menu_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `price` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_tracking` (
    `tracking_id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `driver_id` INTEGER NOT NULL,
    `lat` DECIMAL(10, 6) NOT NULL,
    `lng` DECIMAL(10, 6) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`tracking_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_wallets` (
    `customer_id` INTEGER NOT NULL,
    `balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `total_topups` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total_spent` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `last_topup_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`customer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `driver_wallets` (
    `driver_id` INTEGER NOT NULL,
    `balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `collateral_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `min_collateral` DECIMAL(10, 2) NOT NULL DEFAULT 1000.00,
    `total_earnings` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `total_withdrawn` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `can_withdraw` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_earning_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`driver_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallet_transactions` (
    `transaction_id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NULL,
    `driver_id` INTEGER NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `type` ENUM('CUSTOMER_TOPUP', 'CUSTOMER_ORDER_PAYMENT', 'CUSTOMER_REFUND', 'DRIVER_COLLATERAL_DEPOSIT', 'DRIVER_EARNING', 'DRIVER_WITHDRAWAL', 'DRIVER_PENALTY', 'CREDIT', 'DEBIT', 'TOPUP', 'COMMISSION') NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `description` VARCHAR(191) NULL,
    `screenshot_url` VARCHAR(191) NULL,
    `admin_id` INTEGER NULL,
    `admin_notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed_at` DATETIME(3) NULL,

    PRIMARY KEY (`transaction_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loyalty` (
    `customer_id` INTEGER NOT NULL,
    `total_orders` INTEGER NOT NULL DEFAULT 0,
    `loyalty_points` INTEGER NOT NULL DEFAULT 0,
    `last_rewarded_at` DATETIME(3) NULL,

    PRIMARY KEY (`customer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `geofencing` (
    `zone_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `polygon_coordinates` JSON NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',

    PRIMARY KEY (`zone_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `delivery_fee_rules` (
    `rule_id` INTEGER NOT NULL AUTO_INCREMENT,
    `rule_type` ENUM('FLAT', 'DISTANCE', 'ZONE', 'HYBRID') NOT NULL,
    `base_fee` DECIMAL(10, 2) NOT NULL,
    `per_km_rate` DECIMAL(10, 2) NULL,
    `min_fee` DECIMAL(10, 2) NOT NULL,
    `max_fee` DECIMAL(10, 2) NOT NULL,
    `zone_id` INTEGER NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`rule_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `log_id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `target_entity_id` INTEGER NOT NULL,
    `entity_type` ENUM('DRIVER', 'RESTAURANT', 'ORDER', 'WALLET') NOT NULL,
    `details` JSON NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_tickets` (
    `ticket_id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `customer_id` INTEGER NOT NULL,
    `driver_id` INTEGER NULL,
    `restaurant_id` INTEGER NULL,
    `issue_type` ENUM('FOOD', 'DELIVERY', 'PAYMENT', 'OTHER') NOT NULL,
    `status` ENUM('OPEN', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `notes` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolved_at` DATETIME(3) NULL,

    PRIMARY KEY (`ticket_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ratings` (
    `rating_id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `rating_type` ENUM('RESTAURANT', 'ORDER') NOT NULL,
    `restaurant_id` INTEGER NULL,
    `order_id` INTEGER NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ratings_customer_id_restaurant_id_key`(`customer_id`, `restaurant_id`),
    UNIQUE INDEX `ratings_customer_id_order_id_key`(`customer_id`, `order_id`),
    PRIMARY KEY (`rating_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `drivers` ADD CONSTRAINT `drivers_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `restaurants` ADD CONSTRAINT `restaurants_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `restaurants` ADD CONSTRAINT `restaurants_geofence_zone_id_fkey` FOREIGN KEY (`geofence_zone_id`) REFERENCES `geofencing`(`zone_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `menus` ADD CONSTRAINT `menus_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`restaurant_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`restaurant_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_menu_id_fkey` FOREIGN KEY (`menu_id`) REFERENCES `menus`(`menu_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_tracking` ADD CONSTRAINT `order_tracking_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_tracking` ADD CONSTRAINT `order_tracking_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`driver_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_wallets` ADD CONSTRAINT `customer_wallets_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `driver_wallets` ADD CONSTRAINT `driver_wallets_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`driver_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`driver_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyalty` ADD CONSTRAINT `loyalty_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_fee_rules` ADD CONSTRAINT `delivery_fee_rules_zone_id_fkey` FOREIGN KEY (`zone_id`) REFERENCES `geofencing`(`zone_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`driver_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`restaurant_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ratings` ADD CONSTRAINT `ratings_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ratings` ADD CONSTRAINT `ratings_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`restaurant_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ratings` ADD CONSTRAINT `ratings_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE ON UPDATE CASCADE;
