#!/usr/bin/env node

/**
 * Socket.IO Test Script - Order Acceptance Event
 * 
 * This script simulates Burger Palace restaurant accepting order #34
 * and emits the Socket.IO event to test real-time notifications.
 */

const axios = require('axios');

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const ORDER_ID = 34;

// Burger Palace Restaurant Credentials (from LAKESIDE_DELIVERY_ACCOUNTS.md)
const RESTAURANT_CREDENTIALS = {
  phone: '0955555555', // or +251955555555
  password: 'restaurant123'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

// Helper function for colored console output
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Main test function
 */
async function testOrderAcceptanceSocket() {
  try {
    log('\n🔥 SOCKET.IO ORDER ACCEPTANCE TEST STARTING...', 'bgBlue');
    log('=' * 60, 'blue');

    // Step 1: Login as Burger Palace restaurant
    log('\n📱 Step 1: Logging in as Burger Palace restaurant...', 'yellow');
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      phone: RESTAURANT_CREDENTIALS.phone,
      password: RESTAURANT_CREDENTIALS.password,
      role: 'RESTAURANT'
    });

    if (!loginResponse.data.success) {
      throw new Error('Restaurant login failed');
    }

    const restaurantToken = loginResponse.data.token;
    const restaurantUser = loginResponse.data.user;

    log(`✅ Restaurant Login Success!`, 'green');
    log(`   Restaurant: ${restaurantUser.name}`, 'cyan');
    log(`   Phone: ${restaurantUser.phone}`, 'cyan');
    log(`   Token: ${restaurantToken.substring(0, 20)}...`, 'cyan');

    // Step 2: Get order details
    log(`\n📦 Step 2: Fetching order #${ORDER_ID} details...`, 'yellow');
    const orderResponse = await axios.get(`${BACKEND_URL}/api/restaurant/orders/${ORDER_ID}`, {
      headers: {
        'Authorization': `Bearer ${restaurantToken}`
      }
    });

    const order = orderResponse.data.data;
    log(`✅ Order Found!`, 'green');
    log(`   Order ID: ${order.id}`, 'cyan');
    log(`   Status: ${order.status}`, 'cyan');
    log(`   Customer: ${order.customer ? order.customer.name : 'Unknown'}`, 'cyan');
    log(`   Restaurant: ${order.restaurant ? order.restaurant.name : 'Unknown'}`, 'cyan');
    log(`   Total: $${order.totalPrice}`, 'cyan');

    // Step 3: Accept the order (update status from PENDING to ACCEPTED)
    log(`\n🎯 Step 3: Accepting order #${ORDER_ID}...`, 'yellow');
    
    // Update order status to ACCEPTED using restaurant endpoint
    const acceptResponse = await axios.patch(`${BACKEND_URL}/api/restaurant/orders/${ORDER_ID}/status`, {
      status: 'ACCEPTED'
    }, {
      headers: {
        'Authorization': `Bearer ${restaurantToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (acceptResponse.data.success) {
      log(`✅ Order Accepted Successfully!`, 'green');
      log(`   Status: ${acceptResponse.data.data.status}`, 'cyan');
      log(`   Message: ${acceptResponse.data.message}`, 'cyan');
    } else {
      throw new Error('Failed to accept order');
    }

    // Step 4: Check Socket.IO event emission
    log(`\n🔌 Step 4: Socket.IO Event Information`, 'yellow');
    log(`   Event Type: order_status_update`, 'cyan');
    log(`   Target Customer ID: ${order.customerId}`, 'cyan');
    log(`   Order Status: PENDING → ACCEPTED`, 'cyan');
    log(`   Restaurant: ${order.restaurant?.name || 'Burger Palace'}`, 'cyan');

    // Step 5: Test completed - only one status update to avoid spam
    log(`\n⚡ Step 5: Single status update test completed`, 'yellow');
    log(`   Only one Socket.IO event emitted to avoid notification spam`, 'cyan');

    // Final summary
    log(`\n🚀 TEST COMPLETED!`, 'bgGreen');
    log(`\n📋 Summary:`, 'yellow');
    log(`   ✅ Restaurant Login: Success`, 'green');
    log(`   ✅ Order Fetch: Success`, 'green');
    log(`   ✅ Order Acceptance: Success`, 'green');
    log(`   ✅ Socket Events: Should be emitted`, 'green');
    
    log(`\n🔔 Expected Socket.IO Events on Customer App:`, 'yellow');
    log(`   1. order_status_update (ACCEPTED) - Single notification only`, 'cyan');

    log(`\n📱 Check your Customer App for:`, 'yellow');
    log(`   • Real-time notifications`, 'cyan');
    log(`   • Order status updates`, 'cyan');
    log(`   • Live progress tracking`, 'cyan');

    log(`\n✨ Socket.IO Test Complete! Check Customer App Now! ✨`, 'bgYellow');

  } catch (error) {
    log(`\n❌ TEST FAILED!`, 'bgRed');
    log(`Error: ${error.message}`, 'red');
    
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    
    if (error.code === 'ECONNREFUSED') {
      log(`\n💡 Make sure the backend server is running on ${BACKEND_URL}`, 'yellow');
    }

    process.exit(1);
  }
}

// Handle script termination
process.on('SIGINT', () => {
  log(`\n\n🛑 Test interrupted by user`, 'yellow');
  process.exit(0);
});

// Run the test
if (require.main === module) {
  testOrderAcceptanceSocket().catch(error => {
    log(`\n💥 Unhandled error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { testOrderAcceptanceSocket };
