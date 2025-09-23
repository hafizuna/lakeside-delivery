/**
 * Debug script to test restaurant APIs and check price data types
 * This will help identify if prices are coming as strings or numbers from the API
 * and verify the data structure of restaurants and menu items
 */

const API_BASE_URL = 'http://localhost:3001/api';

async function testRestaurantAPIs() {
  console.log('🔍 Testing Restaurant APIs and Price Data Types...\n');
  console.log(`🔗 API Base URL: ${API_BASE_URL}\n`);
  
  try {
    // Test 1: Fetch all restaurants
    console.log('1️⃣ Testing: GET /restaurants');
    const restaurantsResponse = await fetch(`${API_BASE_URL}/restaurants`);
    
    if (!restaurantsResponse.ok) {
      throw new Error(`HTTP ${restaurantsResponse.status}: ${restaurantsResponse.statusText}`);
    }
    
    const restaurantsData = await restaurantsResponse.json();
    console.log('✅ Restaurants API Response:', {
      status: restaurantsResponse.status,
      dataType: typeof restaurantsData,
      isArray: Array.isArray(restaurantsData.data || restaurantsData),
      length: (restaurantsData.data || restaurantsData).length
    });

    const restaurants = restaurantsData.data || restaurantsData;
    
    if (restaurants.length > 0) {
      const firstRestaurant = restaurants[0];
      console.log('📝 First Restaurant Data Structure:');
      console.log('Full restaurant object:', JSON.stringify(firstRestaurant, null, 2));
      console.log('\n📋 Restaurant Summary:', {
        id: firstRestaurant.id,
        name: firstRestaurant.name,
        deliveryFee: {
          value: firstRestaurant.deliveryFee,
          type: typeof firstRestaurant.deliveryFee
        },
        minimumOrder: {
          value: firstRestaurant.minimumOrder,
          type: typeof firstRestaurant.minimumOrder
        },
        hasMenuItems: !!firstRestaurant.menus && firstRestaurant.menus.length > 0
      });
      
      // Test 2: Fetch restaurant details with menu items
      console.log(`\n2️⃣ Testing: GET /restaurants/${firstRestaurant.id}`);
      const detailResponse = await fetch(`${API_BASE_URL}/restaurants/${firstRestaurant.id}`);
      
      if (!detailResponse.ok) {
        throw new Error(`HTTP ${detailResponse.status}: ${detailResponse.statusText}`);
      }
      
      const detailData = await detailResponse.json();
      console.log('✅ Restaurant Detail API Response:', {
        status: detailResponse.status,
        hasMenuItems: !!(detailData.data || detailData).menus,
        menuItemsCount: ((detailData.data || detailData).menus || []).length
      });
      
      const restaurant = detailData.data || detailData;
      console.log('Full restaurant detail object:', JSON.stringify(restaurant, null, 2));
      
      // Test 3: Try menu items endpoint separately
      console.log(`\n3️⃣ Testing: GET /menu-items/restaurant/${firstRestaurant.id}`);
      try {
        const menuResponse = await fetch(`${API_BASE_URL}/menu-items/restaurant/${firstRestaurant.id}`);
        if (menuResponse.ok) {
          const menuData = await menuResponse.json();
          console.log('✅ Menu Items API Response:', {
            status: menuResponse.status,
            hasItems: !!(menuData.data || menuData).length,
            itemsCount: (menuData.data || menuData).length
          });
          
          if ((menuData.data || menuData).length > 0) {
            restaurant.menus = menuData.data || menuData;
          }
        } else {
          console.log('❌ Menu items endpoint not available:', menuResponse.status);
        }
      } catch (menuError) {
        console.log('❌ Failed to fetch menu items:', menuError.message);
      }
      
      if (restaurant.menus && restaurant.menus.length > 0) {
        console.log('\n🍽️ Menu Items Price Analysis:');
        
        restaurant.menus.slice(0, 5).forEach((item, index) => {
          console.log(`   Item ${index + 1}: ${item.itemName}`);
          console.log(`     - Price: ${item.price} (${typeof item.price})`);
          if (item.originalPrice) {
            console.log(`     - Original Price: ${item.originalPrice} (${typeof item.originalPrice})`);
          }
          console.log(`     - Available: ${item.available} (${typeof item.available})`);
          console.log('   ---');
        });
        
        // Analyze price data types
        const priceTypes = {};
        restaurant.menus.forEach(item => {
          const priceType = typeof item.price;
          priceTypes[priceType] = (priceTypes[priceType] || 0) + 1;
        });
        
        console.log('\n📊 Price Data Type Analysis:');
        Object.entries(priceTypes).forEach(([type, count]) => {
          console.log(`   ${type}: ${count} items (${((count / restaurant.menus.length) * 100).toFixed(1)}%)`);
        });
        
        // Check for any price parsing issues
        const problematicPrices = restaurant.menus.filter(item => {
          const price = parseFloat(item.price);
          return isNaN(price) || price <= 0;
        });
        
        if (problematicPrices.length > 0) {
          console.log('\n⚠️  Problematic Prices Found:');
          problematicPrices.forEach(item => {
            console.log(`   - ${item.itemName}: "${item.price}" (${typeof item.price})`);
          });
        } else {
          console.log('\n✅ All prices appear to be valid numbers when parsed');
        }
        
        // Test price conversion
        console.log('\n🔄 Price Conversion Test:');
        const testItem = restaurant.menus[0];
        console.log(`   Original: ${testItem.price} (${typeof testItem.price})`);
        console.log(`   parseFloat(): ${parseFloat(testItem.price)} (${typeof parseFloat(testItem.price)})`);
        console.log(`   Number(): ${Number(testItem.price)} (${typeof Number(testItem.price)})`);
        console.log(`   toString(): ${parseFloat(testItem.price).toString()}`);
        console.log(`   toFixed(2): ${parseFloat(testItem.price).toFixed(2)}`);
        
      } else {
        console.log('❌ No menu items found for this restaurant');
      }
    }
    
    console.log('\n✅ Debug script completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error occurred during API testing:');
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Troubleshooting Tips:');
      console.log('   1. Make sure your backend server is running on localhost:3001');
      console.log('   2. Check if the API endpoints are correct');
      console.log('   3. Verify CORS settings if testing from browser');
      console.log('   4. Check your network connection');
    }
  }
}

// Run the debug script
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  testRestaurantAPIs();
} else {
  // Browser environment
  testRestaurantAPIs();
}

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testRestaurantAPIs };
}
