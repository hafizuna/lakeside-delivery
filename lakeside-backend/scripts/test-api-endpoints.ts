import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAPIEndpoints() {
  console.log('🧪 Testing new API endpoints...');
  
  try {
    // Test 1: Get categories for a restaurant
    console.log('\n📂 Testing category endpoints...');
    
    const categoriesFromDB = await prisma.category.findMany({
      where: { restaurantId: 5 }, // Burger Palace
      include: {
        _count: { select: { menus: true } }
      },
      orderBy: { sortOrder: 'asc' }
    });
    
    console.log('Categories for Burger Palace:');
    categoriesFromDB.forEach(cat => {
      console.log(`  • ${cat.name} (${cat._count.menus} items) - Sort: ${cat.sortOrder}`);
    });
    
    // Test 2: Get menu items with categories
    console.log('\n🍽️  Testing menu items with categories...');
    
    const menuItemsWithCategories = await prisma.menu.findMany({
      where: { restaurantId: 5 }, // Burger Palace
      include: {
        category: {
          select: { id: true, name: true, sortOrder: true }
        }
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { itemName: 'asc' }
      ]
    });
    
    console.log('Menu items with categories for Burger Palace:');
    menuItemsWithCategories.forEach(item => {
      const categoryName = item.category?.name || 'No Category';
      console.log(`  • ${item.itemName} - ${categoryName} - $${item.price} - ${item.isAvailable ? 'Available' : 'Unavailable'}`);
    });
    
    // Test 3: Test bulk operations validation (simulate)
    console.log('\n🔄 Testing bulk operations preparation...');
    
    const menuIds = menuItemsWithCategories.map(item => item.id);
    console.log(`Found ${menuIds.length} menu items for bulk operations`);
    
    // Show what bulk operations could do
    const burgerItems = menuItemsWithCategories.filter(item => item.category?.name === 'Burgers');
    console.log(`Burger category items: ${burgerItems.length} items`);
    console.log('Burger items:', burgerItems.map(item => `${item.itemName} ($${item.price})`).join(', '));
    
    // Test 4: Check data integrity
    console.log('\n🔍 Testing data integrity...');
    
    const allMenuItems = await prisma.menu.count();
    const menuItemsWithCategory = await prisma.menu.count({
      where: { categoryId: { not: null } }
    });
    const totalCategories = await prisma.category.count();
    
    console.log(`Database status:`);
    console.log(`  • Total menu items: ${allMenuItems}`);
    console.log(`  • Menu items with categories: ${menuItemsWithCategory}`);
    console.log(`  • Menu items without categories: ${allMenuItems - menuItemsWithCategory}`);
    console.log(`  • Total categories: ${totalCategories}`);
    
    if (menuItemsWithCategory === allMenuItems) {
      console.log('✅ All menu items have been successfully migrated to use categories!');
    } else {
      console.log('⚠️ Some menu items are missing category assignments.');
    }
    
    console.log('\n🎉 API endpoint testing preparation completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPIEndpoints();
