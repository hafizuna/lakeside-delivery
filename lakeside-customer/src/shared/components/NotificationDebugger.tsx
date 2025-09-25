import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Colors } from '../theme/colors';

export const NotificationDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    const info: any = {
      device: {},
      permissions: {},
      token: {},
      errors: []
    };

    try {
      // Check if device is physical
      info.device.isPhysical = Device.isDevice;
      info.device.modelName = Device.modelName;
      info.device.osName = Device.osName;
      info.device.osVersion = Device.osVersion;

      console.log('🔔 Device Info:', info.device);

      if (!Device.isDevice) {
        info.errors.push('Must use physical device for push notifications');
      }

      // Check permissions
      try {
        const permissionResponse = await Notifications.getPermissionsAsync();
        info.permissions.status = permissionResponse.status;
        info.permissions.canAskAgain = permissionResponse.canAskAgain;
        info.permissions.granted = permissionResponse.granted;

        console.log('🔔 Permission Status:', info.permissions);

        if (permissionResponse.status !== 'granted') {
          console.log('🔔 Requesting permissions...');
          const requestResponse = await Notifications.requestPermissionsAsync();
          info.permissions.requestStatus = requestResponse.status;
          info.permissions.requestGranted = requestResponse.granted;

          console.log('🔔 Permission Request Result:', requestResponse);
        }
      } catch (error) {
        console.error('🔔 Permission Error:', error);
        info.errors.push(`Permission error: ${error}`);
      }

      // Try to get push token
      try {
        console.log('🔔 Attempting to get push token...');
        
        const tokenResponse = await Notifications.getExpoPushTokenAsync({
          projectId: '550e8400-e29b-41d4-a716-446655440000',
        });
        
        info.token.success = true;
        info.token.data = tokenResponse.data;
        console.log('🔔 Token Success:', tokenResponse.data);
        
      } catch (error) {
        console.error('🔔 Token Error:', error);
        info.token.success = false;
        info.token.error = error.message || error.toString();
        info.errors.push(`Token error: ${error}`);
      }

    } catch (error) {
      console.error('🔔 General Error:', error);
      info.errors.push(`General error: ${error}`);
    }

    setDebugInfo(info);
    setLoading(false);

    console.log('🔔 Full Debug Info:', info);
  };

  const handleRequestPermissions = async () => {
    try {
      const response = await Notifications.requestPermissionsAsync();
      console.log('🔔 Manual permission request:', response);
      Alert.alert('Permission Result', `Status: ${response.status}\nGranted: ${response.granted}`);
      await runDiagnostics();
    } catch (error) {
      console.error('🔔 Manual permission error:', error);
      Alert.alert('Permission Error', error.toString());
    }
  };

  const handleTestNotification = async () => {
    try {
      console.log('🔔 Testing local notification...');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification 🧪',
          body: 'This is a test notification from your app!',
        },
        trigger: null,
      });
      Alert.alert('Test Sent', 'Local notification sent!');
    } catch (error) {
      console.error('🔔 Test notification error:', error);
      Alert.alert('Test Error', error.toString());
    }
  };

  const handleCopyToken = () => {
    if (debugInfo.token?.data) {
      console.log('🔔 FULL TOKEN TO COPY:');
      console.log('='.repeat(80));
      console.log(debugInfo.token.data);
      console.log('='.repeat(80));
      Alert.alert('Token Copied', 'Check console logs for full token');
    } else {
      Alert.alert('No Token', 'Token not available');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🔔 Running Notification Diagnostics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔔 Notification Debug Info</Text>
      
      {/* Device Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 Device</Text>
        <Text style={styles.info}>Physical Device: {debugInfo.device.isPhysical ? '✅ Yes' : '❌ No (Simulator)'}</Text>
        <Text style={styles.info}>Model: {debugInfo.device.modelName}</Text>
        <Text style={styles.info}>OS: {debugInfo.device.osName} {debugInfo.device.osVersion}</Text>
      </View>

      {/* Permissions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔒 Permissions</Text>
        <Text style={styles.info}>Status: {debugInfo.permissions.status}</Text>
        <Text style={styles.info}>Granted: {debugInfo.permissions.granted ? '✅ Yes' : '❌ No'}</Text>
        <Text style={styles.info}>Can Ask Again: {debugInfo.permissions.canAskAgain ? '✅ Yes' : '❌ No'}</Text>
        
        <TouchableOpacity style={styles.button} onPress={handleRequestPermissions}>
          <Text style={styles.buttonText}>🔒 Request Permissions</Text>
        </TouchableOpacity>
      </View>

      {/* Token */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎫 Push Token</Text>
        <Text style={styles.info}>
          Status: {debugInfo.token.success ? '✅ Success' : '❌ Failed'}
        </Text>
        {debugInfo.token.data && (
          <>
            <Text style={styles.info}>Token: {debugInfo.token.data.substring(0, 30)}...</Text>
            <TouchableOpacity style={styles.button} onPress={handleCopyToken}>
              <Text style={styles.buttonText}>📋 Copy Full Token</Text>
            </TouchableOpacity>
          </>
        )}
        {debugInfo.token.error && (
          <Text style={styles.error}>Error: {debugInfo.token.error}</Text>
        )}
      </View>

      {/* Test */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧪 Test</Text>
        <TouchableOpacity style={styles.button} onPress={handleTestNotification}>
          <Text style={styles.buttonText}>🧪 Test Local Notification</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={runDiagnostics}>
          <Text style={styles.buttonText}>🔄 Re-run Diagnostics</Text>
        </TouchableOpacity>
      </View>

      {/* Errors */}
      {debugInfo.errors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❌ Errors</Text>
          {debugInfo.errors.map((error: string, index: number) => (
            <Text key={index} style={styles.error}>{error}</Text>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.instructions}>
          If token generation fails:{'\n'}
          1. Make sure you're on a physical device{'\n'}
          2. Grant notification permissions{'\n'}
          3. Check your device notification settings{'\n'}
          4. Make sure app.json has correct projectId{'\n'}
          5. Try restarting the app
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.action.warning,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  info: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  error: {
    fontSize: 14,
    color: Colors.action.error,
    marginBottom: 4,
  },
  button: {
    backgroundColor: Colors.primary.main,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.text.white,
    fontSize: 14,
    fontWeight: '500',
  },
  instructions: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
});

export default NotificationDebugger;
