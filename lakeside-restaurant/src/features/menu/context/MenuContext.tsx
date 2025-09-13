import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../../../shared/services/api';
import { useAuth } from '../../auth/context/AuthContext';

interface MenuItem {
  id: number;
  restaurantId: number;
  itemName: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  category: string;
}

interface MenuContextType {
  menuItems: MenuItem[];
  categories: string[];
  loading: boolean;
  refreshing: boolean;
  loadMenuItems: () => Promise<void>;
  refreshMenuItems: () => Promise<void>;
  addMenuItem: (menuItem: Omit<MenuItem, 'id' | 'restaurantId'>) => Promise<boolean>;
  updateMenuItem: (id: number, menuItem: Partial<MenuItem>) => Promise<boolean>;
  deleteMenuItem: (id: number) => Promise<boolean>;
  toggleAvailability: (id: number) => Promise<boolean>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

interface MenuProviderProps {
  children: ReactNode;
}

export const MenuProvider: React.FC<MenuProviderProps> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadMenuItems();
    }
  }, [isAuthenticated]);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMenuItems();
      
      if (response.success && response.data) {
        setMenuItems(response.data);
        updateCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshMenuItems = async () => {
    try {
      setRefreshing(true);
      const response = await apiService.getMenuItems();
      
      if (response.success && response.data) {
        setMenuItems(response.data);
        updateCategories(response.data);
      }
    } catch (error) {
      console.error('Error refreshing menu items:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const updateCategories = (items: MenuItem[]) => {
    const uniqueCategories = ['All', ...new Set(items.map(item => item.category))];
    setCategories(uniqueCategories);
  };

  const addMenuItem = async (menuItem: Omit<MenuItem, 'id' | 'restaurantId'>): Promise<boolean> => {
    try {
      const response = await apiService.createMenuItem(menuItem);
      
      if (response.success && response.data) {
        const newItem = response.data;
        setMenuItems(prev => [...prev, newItem]);
        updateCategories([...menuItems, newItem]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding menu item:', error);
      return false;
    }
  };

  const updateMenuItem = async (id: number, menuItem: Partial<MenuItem>): Promise<boolean> => {
    try {
      const response = await apiService.updateMenuItem(id, menuItem);
      
      if (response.success && response.data) {
        const updatedItem = response.data;
        setMenuItems(prev => 
          prev.map(item => item.id === id ? updatedItem : item)
        );
        updateCategories(menuItems.map(item => item.id === id ? updatedItem : item));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating menu item:', error);
      return false;
    }
  };

  const deleteMenuItem = async (id: number): Promise<boolean> => {
    try {
      const response = await apiService.deleteMenuItem(id);
      
      if (response.success) {
        const updatedItems = menuItems.filter(item => item.id !== id);
        setMenuItems(updatedItems);
        updateCategories(updatedItems);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return false;
    }
  };

  const toggleAvailability = async (id: number): Promise<boolean> => {
    try {
      const item = menuItems.find(item => item.id === id);
      if (!item) return false;

      const response = await apiService.toggleMenuItemAvailability(id, !item.isAvailable);
      
      if (response.success) {
        setMenuItems(prev => 
          prev.map(item => 
            item.id === id 
              ? { ...item, isAvailable: !item.isAvailable }
              : item
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error toggling availability:', error);
      return false;
    }
  };

  const value: MenuContextType = {
    menuItems,
    categories,
    loading,
    refreshing,
    loadMenuItems,
    refreshMenuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleAvailability,
  };

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = (): MenuContextType => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};
