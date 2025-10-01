const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test with the order we just created
const ORDER_ID = 59; // From the previous test
const DRIVER_ID = 3; // From the previous test

console.log('🧪 [MANUAL TEST] Testing manual assignment trigger');
console.log('=' .repeat(60));

async function testAssignmentTrigger() {
  try {
    // First, let's check the order status directly from the database
    console.log('📋 [MANUAL TEST] Checking order details...');
    
    // We'll simulate what the assignment trigger service should do
    console.log(`🎯 [MANUAL TEST] Testing assignment for Order ID: ${ORDER_ID}`);
    console.log(`🚗 [MANUAL TEST] Expected Driver ID: ${DRIVER_ID}`);
    
    // Check if we can import and call the assignment trigger service directly
    console.log('🔧 [MANUAL TEST] Attempting to import assignment trigger service...');
    
    try {
      // Try to import the assignment trigger service
      const assignmentTriggerService = require('./dist/services/assignmentTriggerService.js');
      console.log('✅ [MANUAL TEST] Assignment trigger service imported successfully');
      
      // Call the trigger method
      console.log('🚀 [MANUAL TEST] Calling assignment trigger for order...');
      const result = await assignmentTriggerService.default.triggerAssignment(ORDER_ID);
      
      if (result.success) {
        console.log('✅ [MANUAL TEST] Assignment trigger successful:', result.message);
        console.log('📋 [MANUAL TEST] Result data:', result.data);
      } else {
        console.log('❌ [MANUAL TEST] Assignment trigger failed:', result.message);
        console.log('📋 [MANUAL TEST] Error data:', result.data);
      }
      
    } catch (importError) {
      console.log('❌ [MANUAL TEST] Could not import assignment trigger service:', importError.message);
      console.log('ℹ️ [MANUAL TEST] This might be normal if the service uses different import patterns');
      
      // Alternative: try to call the hybrid assignment service directly
      console.log('🔧 [MANUAL TEST] Trying hybrid assignment service instead...');
      
      try {
        const hybridService = require('./dist/services/hybridAssignmentService.js');
        console.log('✅ [MANUAL TEST] Hybrid assignment service imported successfully');
        
        const hybridResult = await hybridService.default.findAndNotifyDrivers(ORDER_ID);
        
        if (hybridResult.success) {
          console.log('✅ [MANUAL TEST] Hybrid assignment successful:', hybridResult.message);
          console.log('📋 [MANUAL TEST] Result data:', hybridResult.data);
        } else {
          console.log('❌ [MANUAL TEST] Hybrid assignment failed:', hybridResult.message);
        }
        
      } catch (hybridError) {
        console.log('❌ [MANUAL TEST] Could not import hybrid assignment service:', hybridError.message);
        
        // Final attempt: just log what we know
        console.log('📋 [MANUAL TEST] Manual import failed. Here\'s what we know:');
        console.log(`   - Order ID: ${ORDER_ID} should be in READY status`);
        console.log(`   - Driver ID: ${DRIVER_ID} should be available`);
        console.log('   - Assignment trigger should have been called when order status changed to READY');
        console.log('   - Check the backend console for assignment trigger debug logs');
      }
    }
    
  } catch (error) {
    console.error('💥 [MANUAL TEST] Test failed:', error.message);
    console.error('🔍 [MANUAL TEST] Stack trace:', error.stack);
  }
}

// Additional test: Check if the driver is actually online and available
async function checkDriverAvailability() {
  try {
    console.log('\n🚗 [MANUAL TEST] Checking driver availability directly...');
    
    const prismaClient = require('./dist/utils/database.js');
    const prisma = prismaClient.default;
    
    console.log('✅ [MANUAL TEST] Database client imported successfully');
    
    // Check driver details
    const driver = await prisma.driver.findUnique({
      where: { id: DRIVER_ID },
      include: { user: true }
    });
    
    if (driver) {
      console.log('👤 [MANUAL TEST] Driver details:', {
        id: driver.id,
        name: driver.user.name,
        phone: driver.user.phone,
        isAvailable: driver.isAvailable,
        approvalStatus: driver.approvalStatus,
        vehicleType: driver.vehicleType,
        currentLat: driver.currentLat,
        currentLng: driver.currentLng
      });
    } else {
      console.log('❌ [MANUAL TEST] Driver not found in database');
    }
    
    // Check order details
    const order = await prisma.order.findUnique({
      where: { id: ORDER_ID },
      include: {
        restaurant: { select: { name: true } },
        customer: { select: { name: true } }
      }
    });
    
    if (order) {
      console.log('📦 [MANUAL TEST] Order details:', {
        id: order.id,
        status: order.status,
        restaurantName: order.restaurant.name,
        customerName: order.customer.name,
        driverId: order.driverId,
        totalPrice: order.totalPrice.toString(),
        createdAt: order.createdAt,
        readyAt: order.readyAt
      });
    } else {
      console.log('❌ [MANUAL TEST] Order not found in database');
    }
    
    await prisma.$disconnect();
    
  } catch (dbError) {
    console.error('💥 [MANUAL TEST] Database check failed:', dbError.message);
  }
}

// Run tests
async function runTests() {
  await testAssignmentTrigger();
  await checkDriverAvailability();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 [MANUAL TEST] Test completed!');
  console.log('📝 [MANUAL TEST] Next steps:');
  console.log('   1. Check the backend console for assignment trigger logs');
  console.log('   2. Verify that socket events are being emitted to the driver');
  console.log('   3. Check if the driver app is properly connected to socket.io');
  console.log('   4. Verify that the driver is listening for assignment events');
}

runTests();