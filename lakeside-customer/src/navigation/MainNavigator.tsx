import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { RestaurantDetailScreen } from '../features/restaurants/screens/RestaurantDetailScreen';
import CartScreen from '../features/cart/screens/CartScreen';
import CheckoutScreen from '../features/cart/screens/CheckoutScreen';
import OrdersScreen from '../features/orders/screens/OrdersScreen';
import OrderDetailScreen from '../features/orders/screens/OrderDetailScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import SavedAddressesScreen from '../features/profile/screens/SavedAddressesScreen';
import NotificationSettingsScreen from '../features/profile/screens/NotificationSettingsScreen';
import PaymentMethodsScreen from '../features/wallet/screens/PaymentMethodsScreen';
import WalletScreen from '../features/wallet/screens/WalletScreen';
import TopUpScreen from '../features/wallet/screens/TopUpScreen';
import TransactionHistoryScreen from '../features/wallet/screens/TransactionHistoryScreen';
import { BottomNavigation, TabName } from '../components/navigation/BottomNavigation';
import { Restaurant } from '../shared/services/api';
import { useCart } from '../features/cart/context/CartContext';

export const MainNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabName>('Home');
  const [currentScreen, setCurrentScreen] = useState<'home' | 'restaurant-detail' | 'cart' | 'checkout' | 'orders' | 'order-detail' | 'profile' | 'saved-addresses' | 'notification-settings' | 'payment-methods' | 'wallet' | 'topup' | 'transaction-history'>('home');
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { state } = useCart();

  const handleTabPress = (tab: TabName) => {
    setActiveTab(tab);
    if (tab === 'Home') {
      setCurrentScreen('home');
    } else if (tab === 'Cart') {
      setCurrentScreen('cart');
    } else if (tab === 'Orders') {
      setCurrentScreen('orders');
    } else if (tab === 'Profile') {
      setCurrentScreen('profile');
    }
  };

  const handleCartPress = () => {
    setActiveTab('Cart');
    setCurrentScreen('cart');
  };

  const handleCheckoutPress = () => {
    setCurrentScreen('checkout');
  };

  const handleOrderComplete = () => {
    setCurrentScreen('home');
    setActiveTab('Home');
  };

  const handleRestaurantPress = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant.id);
    setCurrentScreen('restaurant-detail');
  };

  const handleBackPress = () => {
    setCurrentScreen('home');
    setSelectedRestaurant(null);
  };


  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onRestaurantPress={handleRestaurantPress} onCartPress={handleCartPress} />;
      case 'restaurant-detail':
        if (selectedRestaurant) {
          return (
            <RestaurantDetailScreen
              restaurantId={selectedRestaurant}
              onBackPress={handleBackPress}
            />
          );
        }
        return <HomeScreen onRestaurantPress={handleRestaurantPress} onCartPress={handleCartPress} />;
      case 'cart':
        return <CartScreen onBackPress={handleBackPress} onCheckout={handleCheckoutPress} />;
      case 'checkout':
        return (
          <CheckoutScreen 
            onBackPress={() => setCurrentScreen('cart')} 
            onOrderComplete={handleOrderComplete}
          />
        );
      case 'orders':
        return <OrdersScreen navigation={{ navigate: (screen: string, params?: any) => {
          if (screen === 'Home') {
            setActiveTab('Home');
            setCurrentScreen('home');
          } else if (screen === 'OrderDetail') {
            setSelectedOrderId(params?.orderId);
            setCurrentScreen('order-detail');
          }
        }}} />;
      case 'order-detail':
        if (selectedOrderId) {
          return (
            <OrderDetailScreen
              orderId={selectedOrderId}
              onBackPress={() => {
                setCurrentScreen('orders');
                setSelectedOrderId(null);
              }}
            />
          );
        }
        return <OrdersScreen navigation={{ navigate: (screen: string, params?: any) => {
          if (screen === 'Home') {
            setActiveTab('Home');
            setCurrentScreen('home');
          }
        }}} />;
      case 'profile':
        return <ProfileScreen navigation={{ 
          navigate: (screen: string, params?: any) => {
            if (screen === 'Home') {
              setActiveTab('Home');
              setCurrentScreen('home');
            } else if (screen === 'PaymentMethodsScreen') {
              setCurrentScreen('payment-methods');
            } else if (screen === 'SavedAddressesScreen') {
              setCurrentScreen('saved-addresses');
            } else if (screen === 'NotificationSettingsScreen') {
              setCurrentScreen('notification-settings');
            }
          },
          goBack: () => {
            setActiveTab('Home');
            setCurrentScreen('home');
          },
          canGoBack: () => true
        }} />;
      case 'saved-addresses':
        return <SavedAddressesScreen navigation={{
          navigate: (screen: string, params?: any) => {
            // Handle navigation from saved addresses if needed
            console.log('Navigate from SavedAddresses:', screen, params);
          },
          goBack: () => setCurrentScreen('profile')
        }} />;
      case 'notification-settings':
        return <NotificationSettingsScreen navigation={{
          navigate: (screen: string, params?: any) => {
            // Handle navigation from notification settings if needed
            console.log('Navigate from NotificationSettings:', screen, params);
          },
          goBack: () => setCurrentScreen('profile')
        }} />;
      case 'payment-methods':
        return <PaymentMethodsScreen navigation={{
          navigate: (screen: string, params?: any) => {
            if (screen === 'WalletScreen') {
              setCurrentScreen('wallet');
            } else if (screen === 'TopUpScreen') {
              setCurrentScreen('topup');
            } else if (screen === 'TransactionHistoryScreen') {
              setCurrentScreen('transaction-history');
            }
          },
          goBack: () => setCurrentScreen('profile')
        }} />;
      case 'wallet':
        return <WalletScreen navigation={{
          navigate: (screen: string, params?: any) => {
            if (screen === 'TopUpScreen') {
              setCurrentScreen('topup');
            } else if (screen === 'TransactionHistoryScreen') {
              setCurrentScreen('transaction-history');
            }
          },
          goBack: () => setCurrentScreen('payment-methods')
        }} />;
      case 'topup':
        return <TopUpScreen navigation={{
          navigate: (screen: string, params?: any) => {
            // Handle payment method navigation in the future
            console.log('Navigate from TopUp:', screen, params);
          },
          goBack: () => setCurrentScreen('payment-methods')
        }} />;
      case 'transaction-history':
        return <TransactionHistoryScreen navigation={{
          goBack: () => setCurrentScreen('payment-methods')
        }} />;
      default:
        return <HomeScreen onRestaurantPress={handleRestaurantPress} onCartPress={handleCartPress} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderCurrentScreen()}
      </View>
      <BottomNavigation
        activeTab={activeTab}
        onTabPress={handleTabPress}
        cartItemCount={state.totalItems}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
