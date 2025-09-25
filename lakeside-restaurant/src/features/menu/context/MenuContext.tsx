import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../../../shared/services/api';
import { useAuth } from '../../auth/context/AuthContext';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  sortOrder: number;
}

interface MenuItem {
  id: number;
  restaurantId: number;
  itemName: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  categoryId?: number;
  category?: Category;
}

interface MenuContextType {
  menuItems: MenuItem[];
  categories: string[];
  categoryObjects: Category[];
  loading: boolean;
  refreshing: boolean;
  loadMenuItems: () => Promise<void>;
  refreshMenuItems: () => Promise<void>;
  addMenuItem: (menuItem: Omit<MenuItem, 'id' | 'restaurantId'>) => Promise<boolean>;
  updateMenuItem: (id: number, menuItem: Partial<MenuItem>) => Promise<boolean>;
  deleteMenuItem: (id: number) => Promise<boolean>;
  toggleAvailability: (id: number) => Promise<boolean>;
  // Category management
  loadCategories: () => Promise<void>;
  createCategory: (categoryData: { name: string; icon?: string }) => Promise<boolean>;
  updateCategory: (id: number, categoryData: { name?: string; icon?: string }) => Promise<boolean>;
  deleteCategory: (id: number) => Promise<boolean>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

interface MenuProviderProps {
  children: ReactNode;
}

export const MenuProvider: React.FC<MenuProviderProps> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [categoryObjects, setCategoryObjects] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadMenuItems();
      loadCategories();
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
    // Extract unique category names for legacy string array (keeping for backward compatibility)
    const uniqueCategories = ['All', ...new Set(
      items
        .map(item => item.category?.name || 'Uncategorized')
        .filter(Boolean)
    )];
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

  // Category management methods
  const loadCategories = async (): Promise<void> => {
    try {
      // Don't set loading to true here to avoid conflicts with menu loading
      const response = await apiService.getCategories();
      
      if (response.success && response.data) {
        setCategoryObjects(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const createCategory = async (categoryData: { name: string; icon?: string }): Promise<boolean> => {
    try {
      const response = await apiService.createCategory(categoryData);
      
      if (response.success && response.data) {
        setCategoryObjects(prev => [...prev, response.data]);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating category:', error);
      return false;
    }
  };

  const updateCategory = async (id: number, categoryData: { name?: string; icon?: string }): Promise<boolean> => {
    try {
      const response = await apiService.updateCategory(id, categoryData);
      
      if (response.success && response.data) {
        setCategoryObjects(prev => 
          prev.map(cat => cat.id === id ? response.data : cat)
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating category:', error);
      return false;
    }
  };

  const deleteCategory = async (id: number): Promise<boolean> => {
    try {
      const response = await apiService.deleteCategory(id);
      
      if (response.success) {
        setCategoryObjects(prev => prev.filter(cat => cat.id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  };

  const value: MenuContextType = {
    menuItems,
    categories,
    categoryObjects,
    loading,
    refreshing,
    loadMenuItems,
    refreshMenuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleAvailability,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
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
