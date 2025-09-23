import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Store, ShoppingBag, ArrowRight, Sparkles, ShoppingCart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BackIcon, MinusIcon, PlusIcon, TrashIcon } from '../../../shared/components/CustomIcons';
import { SharedHeader } from '../../../shared/components/SharedHeader';
import { Colors } from '../../../shared/theme/colors';
import { Spacing } from '../../../shared/theme/spacing';
import { useCart } from '../context/CartContext';
import { useToast } from '../../../shared/context/ToastContext';

const { width, height } = Dimensions.get('window');

interface CartScreenProps {
  onBackPress: () => void;
  onCheckout: () => void;
}

const CartScreen: React.FC<CartScreenProps> = ({ onBackPress, onCheckout }) => {
  const { state, updateQuantity, removeItem, clearCart } = useCart();
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const handleMenuPress = () => {
    // Handle menu press - could open drawer or show menu
    console.log('Menu pressed');
  };

  const handleCartPress = () => {
    // Already on cart screen, could show cart details or do nothing
    console.log('Cart pressed');
  };

  const handleNotificationPress = () => {
    // Handle notification press
    console.log('Notifications pressed');
  };

  const handleQuantityChange = (menuId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(menuId);
      showInfo('Item Removed', 'Item has been removed from your cart.');
    } else {
      updateQuantity(menuId, newQuantity);
      showSuccess('Quantity Updated', `Item quantity updated to ${newQuantity}.`);
    }
  };

  const handleClearCart = () => {
    if (state.items.length === 0) {
      showWarning('Cart Empty', 'Your cart is already empty.');
      return;
    }
    clearCart();
    showInfo('Cart Cleared', 'All items have been removed from your cart.');
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      {/* Empty Cart Illustration */}
      <View style={styles.emptyIllustration}>
        <View style={styles.cartIconContainer}>
          <ShoppingCart size={64} color={Colors.text.light} strokeWidth={1.5} />
        </View>
        <View style={styles.emptyDots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </View>
      
      {/* Content Card */}
      <View style={styles.emptyContentCard}>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>
          Looks like you haven't made your choice yet. Browse our delicious menu and add items to get started!
        </Text>
        
        {/* Benefits Grid */}
        <View style={styles.benefitsGrid}>
          <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: '#E8F5E8' }]}>
              <Sparkles size={20} color="#4CAF50" />
            </View>
            <Text style={styles.benefitText}>Fresh Daily</Text>
          </View>
          <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: '#FFF3E0' }]}>
              <Store size={20} color="#FF9800" />
            </View>
            <Text style={styles.benefitText}>Top Restaurants</Text>
          </View>
          <View style={styles.benefitItem}>
            <View style={[styles.benefitIcon, { backgroundColor: '#E3F2FD' }]}>
              <ArrowRight size={20} color="#2196F3" />
            </View>
            <Text style={styles.benefitText}>Fast Delivery</Text>
          </View>
        </View>
      </View>
        
      {/* Action Button */}
      <TouchableOpacity style={styles.exploreButton} onPress={onBackPress}>
        <LinearGradient
          colors={[Colors.primary.main, Colors.primary.dark || Colors.primary.main]}
          style={styles.exploreGradient}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
        >
          <Text style={styles.exploreButtonText}>Start Shopping</Text>
          <ArrowRight size={20} color={Colors.text.white} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderCartItem = (item: any) => (
    <View key={item.menuId} style={styles.modernCartItem}>
      <Image
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/70x70' }}
        style={styles.modernItemImage}
      />
      <View style={styles.modernItemDetails}>
        <Text style={styles.modernItemName} numberOfLines={2}>{item.itemName}</Text>
        {item.description && (
          <Text style={styles.modernItemDescription} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        <View style={styles.itemPriceRow}>
          <Text style={styles.modernItemPrice}>
            ${item.price != null && !isNaN(item.price) ? Number(item.price).toFixed(2) : '0.00'}
          </Text>
          <Text style={styles.itemSubtotal}>
            × {item.quantity} = ${
              item.price != null && !isNaN(item.price) 
                ? (Number(item.price) * item.quantity).toFixed(2) 
                : '0.00'
            }
          </Text>
        </View>
      </View>
      <View style={styles.modernQuantityControls}>
        <TouchableOpacity
          style={styles.modernQuantityButton}
          onPress={() => handleQuantityChange(item.menuId, item.quantity - 1)}
        >
          <MinusIcon size={18} color={Colors.primary.main} />
        </TouchableOpacity>
        <Text style={styles.modernQuantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.modernQuantityButton}
          onPress={() => handleQuantityChange(item.menuId, item.quantity + 1)}
        >
          <PlusIcon size={18} color={Colors.primary.main} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOrderSummary = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Order Summary</Text>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>${state.subtotal.toFixed(2)}</Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Delivery Fee</Text>
        <Text style={styles.summaryValue}>${state.deliveryFee.toFixed(2)}</Text>
      </View>
      
      <View style={[styles.summaryRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>${state.total.toFixed(2)}</Text>
      </View>
    </View>
  );

  if (state.items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
        {/* Shared Header */}
        <SharedHeader 
          cartItemCount={state.totalItems}
          onCartPress={handleCartPress}
          onNotificationPress={handleNotificationPress}
          onMenuPress={handleMenuPress}
        />
        {renderEmptyCart()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
      {/* Shared Header */}
      <SharedHeader 
        cartItemCount={state.totalItems}
        onCartPress={handleCartPress}
        onNotificationPress={handleNotificationPress}
        onMenuPress={handleMenuPress}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Restaurant Info with Clear Button */}
        <View style={styles.restaurantHeader}>
          <View style={styles.restaurantInfo}>
            <Store size={20} color={Colors.primary.main} />
            <Text style={styles.restaurantName}>{state.restaurantName}</Text>
            <Text style={styles.itemCount}>({state.totalItems} items)</Text>
          </View>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearCart}>
            <TrashIcon size={18} color={Colors.action.error} />
          </TouchableOpacity>
        </View>

        {/* Cart Items */}
        <View style={styles.itemsContainer}>
          {state.items.map(renderCartItem)}
        </View>

        {/* Order Summary */}
        {renderOrderSummary()}

        {/* Spacer for checkout button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutContainer}>
        <TouchableOpacity style={styles.checkoutButton} onPress={onCheckout}>
          <View style={styles.checkoutContent}>
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            <Text style={styles.checkoutPrice}>${state.total.toFixed(2)}</Text>
          </View>
          <ArrowRight size={20} color={Colors.text.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  content: {
    flex: 1,
  },
  // New Empty Cart Styles
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: Colors.background.secondary,
  },
  emptyIllustration: {
    alignItems: 'center',
    marginBottom: 40,
  },
  cartIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: Colors.border.light,
  },
  emptyDots: {
    flexDirection: 'row',
    marginTop: 24,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dot1: {
    backgroundColor: Colors.primary.main,
  },
  dot2: {
    backgroundColor: Colors.primary.light,
  },
  dot3: {
    backgroundColor: Colors.text.light,
  },
  emptyContentCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 20,
    padding: 32,
    marginHorizontal: 8,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  benefitsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  benefitItem: {
    alignItems: 'center',
    flex: 1,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  exploreButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginHorizontal: 24,
    alignSelf: 'stretch',
  },
  exploreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  exploreButtonText: {
    color: Colors.text.white,
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  
  // Legacy empty cart styles (kept for compatibility)
  browseButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  browseButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background.secondary,
    marginBottom: 8,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clearButton: {
    padding: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 8,
    flex: 1,
  },
  itemCount: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  itemsContainer: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 12,
  },
  
  // Modern Cart Item Styles
  modernCartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modernItemImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: Colors.background.secondary,
  },
  modernItemDetails: {
    flex: 1,
    marginLeft: 16,
  },
  modernItemName: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 6,
    lineHeight: 22,
  },
  modernItemDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.main,
  },
  itemSubtotal: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  modernQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  modernQuantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modernQuantityText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  
  // Legacy cart item styles (kept for compatibility)
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.main,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: Colors.background.card,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingTop: 12,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary.main,
  },
  bottomSpacer: {
    height: 100,
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  checkoutButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkoutContent: {
    flex: 1,
  },
  checkoutText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  checkoutPrice: {
    color: Colors.text.white,
    fontSize: 14,
    opacity: 0.9,
  },
});

export default CartScreen;
