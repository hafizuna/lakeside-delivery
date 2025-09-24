import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface CartItem {
  id: number;
  menuId: number;
  itemName: string;
  description?: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  restaurantId: number;
  restaurantName: string;
}

interface CartState {
  items: CartItem[];
  restaurantId: number | null;
  restaurantName: string | null;
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: { menuId: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { menuId: number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_DELIVERY_FEE'; payload: { fee: number } };

const initialState: CartState = {
  items: [],
  restaurantId: null,
  restaurantName: null,
  totalItems: 0,
  subtotal: 0,
  deliveryFee: 0.00, // No delivery fee shown in cart
  total: 0,
};

// Utility function to safely convert price to number
const safePrice = (price: any): number => {
  if (price == null) return 0;
  const parsed = Number(price);
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
};

const calculateTotals = (items: CartItem[], deliveryFee: number): Pick<CartState, 'totalItems' | 'subtotal' | 'total'> => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    const itemPrice = safePrice(item.price);
    return sum + (itemPrice * item.quantity);
  }, 0);
  const total = subtotal; // No delivery fee in cart total
  
  return { totalItems, subtotal, total };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const newItem = action.payload;
      
      // Check if adding from different restaurant
      if (state.restaurantId && state.restaurantId !== newItem.restaurantId) {
        // Clear cart and add new item from different restaurant
        const items = [{ ...newItem, quantity: 1 }];
        const totals = calculateTotals(items, state.deliveryFee);
        
        return {
          ...state,
          items,
          restaurantId: newItem.restaurantId,
          restaurantName: newItem.restaurantName,
          ...totals,
        };
      }
      
      // Check if item already exists
      const existingItemIndex = state.items.findIndex(item => item.menuId === newItem.menuId);
      
      let items: CartItem[];
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        items = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item
        items = [...state.items, { ...newItem, quantity: 1 }];
      }
      
      const totals = calculateTotals(items, state.deliveryFee);
      
      return {
        ...state,
        items,
        restaurantId: newItem.restaurantId,
        restaurantName: newItem.restaurantName,
        ...totals,
      };
    }
    
    case 'REMOVE_ITEM': {
      const items = state.items.filter(item => item.menuId !== action.payload.menuId);
      const totals = calculateTotals(items, state.deliveryFee);
      
      return {
        ...state,
        items,
        restaurantId: items.length > 0 ? state.restaurantId : null,
        restaurantName: items.length > 0 ? state.restaurantName : null,
        ...totals,
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const { menuId, quantity } = action.payload;
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        const items = state.items.filter(item => item.menuId !== menuId);
        const totals = calculateTotals(items, state.deliveryFee);
        
        return {
          ...state,
          items,
          restaurantId: items.length > 0 ? state.restaurantId : null,
          restaurantName: items.length > 0 ? state.restaurantName : null,
          ...totals,
        };
      }
      
      const items = state.items.map(item =>
        item.menuId === menuId ? { ...item, quantity } : item
      );
      
      const totals = calculateTotals(items, state.deliveryFee);
      
      return {
        ...state,
        items,
        ...totals,
      };
    }
    
    case 'CLEAR_CART': {
      return {
        ...initialState,
        deliveryFee: state.deliveryFee,
      };
    }
    
    case 'SET_DELIVERY_FEE': {
      const totals = calculateTotals(state.items, action.payload.fee);
      
      return {
        ...state,
        deliveryFee: action.payload.fee,
        ...totals,
      };
    }
    
    default:
      return state;
  }
};

interface CartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (menuId: number) => void;
  updateQuantity: (menuId: number, quantity: number) => void;
  clearCart: () => void;
  setDeliveryFee: (fee: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    // Normalize price to ensure it's a valid number
    const normalizedItem = {
      ...item,
      price: safePrice(item.price)
    };
    console.log('Adding item to cart with normalized price:', normalizedItem);
    dispatch({ type: 'ADD_ITEM', payload: normalizedItem });
  };

  const removeItem = (menuId: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { menuId } });
  };

  const updateQuantity = (menuId: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { menuId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const setDeliveryFee = (fee: number) => {
    dispatch({ type: 'SET_DELIVERY_FEE', payload: { fee } });
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setDeliveryFee,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
