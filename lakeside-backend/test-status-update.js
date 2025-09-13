const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const ORDER_ID = 30;

async function testStatusUpdate() {
  try {
    // First, get a driver token - we need to authenticate
    console.log('Testing order status update for Order #30...');
    
    // Try to update status without authentication first to see the error
    console.log('\n=== Testing without auth ===');
    try {
      const response = await axios.patch(`${BASE_URL}/driver/orders/${ORDER_ID}/status`, {
        status: 'PICKED_UP'
      });
      console.log('Unexpected success:', response.data);
    } catch (error) {
      console.log('Expected auth error:', error.response?.status, error.response?.data?.message);
    }

    // Now test with a mock driver token (we'd need to generate this properly)
    console.log('\n=== Testing status validation ===');
    try {
      // We need to check what the current status transition rules are
      const response = await axios.patch(`${BASE_URL}/driver/orders/${ORDER_ID}/status`, {
        status: 'PICKED_UP'
      }, {
        headers: {
          'Authorization': 'Bearer fake-token-for-testing'
        }
      });
      console.log('Status update success:', response.data);
    } catch (error) {
      console.log('Status update error:', error.response?.status, error.response?.data?.message);
      console.log('Full error response:', error.response?.data);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testStatusUpdate();
