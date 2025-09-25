#!/usr/bin/env node

/**
 * Socket.IO Connection Test Script
 * 
 * Tests Socket.IO client connection to the backend server
 */

const io = require('socket.io-client');

// Test both localhost and network IP
const TEST_URLS = [
  'http://localhost:3001',
  'http://192.168.1.4:3001'
];

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
  bgYellow: '\x1b[43m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testSocketConnection(url) {
  return new Promise((resolve, reject) => {
    log(`\n🔌 Testing Socket.IO connection to: ${url}`, 'yellow');
    
    const socket = io(url, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: false,
      autoConnect: true,
      forceNew: true,
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Connection timeout'));
    }, 10000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      log(`✅ Successfully connected to ${url}`, 'green');
      log(`   Socket ID: ${socket.id}`, 'cyan');
      
      // Test sending a message
      socket.emit('ping');
      
      setTimeout(() => {
        socket.disconnect();
        resolve({
          success: true,
          url,
          socketId: socket.id,
          transport: socket.io.engine.transport.name
        });
      }, 1000);
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      log(`❌ Connection failed to ${url}`, 'red');
      log(`   Error: ${error.message}`, 'red');
      socket.disconnect();
      reject(error);
    });

    socket.on('disconnect', (reason) => {
      log(`🔌 Disconnected from ${url}: ${reason}`, 'yellow');
    });

    socket.on('pong', () => {
      log(`📡 Received pong from ${url}`, 'cyan');
    });
  });
}

async function runConnectionTests() {
  log('\n🚀 SOCKET.IO CONNECTION TEST STARTING...', 'bgYellow');
  log('=' * 60, 'blue');

  const results = [];

  for (const url of TEST_URLS) {
    try {
      const result = await testSocketConnection(url);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        url,
        error: error.message
      });
    }
  }

  log('\n📋 TEST RESULTS SUMMARY:', 'bgGreen');
  log('=' * 60, 'blue');

  results.forEach((result, index) => {
    if (result.success) {
      log(`✅ ${result.url}`, 'green');
      log(`   Socket ID: ${result.socketId}`, 'cyan');
      log(`   Transport: ${result.transport}`, 'cyan');
    } else {
      log(`❌ ${result.url}`, 'red');
      log(`   Error: ${result.error}`, 'red');
    }
    log('');
  });

  const successfulConnections = results.filter(r => r.success);
  if (successfulConnections.length > 0) {
    log('🎉 SOCKET.IO SERVER IS WORKING!', 'bgGreen');
    log(`✅ Working URLs: ${successfulConnections.map(r => r.url).join(', ')}`, 'green');
    
    if (successfulConnections.find(r => r.url.includes('192.168.1.4'))) {
      log('✅ Network IP accessible - React Native should work', 'green');
    } else {
      log('⚠️  Network IP not accessible - React Native may have issues', 'yellow');
      log('💡 Try updating React Native client to use localhost or check network settings', 'yellow');
    }
  } else {
    log('💥 NO SUCCESSFUL CONNECTIONS', 'bgRed');
    log('❌ Socket.IO server may not be running or configured incorrectly', 'red');
  }
}

// Handle script termination
process.on('SIGINT', () => {
  log('\n\n🛑 Test interrupted by user', 'yellow');
  process.exit(0);
});

// Run the test
if (require.main === module) {
  runConnectionTests().catch(error => {
    log(`\n💥 Unhandled error: ${error.message}`, 'red');
    process.exit(1);
  });
}
