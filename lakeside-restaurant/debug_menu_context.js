// Debug script to check menu context state
// Add this to any screen to debug the menu context

import { useMenu } from './src/features/menu/context/MenuContext';

// Add this inside any component to debug
const DebugMenuContext = () => {
  const menuContext = useMenu();
  
  console.log('=== MENU CONTEXT DEBUG ===');
  console.log('menuItems:', menuContext.menuItems?.length || 'undefined');
  console.log('categories:', menuContext.categories?.length || 'undefined'); 
  console.log('categoryObjects:', menuContext.categoryObjects?.length || 'undefined');
  console.log('loading:', menuContext.loading);
  console.log('refreshing:', menuContext.refreshing);
  console.log('=========================');
  
  return null;
};

export default DebugMenuContext;
