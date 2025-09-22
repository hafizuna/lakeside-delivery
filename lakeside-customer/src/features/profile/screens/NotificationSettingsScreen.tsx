import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../shared/theme/colors';
import { useNotifications } from '../../../shared/context/NotificationContext';
import { BackIcon, BellIcon, WalletIcon, GiftIcon, SettingsIcon } from '../../../shared/components/CustomIcons';
import NotificationTests from '../../../shared/utils/notificationTests';

interface NotificationSettingsScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({ navigation }) => {
  const { 
    pushNotificationSettings, 
    updatePushNotificationSettings,
    sendTestNotification,
    sendOrderNotification,
    sendWalletNotification,
    getPushToken,
    isNotificationServiceReady
  } = useNotifications();

  const handleToggleSetting = async (settingKey: keyof typeof pushNotificationSettings) => {
    const newValue = !pushNotificationSettings[settingKey];
    
    try {
      await updatePushNotificationSettings({
        [settingKey]: newValue,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
    }
  };

  const handleSendTestNotification = async () => {
    try {
      await sendTestNotification();
      Alert.alert('Test Sent!', 'Check your notifications to see the test message.');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification. Please check your notification permissions.');
    }
  };

  const handleTestOrderNotification = async () => {
    try {
      const mockOrderData = {
        orderId: '12345',
        restaurantName: 'Test Restaurant',
        orderStatus: 'confirmed',
        estimatedTime: '25 minutes'
      };
      
      // Use the sendOrderNotification from context
      if (typeof sendOrderNotification === 'function') {
        await sendOrderNotification({
          ...mockOrderData,
          orderStatus: 'preparing'
        });
        Alert.alert('Order Test Sent!', 'Check your notifications for the order status test.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send test order notification.');
    }
  };

  const handleTestWalletNotification = async () => {
    try {
      const mockWalletData = {
        transactionId: '67890',
        amount: 100,
        type: 'topup' as const,
        status: 'approved' as const
      };
      
      // Use the sendWalletNotification from context
      if (typeof sendWalletNotification === 'function') {
        await sendWalletNotification(mockWalletData);
        Alert.alert('Wallet Test Sent!', 'Check your notifications for the wallet test.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send test wallet notification.');
    }
  };

  const handleRunAllTests = async () => {
    try {
      Alert.alert(
        'Run Notification Tests',
        'This will run a comprehensive test suite. Check the console logs for detailed results.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Run Tests',
            onPress: async () => {
              const results = await NotificationTests.runAllTests();
              Alert.alert(
                'Tests Complete!',
                `Passed: ${results.passed}, Failed: ${results.failed}\n\nCheck console for detailed results.`
              );
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to run notification tests.');
    }
  };

  const handleShowPushToken = () => {
    const token = getPushToken();
    if (token) {
      Alert.alert('Push Token', `Your device token:\n\n${token.substring(0, 50)}...`, [
        { text: 'Copy', onPress: () => console.log('Token copied to logs:', token) },
        { text: 'Close', style: 'cancel' }
      ]);
    } else {
      Alert.alert('No Token', 'Push notification token not available. Please check permissions.');
    }
  };

  const renderSettingItem = (
    title: string,
    subtitle: string,
    IconComponent: React.ComponentType<{ size: number; color: string }>,
    settingKey: keyof typeof pushNotificationSettings,
    enabled: boolean
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <IconComponent size={24} color={enabled ? Colors.primary.main : Colors.text.light} />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, !enabled && styles.disabledText]}>{title}</Text>
          <Text style={[styles.settingSubtitle, !enabled && styles.disabledText]}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={pushNotificationSettings[settingKey]}
        onValueChange={() => handleToggleSetting(settingKey)}
        trackColor={{ false: Colors.border.light, true: Colors.primary.main + '50' }}
        thumbColor={pushNotificationSettings[settingKey] ? Colors.primary.main : Colors.text.light}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <BackIcon size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <TouchableOpacity
          style={styles.testButton}
          onPress={handleSendTestNotification}
          disabled={!isNotificationServiceReady}
        >
          <Text style={[
            styles.testButtonText,
            !isNotificationServiceReady && styles.disabledText
          ]}>
            Test
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <BellIcon size={24} color={isNotificationServiceReady ? Colors.success : Colors.action.error} />
            <Text style={styles.statusTitle}>
              Notification Service {isNotificationServiceReady ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <Text style={styles.statusDescription}>
            {isNotificationServiceReady 
              ? 'Push notifications are enabled and ready to keep you updated.'
              : 'Push notifications are not available. Please check your device settings.'
            }
          </Text>
        </View>

        {/* Notification Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          <Text style={styles.sectionSubtitle}>
            Choose which types of notifications you'd like to receive
          </Text>

          {renderSettingItem(
            'Order Updates',
            'Get notified about your order status changes',
            BellIcon,
            'orderUpdates',
            isNotificationServiceReady
          )}

          {renderSettingItem(
            'Wallet Transactions',
            'Receive notifications for wallet top-ups and payments',
            WalletIcon,
            'walletTransactions',
            isNotificationServiceReady
          )}

          {renderSettingItem(
            'Promotional Offers',
            'Stay informed about discounts and special deals',
            GiftIcon,
            'promotionalOffers',
            isNotificationServiceReady
          )}

          {renderSettingItem(
            'System Notifications',
            'Important app updates and maintenance notices',
            SettingsIcon,
            'systemNotifications',
            isNotificationServiceReady
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleSendTestNotification}
            disabled={!isNotificationServiceReady}
          >
            <Ionicons name="notifications" size={20} color={Colors.primary.main} />
            <Text style={styles.actionButtonText}>Send Test Notification</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShowPushToken}
            disabled={!isNotificationServiceReady}
          >
            <Ionicons name="key" size={20} color={Colors.primary.main} />
            <Text style={styles.actionButtonText}>View Push Token</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleTestOrderNotification}
            disabled={!isNotificationServiceReady}
          >
            <Ionicons name="restaurant" size={20} color={Colors.primary.main} />
            <Text style={styles.actionButtonText}>Test Order Notification</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleTestWalletNotification}
            disabled={!isNotificationServiceReady}
          >
            <Ionicons name="wallet" size={20} color={Colors.primary.main} />
            <Text style={styles.actionButtonText}>Test Wallet Notification</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.testRunnerButton]}
            onPress={handleRunAllTests}
          >
            <Ionicons name="flask" size={20} color={Colors.action.success} />
            <Text style={[styles.actionButtonText, styles.testRunnerText]}>Run All Tests</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Information Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={Colors.action.info} />
            <Text style={styles.infoTitle}>About Notifications</Text>
            <Text style={styles.infoText}>
              Push notifications help you stay updated with your orders and account activities. 
              You can disable specific types of notifications anytime while keeping others enabled.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
            <Text style={styles.infoTitle}>Privacy & Security</Text>
            <Text style={styles.infoText}>
              Your notification preferences are stored locally on your device. 
              We only send notifications that you've explicitly enabled.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  testButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.main,
  },
  disabledText: {
    color: Colors.text.light,
  },
  content: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: Colors.background.card,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.main,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 12,
  },
  statusDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  section: {
    backgroundColor: Colors.background.card,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    lineHeight: 18,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    marginLeft: 12,
  },
  testRunnerButton: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.action.success,
  },
  testRunnerText: {
    color: Colors.action.success,
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: Colors.background.card,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});

export default NotificationSettingsScreen;
