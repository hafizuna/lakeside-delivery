#!/usr/bin/env node

/**
 * Restart Backend Server Script
 * Gracefully restarts the backend server to apply Socket.IO configuration changes
 */

const { spawn, exec } = require('child_process');
const axios = require('axios');

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

async function checkServerStatus() {
  try {
    const response = await axios.get('http://localhost:3001/api/health', { timeout: 2000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function stopServer() {
  log('\n🛑 Stopping existing backend server...', 'yellow');
  
  return new Promise((resolve) => {
    // Kill all node processes on port 3001 (Windows)
    exec('netstat -ano | findstr :3001', (err, stdout) => {
      if (stdout) {
        const lines = stdout.split('\n');
        const pids = [];
        
        lines.forEach(line => {
          const match = line.match(/\s+(\d+)$/);
          if (match) {
            pids.push(match[1]);
          }
        });
        
        if (pids.length > 0) {
          log(`📋 Found processes on port 3001: ${pids.join(', ')}`, 'cyan');
          
          pids.forEach(pid => {
            exec(`taskkill /F /PID ${pid}`, (killErr) => {
              if (!killErr) {
                log(`✅ Killed process ${pid}`, 'green');
              }
            });
          });
          
          setTimeout(resolve, 2000); // Wait 2 seconds for cleanup
        } else {
          log('ℹ️  No processes found on port 3001', 'cyan');
          resolve();
        }
      } else {
        log('ℹ️  Port 3001 appears to be free', 'cyan');
        resolve();
      }
    });
  });
}

async function startServer() {
  log('\n🚀 Starting backend server with updated Socket.IO configuration...', 'green');
  
  const serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  // Wait a few seconds for server to start
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Check if server is running
  const isRunning = await checkServerStatus();
  
  if (isRunning) {
    log('\n✅ Backend server restarted successfully!', 'bgGreen');
    log('🔌 Socket.IO server should now be accessible', 'green');
    log('📡 Updated CORS configuration applied', 'green');
    log('\n🧪 You can now test Socket.IO connection with:', 'yellow');
    log('   node test-socket-connection.js', 'cyan');
  } else {
    log('\n❌ Failed to start backend server', 'bgRed');
  }
  
  return serverProcess;
}

async function restartServer() {
  log('\n🔄 BACKEND SERVER RESTART PROCESS', 'bgYellow');
  log('=' * 50, 'blue');
  
  try {
    // Stop existing server
    await stopServer();
    
    // Start server with new configuration
    const serverProcess = await startServer();
    
    log('\n📋 Restart process completed!', 'bgGreen');
    log('💡 The server is now running in the background', 'green');
    log('⚠️  Press Ctrl+C in the server terminal to stop it', 'yellow');
    
  } catch (error) {
    log(`\n💥 Restart failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle script termination
process.on('SIGINT', () => {
  log('\n\n🛑 Restart process interrupted', 'yellow');
  process.exit(0);
});

// Run the restart
if (require.main === module) {
  restartServer().catch(error => {
    log(`\n💥 Unhandled error: ${error.message}`, 'red');
    process.exit(1);
  });
}
