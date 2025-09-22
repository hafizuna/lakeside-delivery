import { useState, useEffect, useRef } from 'react';
import { walletAPI } from '../../../shared/services/api';
import { useNotifications } from '../../../shared/context/NotificationContext';

interface WalletTransaction {
  id: number;
  amount: string | number;
  type: string;
  status: string;
  description: string;
  createdAt: string;
  processedAt?: string;
  admin?: { name: string };
}

interface UseWalletTransactionsProps {
  enabled?: boolean;
  pollingInterval?: number;
}

interface UseWalletTransactionsReturn {
  transactions: WalletTransaction[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useWalletTransactions = ({
  enabled = true,
  pollingInterval = 60000 // 1 minute
}: UseWalletTransactionsProps = {}): UseWalletTransactionsReturn => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const lastCheckRef = useRef<Date | null>(null);
  const { handleWalletTransactionChange } = useNotifications();

  const fetchTransactions = async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await walletAPI.getTransactionHistory(1, 50);
      
      if (response.success && mountedRef.current) {
        const newTransactions = response.data.transactions || [];
        
        // Check for new transactions since last fetch
        if (lastCheckRef.current && transactions.length > 0) {
          const newItems = newTransactions.filter((transaction: WalletTransaction) => {
            const transactionDate = new Date(transaction.processedAt || transaction.createdAt);
            return transactionDate > lastCheckRef.current! && 
                   !transactions.some(existing => existing.id === transaction.id);
          });

          // Trigger notifications for new transactions
          for (const transaction of newItems) {
            if (transaction.status === 'APPROVED' || transaction.status === 'REJECTED') {
              await handleWalletTransactionChange(transaction);
            }
          }
        }
        
        setTransactions(newTransactions);
        lastCheckRef.current = new Date();
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError('Failed to fetch wallet transactions');
        console.error('Wallet transactions fetch error:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const refetch = async () => {
    await fetchTransactions();
  };

  useEffect(() => {
    mountedRef.current = true;
    
    if (!enabled) {
      return;
    }

    // Initial fetch
    fetchTransactions();

    return () => {
      mountedRef.current = false;
    };
  }, [enabled]);

  // Separate useEffect for polling
  useEffect(() => {
    if (!enabled || loading) {
      return;
    }

    const startPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      console.log('Starting wallet transaction polling...');
      intervalRef.current = setInterval(() => {
        console.log('Polling for wallet transaction updates...');
        fetchTransactions();
      }, pollingInterval);
    };

    // Start polling after initial fetch is complete
    const timer = setTimeout(startPolling, 2000);

    return () => {
      clearTimeout(timer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, pollingInterval, loading]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    transactions,
    loading,
    error,
    refetch
  };
};

export default useWalletTransactions;
