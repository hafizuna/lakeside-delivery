/*
  PRICING STRUCTURE UPDATE MIGRATION
  
  This migration:
  1. Adds new pricing fields (items_subtotal, delivery_commission, platform_earnings)
  2. Renames commission -> restaurant_commission 
  3. Preserves existing data by migrating values
  4. Removes redundant estimated_delivery field
  5. Calculates correct pricing structure for existing orders
*/

-- Step 1: Add new columns with default values
ALTER TABLE `orders` 
    ADD COLUMN `items_subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `delivery_commission` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `platform_earnings` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `restaurant_commission` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- Step 2: Migrate existing data to new structure
-- Current: totalPrice = food items only, deliveryFee = delivery cost
-- New: totalPrice = itemsSubtotal + deliveryFee
UPDATE `orders` SET 
    items_subtotal = total_price,                           -- Current totalPrice is actually food items price
    restaurant_commission = commission,                     -- Copy existing commission
    delivery_commission = delivery_fee * 0.1,              -- Calculate 10% of delivery fee
    total_price = total_price + delivery_fee,               -- New totalPrice = food + delivery
    platform_earnings = commission + (delivery_fee * 0.1)  -- Restaurant commission + delivery commission
WHERE items_subtotal = 0.00;

-- Step 3: Remove old columns
ALTER TABLE `orders` 
    DROP COLUMN `commission`,
    DROP COLUMN `estimated_delivery`,
    DROP COLUMN `platform_commission`;
