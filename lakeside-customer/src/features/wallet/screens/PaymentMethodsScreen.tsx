import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Colors } from '../../../shared/theme/colors';
import { 
  BackIcon, 
  WalletIcon, 
  CreditCardIcon,
} from '../../../shared/components/CustomIcons';

interface PaymentMethodsScreenProps {
  navigation: any;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  onPress: () => void;
}

const PaymentMethodsScreen: React.FC<PaymentMethodsScreenProps> = ({ navigation }) => {
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'digital-wallet',
      name: 'Digital Wallet',
      description: 'Fast and secure payment',
      icon: WalletIcon,
      onPress: () => navigation.navigate('WalletScreen'),
    },
    {
      id: 'telebirr',
      name: 'TeleBirr',
      description: 'Mobile payment solution',
      icon: CreditCardIcon,
      onPress: () => console.log('TeleBirr selected'),
    },
    {
      id: 'cbe-mobile',
      name: 'CBE Mobile Banking',
      description: 'Commercial Bank of Ethiopia',
      icon: CreditCardIcon,
      onPress: () => console.log('CBE Mobile Banking selected'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <BackIcon size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Payment Methods List */}
        <View style={styles.paymentMethodsSection}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={styles.paymentMethodItem}
              onPress={method.onPress}
              activeOpacity={0.8}
            >
              <View style={styles.methodLeft}>
                <View style={styles.methodIconContainer}>
                  <method.icon size={24} color={Colors.primary.main} />
                </View>
                <View style={styles.methodInfo}>
                  <Text style={styles.methodName}>{method.name}</Text>
                  <Text style={styles.methodDescription}>{method.description}</Text>
                </View>
              </View>
              <BackIcon size={16} color={Colors.text.secondary} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: Colors.background.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: 0.5,
  },
  headerPlaceholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Payment Methods Section
  paymentMethodsSection: {
    marginTop: 24,
    marginHorizontal: 20,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
  },

  // Modern Section Styles
  modernSection: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: Colors.background.primary,
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  sectionHeaderModern: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleModern: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginLeft: 12,
    flex: 1,
    letterSpacing: 0.3,
  },
  modernAddButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.main + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modern Wallet Card Design
  modernWalletCard: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  walletCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  walletBrandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletBrandText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.background.primary,
    marginLeft: 8,
    letterSpacing: 1,
  },
  walletStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.background.primary + '20',
    borderRadius: 12,
  },
  walletStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.background.primary,
  },
  walletBalanceContainer: {
    marginBottom: 16,
  },
  walletBalanceLabel: {
    fontSize: 12,
    color: Colors.background.primary + 'CC',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modernWalletBalance: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.background.primary,
    letterSpacing: 1,
  },
  walletCardFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.background.primary + '30',
    paddingTop: 12,
  },
  walletCardNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.background.primary + 'DD',
    letterSpacing: 2,
  },

  // Modern Quick Actions
  modernQuickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  modernQuickActionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  modernQuickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary.main + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modernQuickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    letterSpacing: 0.3,
  },

  // Modern Empty States
  modernEmptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.border.light,
  },
  modernEmptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  modernEmptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  modernAddCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    backgroundColor: Colors.primary.main,
    borderRadius: 16,
    shadowColor: Colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    gap: 8,
  },
  modernAddCardText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.white,
    letterSpacing: 0.5,
  },

  // Error Notice
  errorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.action.warning + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.action.warning + '30',
  },
  errorText: {
    fontSize: 13,
    color: Colors.action.warning,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  
  // Inactive Wallet Card
  inactiveWalletCard: {
    backgroundColor: Colors.text.secondary,
    shadowColor: Colors.text.secondary,
  },

  // Security Notice
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.action.success + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.action.success + '20',
  },
  securityText: {
    fontSize: 12,
    color: Colors.action.success,
    fontWeight: '500',
    marginLeft: 8,
    textAlign: 'center',
    flex: 1,
  },

  // Simplified Wallet Section
  walletSection: {
    marginTop: 24,
    marginHorizontal: 20,
  },
  walletCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  walletCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary.main + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  walletDetails: {
    flex: 1,
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary.main,
    marginBottom: 2,
  },
  walletStatus: {
    fontSize: 12,
    color: Colors.action.success,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  walletActions: {
    flexDirection: 'column',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary.main,
  },

  // Features Section
  featuresSection: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: Colors.background.primary,
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.main + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },

  // Legacy styles (keeping for compatibility)
  section: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  addButton: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.main,
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  walletInfo: {
    flex: 1,
  },
  walletRight: {
    padding: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 12,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  addCardButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary.main,
    borderRadius: 8,
  },
  addCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.white,
  },
});

export default PaymentMethodsScreen;
