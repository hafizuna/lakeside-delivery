import { MenuItem, CategoryObject } from '../services/api';

/**
 * Utility functions to handle backward compatibility between old and new category formats
 */

/**
 * Extract category name from menu item (supports both old and new formats)
 */
export const getCategoryName = (item: MenuItem): string => {
  // Try new format first
  if (item.categoryObject?.name) {
    return item.categoryObject.name;
  }
  
  // Fall back to legacy format
  if (item.category) {
    return item.category;
  }
  
  // Default fallback
  return 'Uncategorized';
};

/**
 * Extract category object from menu item (creates one if using legacy format)
 */
export const getCategoryObject = (item: MenuItem): CategoryObject | null => {
  // Return new format if available
  if (item.categoryObject) {
    return item.categoryObject;
  }
  
  // Create a minimal category object from legacy format
  if (item.category) {
    return {
      id: item.categoryId || 0,
      name: item.category,
      slug: item.category.toLowerCase().replace(/\s+/g, '-'),
      icon: undefined,
      sortOrder: 999
    };
  }
  
  return null;
};

/**
 * Extract category display text with icon if available
 */
export const getCategoryDisplayText = (item: MenuItem): string => {
  const categoryObj = getCategoryObject(item);
  const categoryName = getCategoryName(item);
  
  if (categoryObj?.icon) {
    return `${categoryObj.icon} ${categoryName}`;
  }
  
  return categoryName;
};

/**
 * Group menu items by category (supports both formats)
 */
export const groupItemsByCategory = (items: MenuItem[]): Record<string, MenuItem[]> => {
  return items.reduce((groups, item) => {
    const categoryName = getCategoryName(item);
    
    if (!groups[categoryName]) {
      groups[categoryName] = [];
    }
    
    groups[categoryName].push(item);
    return groups;
  }, {} as Record<string, MenuItem[]>);
};

/**
 * Get sorted list of unique categories from menu items
 */
export const getUniqueCategories = (items: MenuItem[]): CategoryObject[] => {
  const categoryMap = new Map<string, CategoryObject>();
  
  items.forEach(item => {
    const categoryObj = getCategoryObject(item);
    const categoryName = getCategoryName(item);
    
    if (!categoryMap.has(categoryName)) {
      categoryMap.set(categoryName, categoryObj || {
        id: 0,
        name: categoryName,
        slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
        icon: undefined,
        sortOrder: 999
      });
    }
  });
  
  return Array.from(categoryMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);
};

/**
 * Check if menu item has valid category information
 */
export const hasValidCategory = (item: MenuItem): boolean => {
  return !!(item.category || item.categoryObject?.name);
};
