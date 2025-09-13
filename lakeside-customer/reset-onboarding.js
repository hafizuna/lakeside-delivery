#!/usr/bin/env node

/**
 * Quick script to reset onboarding state for testing
 * Run this script and then restart your Expo app to see onboarding screens
 */

const { execSync } = require('child_process');

console.log('🔄 Resetting Lakeside Delivery onboarding state...\n');

try {
  // Clear Metro bundler cache
  console.log('1️⃣ Clearing Metro cache...');
  execSync('npx expo start --clear', { stdio: 'pipe' });
  
  console.log('2️⃣ Onboarding state will be reset when you restart the app');
  console.log('\n✅ Reset complete!');
  console.log('\n📱 To see the onboarding screens:');
  console.log('   1. Close the Expo Go app completely');
  console.log('   2. Scan the QR code again');
  console.log('   3. Or press "r" in the terminal to reload');
  
} catch (error) {
  console.error('❌ Error resetting onboarding:', error.message);
  console.log('\n🔧 Manual reset instructions:');
  console.log('   1. In your app, look for "🔄 Reset Onboarding (Dev)" button');
  console.log('   2. Tap it and restart the app');
  console.log('   3. Or run: npx expo start --clear');
}
