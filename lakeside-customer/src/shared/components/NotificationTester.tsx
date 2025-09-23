import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Switch
} from 'react-native';
import { Colors } from '../theme/colors';
import { OrderStatus } from '../types/Order';
import { useNotifications } from '../context/NotificationContext';

interface NotificationTesterProps {
  onClose: () => void;
}

const NotificationTester: React.FC<NotificationTesterProps> = ({ onClose }) => {
  const [testingInProgress, setTestingInProgress] = useState(false);
  const {
    testOrderStatusNotification,
    sendTestNotification,
    getNotificationStats,
    pushNotificationSettings,
    updatePushNotificationSettings,
    isNotificationServiceReady,
    addNotification
  } = useNotifications();

  const handleTestOrderStatus = async (status: OrderStatus) => {
    setTestingInProgress(true);
    try {
      await testOrderStatusNotification(status);
      Alert.alert('Test Sent', `Test notification for ${status} status has been sent!`);
    } catch (error) {
      Alert.alert('Test Failed', 'Failed to send test notification');
    } finally {
      setTestingInProgress(false);
    }
  };

  const handleTestPushNotification = async () => {
    setTestingInProgress(true);
    try {
      await sendTestNotification();
      Alert.alert('Push Test Sent', 'Test push notification has been sent!');
    } catch (error) {
      Alert.alert('Push Test Failed', 'Failed to send test push notification');
    } finally {
      setTestingInProgress(false);
    }
  };

  const handleTestInAppNotification = () => {
    addNotification({
      title: 'Test In-App Notification 🧪',
      message: 'This is a test in-app notification to verify the notification display system.',
      type: 'general'
    });
    Alert.alert('In-App Test', 'Test in-app notification has been added!');
  };

  const showNotificationStats = () => {
    const stats = getNotificationStats();
    Alert.alert(
      'Notification Stats',
      JSON.stringify(stats, null, 2),
      [{ text: 'OK' }]
    );
  };

  const orderStatuses = [
    { status: OrderStatus.ACCEPTED, label: 'Order Confirmed' },
    { status: OrderStatus.PREPARING, label: 'Preparing Food' },
    { status: OrderStatus.PICKED_UP, label: 'Picked Up' },
    { status: OrderStatus.DELIVERING, label: 'Out for Delivery' },
    { status: OrderStatus.DELIVERED, label: 'Delivered' },
    { status: OrderStatus.CANCELLED, label: 'Cancelled' }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔔 Notification Tester</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Service Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Status</Text>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Notification Service Ready:</Text>
            <Text style={[
              styles.statusValue, 
              { color: isNotificationServiceReady ? Colors.status.delivered : Colors.status.cancelled }
            ]}>
              {isNotificationServiceReady ? '✅ Ready' : '❌ Not Ready'}
            </Text>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Order Updates</Text>
            <Switch
              value={pushNotificationSettings.orderUpdates}
              onValueChange={(value) => updatePushNotificationSettings({ orderUpdates: value })}
              trackColor={{ false: Colors.border.light, true: Colors.primary.light }}
              thumbColor={pushNotificationSettings.orderUpdates ? Colors.primary.main : Colors.text.secondary}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Wallet Transactions</Text>
            <Switch
              value={pushNotificationSettings.walletTransactions}
              onValueChange={(value) => updatePushNotificationSettings({ walletTransactions: value })}
              trackColor={{ false: Colors.border.light, true: Colors.primary.light }}
              thumbColor={pushNotificationSettings.walletTransactions ? Colors.primary.main : Colors.text.secondary}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Promotional Offers</Text>
            <Switch
              value={pushNotificationSettings.promotionalOffers}
              onValueChange={(value) => updatePushNotificationSettings({ promotionalOffers: value })}
              trackColor={{ false: Colors.border.light, true: Colors.primary.light }}
              thumbColor={pushNotificationSettings.promotionalOffers ? Colors.primary.main : Colors.text.secondary}
            />
          </View>
        </View>

        {/* Quick Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Tests</Text>
          
          <TouchableOpacity 
            style={[styles.testButton, testingInProgress && styles.testButtonDisabled]}
            onPress={handleTestPushNotification}
            disabled={testingInProgress}
          >
            <Text style={styles.testButtonText}>📱 Test Push Notification</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.testButton}
            onPress={handleTestInAppNotification}
          >
            <Text style={styles.testButtonText}>💬 Test In-App Notification</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.testButton}
            onPress={showNotificationStats}
          >
            <Text style={styles.testButtonText}>📊 Show Notification Stats</Text>
          </TouchableOpacity>
        </View>

        {/* Order Status Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Status Tests</Text>
          <Text style={styles.sectionSubtitle}>
            Test different order status notifications
          </Text>
          
          {orderStatuses.map((item) => (
            <TouchableOpacity
              key={item.status}
              style={[styles.statusTestButton, testingInProgress && styles.testButtonDisabled]}
              onPress={() => handleTestOrderStatus(item.status)}
              disabled={testingInProgress}
            >
              <Text style={styles.statusTestButtonText}>{item.label}</Text>
              <Text style={styles.statusTestButtonSubtext}>{item.status}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instructionText}>
            • Use the quick tests to verify basic notification functionality{'\n'}
            • Test different order statuses to ensure all scenarios work{'\n'}
            • Check notification stats to see service health{'\n'}
            • Toggle settings to test different notification types{'\n'}
            • Close and reopen the app to test persistence
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    bottom: 50,
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  settingLabel: {
    fontSize: 14,
    color: Colors.text.primary,
    flex: 1,
  },
  testButton: {
    backgroundColor: Colors.primary.light,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  testButtonDisabled: {
    backgroundColor: Colors.text.light,
    borderColor: Colors.border.light,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary.main,
    textAlign: 'center',
  },
  statusTestButton: {
    backgroundColor: Colors.background.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  statusTestButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  statusTestButtonSubtext: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});

export default NotificationTester;
