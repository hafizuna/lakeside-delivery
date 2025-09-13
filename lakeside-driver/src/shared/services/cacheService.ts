import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface CacheStats {
  totalKeys: number;
  authKeys: number;
  orderKeys: number;
  userKeys: number;
  otherKeys: number;
}

class CacheService {
  /**
   * Get all cache keys and categorize them
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      
      const stats: CacheStats = {
        totalKeys: allKeys.length,
        authKeys: 0,
        orderKeys: 0,
        userKeys: 0,
        otherKeys: 0,
      };

      allKeys.forEach(key => {
        if (key.includes('auth') || key.includes('token') || key.includes('login')) {
          stats.authKeys++;
        } else if (key.includes('order') || key.includes('delivery')) {
          stats.orderKeys++;
        } else if (key.includes('user') || key.includes('profile') || key.includes('driver')) {
          stats.userKeys++;
        } else {
          stats.otherKeys++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalKeys: 0,
        authKeys: 0,
        orderKeys: 0,
        userKeys: 0,
        otherKeys: 0,
      };
    }
  }

  /**
   * Clear all cached data
   */
  async clearAllCache(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      console.log('✅ All cache cleared successfully');
      return true;
    } catch (error) {
      console.error('❌ Error clearing all cache:', error);
      return false;
    }
  }

  /**
   * Clear specific cache categories
   */
  async clearAuthCache(): Promise<boolean> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const authKeys = allKeys.filter(key => 
        key.includes('auth') || 
        key.includes('token') || 
        key.includes('login') ||
        key.includes('session')
      );
      
      if (authKeys.length > 0) {
        await AsyncStorage.multiRemove(authKeys);
        console.log(`✅ Cleared ${authKeys.length} auth keys:`, authKeys);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error clearing auth cache:', error);
      return false;
    }
  }

  async clearOrderCache(): Promise<boolean> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const orderKeys = allKeys.filter(key => 
        key.includes('order') || 
        key.includes('delivery') ||
        key.includes('route')
      );
      
      if (orderKeys.length > 0) {
        await AsyncStorage.multiRemove(orderKeys);
        console.log(`✅ Cleared ${orderKeys.length} order keys:`, orderKeys);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error clearing order cache:', error);
      return false;
    }
  }

  async clearUserCache(): Promise<boolean> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const userKeys = allKeys.filter(key => 
        key.includes('user') || 
        key.includes('profile') ||
        key.includes('driver') ||
        key.includes('settings')
      );
      
      if (userKeys.length > 0) {
        await AsyncStorage.multiRemove(userKeys);
        console.log(`✅ Cleared ${userKeys.length} user keys:`, userKeys);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error clearing user cache:', error);
      return false;
    }
  }

  /**
   * Get all cache keys for debugging
   */
  async getAllCacheKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting cache keys:', error);
      return [];
    }
  }

  /**
   * Show cache info dialog
   */
  async showCacheInfo(): Promise<void> {
    const stats = await this.getCacheStats();
    const keys = await this.getAllCacheKeys();
    
    console.log('📊 Cache Stats:', stats);
    console.log('🔑 All Keys:', keys);
    
    Alert.alert(
      '📊 Cache Information',
      `Total Keys: ${stats.totalKeys}\n` +
      `Auth Keys: ${stats.authKeys}\n` +
      `Order Keys: ${stats.orderKeys}\n` +
      `User Keys: ${stats.userKeys}\n` +
      `Other Keys: ${stats.otherKeys}\n\n` +
      `Check console for detailed key list`,
      [{ text: 'OK' }]
    );
  }

  /**
   * Show clear cache options dialog
   */
  showClearCacheDialog(): void {
    Alert.alert(
      '🗑️ Clear Cache',
      'What would you like to clear?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => this.confirmClearAll(),
        },
        {
          text: 'Clear Auth Only',
          onPress: () => this.confirmClearAuth(),
        },
        {
          text: 'Clear Orders Only',
          onPress: () => this.confirmClearOrders(),
        },
        {
          text: 'Show Info',
          onPress: () => this.showCacheInfo(),
        },
      ]
    );
  }

  /**
   * Confirmation dialogs
   */
  private confirmClearAll(): void {
    Alert.alert(
      '⚠️ Clear All Cache',
      'This will remove ALL cached data including login session. You may need to log in again.\n\nAre you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const success = await this.clearAllCache();
            Alert.alert(
              success ? '✅ Success' : '❌ Error',
              success ? 'All cache cleared successfully!' : 'Failed to clear cache. Check console for details.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  }

  private confirmClearAuth(): void {
    Alert.alert(
      '⚠️ Clear Auth Cache',
      'This will clear authentication tokens and login session. You may need to log in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Auth',
          style: 'destructive',
          onPress: async () => {
            const success = await this.clearAuthCache();
            Alert.alert(
              success ? '✅ Success' : '❌ Error',
              success ? 'Auth cache cleared successfully!' : 'Failed to clear auth cache.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  }

  private confirmClearOrders(): void {
    Alert.alert(
      '⚠️ Clear Order Cache',
      'This will clear cached order and delivery data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Orders',
          style: 'destructive',
          onPress: async () => {
            const success = await this.clearOrderCache();
            Alert.alert(
              success ? '✅ Success' : '❌ Error',
              success ? 'Order cache cleared successfully!' : 'Failed to clear order cache.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default CacheService;
