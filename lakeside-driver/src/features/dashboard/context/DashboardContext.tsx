import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { driverAPI } from '../../../shared/services/api';

// Dashboard Types
export interface DashboardStats {
  deliveries: number;
  earnings: number;
  hoursOnline: number;
  successRate: number;
}

export interface EarningsData {
  totalEarnings: number;
  deliveryFees: number;
  tips: number;
  bonuses: number;
  totalDeliveries: number;
  averageEarningPerDelivery: number;
  period: string;
}

export interface PerformanceData {
  rating: number;
  totalDeliveries: number;
  successRate: number;
  onTimeRate: number;
  avgDeliveryTime: number;
  customerFeedback: Array<{
    id: string;
    rating: number;
    comment: string;
    orderId: number;
    createdAt: string;
  }>;
}

export interface ActivityItem {
  id: string;
  type: 'delivery_completed' | 'offer_accepted' | 'offer_declined' | 'status_change';
  title: string;
  description: string;
  timestamp: string;
  data?: any;
}

export interface DashboardState {
  // Dashboard overview
  activeAssignment: any | null;
  todayStats: DashboardStats;
  recentActivity: ActivityItem[];
  
  // Earnings data
  todayEarnings: EarningsData | null;
  weekEarnings: EarningsData | null;
  monthEarnings: EarningsData | null;
  
  // Performance data
  performance: PerformanceData | null;
  
  // Loading and error states
  isLoading: boolean;
  isEarningsLoading: boolean;
  isPerformanceLoading: boolean;
  error: string | null;
  earningsError: string | null;
  performanceError: string | null;
  
  // Last updated timestamps
  lastUpdated: Date | null;
  earningsLastUpdated: Date | null;
  performanceLastUpdated: Date | null;
}

type DashboardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_EARNINGS_LOADING'; payload: boolean }
  | { type: 'SET_PERFORMANCE_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EARNINGS_ERROR'; payload: string | null }
  | { type: 'SET_PERFORMANCE_ERROR'; payload: string | null }
  | { type: 'SET_DASHBOARD_DATA'; payload: { activeAssignment: any | null; todayStats: DashboardStats; recentActivity: ActivityItem[] } }
  | { type: 'SET_EARNINGS_DATA'; payload: { period: 'today' | 'week' | 'month'; data: EarningsData } }
  | { type: 'SET_PERFORMANCE_DATA'; payload: PerformanceData }
  | { type: 'UPDATE_ACTIVITY'; payload: ActivityItem }
  | { type: 'CLEAR_DATA' };

interface DashboardContextType extends DashboardState {
  // Data fetching
  fetchDashboardData: () => Promise<void>;
  fetchEarnings: (period: 'today' | 'week' | 'month') => Promise<void>;
  fetchPerformance: () => Promise<void>;
  fetchAllData: () => Promise<void>;
  
  // Activity updates
  addActivity: (activity: ActivityItem) => void;
  
  // Utility
  refreshDashboard: () => Promise<void>;
  clearError: () => void;
  clearEarningsError: () => void;
  clearPerformanceError: () => void;
}

// Initial State
const initialState: DashboardState = {
  activeAssignment: null,
  todayStats: {
    deliveries: 0,
    earnings: 0,
    hoursOnline: 0,
    successRate: 0,
  },
  recentActivity: [],
  todayEarnings: null,
  weekEarnings: null,
  monthEarnings: null,
  performance: null,
  isLoading: false,
  isEarningsLoading: false,
  isPerformanceLoading: false,
  error: null,
  earningsError: null,
  performanceError: null,
  lastUpdated: null,
  earningsLastUpdated: null,
  performanceLastUpdated: null,
};

