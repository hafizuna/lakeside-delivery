/**
 * Debug script to test rating API endpoints
 * This will help verify if the rating functionality is properly connected to the backend
 */

const API_BASE_URL = 'http://localhost:3001/api';

async function testRatingAPIs() {
  console.log('⭐ Testing Rating API Endpoints...\n');
  console.log(`🔗 API Base URL: ${API_BASE_URL}\n`);
  
  try {
    // Test 1: Check if rating endpoints exist
    console.log('1️⃣ Testing: POST /ratings/restaurant (dry run)');
    
    // Note: This is a dry run test to check if the endpoint exists
    // We're not actually submitting a rating without authentication
    const testRestaurantRating = await fetch(`${API_BASE_URL}/ratings/restaurant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        restaurantId: 1,
        rating: 5,
        comment: 'Test rating (should fail due to no auth)'
      })
    });
    
    console.log('Restaurant rating endpoint response:', {
      status: testRestaurantRating.status,
      statusText: testRestaurantRating.statusText,
      endpointExists: testRestaurantRating.status !== 404
    });
    
    if (testRestaurantRating.status === 401) {
      console.log('✅ Restaurant rating endpoint exists (401 = needs authentication)');\n    } else if (testRestaurantRating.status === 404) {
      console.log('❌ Restaurant rating endpoint not found');\n    } else {
      console.log(`ℹ️ Restaurant rating endpoint responded with: ${testRestaurantRating.status}`);\n    }
    
    // Test 2: Check order rating endpoint
    console.log('2️⃣ Testing: POST /ratings/order (dry run)');
    
    const testOrderRating = await fetch(`${API_BASE_URL}/ratings/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: 1,
        rating: 5,
        comment: 'Test rating (should fail due to no auth)'
      })
    });
    
    console.log('Order rating endpoint response:', {
      status: testOrderRating.status,
      statusText: testOrderRating.statusText,
      endpointExists: testOrderRating.status !== 404
    });
    
    if (testOrderRating.status === 401) {
      console.log('✅ Order rating endpoint exists (401 = needs authentication)');\n    } else if (testOrderRating.status === 404) {
      console.log('❌ Order rating endpoint not found');\n    } else {
      console.log(`ℹ️ Order rating endpoint responded with: ${testOrderRating.status}`);\n    }
    
    // Test 3: Check get ratings endpoint
    console.log('3️⃣ Testing: GET /ratings/user (dry run)');
    
    const testGetRatings = await fetch(`${API_BASE_URL}/ratings/user`);
    
    console.log('Get user ratings endpoint response:', {
      status: testGetRatings.status,
      statusText: testGetRatings.statusText,
      endpointExists: testGetRatings.status !== 404
    });
    
    if (testGetRatings.status === 401) {
      console.log('✅ Get user ratings endpoint exists (401 = needs authentication)');\n    } else if (testGetRatings.status === 404) {
      console.log('❌ Get user ratings endpoint not found');\n    } else {
      console.log(`ℹ️ Get user ratings endpoint responded with: ${testGetRatings.status}`);\n    }
    
    // Test 4: Check general orders endpoint to see if we have any actual orders
    console.log('4️⃣ Testing: GET /orders/user (check for existing orders)');
    
    const testOrders = await fetch(`${API_BASE_URL}/orders/user`);
    
    console.log('Orders endpoint response:', {
      status: testOrders.status,
      statusText: testOrders.statusText
    });
    
    if (testOrders.status === 200) {
      try {
        const ordersData = await testOrders.json();
        console.log('Orders found:', {
          count: ordersData.data?.length || 0,
          hasDeliveredOrders: ordersData.data?.some(order => order.status === 'DELIVERED') || false
        });
        
        if (ordersData.data?.length > 0) {
          console.log('\n📋 Sample order statuses:');
          ordersData.data.slice(0, 3).forEach((order, index) => {
            console.log(`   Order ${index + 1}: Status = ${order.status}, ID = ${order.id}`);
          });
        }
      } catch (parseError) {
        console.log('Could not parse orders response');
      }
    } else if (testOrders.status === 401) {
      console.log('ℹ️ Orders endpoint requires authentication');\n    }
    
    console.log('\n📊 Rating API Test Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ If endpoints return 401, they exist but need authentication');
    console.log('❌ If endpoints return 404, they are not implemented');
    console.log('ℹ️ To test with authentication, login through the app first');
    console.log('\n💡 Next steps:');
    console.log('   1. Make sure your backend has rating endpoints implemented');
    console.log('   2. Test rating functionality with a logged-in user');
    console.log('   3. Check that delivered orders show rating buttons in the app');
    
  } catch (error) {
    console.error('\n❌ Error occurred during rating API testing:');
    console.error('Error message:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Troubleshooting Tips:');
      console.log('   1. Make sure your backend server is running on localhost:3001');
      console.log('   2. Check if the rating API endpoints are implemented');
      console.log('   3. Verify CORS settings if testing from browser');
      console.log('   4. Check your network connection');
    }
  }
}

// Run the debug script
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  testRatingAPIs();
} else {
  // Browser environment
  testRatingAPIs();
}

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testRatingAPIs };
}
