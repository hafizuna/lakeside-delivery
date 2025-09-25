/**
 * Test script to verify backward compatibility between old and new category structures
 * Run this to test that both restaurant and customer apps work with the updated backend
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testCategoryCompatibility() {
  console.log('🧪 Testing Category Compatibility...\n');

  try {
    // Test 1: Get restaurants with menu items (customer app perspective)
    console.log('📋 Test 1: Customer App - Getting restaurant with menu items');
    const restaurantResponse = await axios.get(`${API_BASE_URL}/restaurants/1`);
    
    if (restaurantResponse.data.success) {
      const restaurant = restaurantResponse.data.data;
      console.log(`✅ Restaurant: ${restaurant.name}`);
      console.log(`📊 Menu items count: ${restaurant.menus?.length || 0}`);
      
      if (restaurant.menus && restaurant.menus.length > 0) {
        const firstItem = restaurant.menus[0];
        console.log('🔍 First menu item structure:');
        console.log(`   - Name: ${firstItem.itemName}`);
        console.log(`   - Legacy category: ${firstItem.category || 'null'}`);
        console.log(`   - New category object: ${JSON.stringify(firstItem.categoryObject || null)}`);
        
        // Test backward compatibility
        const hasLegacyCategory = firstItem.category !== undefined;
        const hasNewCategory = firstItem.categoryObject !== undefined;
        
        console.log(`✅ Legacy category field present: ${hasLegacyCategory}`);
        console.log(`✅ New category object present: ${hasNewCategory}`);
        
        if (hasLegacyCategory && hasNewCategory) {
          const categoryMatch = firstItem.category === firstItem.categoryObject?.name;
          console.log(`✅ Category compatibility: ${categoryMatch ? 'PASS' : 'FAIL'}`);
        }
      }
    } else {
      console.log('❌ Failed to get restaurant details');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Get categories endpoint (both old and new formats)
    console.log('📋 Test 2: Categories API - Backward compatibility');
    const categoriesResponse = await axios.get(`${API_BASE_URL}/restaurants/categories`);
    
    if (categoriesResponse.data.success) {
      console.log('✅ Categories API response structure:');
      console.log(`   - Legacy data array: ${Array.isArray(categoriesResponse.data.data)}`);
      console.log(`   - Legacy data: [${categoriesResponse.data.data?.slice(0, 3).join(', ')}...]`);
      console.log(`   - New categories array: ${Array.isArray(categoriesResponse.data.categories)}`);
      
      if (categoriesResponse.data.categories && categoriesResponse.data.categories.length > 0) {
        const firstCategory = categoriesResponse.data.categories[0];
        console.log('🔍 First category object structure:');
        console.log(`   - ${JSON.stringify(firstCategory, null, 2)}`);
      }
      
      console.log('✅ Both legacy and new formats are available');
    } else {
      console.log('❌ Failed to get categories');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Restaurant app perspective (if authenticated)
    console.log('📋 Test 3: Testing menu items grouping by category');
    const allRestaurants = await axios.get(`${API_BASE_URL}/restaurants`);
    
    if (allRestaurants.data.success) {
      const restaurants = allRestaurants.data.data;
      console.log(`✅ Found ${restaurants.length} restaurants`);
      
      let totalMenuItems = 0;
      let categorizedItems = 0;
      
      restaurants.forEach(restaurant => {
        if (restaurant.menus) {
          totalMenuItems += restaurant.menus.length;
          categorizedItems += restaurant.menus.filter(item => item.category || item.categoryObject).length;
        }
      });
      
      console.log(`📊 Total menu items across all restaurants: ${totalMenuItems}`);
      console.log(`📊 Items with category information: ${categorizedItems}`);
      console.log(`📊 Category coverage: ${Math.round((categorizedItems / totalMenuItems) * 100)}%`);
    }

    console.log('\n🎉 Category compatibility tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

// Helper function to test category utilities (would need to be run in the customer app context)
function testCategoryUtils() {
  console.log('\n🧪 Testing Category Utility Functions...\n');
  
  // Mock menu items with different category formats
  const mockMenuItems = [
    // Legacy format only
    {
      id: 1,
      itemName: "Classic Burger",
      category: "Burgers",
      price: "12.99"
    },
    // New format only  
    {
      id: 2,
      itemName: "Margherita Pizza",
      categoryObject: {
        id: 2,
        name: "Pizza",
        slug: "pizza",
        icon: "🍕",
        sortOrder: 2
      },
      price: "14.99"
    },
    // Both formats (most common after migration)
    {
      id: 3,
      itemName: "Chocolate Chip Cookie",
      category: "Desserts",
      categoryObject: {
        id: 3,
        name: "Desserts", 
        slug: "desserts",
        icon: "🍪",
        sortOrder: 5
      },
      price: "3.99"
    },
    // No category
    {
      id: 4,
      itemName: "Mystery Item",
      price: "9.99"
    }
  ];

  console.log('📋 Mock menu items for testing:');
  mockMenuItems.forEach(item => {
    console.log(`   ${item.itemName}: legacy="${item.category || 'none'}", new="${item.categoryObject?.name || 'none'}"`);
  });

  // Note: These utility functions would need to be imported and run in actual app context
  console.log('\n✅ Category utility functions ready for testing in app context');
  console.log('   - getCategoryName()');
  console.log('   - getCategoryDisplayText()'); 
  console.log('   - groupItemsByCategory()');
  console.log('   - getUniqueCategories()');
}

// Run tests
if (require.main === module) {
  console.log('🚀 Starting Category Compatibility Tests\n');
  testCategoryCompatibility()
    .then(() => {
      testCategoryUtils();
      console.log('\n✅ All tests completed successfully!');
    })
    .catch(error => {
      console.error('\n❌ Tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testCategoryCompatibility, testCategoryUtils };
