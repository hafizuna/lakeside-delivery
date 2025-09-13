import React, { ReactNode } from 'react';
import { AuthProvider } from '../../features/auth/context/AuthContext';
import { MenuProvider } from '../../features/menu/context/MenuContext';
import { OrdersProvider } from '../../features/orders/context/OrdersContext';
import { RestaurantStatusProvider } from '../../contexts/RestaurantStatusContext';

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <AuthProvider>
      <RestaurantStatusProvider>
        <MenuProvider>
          <OrdersProvider>
            {children}
          </OrdersProvider>
        </MenuProvider>
      </RestaurantStatusProvider>
    </AuthProvider>
  );
};
