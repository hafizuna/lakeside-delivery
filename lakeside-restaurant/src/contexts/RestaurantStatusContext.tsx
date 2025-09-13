import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../shared/services/api';

interface RestaurantStatusContextType {
  isOpen: boolean;
  status: 'OPEN' | 'CLOSED' | 'BUSY';
  updating: boolean;
  updateStatus: (newStatus: 'OPEN' | 'CLOSED' | 'BUSY') => Promise<boolean>;
  toggleRestaurantStatus: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const RestaurantStatusContext = createContext<RestaurantStatusContextType | undefined>(undefined);

interface RestaurantStatusProviderProps {
  children: ReactNode;
}

export const RestaurantStatusProvider: React.FC<RestaurantStatusProviderProps> = ({ children }) => {
  const [status, setStatus] = useState<'OPEN' | 'CLOSED' | 'BUSY'>('CLOSED');
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const refreshStatus = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        const newStatus = response.data.status || 'CLOSED';
        setStatus(newStatus);
        setIsOpen(newStatus === 'OPEN');
      }
    } catch (error) {
      console.error('Error refreshing restaurant status:', error);
    }
  };

  const updateStatus = async (newStatus: 'OPEN' | 'CLOSED' | 'BUSY'): Promise<boolean> => {
    setUpdating(true);
    try {
      const response = await apiService.updateProfile({ status: newStatus });
      if (response.success) {
        setStatus(newStatus);
        setIsOpen(newStatus === 'OPEN');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating restaurant status:', error);
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const toggleRestaurantStatus = async (): Promise<void> => {
    const newStatus = status === 'OPEN' ? 'CLOSED' : 'OPEN';
    await updateStatus(newStatus);
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const value: RestaurantStatusContextType = {
    isOpen,
    status,
    updating,
    updateStatus,
    toggleRestaurantStatus,
    refreshStatus,
  };

  return (
    <RestaurantStatusContext.Provider value={value}>
      {children}
    </RestaurantStatusContext.Provider>
  );
};

export const useRestaurantStatus = (): RestaurantStatusContextType => {
  const context = useContext(RestaurantStatusContext);
  if (context === undefined) {
    throw new Error('useRestaurantStatus must be used within a RestaurantStatusProvider');
  }
  return context;
};
