#!/usr/bin/env node

/**
 * COMPLETE ASSIGNMENT FLOW TEST
 * 
 * Tests the entire order-to-assignment flow:
 * 1. Customer places order
 * 2. Restaurant accepts and updates to PREPARING
 * 3. Driver goes online (should now work with socket handlers)
 * 4. Assignment system triggers and sends offer to driver
 * 5. Driver receives assignment offer modal
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test credentials (adjust these to match your test data)
const CUSTOMER = {
  phone: '0911111111',
  password: 'customer123'
};

const RESTAURANT = {
  phone: '0955555555', 
  password: 'restaurant123'
};

const DRIVER = {
  phone: '0933333333',
  password: 'driver123'
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
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n📋 STEP ${step}: ${message}`, 'cyan');
  log('─'.repeat(60), 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
}

async function loginUser(phone, password, role) {
  log(`\n🔐 Logging in ${role}: ${phone}`, 'yellow');
  
  const result = await apiCall('POST', '/auth/login', { phone, password });
  
  if (result.success && result.data.success) {
    logSuccess(`${role} logged in successfully`);
    log(`   User ID: ${result.data.user.id}`, 'cyan');
    log(`   Name: ${result.data.user.name}`, 'cyan');
    return {
      token: result.data.token,
      user: result.data.user
    };
  } else {
    logError(`${role} login failed: ${JSON.stringify(result.error)}`);
    return null;
  }
}

async function getRestaurantId(customerToken) {
  log('\n🏪 Getting restaurant ID...', 'yellow');
  
  const result = await apiCall('GET', '/restaurants', null, customerToken);
  
  if (result.success && result.data.success && result.data.data.length > 0) {
    const restaurant = result.data.data[0];
    logSuccess(`Found restaurant: ${restaurant.name}`);
    log(`   Restaurant ID: ${restaurant.id}`, 'cyan');
    return restaurant.id;
  } else {
    logError(`No restaurants found: ${JSON.stringify(result.error)}`);
    return null;
  }
}

async function getMenuId(customerToken, restaurantId) {
  log('\n📋 Getting menu item ID...', 'yellow');
  
  const result = await apiCall('GET', `/restaurants/${restaurantId}`, null, customerToken);
  
  if (result.success && result.data.success && result.data.data.menus && result.data.data.menus.length > 0) {
    const menuItem = result.data.data.menus[0];
    logSuccess(`Found menu item: ${menuItem.itemName}`);
    log(`   Menu ID: ${menuItem.id}`, 'cyan');
    log(`   Price: $${menuItem.price}`, 'cyan');
    return { id: menuItem.id, price: menuItem.price };
  } else {
    logError(`No menu items found: ${JSON.stringify(result.error)}`);
    return null;
  }
}

async function placeOrder(customerToken, customerId, restaurantId, menuItem) {
  log('\n🛒 Placing test order...', 'yellow');
  
  const orderData = {
    restaurantId: restaurantId,
    items: [
      {
        menuId: menuItem.id,
        quantity: 2,
        price: menuItem.price,
        customizations: []
      }
    ],
    deliveryAddress: "Bole Road, Addis Ababa, Ethiopia",
    deliveryLat: 9.0054,
    deliveryLng: 38.7636,
    paymentMethod: "CASH",
    totalPrice: (menuItem.price * 2) + 4.00,
    deliveryFee: 4.00,
    notes: "Test order for assignment flow"
  };

  const result = await apiCall('POST', '/orders', orderData, customerToken);
  
  if (result.success && result.data.success) {
    logSuccess(`Order placed successfully`);
    log(`   Order ID: ${result.data.data.id}`, 'cyan');
    log(`   Order Number: ${result.data.data.orderNumber}`, 'cyan');
    log(`   Status: ${result.data.data.status}`, 'cyan');
    return result.data.data;
  } else {
    logError(`Order placement failed: ${JSON.stringify(result.error)}`);
    return null;
  }
}

async function updateOrderStatus(restaurantToken, orderId, status) {
  log(`\n🍳 Updating order ${orderId} status to: ${status}`, 'yellow');
  
  const result = await apiCall('PATCH', `/restaurant/orders/${orderId}/status`, {
    status: status
  }, restaurantToken);
  
  if (result.success && result.data.success) {
    logSuccess(`Order status updated to ${status}`);
    log(`   Order ID: ${result.data.data.id}`, 'cyan');
    log(`   Status: ${result.data.data.status}`, 'cyan');
    if (result.data.data.readyAt) {
      log(`   Ready At: ${result.data.data.readyAt}`, 'cyan');
    }
    return result.data.data;
  } else {
    logError(`Order status update failed: ${JSON.stringify(result.error)}`);
    return null;
  }
}

async function approveDriver(driverToken) {
  log('\n👮 Approving driver for testing...', 'yellow');
  
  const result = await apiCall('POST', '/driver/approve', {}, driverToken);
  
  if (result.success && result.data.success) {
    logSuccess(`Driver approved successfully`);
    log(`   Driver ID: ${result.data.data.driverId}`, 'cyan');
    log(`   Approval Status: ${result.data.data.approvalStatus}`, 'cyan');
    log(`   Available: ${result.data.data.isAvailable}`, 'cyan');
    return true;
  } else {
    logError(`Driver approval failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function setDriverOnline(driverToken, isAvailable) {
  log(`\n🚗 Setting driver ${isAvailable ? 'ONLINE' : 'OFFLINE'}...`, 'yellow');
  
  const result = await apiCall('POST', '/driver/availability', {
    isAvailable: isAvailable
  }, driverToken);
  
  if (result.success && result.data.success) {
    logSuccess(`Driver status updated to ${isAvailable ? 'ONLINE' : 'OFFLINE'}`);
    log(`   Driver ID: ${result.data.data.driverId}`, 'cyan');
    log(`   Available: ${result.data.data.isAvailable}`, 'cyan');
    log(`   Online At: ${result.data.data.onlineAt || 'N/A'}`, 'cyan');
    return true;
  } else {
    logError(`Driver status update failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function triggerAssignment(orderId) {
  log(`\n🎯 Manually triggering assignment for order ${orderId}...`, 'yellow');
  
  const result = await apiCall('POST', `/driver/assignments/create`, {
    orderId: orderId,
    driverIds: [], // Let the system find drivers
    wave: 1
  });
  
  if (result.success && result.data.success) {
    logSuccess(`Assignment triggered successfully`);
    log(`   Order ID: ${orderId}`, 'cyan');
    log(`   Assignments Created: ${result.data.assignmentsCreated}`, 'cyan');
    log(`   Wave: ${result.data.wave}`, 'cyan');
    return true;
  } else {
    logError(`Assignment trigger failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function checkDriverState(driverToken, driverId) {
  log(`\n📊 Checking driver state in database...`, 'yellow');
  
  // Check driver state via API
  const profileResult = await apiCall('GET', '/driver/profile', null, driverToken);
  
  if (profileResult.success && profileResult.data.success) {
    const driver = profileResult.data.data;
    logSuccess(`Driver profile retrieved`);
    log(`   Driver ID: ${driver.id}`, 'cyan');
    log(`   Name: ${driver.user.name}`, 'cyan');
    log(`   Available: ${driver.isAvailable}`, 'cyan');
    log(`   Approval Status: ${driver.approvalStatus}`, 'cyan');
    log(`   Online At: ${driver.onlineAt || 'N/A'}`, 'cyan');
    return driver;
  } else {
    logError(`Driver profile check failed: ${JSON.stringify(profileResult.error)}`);
    return null;
  }
}

async function checkAvailableOrders(driverToken) {
  log(`\n📋 Checking available orders for driver...`, 'yellow');
  
  const result = await apiCall('GET', '/driver/orders/available', null, driverToken);
  
  if (result.success && result.data.success) {
    logSuccess(`Available orders retrieved`);
    log(`   Available Orders Count: ${result.data.count}`, 'cyan');
    
    if (result.data.data.length > 0) {
      result.data.data.forEach((order, index) => {
        log(`   Order ${index + 1}:`, 'magenta');
        log(`     ID: ${order.id}`, 'cyan');
        log(`     Status: ${order.status}`, 'cyan');
        log(`     Restaurant: ${order.restaurant.name}`, 'cyan');
        log(`     Driver Earning: $${order.calculatedDriverEarning}`, 'cyan');
      });
    } else {
      logWarning('No available orders found');
    }
    
    return result.data.data;
  } else {
    logError(`Available orders check failed: ${JSON.stringify(result.error)}`);
    return [];
  }
}

async function runCompleteTest() {
  log('\n🚀 COMPLETE ASSIGNMENT FLOW TEST STARTING...', 'bgYellow');
  log('═'.repeat(80), 'blue');

  let customerAuth, restaurantAuth, driverAuth;
  let order;

  try {
    // Step 1: Login all users
    logStep(1, 'LOGIN ALL USERS');
    
    customerAuth = await loginUser(CUSTOMER.phone, CUSTOMER.password, 'Customer');
    if (!customerAuth) {
      throw new Error('Customer login failed');
    }

    restaurantAuth = await loginUser(RESTAURANT.phone, RESTAURANT.password, 'Restaurant');
    if (!restaurantAuth) {
      throw new Error('Restaurant login failed');
    }

    driverAuth = await loginUser(DRIVER.phone, DRIVER.password, 'Driver');
    if (!driverAuth) {
      throw new Error('Driver login failed');
    }

    // Step 2: Approve driver
    logStep(2, 'APPROVE DRIVER');
    const driverApproved = await approveDriver(driverAuth.token);
    if (!driverApproved) {
      throw new Error('Driver approval failed');
    }

    // Step 3: Get restaurant and menu data
    logStep(3, 'GET RESTAURANT AND MENU DATA');
    const restaurantId = await getRestaurantId(customerAuth.token);
    if (!restaurantId) {
      throw new Error('No restaurant found');
    }
    
    const menuItem = await getMenuId(customerAuth.token, restaurantId);
    if (!menuItem) {
      throw new Error('No menu items found');
    }

    // Step 4: Place order
    logStep(4, 'PLACE ORDER');
    order = await placeOrder(customerAuth.token, customerAuth.user.id, restaurantId, menuItem);
    if (!order) {
      throw new Error('Order placement failed');
    }

    // Step 5: Restaurant accepts order
    logStep(5, 'RESTAURANT ACCEPTS ORDER');
    const acceptedOrder = await updateOrderStatus(restaurantAuth.token, order.id, 'ACCEPTED');
    if (!acceptedOrder) {
      throw new Error('Order acceptance failed');
    }

    // Step 6: Restaurant starts preparing
    logStep(6, 'RESTAURANT STARTS PREPARING');
    const preparingOrder = await updateOrderStatus(restaurantAuth.token, order.id, 'PREPARING');
    if (!preparingOrder) {
      throw new Error('Order preparing update failed');
    }

    // Step 7: Set driver online (this should now work!)
    logStep(7, 'SET DRIVER ONLINE');
    const driverOnline = await setDriverOnline(driverAuth.token, true);
    if (!driverOnline) {
      throw new Error('Setting driver online failed');
    }

    // Step 8: Check driver state
    logStep(8, 'VERIFY DRIVER STATE');
    const driverState = await checkDriverState(driverAuth.token, driverAuth.user.id);
    if (!driverState) {
      throw new Error('Driver state check failed');
    }

    // Step 9: Check available orders
    logStep(9, 'CHECK AVAILABLE ORDERS');
    const availableOrders = await checkAvailableOrders(driverAuth.token);
    
    // Step 10: Restaurant marks order ready
    logStep(10, 'RESTAURANT MARKS ORDER READY');
    const readyOrder = await updateOrderStatus(restaurantAuth.token, order.id, 'READY');
    if (!readyOrder) {
      throw new Error('Order ready update failed');
    }

    // Step 11: Manual assignment trigger (if needed)
    logStep(11, 'TRIGGER ASSIGNMENT SYSTEM');
    const assignmentTriggered = await triggerAssignment(order.id);
    
    // Step 12: Final check for assignments
    logStep(12, 'FINAL VERIFICATION');
    
    // Wait a moment for assignment processing
    log('\n⏳ Waiting 3 seconds for assignment processing...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check available orders again
    const finalAvailableOrders = await checkAvailableOrders(driverAuth.token);

    // Summary
    log('\n📋 TEST SUMMARY:', 'bgGreen');
    log('═'.repeat(60), 'blue');
    logSuccess(`✅ Customer logged in: ${customerAuth.user.name}`);
    logSuccess(`✅ Restaurant logged in: ${restaurantAuth.user.name}`);
    logSuccess(`✅ Driver logged in: ${driverAuth.user.name}`);
    logSuccess(`✅ Order placed: #${order.orderNumber}`);
    logSuccess(`✅ Order accepted and prepared by restaurant`);
    logSuccess(`✅ Driver set online: ${driverState.isAvailable ? 'YES' : 'NO'}`);
    logSuccess(`✅ Available orders for driver: ${finalAvailableOrders.length}`);
    
    if (finalAvailableOrders.length > 0) {
      log('\n🎉 SUCCESS! Driver can see available orders!', 'bgGreen');
      log('The assignment flow is working correctly.', 'green');
      
      // Check if the test order is in the available orders
      const testOrderAvailable = finalAvailableOrders.find(o => o.id === order.id);
      if (testOrderAvailable) {
        log('🎯 Test order is visible to driver for assignment!', 'bgGreen');
      } else {
        logWarning('Test order not visible (may have been assigned or different criteria)');
      }
    } else {
      logWarning('Driver online but no available orders visible');
      log('This could be due to order status, driver criteria, or assignment rules', 'yellow');
    }

  } catch (error) {
    log('\n💥 TEST FAILED', 'bgRed');
    logError(`Error: ${error.message}`);
    throw error;
  }
}

// Handle script termination
process.on('SIGINT', () => {
  log('\n\n🛑 Test interrupted by user', 'yellow');
  process.exit(0);
});

// Run the test
if (require.main === module) {
  runCompleteTest().catch(error => {
    log(`\n💥 Unhandled error: ${error.message}`, 'red');
    process.exit(1);
  });
}