// Reducer
function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'SET_EARNINGS_LOADING':
      return { ...state, isEarningsLoading: action.payload };
      
    case 'SET_PERFORMANCE_LOADING':
      return { ...state, isPerformanceLoading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
      
    case 'SET_EARNINGS_ERROR':
      return { ...state, earningsError: action.payload, isEarningsLoading: false };
      
    case 'SET_PERFORMANCE_ERROR':
      return { ...state, performanceError: action.payload, isPerformanceLoading: false };
      
    case 'SET_DASHBOARD_DATA':
      return {
        ...state,
        activeAssignment: action.payload.activeAssignment,
        todayStats: action.payload.todayStats,
        recentActivity: action.payload.recentActivity,
        lastUpdated: new Date(),
        isLoading: false,
        error: null,
      };
      
    case 'SET_EARNINGS_DATA':
      const earningsUpdate: any = {
        ...state,
        isEarningsLoading: false,
        earningsError: null,
        earningsLastUpdated: new Date(),
      };
      
      if (action.payload.period === 'today') {
        earningsUpdate.todayEarnings = action.payload.data;
      } else if (action.payload.period === 'week') {
        earningsUpdate.weekEarnings = action.payload.data;
      } else if (action.payload.period === 'month') {
        earningsUpdate.monthEarnings = action.payload.data;
      }
      
      return earningsUpdate;
      
    case 'SET_PERFORMANCE_DATA':
      return {
        ...state,
        performance: action.payload,
        performanceLastUpdated: new Date(),
        isPerformanceLoading: false,
        performanceError: null,
      };
      
    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        recentActivity: [action.payload, ...state.recentActivity.slice(0, 9)], // Keep only 10 most recent
      };
      
    case 'CLEAR_DATA':
      return initialState;
      
    default:
      return state;
  }
}

// Context
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Provider Component
interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Fetch Dashboard Data
  const fetchDashboardData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await driverAPI.getDriverDashboard();
      
      if (response.success) {
        dispatch({ 
          type: 'SET_DASHBOARD_DATA', 
          payload: {
            activeAssignment: response.data.activeAssignment,
            todayStats: response.data.todayStats,
            recentActivity: response.data.recentActivity || [],
          }
        });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch dashboard data' });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Network error' });
    }
  };

  // Fetch Earnings Data
  const fetchEarnings = async (period: 'today' | 'week' | 'month') => {
    try {
      dispatch({ type: 'SET_EARNINGS_LOADING', payload: true });
      const response = await driverAPI.getDriverEarnings(period);
      
      if (response.success) {
        dispatch({ 
          type: 'SET_EARNINGS_DATA', 
          payload: { period, data: response.data }
        });
      } else {
        dispatch({ type: 'SET_EARNINGS_ERROR', payload: 'Failed to fetch earnings data' });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_EARNINGS_ERROR', payload: error.message || 'Network error' });
    }
  };

  // Fetch Performance Data
  const fetchPerformance = async () => {
    try {
      dispatch({ type: 'SET_PERFORMANCE_LOADING', payload: true });
      const response = await driverAPI.getDriverPerformance();
      
      if (response.success) {
        dispatch({ type: 'SET_PERFORMANCE_DATA', payload: response.data });
      } else {
        dispatch({ type: 'SET_PERFORMANCE_ERROR', payload: 'Failed to fetch performance data' });
      }
    } catch (error: any) {
      dispatch({ type: 'SET_PERFORMANCE_ERROR', payload: error.message || 'Network error' });
    }
  };

  // Fetch All Data
  const fetchAllData = async () => {
    await Promise.all([
      fetchDashboardData(),
      fetchEarnings('today'),
      fetchEarnings('week'),
      fetchEarnings('month'),
      fetchPerformance(),
    ]);
  };

  // Add Activity
  const addActivity = (activity: ActivityItem) => {
    dispatch({ type: 'UPDATE_ACTIVITY', payload: activity });
  };

  // Refresh Dashboard
  const refreshDashboard = async () => {
    await fetchDashboardData();
  };

  // Clear Errors
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const clearEarningsError = () => {
    dispatch({ type: 'SET_EARNINGS_ERROR', payload: null });
  };

  const clearPerformanceError = () => {
    dispatch({ type: 'SET_PERFORMANCE_ERROR', payload: null });
  };

  // Auto-refresh dashboard data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.isLoading) {
        fetchDashboardData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [state.isLoading]);

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, []);

  const contextValue: DashboardContextType = {
    ...state,
    fetchDashboardData,
    fetchEarnings,
    fetchPerformance,
    fetchAllData,
    addActivity,
    refreshDashboard,
    clearError,
    clearEarningsError,
    clearPerformanceError,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

// Hook
export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};