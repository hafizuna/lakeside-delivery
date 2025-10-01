const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test credentials
const CUSTOMER_CREDENTIALS = { phone: '0911111111', password: 'customer123' };
const RESTAURANT_CREDENTIALS = { phone: '0955555555', password: 'restaurant123' };
const DRIVER_CREDENTIALS = { phone: '0933333333', password: 'driver123' };

let customerToken = null;
let restaurantToken = null;
let driverToken = null;
let orderId = null;
let restaurantId = null;
let driverId = null;

console.log('🧪 [TEST] Starting End-to-End Assignment Flow Test');
console.log('=' .repeat(60));

async function login(credentials, userType) {
  try {
    console.log(`🔐 [${userType.toUpperCase()}] Logging in with phone: ${credentials.phone}`);
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
    
    if (response.data.success) {
      console.log(`✅ [${userType.toUpperCase()}] Login successful`);
      console.log(`   User ID: ${response.data.user.id}`);
      console.log(`   Name: ${response.data.user.name}`);
      console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
      return {
        token: response.data.token,
        userId: response.data.user.id,
        user: response.data.user
      };
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error(`❌ [${userType.toUpperCase()}] Login failed:`, error.response?.data?.message || error.message);
    throw error;
  }
}

async function createOrder() {
  try {
    console.log('\n📦 [CUSTOMER] Creating order at Burger Palace...');
    
    // First, get restaurant info
    const restaurantsResponse = await axios.get(`${BASE_URL}/restaurants`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    
    const burgerPalace = restaurantsResponse.data.data.find(r => 
      r.name.toLowerCase().includes('burger') || r.name.toLowerCase().includes('palace')
    );
    
    if (!burgerPalace) {
      throw new Error('Burger Palace restaurant not found');
    }
    
    restaurantId = burgerPalace.id;
    console.log(`🏪 [CUSTOMER] Found restaurant: ${burgerPalace.name} (ID: ${restaurantId})`);
    
  // Get menu items
    const menuResponse = await axios.get(`${BASE_URL}/restaurants/${restaurantId}`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    
    const restaurant = menuResponse.data.data;
    if (!restaurant.menus || restaurant.menus.length === 0) {
      throw new Error('No menu items found');
    }
    
    // Use first menu item
    const firstItem = restaurant.menus[0];
    console.log(`🍔 [CUSTOMER] Selected item: ${firstItem.itemName} ($${firstItem.price})`);
    
    // Create order
    const orderData = {
      restaurantId: restaurantId,
      items: [{
        menuId: firstItem.id,
        quantity: 2,
        price: firstItem.price
      }],
      totalPrice: firstItem.price * 2,
      deliveryFee: 5.0,
      deliveryAddress: "123 Test Street, Test City",
      deliveryLat: 34.0522,
      deliveryLng: -118.2437,
      deliveryInstructions: "Test delivery instructions",
      paymentMethod: "CASH"
    };
    
    const orderResponse = await axios.post(`${BASE_URL}/orders`, orderData, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    
    if (orderResponse.data.success) {
      orderId = orderResponse.data.data.id;
      console.log(`✅ [CUSTOMER] Order created successfully!`);
      console.log(`   Order ID: ${orderId}`);
      console.log(`   Status: ${orderResponse.data.data.status}`);
      console.log(`   Total: $${orderResponse.data.data.totalPrice}`);
      console.log(`   Restaurant: ${orderResponse.data.data.restaurant.name}`);
      return orderId;
    } else {
      throw new Error(orderResponse.data.message);
    }
  } catch (error) {
    console.error('❌ [CUSTOMER] Order creation failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

async function acceptOrder() {
  try {
    console.log('\n🍳 [RESTAURANT] Accepting order...');
    
    const response = await axios.patch(`${BASE_URL}/restaurant/orders/${orderId}/status`, {
      status: 'ACCEPTED'
    }, {
      headers: { Authorization: `Bearer ${restaurantToken}` }
    });
    
    if (response.data.success) {
      console.log(`✅ [RESTAURANT] Order ${orderId} accepted successfully`);
      console.log(`   Status: ${response.data.data.status}`);
      return true;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('❌ [RESTAURANT] Order acceptance failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

async function markOrderReady() {
  try {
    console.log('\n🔥 [RESTAURANT] Marking order as READY (this should trigger driver assignment)...');
    console.log('⏰ [RESTAURANT] Timestamp:', new Date().toISOString());
    
    const response = await axios.patch(`${BASE_URL}/restaurant/orders/${orderId}/status`, {
      status: 'READY'
    }, {
      headers: { Authorization: `Bearer ${restaurantToken}` }
    });
    
    if (response.data.success) {
      console.log(`✅ [RESTAURANT] Order ${orderId} marked as READY successfully`);
      console.log(`   Status: ${response.data.data.status}`);
      console.log('🎯 [RESTAURANT] Assignment trigger should have fired now - check backend logs!');
      return true;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('❌ [RESTAURANT] Mark as ready failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

async function checkDriverStatus() {
  try {
    console.log('\n🚗 [DRIVER] Checking driver status and available orders...');
    
    // Get driver profile
    const profileResponse = await axios.get(`${BASE_URL}/driver/profile`, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    
    if (profileResponse.data.success) {
      const driver = profileResponse.data.data;
      driverId = driver.id;
      console.log(`👤 [DRIVER] Driver profile:`, {
        id: driver.id,
        name: driver.user.name,
        phone: driver.user.phone,
        isOnline: driver.isOnline,
        approvalStatus: driver.approvalStatus,
        totalDeliveries: driver.totalDeliveries
      });
    }
    
    // Check available orders
    const availableResponse = await axios.get(`${BASE_URL}/driver/orders/available`, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    
    if (availableResponse.data.success) {
      const availableOrders = availableResponse.data.data;
      console.log(`📋 [DRIVER] Available orders: ${availableOrders.length}`);
      
      if (availableOrders.length > 0) {
        availableOrders.forEach((order, index) => {
          console.log(`   ${index + 1}. Order #${order.id} - ${order.restaurant.name} - $${order.totalPrice} (${order.status})`);
        });
        
        // Check if our test order is in the list
        const ourOrder = availableOrders.find(o => o.id === orderId);
        if (ourOrder) {
          console.log(`✅ [DRIVER] Our test order #${orderId} is visible in available orders!`);
        } else {
          console.log(`⚠️ [DRIVER] Our test order #${orderId} is NOT in the available orders list`);
        }
      } else {
        console.log(`⚠️ [DRIVER] No available orders found`);
      }
    }
    
  } catch (error) {
    console.error('❌ [DRIVER] Status check failed:', error.response?.data?.message || error.message);
  }
}

async function checkDriverOnlineStatus() {
  try {
    console.log('\n🟢 [DRIVER] Getting driver profile...');
    
    // Check driver profile instead
    const profileResponse = await axios.get(`${BASE_URL}/driver/profile`, {
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    
    if (profileResponse.data.success) {
      console.log(`✅ [DRIVER] Driver profile retrieved successfully`);
    }
    
  } catch (error) {
    console.log('ℹ️ [DRIVER] Profile check:', error.response?.data?.message || 'Error occurred');
  }
}

async function runTest() {
  try {
    // Step 1: Login all users
    console.log('📋 Step 1: Logging in all users...');
    const customerAuth = await login(CUSTOMER_CREDENTIALS, 'customer');
    customerToken = customerAuth.token;
    
    const restaurantAuth = await login(RESTAURANT_CREDENTIALS, 'restaurant');
    restaurantToken = restaurantAuth.token;
    
    const driverAuth = await login(DRIVER_CREDENTIALS, 'driver');
    driverToken = driverAuth.token;
    driverId = driverAuth.userId;
    
    // Step 2: Make sure driver is online
    console.log('\n📋 Step 2: Ensuring driver is online...');
    await checkDriverOnlineStatus();
    
    // Step 3: Create order
    console.log('\n📋 Step 3: Creating customer order...');
    await createOrder();
    
    // Step 4: Restaurant accepts order
    console.log('\n📋 Step 4: Restaurant accepting order...');
    await acceptOrder();
    
    // Wait a bit
    console.log('\n⏰ Waiting 2 seconds before marking as ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 5: Restaurant marks order as READY (this should trigger assignment)
    console.log('\n📋 Step 5: Restaurant marking order as READY...');
    await markOrderReady();
    
    // Wait for assignment to process
    console.log('\n⏰ Waiting 3 seconds for assignment to process...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 6: Check driver status
    console.log('\n📋 Step 6: Checking driver status...');
    await checkDriverStatus();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 [TEST] Test completed!');
    console.log('📝 [TEST] Key things to check:');
    console.log('   1. Backend logs should show "[ASSIGNMENT-TRIGGER]" messages');
    console.log('   2. Backend logs should show driver availability check');  
    console.log('   3. Backend logs should show socket emission to driver');
    console.log('   4. Driver app should receive assignment offer modal');
    console.log(`   5. Order ID: ${orderId}`);
    console.log(`   6. Driver ID: ${driverId}`);
    console.log('\n🔍 [TEST] If no assignment offer appears in driver app:');
    console.log('   - Check if assignment trigger fired in backend logs');
    console.log('   - Check if driver was found as available');
    console.log('   - Check if socket event was emitted');
    console.log('   - Check if driver socket is connected and listening');
    
  } catch (error) {
    console.error('\n💥 [TEST] Test failed:', error.message);
  }
}

// Run the test
runTest();