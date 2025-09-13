import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../../../shared/theme/colors';
import { walletAPI } from '../../../shared/services/api';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import ErrorMessage from '../../../shared/components/ErrorMessage';

interface Transaction {
  id: number;
  amount: string | number; // API returns as string (Decimal from database)
  type: string;
  status: string;
  description: string;
  createdAt: string;
  processedAt?: string;
  admin?: { name: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const TransactionHistoryScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (page: number = 1, isRefresh: boolean = false) => {
    try {
      if (page === 1) setError(null);
      
      const response = await walletAPI.getTransactionHistory(page);
      
      if (response.success) {
        const { transactions: newTransactions, pagination: newPagination } = response.data;
        
        if (isRefresh || page === 1) {
          setTransactions(newTransactions);
        } else {
          setTransactions(prev => [...prev, ...newTransactions]);
        }
        
        setPagination(newPagination);
      } else {
        setError(response.message || 'Failed to fetch transactions');
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions(1, true);
  };

  const loadMoreTransactions = () => {
    if (!loadingMore && pagination && pagination.page < pagination.pages) {
      setLoadingMore(true);
      fetchTransactions(pagination.page + 1);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'CUSTOMER_TOPUP':
        return { name: 'add-circle', color: Colors.success };
      case 'CUSTOMER_ORDER_PAYMENT':
        return { name: 'restaurant', color: Colors.action.warning };
      case 'CUSTOMER_REFUND':
        return { name: 'return-down-back', color: Colors.action.success };
      default:
        return { name: 'wallet', color: Colors.primary.main };
    }
  };

  const getTransactionTitle = (type: string, description: string) => {
    switch (type) {
      case 'CUSTOMER_TOPUP':
        return 'Wallet Top-up';
      case 'CUSTOMER_ORDER_PAYMENT':
        return 'Order Payment';
      case 'CUSTOMER_REFUND':
        return 'Refund Received';
      default:
        return description || 'Transaction';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return Colors.action.success;
      case 'PENDING':
        return Colors.action.warning;
      case 'REJECTED':
        return Colors.action.error;
      default:
        return Colors.text.secondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const icon = getTransactionIcon(item.type);
    const amount = parseFloat(item.amount.toString());
    const isCredit = amount > 0;

    return (
      <TouchableOpacity style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <View style={[styles.transactionIcon, { backgroundColor: `${icon.color}15` }]}>
            <Ionicons name={icon.name as any} size={20} color={icon.color} />
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionTitle}>
              {getTransactionTitle(item.type, item.description)}
            </Text>
            <Text style={styles.transactionDate}>
              {formatDate(item.createdAt)}
            </Text>
            {item.status === 'PENDING' && (
              <Text style={styles.pendingText}>Pending approval</Text>
            )}
          </View>
        </View>
        
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            { color: isCredit ? Colors.action.success : Colors.action.error }
          ]}>
            {isCredit ? '+' : ''}₹{Math.abs(amount).toFixed(2)}
          </Text>
          <Text style={[styles.transactionStatus, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={Colors.primary.main} />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={48} color={Colors.text.secondary} />
      <Text style={styles.emptyTitle}>No Transactions Yet</Text>
      <Text style={styles.emptySubtitle}>
        Your wallet transaction history will appear here
      </Text>
    </View>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error && transactions.length === 0) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={() => fetchTransactions()}
        style={styles.container}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTransaction}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreTransactions}
        onEndReachedThreshold={0.3}
        contentContainerStyle={transactions.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  transactionItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  pendingText: {
    fontSize: 11,
    color: Colors.action.warning,
    fontStyle: 'italic',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionStatus: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  footerLoader: {
    padding: 20,
    alignItems: 'center',
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default TransactionHistoryScreen;
