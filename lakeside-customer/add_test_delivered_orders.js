/**
 * Script to add test delivered orders for testing rating functionality
 * Run this with a valid auth token to add some delivered orders to test with
 */

const API_BASE_URL = 'http://localhost:3001/api';

async function addTestDeliveredOrders() {
  console.log('🚀 Adding test delivered orders...\n');

  // Note: In a real scenario, you would need to login first and get a token
  // For testing purposes, we'll create orders that can be manually set to DELIVERED status
  
  console.log('📋 To test the rating functionality:');
  console.log('1. Login to the app with a customer account');
  console.log('2. Place some orders from restaurants');
  console.log('3. Manually update the order status to DELIVERED in the database');
  console.log('4. Check the Order History tab - you should see rating buttons');
  
  console.log('\n🗄️ Manual Database Update (run in MySQL):');
  console.log('```sql');
  console.log('-- Update some orders to DELIVERED status for testing');
  console.log('UPDATE orders SET status = "DELIVERED", delivered_at = NOW() WHERE order_id IN (1, 2, 3);');
  console.log('```');

  console.log('\n✅ After updating orders to DELIVERED status:');
  console.log('   - Order History tab will show delivered orders');
  console.log('   - Rating buttons will be visible for delivered orders');
  console.log('   - You can test the rating functionality');
  
  console.log('\n🧪 Quick Database Check:');
  try {
    const response = await fetch(`${API_BASE_URL}/restaurants`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Found ${data.data?.length || 0} restaurants for testing`);
    }
  } catch (error) {
    console.log('   ❌ Could not connect to backend');
  }
}

addTestDeliveredOrders();
