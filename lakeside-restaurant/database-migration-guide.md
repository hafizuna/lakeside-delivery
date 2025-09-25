# 🗄️ DATABASE MIGRATION GUIDE - Categories Table

## 🎯 OBJECTIVE
Transform the current `Menu.category` (String) field into a proper foreign key relationship with a dedicated `Category` table.

---

## 📋 STEP-BY-STEP MIGRATION PROCESS

### STEP 1: Update Prisma Schema
Navigate to the backend and update the schema file:

```bash
cd C:\Users\Dev\Documents\lakeside-delivery\lakeside-backend
```

Edit `prisma/schema.prisma`:

```prisma
// Add this NEW Category model before the Menu model
model Category {
  id            Int        @id @default(autoincrement()) @map("category_id")
  restaurantId  Int        @map("restaurant_id")
  name          String
  slug          String     @unique
  icon          String?    // optional URL or icon name
  sortOrder     Int        @default(0) @map("sort_order")
  isActive      Boolean    @default(true) @map("is_active")
  createdAt     DateTime   @default(now()) @map("created_at")
  updatedAt     DateTime   @updatedAt @map("updated_at")

  // Relations
  restaurant    Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  menus         Menu[]

  @@unique([restaurantId, name], name: "unique_restaurant_category_name")
  @@map("categories")
}

// UPDATE existing Menu model
model Menu {
  id           Int       @id @default(autoincrement()) @map("menu_id")
  restaurantId Int       @map("restaurant_id")
  itemName     String    @map("item_name")
  description  String?
  price        Decimal   @db.Decimal(10, 2)
  imageUrl     String?   @map("image_url")
  isAvailable  Boolean   @default(true) @map("is_available")
  
  // REMOVE this old field:
  // category     String  @default("Other")
  
  // ADD new foreign key relationship:
  categoryId   Int?      @map("category_id")
  category     Category? @relation(fields: [categoryId], references: [id])

  restaurant   Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  orderItems   OrderItem[]
  
  @@map("menus")
}

// UPDATE Restaurant model to include categories relation
model Restaurant {
  // ... existing fields ...
  
  // Relations (add categories to existing relations)
  menus          Menu[]
  orders         Order[]
  supportTickets SupportTicket[]
  ratings        Rating[] @relation("RestaurantRatings")
  restaurantWallet RestaurantWallet?
  categories     Category[]  // 👈 ADD THIS LINE
  
  @@map("restaurants")
}
```

### STEP 2: Generate Migration
```bash
npx prisma migrate dev --name add-categories-table
```

This creates a new migration file in `prisma/migrations/` with the SQL to:
- Create `categories` table
- Add `category_id` column to `menus` table
- Create foreign key constraint

### STEP 3: Data Migration Script
After the schema migration, we need to migrate existing category data.

Create `scripts/migrate-categories.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCategories() {
  console.log('🚀 Starting category data migration...');

  try {
    // Step 1: Get all restaurants
    const restaurants = await prisma.restaurant.findMany({
      select: { id: true, name: true }
    });

    console.log(`Found ${restaurants.length} restaurants to migrate`);

    for (const restaurant of restaurants) {
      console.log(`\n📍 Migrating restaurant: ${restaurant.name} (ID: ${restaurant.id})`);

      // Step 2: Get unique categories from existing menu items
      const uniqueCategories = await prisma.menu.findMany({
        where: { restaurantId: restaurant.id },
        select: { category: true },
        distinct: ['category']
      });

      console.log(`  Found ${uniqueCategories.length} unique categories`);

      // Step 3: Create Category records
      const categoryMap: Record<string, number> = {};
      
      for (let i = 0; i < uniqueCategories.length; i++) {
        const categoryName = uniqueCategories[i].category || 'Other';
        
        const slug = categoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        try {
          const newCategory = await prisma.category.create({
            data: {
              restaurantId: restaurant.id,
              name: categoryName,
              slug: `${restaurant.id}-${slug}`, // Ensure uniqueness across restaurants
              sortOrder: i + 1,
              isActive: true
            }
          });
          
          categoryMap[categoryName] = newCategory.id;
          console.log(`    ✅ Created category: ${categoryName} (ID: ${newCategory.id})`);
        } catch (error) {
          console.error(`    ❌ Failed to create category: ${categoryName}`, error);
        }
      }

      // Step 4: Update Menu items to use category_id
      for (const [categoryName, categoryId] of Object.entries(categoryMap)) {
        try {
          const result = await prisma.menu.updateMany({
            where: { 
              restaurantId: restaurant.id,
              category: categoryName,
              categoryId: null // Only update items that haven't been migrated yet
            },
            data: { categoryId }
          });
          
          console.log(`    ✅ Updated ${result.count} menu items for category: ${categoryName}`);
        } catch (error) {
          console.error(`    ❌ Failed to update menu items for category: ${categoryName}`, error);
        }
      }
    }

    console.log('\n🎉 Category migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateCategories()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### STEP 4: Run Data Migration
```bash
# Make the script executable
npx ts-node scripts/migrate-categories.ts
```

### STEP 5: Final Schema Update (Remove old category column)
After verifying all data is migrated correctly, create a final migration to remove the old column:

```bash
# First, manually edit the schema to remove the old category field (already done in Step 1)
# Then generate the migration to drop the column
npx prisma migrate dev --name remove-old-category-column
```

---

## ✅ VERIFICATION STEPS

### 1. Check Categories were created correctly:
```sql
SELECT r.name as restaurant_name, c.name as category_name, c.sort_order, 
       COUNT(m.id) as menu_items_count
FROM categories c
JOIN restaurants r ON c.restaurant_id = r.restaurant_id  
LEFT JOIN menus m ON m.category_id = c.category_id
GROUP BY c.category_id
ORDER BY r.name, c.sort_order;
```

### 2. Check Menu items have category_id set:
```sql
SELECT 
  COUNT(*) as total_menu_items,
  COUNT(category_id) as items_with_category,
  COUNT(*) - COUNT(category_id) as items_without_category
FROM menus;
```

### 3. Test the relationship:
```typescript
// Test in your app
const menuWithCategory = await prisma.menu.findFirst({
  include: {
    category: true,
    restaurant: true
  }
});

console.log('Menu item:', menuWithCategory?.itemName);
console.log('Category:', menuWithCategory?.category?.name);
console.log('Restaurant:', menuWithCategory?.restaurant.name);
```

---

## 🚨 ROLLBACK PLAN (if needed)

If something goes wrong, you can rollback:

```bash
# Rollback the last migration
npx prisma migrate reset
# Or rollback to a specific migration
npx prisma migrate resolve --rolled-back [migration-name]
```

---

## 📊 EXPECTED RESULTS

After migration:
- ✅ New `categories` table with all unique categories per restaurant
- ✅ Menu items linked to categories via `category_id` foreign key
- ✅ Old `category` string column removed
- ✅ Proper relationships for future category management features
- ✅ Better query performance with indexed foreign keys
- ✅ Data integrity with foreign key constraints

---

## 🚀 READY TO PROCEED?

Once this migration is complete, we can implement:
1. Category management APIs
2. Category reordering
3. Bulk operations with proper category relationships
4. Advanced analytics per category

**Would you like me to start implementing this migration step-by-step?**
