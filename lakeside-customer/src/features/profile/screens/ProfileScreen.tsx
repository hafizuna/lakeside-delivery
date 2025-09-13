import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Alert,
  Switch,
} from 'react-native';
import { 
  ProfileIcon,
  PhoneIcon,
  MapIcon,
  BellIcon,
  CreditCardIcon,
  HelpIcon,
  SettingsIcon,
  LogoutIcon,
  BackIcon,
  StarIcon,
  GiftIcon,
  ShieldIcon,
  EditIcon,
  OrdersIcon
} from '../../../shared/components/CustomIcons';
import { SharedHeader } from '../../../shared/components/SharedHeader';
import { Colors } from '../../../shared/theme/colors';
import { authAPI, User as UserType } from '../../../shared/services/api';
import { useCart } from '../../cart/context/CartContext';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { state } = useCart();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      if (response.success) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authAPI.logout();
              // Navigate to auth screen - this would be handled by your auth context
              Alert.alert('Success', 'You have been logged out successfully.');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      id: 'addresses',
      title: 'Delivery Addresses',
      subtitle: 'Manage your saved addresses',
      icon: MapIcon,
      onPress: () => Alert.alert('Coming Soon', 'Address management feature coming soon!'),
    },
    {
      id: 'payment',
      title: 'Payment Methods',
      subtitle: 'Cards, wallets & more',
      icon: CreditCardIcon,
      onPress: () => {
        navigation.navigate('PaymentMethodsScreen');
      },
    },
    {
      id: 'loyalty',
      title: 'Loyalty Points',
      subtitle: 'View your rewards',
      icon: GiftIcon,
      onPress: () => Alert.alert('Coming Soon', 'Loyalty program feature coming soon!'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help with your orders',
      icon: HelpIcon,
      onPress: () => Alert.alert('Coming Soon', 'Help center feature coming soon!'),
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'App preferences',
      icon: SettingsIcon,
      onPress: () => Alert.alert('Coming Soon', 'Settings feature coming soon!'),
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      subtitle: 'Manage your data',
      icon: ShieldIcon,
      onPress: () => Alert.alert('Coming Soon', 'Privacy settings feature coming soon!'),
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCartPress = () => {
    navigation.navigate('Home'); // Navigate back to home to access cart
  };

  const handleMenuPress = () => {
    // Handle menu press - could open drawer or show menu
    console.log('Menu pressed');
  };

  const handleNotificationPress = () => {
    // Handle notification press
    console.log('Notifications pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Shared Header */}
      <SharedHeader 
        cartItemCount={state.totalItems}
        onCartPress={handleCartPress}
        onNotificationPress={handleNotificationPress}
        onMenuPress={handleMenuPress}
      />
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <ProfileIcon size={40} color={Colors.text.white} />
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || 'M Rabbi Rezwan'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'rabbikafkawala7@gmail.com'}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <BellIcon size={24} color={Colors.primary.main} />
            </View>
            <Text style={styles.actionLabel}>Notification</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <GiftIcon size={24} color={Colors.primary.main} />
            </View>
            <Text style={styles.actionLabel}>Voucher</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <OrdersIcon size={24} color={Colors.primary.main} />
            </View>
            <Text style={styles.actionLabel}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Menu Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <ProfileIcon size={20} color={Colors.text.primary} />
              <Text style={styles.menuText}>My Profile</Text>
            </View>
            <BackIcon size={16} color={Colors.text.secondary} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'Address management feature coming soon!')}>
            <View style={styles.menuLeft}>
              <MapIcon size={20} color={Colors.text.primary} />
              <Text style={styles.menuText}>Address Management</Text>
            </View>
            <BackIcon size={16} color={Colors.text.secondary} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PaymentMethodsScreen')}>
            <View style={styles.menuLeft}>
              <CreditCardIcon size={20} color={Colors.text.primary} />
              <Text style={styles.menuText}>Payment Methods</Text>
            </View>
            <BackIcon size={16} color={Colors.text.secondary} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'Help center feature coming soon!')}>
            <View style={styles.menuLeft}>
              <HelpIcon size={20} color={Colors.text.primary} />
              <Text style={styles.menuText}>Help & Support</Text>
            </View>
            <BackIcon size={16} color={Colors.text.secondary} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'Settings feature coming soon!')}>
            <View style={styles.menuLeft}>
              <SettingsIcon size={20} color={Colors.text.primary} />
              <Text style={styles.menuText}>Setting</Text>
            </View>
            <BackIcon size={16} color={Colors.text.secondary} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.lastMenuItem]} onPress={handleLogout}>
            <View style={styles.menuLeft}>
              <LogoutIcon size={20} color={Colors.action.error} />
              <Text style={[styles.menuText, { color: Colors.action.error }]}>Log out</Text>
            </View>
            <BackIcon size={16} color={Colors.text.secondary} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        </View>

        {/* Bottom Spacer to prevent overlap with bottom navigation */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Add space for bottom navigation
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  
  // Profile Header
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: Colors.background.primary,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingVertical: 20,
    marginBottom: 20,
    backgroundColor: Colors.background.primary,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  voucherContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherIcon: {
    transform: [{ rotate: '0deg' }],
  },
  historyContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  
  // Profile Section
  profileSection: {
    backgroundColor: Colors.background.primary,
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: Colors.text.primary,
    marginLeft: 12,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 20,
  },
});

export default ProfileScreen;
