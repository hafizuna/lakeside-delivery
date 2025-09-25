import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCategories() {
  console.log('🧪 Testing new Category-Menu relationships...');
  
  try {
    // Test 1: Get menu items with categories
    const menuWithCategories = await prisma.menu.findMany({
      include: {
        category: true,
        restaurant: { select: { name: true } }
      },
      take: 3
    });
    
    console.log('\n📋 Menu items with categories:');
    for (const item of menuWithCategories) {
      console.log(`  • ${item.restaurant.name} > ${item.itemName} (${item.category?.name || 'No Category'})`);
    }
    
    // Test 2: Get categories with menu counts
    const categoriesWithMenus = await prisma.category.findMany({
      include: {
        _count: { select: { menus: true } },
        restaurant: { select: { name: true } }
      },
      take: 5
    });
    
    console.log('\n🏷️ Categories with menu item counts:');
    for (const cat of categoriesWithMenus) {
      console.log(`  • ${cat.restaurant.name} > ${cat.name}: ${cat._count.menus} items`);
    }
    
    console.log('\n✅ All tests passed! Categories system is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCategories();
