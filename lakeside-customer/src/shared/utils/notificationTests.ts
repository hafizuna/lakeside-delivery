import NotificationService from '../services/notificationService';

/**
 * Test suite for notification system
 */
export class NotificationTests {
  
  /**
   * Test basic notification service initialization
   */
  static async testInitialization(): Promise<boolean> {
    try {
      console.log('Testing notification service initialization...');
      await NotificationService.initialize();
      
      const stats = NotificationService.getNotificationStats();
      console.log('Notification stats:', stats);
      
      return true;
    } catch (error) {
      console.error('Initialization test failed:', error);
      return false;
    }
  }

  /**
   * Test notification permissions
   */
  static async testPermissions(): Promise<boolean> {
    try {
      console.log('Testing notification permissions...');
      const validation = await NotificationService.validateConfiguration();
      
      console.log('Validation result:', validation);
      
      if (!validation.isValid) {
        console.warn('Validation issues found:', validation.issues);
      }
      
      return validation.isValid;
    } catch (error) {
      console.error('Permission test failed:', error);
      return false;
    }
  }

  /**
   * Test order notification
   */
  static async testOrderNotification(): Promise<boolean> {
    try {
      console.log('Testing order notification...');
      
      const mockOrderData = {
        orderId: 'test-123',
        restaurantName: 'Test Restaurant',
        orderStatus: 'confirmed',
        estimatedTime: '20 minutes'
      };
      
      await NotificationService.sendOrderNotification(mockOrderData);
      console.log('Order notification test completed');
      return true;
    } catch (error) {
      console.error('Order notification test failed:', error);
      return false;
    }
  }

  /**
   * Test wallet notification
   */
  static async testWalletNotification(): Promise<boolean> {
    try {
      console.log('Testing wallet notification...');
      
      const mockWalletData = {
        transactionId: 'test-wallet-456',
        amount: 100,
        type: 'topup' as const,
        status: 'approved' as const
      };
      
      await NotificationService.sendWalletNotification(mockWalletData);
      console.log('Wallet notification test completed');
      return true;
    } catch (error) {
      console.error('Wallet notification test failed:', error);
      return false;
    }
  }

  /**
   * Test promotional notification
   */
  static async testPromotionalNotification(): Promise<boolean> {
    try {
      console.log('Testing promotional notification...');
      
      await NotificationService.sendPromotionalNotification(
        'Special Offer!',
        'Get 20% off your next order with code SAVE20'
      );
      
      console.log('Promotional notification test completed');
      return true;
    } catch (error) {
      console.error('Promotional notification test failed:', error);
      return false;
    }
  }

  /**
   * Test notification throttling
   */
  static async testThrottling(): Promise<boolean> {
    try {
      console.log('Testing notification throttling...');
      
      // Send the same notification multiple times quickly
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(NotificationService.sendTestNotification());
      }
      
      await Promise.all(promises);
      console.log('Throttling test completed (check logs for throttle messages)');
      return true;
    } catch (error) {
      console.error('Throttling test failed:', error);
      return false;
    }
  }

  /**
   * Run all tests
   */
  static async runAllTests(): Promise<{
    passed: number;
    failed: number;
    results: { [key: string]: boolean };
  }> {
    console.log('🧪 Starting notification system tests...');
    
    const tests = [
      { name: 'Initialization', test: this.testInitialization },
      { name: 'Permissions', test: this.testPermissions },
      { name: 'Order Notification', test: this.testOrderNotification },
      { name: 'Wallet Notification', test: this.testWalletNotification },
      { name: 'Promotional Notification', test: this.testPromotionalNotification },
      { name: 'Throttling', test: this.testThrottling },
    ];

    const results: { [key: string]: boolean } = {};
    let passed = 0;
    let failed = 0;

    for (const { name, test } of tests) {
      try {
        const result = await test();
        results[name] = result;
        
        if (result) {
          passed++;
          console.log(`✅ ${name} test passed`);
        } else {
          failed++;
          console.log(`❌ ${name} test failed`);
        }
      } catch (error) {
        failed++;
        results[name] = false;
        console.log(`💥 ${name} test crashed:`, error);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    return { passed, failed, results };
  }
}

export default NotificationTests;
