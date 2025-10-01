/**
 * Grace Period Utilities
 * Handles the 1-minute grace period during which customers can cancel orders for free
 * and restaurants cannot accept/reject orders
 */

export interface GracePeriodStatus {
  isInGracePeriod: boolean;
  remainingTime: number; // milliseconds remaining in grace period
  formattedTime: string; // formatted as "0:45" (minutes:seconds)
  actionsDisabled: boolean; // whether restaurant actions should be disabled
  gracePeriodExpired: boolean; // whether grace period has completely expired
}

/**
 * Grace period duration in milliseconds (1 minute)
 */
export const GRACE_PERIOD_DURATION = 60 * 1000; // 1 minute in milliseconds

/**
 * Calculate the grace period status for an order
 */
export const calculateGracePeriodStatus = (orderCreatedAt: string): GracePeriodStatus => {
  try {
    const createdTime = new Date(orderCreatedAt).getTime();
    const currentTime = new Date().getTime();
    const elapsedTime = currentTime - createdTime;
    const remainingTime = Math.max(0, GRACE_PERIOD_DURATION - elapsedTime);
    
    const isInGracePeriod = remainingTime > 0;
    const gracePeriodExpired = elapsedTime >= GRACE_PERIOD_DURATION;
    const actionsDisabled = isInGracePeriod;
    
    return {
      isInGracePeriod,
      remainingTime,
      formattedTime: formatCountdownTime(remainingTime),
      actionsDisabled,
      gracePeriodExpired
    };
  } catch (error) {
    console.error('Error calculating grace period status:', error);
    // Fallback: assume grace period has expired to allow actions
    return {
      isInGracePeriod: false,
      remainingTime: 0,
      formattedTime: '0:00',
      actionsDisabled: false,
      gracePeriodExpired: true
    };
  }
};

/**
 * Format milliseconds into a countdown string (MM:SS)
 */
export const formatCountdownTime = (milliseconds: number): string => {
  if (milliseconds <= 0) {
    return '0:00';
  }
  
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Check if an order should have restaurant actions disabled
 * Takes into account both grace period and order status
 */
export const shouldDisableRestaurantActions = (
  orderCreatedAt: string, 
  orderStatus: string,
  orderAcceptedAt?: string | null
): boolean => {
  // If order is already accepted or in progress, don't disable based on grace period
  if (orderStatus !== 'PENDING' || orderAcceptedAt) {
    return false;
  }
  
  const gracePeriodStatus = calculateGracePeriodStatus(orderCreatedAt);
  return gracePeriodStatus.actionsDisabled;
};

/**
 * Get a user-friendly message about the grace period status
 */
export const getGracePeriodMessage = (gracePeriodStatus: GracePeriodStatus): string => {
  if (!gracePeriodStatus.isInGracePeriod) {
    return 'You can now accept or reject this order';
  }
  
  return `Customer can cancel for free. Actions available in ${gracePeriodStatus.formattedTime}`;
};

/**
 * Get grace period information for display in UI components
 */
export const getGracePeriodDisplayInfo = (orderCreatedAt: string, orderStatus: string) => {
  const gracePeriodStatus = calculateGracePeriodStatus(orderCreatedAt);
  const shouldDisable = shouldDisableRestaurantActions(orderCreatedAt, orderStatus);
  
  return {
    ...gracePeriodStatus,
    shouldDisableActions: shouldDisable,
    displayMessage: getGracePeriodMessage(gracePeriodStatus),
    showCountdown: gracePeriodStatus.isInGracePeriod && orderStatus === 'PENDING'
  };
};

/**
 * Hook-friendly function to get grace period status that updates frequently
 */
export const getUpdatedGracePeriodStatus = (orderCreatedAt: string, orderStatus: string) => {
  return getGracePeriodDisplayInfo(orderCreatedAt, orderStatus);
};