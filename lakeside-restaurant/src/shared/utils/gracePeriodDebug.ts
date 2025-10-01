/**
 * Debug utility for testing grace period functionality
 * Use this to test grace period calculations in development
 */

import { calculateGracePeriodStatus, shouldDisableRestaurantActions } from './gracePeriodUtils';

export const testGracePeriod = (orderCreatedAt: string, orderStatus: string) => {
  console.log('=== GRACE PERIOD DEBUG ===');
  console.log('Order Created At:', orderCreatedAt);
  console.log('Order Status:', orderStatus);
  
  const gracePeriodStatus = calculateGracePeriodStatus(orderCreatedAt);
  console.log('Grace Period Status:', gracePeriodStatus);
  
  const shouldDisable = shouldDisableRestaurantActions(orderCreatedAt, orderStatus);
  console.log('Should Disable Actions:', shouldDisable);
  
  const now = new Date();
  const createdTime = new Date(orderCreatedAt);
  const elapsedMs = now.getTime() - createdTime.getTime();
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  
  console.log('Current Time:', now.toISOString());
  console.log('Elapsed Time:', elapsedSeconds, 'seconds');
  console.log('Grace Period (60s):', elapsedSeconds < 60 ? 'ACTIVE' : 'EXPIRED');
  console.log('========================');
  
  return {
    gracePeriodStatus,
    shouldDisable,
    elapsedSeconds,
    isActive: elapsedSeconds < 60
  };
};

// Quick test with current time
export const testCurrentTime = () => {
  const now = new Date().toISOString();
  return testGracePeriod(now, 'PENDING');
};

// Test with order that's 30 seconds old
export const testPartialGracePeriod = () => {
  const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
  return testGracePeriod(thirtySecondsAgo, 'PENDING');
};

// Test with order that's 2 minutes old (expired)
export const testExpiredGracePeriod = () => {
  const twoMinutesAgo = new Date(Date.now() - 120000).toISOString();
  return testGracePeriod(twoMinutesAgo, 'PENDING');
};