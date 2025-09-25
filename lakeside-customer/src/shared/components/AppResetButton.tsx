import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { Colors } from '../theme/colors';

/**
 * AppResetButton Component
 * 
 * This component provides a button to completely reset the app to fresh install state
 * - Clears AsyncStorage (tokens, settings, etc.)
 * - Clears SecureStore (secure tokens)
 * - Resets user login state
 * - Forces permission re-requests
 */
export const AppResetButton: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false);

  const clearAsyncStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      console.log('🗑️ AsyncStorage keys to clear:', keys);
      await AsyncStorage.multiRemove(keys);
      console.log('✅ AsyncStorage cleared');
    } catch (error) {
      console.error('❌ Error clearing AsyncStorage:', error);
      throw error;
    }
  };

  const clearSecureStore = async () => {
    try {
      // Common secure store keys used in the app
      const secureKeys = [
        'access_token',
        'refresh_token', 
        'user_credentials',
        'expo_push_token',
        'notification_settings',
        'user_data',
        'auth_token',
        'login_data'
      ];

      for (const key of secureKeys) {
        try {
          await SecureStore.deleteItemAsync(key);
          console.log(`✅ Cleared SecureStore key: ${key}`);
        } catch (error) {
          // Key might not exist, that's okay
          console.log(`🔍 SecureStore key not found: ${key}`);
        }
      }
      console.log('✅ SecureStore cleared');
    } catch (error) {
      console.error('❌ Error clearing SecureStore:', error);
      throw error;
    }
  };

  const resetAppData = async () => {
    setIsResetting(true);
    
    try {
      console.log('🧹 Starting complete app reset...');
      
      // Clear all storage
      await clearAsyncStorage();
      await clearSecureStore();
      
      console.log('✅ App data reset complete!');
      
      Alert.alert(
        '✅ Reset Complete!', 
        'App data has been cleared. Please:\n\n1. Close the app completely\n2. Reopen the app\n3. You should see onboarding/login again\n4. Allow notifications when prompted\n\nThis simulates a fresh app install!',
        [
          {
            text: 'OK',
            onPress: () => {
              // You could also force app restart here if needed
              console.log('🔄 App reset complete, please restart app');
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Error during app reset:', error);
      Alert.alert('Reset Error', `Failed to reset app data: ${error.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetPress = () => {
    Alert.alert(
      '⚠️ Reset App Data',
      'This will:\n\n• Clear all stored data\n• Log you out\n• Reset notification permissions\n• Clear cached tokens\n• Reset to fresh install state\n\nAre you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset Everything', 
          style: 'destructive',
          onPress: resetAppData 
        }
      ]
    );
  };

  const handleClearSpecific = () => {
    Alert.alert(
      '🔧 Clear Specific Data',
      'What would you like to clear?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Just Tokens', 
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('expo_push_token');
              await AsyncStorage.removeItem('access_token');
              await AsyncStorage.removeItem('refresh_token');
              await SecureStore.deleteItemAsync('access_token');
              await SecureStore.deleteItemAsync('expo_push_token');
              Alert.alert('✅ Tokens Cleared', 'Authentication and push tokens have been cleared.');
            } catch (error) {
              Alert.alert('❌ Error', 'Failed to clear tokens.');
            }
          }
        },
        { 
          text: 'Just Settings', 
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('notification_settings');
              await AsyncStorage.removeItem('user_preferences');
              Alert.alert('✅ Settings Cleared', 'App settings have been reset.');
            } catch (error) {
              Alert.alert('❌ Error', 'Failed to clear settings.');
            }
          }
        },
        { 
          text: 'Everything', 
          style: 'destructive',
          onPress: resetAppData 
        }
      ]
    );
  };

  const handleForcePermissionRequest = async () => {
    try {
      console.log('🔔 Force requesting notification permissions...');
      
      // First check current status
      const currentPermissions = await Notifications.getPermissionsAsync();
      console.log('🔔 Current permissions:', currentPermissions);
      
      Alert.alert(
        'Current Permission Status',
        `Status: ${currentPermissions.status}\nGranted: ${currentPermissions.granted}\nCan Ask Again: ${currentPermissions.canAskAgain}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Request Again',
            onPress: async () => {
              try {
                const response = await Notifications.requestPermissionsAsync({
                  ios: {
                    allowAlert: true,
                    allowBadge: true,
                    allowSound: true,
                    allowDisplayInCarPlay: true,
                    allowCriticalAlerts: false,
                    provideAppNotificationSettings: true,
                    allowProvisional: false,
                    allowAnnouncements: false,
                  }
                });
                
                console.log('🔔 Permission request response:', response);
                
                Alert.alert(
                  'Permission Request Result',
                  `Status: ${response.status}\nGranted: ${response.granted}\n\n${response.granted ? 'Success! Notifications should work now.' : 'Permission denied. Check iPhone Settings > [App Name] > Notifications'}`,
                  [{ text: 'OK' }]
                );
              } catch (error) {
                console.error('🔔 Permission request error:', error);
                Alert.alert('Error', 'Failed to request permissions: ' + error.message);
              }
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('🔔 Error checking permissions:', error);
      Alert.alert('Error', 'Failed to check permissions: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧹 App Reset Tools</Text>
      <Text style={styles.subtitle}>
        Use these tools to reset the app to fresh install state
      </Text>
      
      <TouchableOpacity 
        style={[styles.resetButton, isResetting && styles.buttonDisabled]}
        onPress={handleResetPress}
        disabled={isResetting}
      >
        <Text style={styles.resetButtonText}>
          {isResetting ? '🔄 Resetting...' : '🗑️ Reset Everything'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.partialButton]}
        onPress={handleClearSpecific}
        disabled={isResetting}
      >
        <Text style={styles.partialButtonText}>
          🔧 Clear Specific Data
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.permissionButton]}
        onPress={handleForcePermissionRequest}
        disabled={isResetting}
      >
        <Text style={styles.permissionButtonText}>
          🔔 Force Permission Request
        </Text>
      </TouchableOpacity>
      
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⚠️ After reset:{'\n'}
          • Close app completely{'\n'}
          • Reopen app{'\n'}
          • Try 'Force Permission Request' button{'\n'}
          • If no permission prompt: Delete app from iPhone, reinstall{'\n'}
          • Or: iPhone Settings > [App] > Reset Notifications{'\n'}
          • Login again and check push token
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.action.error,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: Colors.action.error,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  partialButton: {
    backgroundColor: Colors.action.warning,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  permissionButton: {
    backgroundColor: Colors.action.info,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.text.light,
  },
  resetButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
  partialButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '500',
  },
  permissionButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '500',
  },
  warningBox: {
    backgroundColor: Colors.action.warning + '20',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.action.warning,
  },
  warningText: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
});

export default AppResetButton;
