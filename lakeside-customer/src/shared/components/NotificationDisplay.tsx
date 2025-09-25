import React, { useEffect, useRef } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useToast } from '../context/ToastContext';

/**
 * NotificationDisplay Component
 * 
 * This component bridges the NotificationContext and ToastContext
 * to automatically display in-app notifications as visual toast messages.
 * 
 * It listens for new notifications and shows them using the Toast system.
 */
export const NotificationDisplay: React.FC = () => {
  const { notifications } = useNotifications();
  const processedNotificationsRef = useRef<Set<string>>(new Set());
  
  // Get toast functions with error handling
  let toastFunctions: any = {};
  try {
    toastFunctions = useToast();
  } catch (error) {
    console.error('🔔 Error getting toast functions:', error);
    return null; // Don't render if toast context is not available
  }
  
  const { showSuccess, showInfo, showWarning, showError } = toastFunctions;

  useEffect(() => {
    // Process new notifications that haven't been displayed yet
    notifications.forEach(notification => {
      if (!processedNotificationsRef.current.has(notification.id)) {
        console.log('🔔 Displaying toast for notification:', notification.title);
        
        // Mark as processed
        processedNotificationsRef.current.add(notification.id);
        
        try {
          // Show toast based on notification type
          switch (notification.type) {
            case 'order_update':
              if (notification.title.includes('Confirmed') || 
                  notification.title.includes('Delivered') ||
                  notification.title.includes('Ready')) {
                if (showSuccess) {
                  showSuccess(notification.title, notification.message);
                } else {
                  console.warn('🔔 showSuccess not available, falling back to showInfo');
                  showInfo && showInfo(notification.title, notification.message);
                }
              } else if (notification.title.includes('Cancelled')) {
                if (showError) {
                  showError(notification.title, notification.message);
                } else {
                  console.warn('🔔 showError not available, falling back to showInfo');
                  showInfo && showInfo(notification.title, notification.message);
                }
              } else {
                showInfo && showInfo(notification.title, notification.message);
              }
              break;
              
            case 'promotion':
              showInfo && showInfo(notification.title, notification.message);
              break;
              
            case 'general':
            default:
              showInfo && showInfo(notification.title, notification.message);
              break;
          }
        } catch (error) {
          console.error('🔔 Error displaying toast notification:', error);
          // Fallback: just log the notification
          console.log('🔔 Notification (fallback):', notification.title, '-', notification.message);
        }
      }
    });

    // Cleanup processed notifications that are no longer in the list
    const currentIds = new Set(notifications.map(n => n.id));
    Array.from(processedNotificationsRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        processedNotificationsRef.current.delete(id);
      }
    });
    
  }, [notifications, showSuccess, showInfo, showWarning, showError]);

  // This component renders nothing - it's just for side effects
  return null;
};

export default NotificationDisplay;
