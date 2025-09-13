const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testAuth() {
  console.log('🧪 Testing Authentication Endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1. Health Check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health:', health.status, health.data.message);

    // Test 2: Register
    console.log('\n2. Testing Registration...');
    const registerData = {
      name: "Test User",
      phone: "1234567890",
      password: "TestPass123!"
    };

    try {
      const register = await axios.post(`${BASE_URL}/auth/register`, registerData);
      console.log('✅ Registration Success:', register.status);
      console.log('   User:', register.data.user.name, register.data.user.phone);
      console.log('   Token received:', !!register.data.token);
    } catch (regError) {
      if (regError.response?.status === 409) {
        console.log('ℹ️  User already exists, testing login...');
      } else {
        console.log('❌ Registration Error:', regError.response?.data || regError.message);
        return;
      }
    }

    // Test 3: Login
    console.log('\n3. Testing Login...');
    const loginData = {
      phone: "1234567890",
      password: "TestPass123!"
    };

    const login = await axios.post(`${BASE_URL}/auth/login`, loginData);
    console.log('✅ Login Success:', login.status);
    console.log('   User:', login.data.user.name, login.data.user.phone);
    console.log('   Token:', login.data.token.substring(0, 20) + '...');

    // Test 4: Protected endpoint
    console.log('\n4. Testing Protected Endpoint...');
    const profile = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${login.data.token}` }
    });
    console.log('✅ Profile Success:', profile.status);
    console.log('   Profile:', profile.data.user.name, profile.data.user.role);

    console.log('\n🎉 All tests passed! Backend authentication is working with MySQL database.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAuth();
