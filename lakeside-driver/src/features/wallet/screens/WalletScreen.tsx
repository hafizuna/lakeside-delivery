import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../shared/theme';
import { Button, TextInput } from '../../../components/ui';
import {
  WalletIcon,
  EarningsIcon,
  HistoryIcon,
  CalendarIcon,
  TrendUpIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BankIcon,
  CheckIcon,
  ClockIcon,
  BackIcon,
} from '../../../shared/components/CustomIcons';

// Based on Prisma schema DriverWallet and WalletTransaction models
interface DriverWallet {
  driverId: number;
  balance: number;
  collateralAmount: number;
  minCollateral: number;
  totalEarnings: number;
  totalWithdrawn: number;
  canWithdraw: boolean;
  isActive: boolean;
  lastEarningAt?: string;
}

interface WalletTransaction {
  id: number;
  driverId: number;
  amount: number;
  type: 'DRIVER_COLLATERAL_DEPOSIT' | 'DRIVER_EARNING' | 'DRIVER_WITHDRAWAL' | 'DRIVER_PENALTY';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  description?: string;
  createdAt: string;
  processedAt?: string;
}

interface EarningsStats {
  today: number;
  week: number;
  month: number;
  totalDeliveries: number;
  averagePerDelivery: number;
}

export const WalletScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  
  // Mock wallet data based on Prisma schema
  const [walletData, setWalletData] = useState<DriverWallet>({
    driverId: 1,
    balance: 2450.75,
    collateralAmount: 1000.00,
    minCollateral: 1000.00,
    totalEarnings: 15750.50,
    totalWithdrawn: 13299.75,
    canWithdraw: true,
    isActive: true,
    lastEarningAt: '2024-01-20T10:30:00Z',
  });

  const [earningsStats, setEarningsStats] = useState<EarningsStats>({
    today: 485.50,
    week: 2150.25,
    month: 8340.75,
    totalDeliveries: 247,
    averagePerDelivery: 63.77,
  });

  const [transactions, setTransactions] = useState<WalletTransaction[]>([
    {
      id: 1,
      driverId: 1,
      amount: 85.50,
      type: 'DRIVER_EARNING',
      status: 'APPROVED',
      description: 'Delivery #ORD001 - Pizza Palace to DLF Phase 2',
      createdAt: '2024-01-20T10:30:00Z',
      processedAt: '2024-01-20T10:30:00Z',
    },
    {
      id: 2,
      driverId: 1,
      amount: 2000.00,
      type: 'DRIVER_WITHDRAWAL',
      status: 'APPROVED',
      description: 'Withdrawal to Bank Account',
      createdAt: '2024-01-19T15:45:00Z',
      processedAt: '2024-01-19T16:00:00Z',
    },
    {
      id: 3,
      driverId: 1,
      amount: 72.25,
      type: 'DRIVER_EARNING',
      status: 'APPROVED',
      description: 'Delivery #ORD002 - Burger King to Cyber City',
      createdAt: '2024-01-19T14:20:00Z',
      processedAt: '2024-01-19T14:20:00Z',
    },
    {
      id: 4,
      driverId: 1,
      amount: 500.00,
      type: 'DRIVER_WITHDRAWAL',
      status: 'PENDING',
      description: 'Withdrawal Request',
      createdAt: '2024-01-20T09:00:00Z',
    },
  ]);

  const [withdrawalModal, setWithdrawalModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    if (amount > walletData.balance) {
      Alert.alert('Error', 'Insufficient balance for withdrawal');
      return;
    }
    
    // TODO: Process withdrawal request to backend
    const newTransaction: WalletTransaction = {
      id: transactions.length + 1,
      driverId: walletData.driverId,
      amount: amount,
      type: 'DRIVER_WITHDRAWAL',
      status: 'PENDING',
      description: 'Withdrawal Request',
      createdAt: new Date().toISOString(),
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    setWalletData(prev => ({ ...prev, balance: prev.balance - amount }));
    setWithdrawalModal(false);
    setWithdrawAmount('');
    
    Alert.alert('Success', 'Withdrawal request submitted successfully');
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: WalletTransaction['type']) => {
    switch (type) {
      case 'DRIVER_EARNING':
        return <ArrowUpIcon size={20} color={theme.colors.driver.online} />;
      case 'DRIVER_WITHDRAWAL':
        return <ArrowDownIcon size={20} color={theme.colors.action.error} />;
      case 'DRIVER_COLLATERAL_DEPOSIT':
        return <BankIcon size={20} color={theme.colors.primary.main} />;
      case 'DRIVER_PENALTY':
        return <ArrowDownIcon size={20} color={theme.colors.action.error} />;
      default:
        return <WalletIcon size={20} color={theme.colors.text.secondary} />;
    }
  };

  const getStatusIcon = (status: WalletTransaction['status']) => {
    switch (status) {
      case 'APPROVED':
        return <CheckIcon size={16} color={theme.colors.driver.online} />;
      case 'PENDING':
        return <ClockIcon size={16} color={theme.colors.action.warning} />;
      case 'REJECTED':
        return <ArrowDownIcon size={16} color={theme.colors.action.error} />;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <BackIcon size={24} color={theme.colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Driver Wallet</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderWalletOverview = () => (
    <View style={styles.walletOverview}>
      <View style={styles.balanceCard}>
        <WalletIcon size={32} color={theme.colors.text.white} />
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>
          ₹{walletData.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Text>
        
        <View style={styles.balanceActions}>
          <Button
            title="Withdraw"
            onPress={() => setWithdrawalModal(true)}
            variant="outline"
            disabled={!walletData.canWithdraw}
            style={styles.withdrawButton}
          />
        </View>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            ₹{walletData.totalEarnings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.statLabel}>Total Earnings</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            ₹{walletData.totalWithdrawn.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.statLabel}>Total Withdrawn</Text>
        </View>
      </View>
    </View>
  );

  const renderEarningsCards = () => (
    <View style={styles.earningsSection}>
      <Text style={styles.sectionTitle}>Earnings Overview</Text>
      
      <View style={styles.periodSelector}>
        {(['today', 'week', 'month'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.selectedPeriodButton
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.selectedPeriodButtonText
            ]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.earningsCards}>
        <View style={styles.earningsCard}>
          <EarningsIcon size={24} color={theme.colors.driver.earnings} />
          <Text style={styles.earningsValue}>
            ₹{earningsStats[selectedPeriod].toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.earningsLabel}>Earnings</Text>
        </View>
        
        <View style={styles.earningsCard}>
          <CalendarIcon size={24} color={theme.colors.primary.main} />
          <Text style={styles.earningsValue}>{earningsStats.totalDeliveries}</Text>
          <Text style={styles.earningsLabel}>Deliveries</Text>
        </View>
        
        <View style={styles.earningsCard}>
          <TrendUpIcon size={24} color={theme.colors.action.success} />
          <Text style={styles.earningsValue}>
            ₹{earningsStats.averagePerDelivery.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.earningsLabel}>Avg/Order</Text>
        </View>
      </View>
    </View>
  );

  const renderTransactionItem = ({ item }: { item: WalletTransaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        {getTransactionIcon(item.type)}
      </View>
      
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionType}>
          {item.type === 'DRIVER_EARNING' ? 'Delivery Earning' :
           item.type === 'DRIVER_WITHDRAWAL' ? 'Withdrawal' :
           item.type === 'DRIVER_COLLATERAL_DEPOSIT' ? 'Collateral Deposit' :
           'Penalty'}
        </Text>
        <Text style={styles.transactionDescription} numberOfLines={2}>
          {item.description || 'No description'}
        </Text>
        <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
      </View>
      
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { 
            color: item.type === 'DRIVER_EARNING' || item.type === 'DRIVER_COLLATERAL_DEPOSIT' 
              ? theme.colors.driver.online 
              : theme.colors.action.error 
          }
        ]}>
          {item.type === 'DRIVER_EARNING' || item.type === 'DRIVER_COLLATERAL_DEPOSIT' ? '+' : '-'}
          ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Text>
        
        <View style={styles.statusContainer}>
          {getStatusIcon(item.status)}
          <Text style={[
            styles.statusText,
            { 
              color: item.status === 'APPROVED' ? theme.colors.driver.online :
                     item.status === 'PENDING' ? theme.colors.action.warning :
                     theme.colors.action.error
            }
          ]}>
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderTransactionHistory = () => (
    <View style={styles.historySection}>
      <View style={styles.historyHeader}>
        <HistoryIcon size={24} color={theme.colors.primary.main} />
        <Text style={styles.sectionTitle}>Transaction History</Text>
      </View>
      
      <View style={styles.transactionsContainer}>
        {transactions.slice(0, 5).map((item, index) => (
          <View key={item.id}>
            {renderTransactionItem({ item })}
            {index < Math.min(transactions.length - 1, 4) && <View style={styles.transactionSeparator} />}
          </View>
        ))}
        
        {transactions.length > 5 && (
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All Transactions</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderWithdrawalModal = () => (
    <Modal
      visible={withdrawalModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setWithdrawalModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Withdraw Funds</Text>
          
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceInfoLabel}>Available Balance</Text>
            <Text style={styles.balanceInfoValue}>
              ₹{walletData.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          
          <TextInput
            label="Withdrawal Amount"
            value={withdrawAmount}
            onChangeText={setWithdrawAmount}
            placeholder="Enter amount"
            keyboardType="numeric"
            style={styles.withdrawInput}
          />
          
          <View style={styles.quickAmounts}>
            {[500, 1000, 2000].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.quickAmountButton}
                onPress={() => setWithdrawAmount(amount.toString())}
              >
                <Text style={styles.quickAmountText}>₹{amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={() => setWithdrawalModal(false)}
              variant="outline"
              style={styles.modalCancelButton}
            />
            
            <Button
              title="Request Withdrawal"
              onPress={handleWithdraw}
              variant="primary"
              style={styles.modalSubmitButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderWalletOverview()}
        {renderEarningsCards()}
        {renderTransactionHistory()}
        
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {renderWithdrawalModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    ...theme.layout.shadow.sm,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  
  scrollView: {
    flex: 1,
  },
  
  // Wallet Overview Styles
  walletOverview: {
    padding: theme.spacing.lg,
  },
  balanceCard: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.layout.shadow.sm,
  },
  balanceLabel: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.primary.light,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  balanceAmount: {
    fontSize: theme.typography.sizes.xxxl,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.white,
    marginBottom: theme.spacing.lg,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  withdrawButton: {
    borderColor: theme.colors.text.white,
    paddingHorizontal: theme.spacing.xl,
  },
  
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.layout.shadow.sm,
  },
  statValue: {
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  // Earnings Section Styles
  earningsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  periodButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.layout.borderRadius.md,
  },
  selectedPeriodButton: {
    backgroundColor: theme.colors.primary.main,
  },
  periodButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
  selectedPeriodButtonText: {
    color: theme.colors.text.white,
  },
  
  earningsCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  earningsCard: {
    flex: 1,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.layout.shadow.sm,
  },
  earningsValue: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  earningsLabel: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  // Transaction History Styles
  historySection: {
    flex: 1,
    backgroundColor: theme.colors.background.card,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.layout.borderRadius.lg,
    ...theme.layout.shadow.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  
  transactionsList: {
    maxHeight: 400,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  transactionSeparator: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginHorizontal: theme.spacing.lg,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  transactionDescription: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.regular,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  transactionDate: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.weights.regular,
    color: theme.colors.text.secondary,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.bold,
    marginBottom: theme.spacing.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.weights.medium,
    marginLeft: theme.spacing.xs,
  },
  
  // Withdrawal Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  balanceInfo: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.layout.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceInfoLabel: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
  balanceInfoValue: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.primary.main,
  },
  withdrawInput: {
    marginBottom: theme.spacing.lg,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: theme.colors.primary.light,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.layout.borderRadius.md,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.primary.main,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalSubmitButton: {
    flex: 1,
  },
  
  // Additional styles for transaction container
  transactionsContainer: {
    // No additional styles needed, just a container
  },
  viewAllButton: {
    alignItems: 'center',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  viewAllText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.primary.main,
  },
});
