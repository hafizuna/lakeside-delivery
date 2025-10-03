#!/usr/bin/env node

/**
 * Socket.IO 2.4.x Connection Test Script
 *
 * Tests Socket.IO client connection to the backend server using 2.4.x compatible client
 */

const io = require("socket.io-client");

// Test both localhost and network IP
const TEST_URLS = ["http://localhost:3001", "http://192.168.1.2:3001"];

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  bgGreen: "\x1b[42m",
  bgRed: "\x1b[41m",
  bgYellow: "\x1b[43m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testSocketConnection(url) {
  return new Promise((resolve, reject) => {
    log(`\n🔌 Testing Socket.IO 2.4.x connection to: ${url}`, "yellow");

    // Socket.IO 2.4.x compatible options
    const socket = io(url, {
      transports: ["polling", "websocket"], // Try polling first
      timeout: 10000,
      reconnection: false,
      autoConnect: true,
      forceNew: true,
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error("Connection timeout"));
    }, 15000);

    socket.on("connect", () => {
      clearTimeout(timeout);
      log(`✅ Successfully connected to ${url}`, "green");
      log(`   Socket ID: ${socket.id}`, "cyan");
      log(`   Transport: ${socket.io.engine.transport.name}`, "cyan");

      // Test sending a message
      log(`📡 Sending ping to server...`, "cyan");
      socket.emit("ping");

      // Test authentication (optional)
      setTimeout(() => {
        socket.disconnect();
        resolve({
          success: true,
          url,
          socketId: socket.id,
          transport: socket.io.engine.transport.name,
        });
      }, 2000);
    });

    socket.on("connect_error", (error) => {
      clearTimeout(timeout);
      log(`❌ Connection failed to ${url}`, "red");
      log(`   Error: ${error}`, "red");
      socket.disconnect();
      reject(error);
    });

    socket.on("disconnect", (reason) => {
      log(`🔌 Disconnected from ${url}: ${reason}`, "yellow");
    });

    socket.on("pong", () => {
      log(`📡 Received pong from ${url}`, "green");
    });

    socket.on("connection_status", (data) => {
      log(`📡 Received connection_status from ${url}:`, "green");
      log(`   ${JSON.stringify(data)}`, "cyan");
    });

    // Listen for any events
    const originalEmit = socket.emit;
    socket.emit = function (...args) {
      log(`📤 Emitting: ${args[0]}`, "magenta");
      return originalEmit.apply(socket, args);
    };
  });
}

async function runConnectionTests() {
  log("\n🚀 SOCKET.IO 2.4.x CONNECTION TEST STARTING...", "bgYellow");
  log("=" * 60, "blue");

  const results = [];

  for (const url of TEST_URLS) {
    try {
      const result = await testSocketConnection(url);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        url,
        error: error.message || error.toString(),
      });
    }
  }

  log("\n📋 TEST RESULTS SUMMARY:", "bgGreen");
  log("=" * 60, "blue");

  results.forEach((result, index) => {
    if (result.success) {
      log(`✅ ${result.url}`, "green");
      log(`   Socket ID: ${result.socketId}`, "cyan");
      log(`   Transport: ${result.transport}`, "cyan");
    } else {
      log(`❌ ${result.url}`, "red");
      log(`   Error: ${result.error}`, "red");
    }
    log("");
  });

  const successfulConnections = results.filter((r) => r.success);
  if (successfulConnections.length > 0) {
    log("🎉 SOCKET.IO 2.4.x SERVER IS WORKING!", "bgGreen");
    log(
      `✅ Working URLs: ${successfulConnections.map((r) => r.url).join(", ")}`,
      "green"
    );

    log("\n🔔 Ready for real-time testing:", "yellow");
    log("   1. Restart your React Native customer app", "cyan");
    log("   2. Create order #34 if not already created", "cyan");
    log("   3. Run: node test-socket-order-acceptance.js", "cyan");
    log("   4. Check customer app for real-time notifications", "cyan");
  } else {
    log("💥 NO SUCCESSFUL CONNECTIONS", "bgRed");
    log("❌ Check if backend server is running on port 3001", "red");
    log("💡 Try: npm run dev in backend directory", "yellow");
  }
}

// Handle script termination
process.on("SIGINT", () => {
  log("\n\n🛑 Test interrupted by user", "yellow");
  process.exit(0);
});

// Run the test
if (require.main === module) {
  runConnectionTests().catch((error) => {
    log(`\n💥 Unhandled error: ${error.message}`, "red");
    process.exit(1);
  });
}
