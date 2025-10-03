/*
  Warnings:

  - You are about to drop the column `driver_arrived_at` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `orders` DROP COLUMN `driver_arrived_at`,
    ADD COLUMN `arrived_at_restaurant_at` DATETIME(3) NULL;
