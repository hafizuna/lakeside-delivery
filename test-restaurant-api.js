const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test data for restaurant login
const testRestaurantLogin = {
  phone: '+1234567890', // Replace with actual restaurant phone from your database
  password: 'password123' // Replace with actual restaurant password
};

async function testRestaurantAuth() {
  console.log('🧪 Testing Restaurant Authentication API...\n');
  
  try {
    // Test 1: Restaurant Login
    console.log('1️⃣ Testing Restaurant Login...');
    const loginResponse = await axios.post(`${BASE_URL}/restaurant/auth/login`, testRestaurantLogin);
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful!');
      console.log('📋 Restaurant Data:', JSON.stringify(loginResponse.data.data.restaurant, null, 2));
      
      const token = loginResponse.data.data.token;
      console.log('🔑 Token received:', token.substring(0, 20) + '...\n');
      
      // Test 2: Get Restaurant Profile
      console.log('2️⃣ Testing Get Restaurant Profile...');
      const profileResponse = await axios.get(`${BASE_URL}/restaurant/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (profileResponse.data.success) {
        console.log('✅ Profile fetch successful!');
        console.log('📋 Profile Data:', JSON.stringify(profileResponse.data.data, null, 2));
      } else {
        console.log('❌ Profile fetch failed:', profileResponse.data.message);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.log('❌ Network Error: Server not responding. Make sure backend is running on port 3000');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

async function testMenuAPI(token) {
  console.log('\n🍽️ Testing Menu Management API...\n');
  
  try {
    // Test 3: Get Menu Items
    console.log('3️⃣ Testing Get Menu Items...');
    const menuResponse = await axios.get(`${BASE_URL}/restaurant/menu`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (menuResponse.data.success) {
      console.log('✅ Menu fetch successful!');
      console.log('📋 Menu Items Count:', menuResponse.data.data.length);
    } else {
      console.log('❌ Menu fetch failed:', menuResponse.data.message);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Menu API Error:', error.response.status, error.response.data);
    } else {
      console.log('❌ Menu Error:', error.message);
    }
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting Restaurant API Tests...\n');
  console.log('⚠️  Make sure to:');
  console.log('   1. Start the backend server: npm start');
  console.log('   2. Update testRestaurantLogin with valid restaurant credentials');
  console.log('   3. Ensure database has restaurant data\n');
  
  await testRestaurantAuth();
}

runAllTests();
