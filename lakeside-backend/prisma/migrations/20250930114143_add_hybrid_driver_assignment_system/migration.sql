-- AlterTable
ALTER TABLE `orders` ADD COLUMN `cancel_reason` ENUM('CUSTOMER_CHANGED_MIND', 'OUT_OF_STOCK', 'NO_DRIVER_FOUND', 'RESTAURANT_TIMEOUT', 'ADDRESS_ISSUE', 'DRIVER_CANCEL_PREP', 'DRIVER_EMERGENCY') NULL,
    ADD COLUMN `cancelled_by` ENUM('CUSTOMER', 'RESTAURANT', 'DRIVER', 'SYSTEM') NULL,
    ADD COLUMN `driver_arrived_at` DATETIME(3) NULL,
    ADD COLUMN `driver_assigned_at` DATETIME(3) NULL,
    ADD COLUMN `driver_cancel_reason` ENUM('VEHICLE_ISSUE', 'EMERGENCY', 'LONG_WAIT', 'WRONG_ADDRESS', 'RESTAURANT_DELAY') NULL,
    ADD COLUMN `ready_at` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `driver_assignments` (
    `assignment_id` VARCHAR(191) NOT NULL,
    `order_id` INTEGER NOT NULL,
    `driver_id` INTEGER NOT NULL,
    `status` ENUM('OFFERED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'OFFERED',
    `wave` INTEGER NOT NULL DEFAULT 1,
    `offered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `responded_at` DATETIME(3) NULL,
    `accepted_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `reason` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `driver_assignments_order_id_fkey`(`order_id`),
    INDEX `driver_assignments_driver_id_fkey`(`driver_id`),
    INDEX `driver_assignments_status_expires_idx`(`status`, `expires_at`),
    INDEX `driver_assignments_wave_offered_idx`(`wave`, `offered_at`),
    PRIMARY KEY (`assignment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `driver_state` (
    `driver_id` INTEGER NOT NULL,
    `is_online` BOOLEAN NOT NULL DEFAULT false,
    `active_assignments_count` INTEGER NOT NULL DEFAULT 0,
    `max_concurrent_assignments` INTEGER NOT NULL DEFAULT 1,
    `current_zone_id` INTEGER NULL,
    `last_heartbeat_at` DATETIME(3) NULL,
    `online_since` DATETIME(3) NULL,
    `last_location_update` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `driver_state_availability_idx`(`is_online`, `active_assignments_count`),
    INDEX `driver_state_zone_id_fkey`(`current_zone_id`),
    INDEX `driver_state_heartbeat_idx`(`last_heartbeat_at`),
    PRIMARY KEY (`driver_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `driver_assignments` ADD CONSTRAINT `driver_assignments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `driver_assignments` ADD CONSTRAINT `driver_assignments_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`driver_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `driver_state` ADD CONSTRAINT `driver_state_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`driver_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `driver_state` ADD CONSTRAINT `driver_state_current_zone_id_fkey` FOREIGN KEY (`current_zone_id`) REFERENCES `geofencing`(`zone_id`) ON DELETE SET NULL ON UPDATE CASCADE;
