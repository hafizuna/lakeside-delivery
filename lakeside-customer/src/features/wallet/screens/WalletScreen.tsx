import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '../../../shared/theme/colors';
import { walletAPI } from '../../../shared/services/api';
import { 
  WalletIcon, 
  PlusIcon, 
  TransactionIcon, 
  SecurityIcon, 
  BackIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '../../../shared/components/CustomIcons';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import ErrorMessage from '../../../shared/components/ErrorMessage';

interface Wallet {
  balance: string | number; // API returns as string (Decimal from database)
  totalTopUps: string | number;
  totalSpent: string | number;
  isActive: boolean;
}

interface Transaction {
  id: string;
  type: 'top_up' | 'purchase' | 'refund';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  image?: string;
}

interface ApiTransaction {
  id: number;
  amount: string | number;
  type: string;
  status: string;
  description: string;
  createdAt: string;
  processedAt?: string;
  admin?: { name: string };
}

const WalletScreen: React.FC = ({ navigation }: any) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = async () => {
    try {
      setError(null);
      
      // Fetch wallet data
      const walletResponse = await walletAPI.getWallet();
      if (walletResponse.success) {
        setWallet(walletResponse.data);
      } else {
        setWallet({ balance: 998.00, totalTopUps: 1200, totalSpent: 202, isActive: true });
      }
      
      // Fetch recent transactions (first 5)
      const transactionResponse = await walletAPI.getTransactionHistory(1, 5);
      if (transactionResponse.success) {
        setTransactions(transactionResponse.data.transactions || []);
      } else {
        setTransactions([]);
      }
    } catch (err: any) {
      console.error('Error fetching wallet:', err);
      // Use mock data on error
      setWallet({ balance: 998.00, totalTopUps: 1200, totalSpent: 202, isActive: true });
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'CUSTOMER_TOPUP':
        return { component: ArrowUpIcon, color: Colors.action.success };
      case 'CUSTOMER_ORDER_PAYMENT':
        return { component: ArrowDownIcon, color: Colors.action.error };
      case 'CUSTOMER_REFUND':
        return { component: ArrowUpIcon, color: Colors.action.success };
      default:
        return { component: WalletIcon, color: Colors.primary.main };
    }
  };

  const getTransactionTitle = (type: string, description: string) => {
    switch (type) {
      case 'CUSTOMER_TOPUP':
        return 'Top Up';
      case 'CUSTOMER_ORDER_PAYMENT':
        return description || 'Order Payment';
      case 'CUSTOMER_REFUND':
        return 'Refund';
      default:
        return description || 'Transaction';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' today';
    } else if (days === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ', ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWallet();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchWallet();
  };

  const handleTopUp = () => {
    navigation.navigate('TopUpScreen');
  };

  const handleTransactionHistory = () => {
    navigation.navigate('TransactionHistoryScreen');
  };

  const handleSendMoney = () => {
    Alert.alert('Coming Soon', 'Send money feature will be available soon!');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error && !wallet) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={fetchWallet}
        style={styles.container}
      />
    );
  }

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
        <Text style={styles.headerTitle}>E-Wallet</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Gradient Wallet Balance Card */}
        <View style={styles.walletCardContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.gradientWalletCard}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
          >
            <View style={styles.walletCardHeader}>
              <Text style={styles.balanceLabel}>My Balance</Text>
              <TouchableOpacity style={styles.topUpButton} onPress={handleTopUp}>
                <Text style={styles.topUpButtonText}>Top Up</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.balanceAmount}>
              ${wallet?.balance ? parseFloat(wallet.balance.toString()).toFixed(2) : '998.00'}
            </Text>
          </LinearGradient>
        </View>

        {/* Transaction History */}
        <View style={styles.transactionSection}>
          <View style={styles.transactionHeader}>
            <Text style={styles.transactionTitle}>Transaction History</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('TransactionHistoryScreen')}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {transactions.length > 0 ? (
            transactions.slice(0, 5).map((transaction) => {
              const icon = getTransactionIcon(transaction.type);
              const IconComponent = icon.component;
              const amount = parseFloat(transaction.amount.toString());
              const isCredit = amount > 0;
              
              return (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <View style={[styles.transactionIcon, { backgroundColor: icon.color + '15' }]}>
                      <IconComponent size={16} color={icon.color} />
                    </View>
                    
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription}>
                        {getTransactionTitle(transaction.type, transaction.description)}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.createdAt)}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[
                    styles.transactionAmount,
                    isCredit ? styles.positiveAmount : styles.negativeAmount
                  ]}>
                    {isCredit ? '+' : ''}${Math.abs(amount).toFixed(2)}
                  </Text>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyTransactions}>
              <Text style={styles.emptyTransactionsText}>No recent transactions</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  // Header
  header: {
    backgroundColor: Colors.background.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Gradient Wallet Card
  walletCardContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  gradientWalletCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  walletCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  topUpButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  topUpButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 1,
  },

  // Transaction History
  transactionSection: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: Colors.background.primary,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.main,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topUpIcon: {
    backgroundColor: Colors.action.success,
  },
  purchaseIcon: {
    backgroundColor: Colors.action.error,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  positiveAmount: {
    color: Colors.action.success,
  },
  negativeAmount: {
    color: Colors.text.primary,
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTransactionsText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },

  // Quick Actions
  quickActionsSection: {
    marginTop: 24,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  // Stats Section
  statsSection: {
    marginTop: 32,
    marginHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },

  // Features Section
  featuresSection: {
    marginTop: 32,
    marginHorizontal: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
});

export default WalletScreen;
