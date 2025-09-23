/*
  Warnings:

  - You are about to drop the column `avg_rating` on the `drivers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[customer_id,driver_id]` on the table `ratings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `drivers` DROP COLUMN `avg_rating`;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `order_rating` DOUBLE NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE `ratings` ADD COLUMN `driver_id` INTEGER NULL,
    MODIFY `rating_type` ENUM('RESTAURANT', 'ORDER', 'DRIVER') NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ratings_customer_id_driver_id_key` ON `ratings`(`customer_id`, `driver_id`);

-- AddForeignKey
ALTER TABLE `ratings` ADD CONSTRAINT `ratings_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`driver_id`) ON DELETE CASCADE ON UPDATE CASCADE;
