#!/usr/bin/env node

/**
 * Clear React Native App Data Script
 * 
 * This script helps you reset your React Native app to a fresh state
 * so you get permission prompts again like a new install
 */

console.log('🧹 Clear App Data Script');
console.log('========================\n');

console.log('To reset your app to a fresh install state:\n');

console.log('📱 FOR iOS (your iPhone):');
console.log('1. Delete the app from your iPhone:');
console.log('   - Long press the app icon');
console.log('   - Tap "Remove App" → "Delete App"');
console.log('2. Clear any cached data:');
console.log('   - Go to iPhone Settings → General → iPhone Storage');
console.log('   - Find your app and delete it completely');
console.log('3. Restart your iPhone (optional but recommended)\n');

console.log('📱 FOR Android:');
console.log('1. Go to Settings → Apps → [Your App Name]');
console.log('2. Tap "Storage" → "Clear Data" and "Clear Cache"');
console.log('3. Or uninstall and reinstall the app\n');

console.log('🖥️  FOR Expo Development:');
console.log('1. Stop your React Native development server');
console.log('2. Clear React Native cache:');
console.log('   • Run: npx expo start --clear');
console.log('   • Or: npx react-native start --reset-cache');
console.log('3. Delete node_modules and reinstall:');
console.log('   • rm -rf node_modules');
console.log('   • npm install');
console.log('4. Clear Expo cache:');
console.log('   • npx expo install --fix\n');

console.log('🔄 RESTART SEQUENCE:');
console.log('1. Delete app from your iPhone');
console.log('2. Run: npx expo start --clear');
console.log('3. Reinstall app on iPhone via Expo Go or direct install');
console.log('4. When app opens, you should get permission prompts again\n');

console.log('⚠️  IMPORTANT:');
console.log('- After clearing, the app will ask for permissions again');
console.log('- Make sure to ALLOW notifications when prompted');
console.log('- Test on the same physical device (iPhone 6s Plus)\n');

console.log('🎯 Expected Result:');
console.log('- Fresh permission prompts ✅');
console.log('- Successful push token generation ✅');
console.log('- Working system notifications ✅');
