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

      if (uniqueCategories.length === 0) {
        console.log('  No menu items found, skipping...');
        continue;
      }

      // Step 3: Create Category records
      const categoryMap: Record<string, number> = {};
      
      for (let i = 0; i < uniqueCategories.length; i++) {
        const categoryName = uniqueCategories[i].category || 'Other';
        
        // Create a URL-friendly slug
        const slug = categoryName.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        
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
        } catch (error: any) {
          console.error(`    ❌ Failed to create category: ${categoryName}`, error.message);
          
          // If category already exists, try to find it
          try {
            const existingCategory = await prisma.category.findFirst({
              where: {
                restaurantId: restaurant.id,
                name: categoryName
              }
            });
            
            if (existingCategory) {
              categoryMap[categoryName] = existingCategory.id;
              console.log(`    ℹ️  Using existing category: ${categoryName} (ID: ${existingCategory.id})`);
            }
          } catch (findError) {
            console.error(`    ❌ Could not find existing category: ${categoryName}`);
          }
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
        } catch (error: any) {
          console.error(`    ❌ Failed to update menu items for category: ${categoryName}`, error.message);
        }
      }
    }

    // Step 5: Verification - count migrated items
    console.log('\n📊 Migration Verification:');
    
    const totalMenuItems = await prisma.menu.count();
    const migratedMenuItems = await prisma.menu.count({
      where: { categoryId: { not: null } }
    });
    const totalCategories = await prisma.category.count();
    
    console.log(`  • Total menu items: ${totalMenuItems}`);
    console.log(`  • Migrated menu items: ${migratedMenuItems}`);
    console.log(`  • Items not migrated: ${totalMenuItems - migratedMenuItems}`);
    console.log(`  • Total categories created: ${totalCategories}`);
    
    if (migratedMenuItems === totalMenuItems) {
      console.log('\n🎉 Category migration completed successfully! All menu items migrated.');
    } else {
      console.log('\n⚠️  Category migration completed with some items not migrated. Please check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Add some test queries to verify the migration
async function verifyMigration() {
  console.log('\n🔍 Running migration verification queries...');
  
  try {
    // Test query 1: Categories with menu item counts
    const categoriesWithCounts = await prisma.category.findMany({
      include: {
        _count: {
          select: { menus: true }
        },
        restaurant: {
          select: { name: true }
        }
      },
      orderBy: [
        { restaurantId: 'asc' },
        { sortOrder: 'asc' }
      ]
    });
    
    console.log('\n📊 Categories and their menu item counts:');
    for (const category of categoriesWithCounts) {
      console.log(`  • ${category.restaurant.name} > ${category.name}: ${category._count.menus} items`);
    }
    
    // Test query 2: Menu items with their categories
    const menuItemsWithCategories = await prisma.menu.findMany({
      include: {
        categoryRef: {
          select: { name: true }
        },
        restaurant: {
          select: { name: true }
        }
      },
      take: 5 // Just show first 5 as example
    });
    
    console.log('\n🍽️  Sample menu items with categories:');
    for (const item of menuItemsWithCategories) {
      const categoryName = item.categoryRef?.name || 'No Category';
      console.log(`  • ${item.restaurant.name} > ${item.itemName} (${categoryName})`);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the migration
migrateCategories()
  .then(() => verifyMigration())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
