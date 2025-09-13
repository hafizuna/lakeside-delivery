// Simple Node.js script to test the authentication API
const https = require('http');

// Test data
const testUser = {
  name: "Test User",
  phone: "1234567890",
  password: "TestPass123!"
};

// Function to make HTTP requests
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPI() {
  console.log('🧪 Testing Lakeside Backend API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET'
    };
    
    const healthResult = await makeRequest(healthOptions);
    console.log('✅ Health check:', healthResult.status === 200 ? 'PASSED' : 'FAILED');
    console.log('   Response:', healthResult.data);

    // Test 2: Register new user
    console.log('\n2. Testing user registration...');
    const registerOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const registerResult = await makeRequest(registerOptions, testUser);
    console.log('✅ Registration:', registerResult.status === 201 ? 'PASSED' : 'FAILED');
    console.log('   Response:', registerResult.data);

    // Test 3: Login with the same user
    console.log('\n3. Testing user login...');
    const loginOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const loginData = {
      phone: testUser.phone,
      password: testUser.password
    };

    const loginResult = await makeRequest(loginOptions, loginData);
    console.log('✅ Login:', loginResult.status === 200 ? 'PASSED' : 'FAILED');
    console.log('   Response:', loginResult.data);

    if (loginResult.data.token) {
      console.log('\n🎉 Authentication system is working! JWT token received.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();
