import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNotifications } from '../context/NotificationContext';
import { Colors } from '../theme/colors';

/**
 * PushTokenDisplay Component
 * 
 * This component displays the push token for debugging and testing
 * Add this component anywhere in your app to see and copy the push token
 */
export const PushTokenDisplay: React.FC = () => {
  const { getPushToken, isNotificationServiceReady, sendTestNotification } = useNotifications();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (isNotificationServiceReady) {
      const pushToken = getPushToken();
      setToken(pushToken);
      
      if (pushToken) {
        console.log('🔔 PUSH TOKEN FOR BACKEND:');
        console.log('=' .repeat(80));
        console.log(pushToken);
        console.log('=' .repeat(80));
        console.log('Copy this token and replace "REPLACE_WITH_REAL_TOKEN_FROM_APP_LOGS" in backend');
      }
    }
  }, [isNotificationServiceReady, getPushToken]);

  const handleCopyToken = () => {
    if (token) {
      // In a real app, you'd use Clipboard.setString(token)
      Alert.alert(
        'Push Token',
        `Token: ${token.substring(0, 50)}...\n\nFull token logged to console. Copy from logs and paste in backend.`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              console.log('🔔 FULL PUSH TOKEN:');
              console.log(token);
            }
          }
        ]
      );
    } else {
      Alert.alert('No Token', 'Push token not available yet. Make sure notifications are enabled.');
    }
  };

  const handleTestNotification = async () => {
    try {
      await sendTestNotification();
      Alert.alert('Test Sent', 'Test notification sent! Check your device notification bar.');
    } catch (error) {
      Alert.alert('Test Failed', 'Failed to send test notification.');
    }
  };

  if (!isNotificationServiceReady) {
    return (
      <View style={styles.container}>
        <Text style={styles.status}>🔄 Notification service initializing...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 Push Token Debug</Text>
      
      <View style={styles.tokenContainer}>
        <Text style={styles.label}>Status:</Text>
        <Text style={[styles.value, { color: token ? Colors.success : Colors.action.error }]}>
          {token ? '✅ Token Ready' : '❌ No Token'}
        </Text>
      </View>

      {token && (
        <View style={styles.tokenContainer}>
          <Text style={styles.label}>Token Preview:</Text>
          <Text style={styles.tokenPreview}>
            {token.substring(0, 30)}...
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, !token && styles.buttonDisabled]} 
          onPress={handleCopyToken}
          disabled={!token}
        >
          <Text style={styles.buttonText}>📋 Show Full Token</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={handleTestNotification}
        >
          <Text style={styles.buttonText}>🧪 Test Notification</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.instruction}>
        1. Copy the token from console logs{'\n'}
        2. Replace dummy token in backend{'\n'}
        3. Restart backend server{'\n'}
        4. Test notifications again
      </Text>
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
    borderColor: Colors.primary.light,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  status: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  tokenContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  tokenPreview: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontFamily: 'monospace',
    backgroundColor: Colors.background.secondary,
    padding: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    gap: 8,
    marginVertical: 12,
  },
  button: {
    backgroundColor: Colors.primary.main,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.text.light,
  },
  testButton: {
    backgroundColor: Colors.action.info,
  },
  buttonText: {
    color: Colors.text.white,
    fontSize: 14,
    fontWeight: '500',
  },
  instruction: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
    textAlign: 'center',
  },
});

export default PushTokenDisplay;
