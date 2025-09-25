#!/usr/bin/env node

/**
 * Working Socket.IO 2.4.0 Connection Test
 * 
 * Uses proper Socket.IO 2.4.0 client configuration
 */

const io = require('socket.io-client');

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

function testConnection() {
  const url = 'http://localhost:3001';
  
  log('\n🚀 SOCKET.IO 2.4.0 CONNECTION TEST', 'bgYellow');
  log(`🔌 Connecting to: ${url}`, 'yellow');

  // Use proper Socket.IO 2.4.0 configuration
  const socket = io(url, {
    autoConnect: true,
    reconnection: false,
    forceNew: true
  });

  socket.on('connect', () => {
    log('✅ Connected successfully!', 'bgGreen');
    log(`   Socket ID: ${socket.id}`, 'cyan');
    
    // Test basic communication
    socket.emit('ping');
    log('📤 Sent ping to server', 'magenta');
  });

  socket.on('connect_error', (error) => {
    log('❌ Connection failed:', 'red');
    log(`   Error: ${error}`, 'red');
  });

  socket.on('connection_status', (data) => {
    log('📡 Received connection_status:', 'green');
    log(`   ${JSON.stringify(data)}`, 'cyan');
  });

  socket.on('pong', () => {
    log('📡 Received pong from server!', 'green');
    
    // Now test the order acceptance simulation
    log('\n🎯 Socket.IO is working! Time to test order events...', 'bgGreen');
    log('📋 Next steps:', 'yellow');
    log('   1. Run: node test-socket-order-acceptance.js', 'cyan');
    log('   2. Check your React Native customer app for notifications', 'cyan');
    
    setTimeout(() => {
      socket.disconnect();
      process.exit(0);
    }, 2000);
  });

  socket.on('disconnect', (reason) => {
    log(`🔌 Disconnected: ${reason}`, 'yellow');
  });

  // Set timeout
  setTimeout(() => {
    if (!socket.connected) {
      log('⏰ Connection timeout', 'red');
      socket.disconnect();
      process.exit(1);
    }
  }, 10000);
}

// Handle script termination
process.on('SIGINT', () => {
  log('\n\n🛑 Test interrupted by user', 'yellow');
  process.exit(0);
});

// Run the test
testConnection();
