import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Store, MessageCircle } from 'lucide-react-native';
import { BackIcon, CheckIcon, CreditCardIcon, CashIcon, WalletIcon, MapIcon, ClockIcon } from '../../../shared/components/CustomIcons';
import MapAddressPicker from '../../../shared/components/MapAddressPicker';
import { Colors } from '../../../shared/theme/colors';
import { useCart } from '../context/CartContext';
import { orderAPI, walletAPI } from '../../../shared/services/api';
import { PaymentMethod } from '../../../shared/types/Order';
import { useToast } from '../../../shared/context/ToastContext';
import { useLocation } from '../../../shared/context/LocationContext';
import { LocationCoordinates } from '../../../shared/services/locationService';
import { useNavigation } from '@react-navigation/native';

// Helper function to calculate distance between two coordinates using Haversine formula
const calculateDistanceKm = (coord1: LocationCoordinates, coord2: LocationCoordinates): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

interface CheckoutScreenProps {
  onBackPress: () => void;
  onOrderComplete: () => void;
  navigation?: {
    navigate: (screen: string, params?: any) => void;
  };
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ onBackPress, onOrderComplete, navigation: customNavigation }) => {
  const { state, clearCart } = useCart();
  const { showSuccess, showError, showWarning } = useToast();
  const { calculateDistance } = useLocation();
  const reactNavigation = useNavigation();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCoordinates, setDeliveryCoordinates] = useState<LocationCoordinates | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.WALLET);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [deliveryFeeCalculated, setDeliveryFeeCalculated] = useState<number>(5.00);

  // Fetch wallet balance on component mount
  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      setWalletLoading(true);
      setWalletError(null);
      const response = await walletAPI.getWallet();
      
      if (response.success) {
        const balance = parseFloat(response.data.balance.toString());
        setWalletBalance(balance);
      } else {
        setWalletError('Failed to load wallet');
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      setWalletError('Unable to load wallet');
    } finally {
      setWalletLoading(false);
    }
  };

  // Use dummy coordinates for API calls
  const dummyCoordinates = {
    latitude: 9.03,
    longitude: 38.74
  };

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim() || !deliveryCoordinates) {
      showWarning('Missing Address', 'Please select your delivery address to continue.');
      return;
    }

    if (state.items.length === 0) {
      showWarning('Empty Cart', 'Your cart is empty. Please add items before placing an order.');
      return;
    }

    // Check wallet balance if wallet payment is selected
    if (paymentMethod === PaymentMethod.WALLET) {
      const totalAmount = state.subtotal + deliveryFeeCalculated;
      console.log('💰 WALLET CHECK:');
      console.log('💰 Wallet Balance:', walletBalance);
      console.log('💰 Order Subtotal:', state.subtotal);
      console.log('💰 Delivery Fee:', deliveryFeeCalculated);
      console.log('💰 Total Amount Required:', totalAmount);
      
      if (walletBalance < totalAmount) {
        console.warn('⚠️ Insufficient wallet balance!');
        showWarning(
          'Insufficient Wallet Balance', 
          `Your wallet balance is ₹${walletBalance.toFixed(2)} but the total amount is ₹${totalAmount.toFixed(2)}. Please top up your wallet or choose a different payment method.`
        );
        return;
      }
      
      console.log('✅ Wallet balance sufficient');
    }

    setIsProcessing(true);
    
    try {
      // Get restaurant ID from first item (all items should be from same restaurant)
      const restaurantId = state.items[0].restaurantId;
      
      // Prepare order data with real coordinates
      // Note: Backend expects totalPrice to be the subtotal (without delivery fee)
      // Backend will add delivery fee to totalPrice to get the final amount
      const orderData = {
        restaurantId,
        items: state.items.map(item => ({
          menuId: item.menuId, // Use menuId instead of id
          quantity: item.quantity,
          price: item.price
        })),
        totalPrice: state.subtotal, // Send subtotal only, backend will add delivery fee
        deliveryFee: deliveryFeeCalculated,
        deliveryAddress,
        deliveryLat: deliveryCoordinates!.latitude,
        deliveryLng: deliveryCoordinates!.longitude,
        deliveryInstructions: specialInstructions,
        paymentMethod: paymentMethod
      };

      console.log('🚀 CREATING ORDER - Full Debug Info:');
      console.log('📋 Order Data:', JSON.stringify(orderData, null, 2));
      console.log('🏪 Restaurant ID:', restaurantId);
      console.log('🛒 Cart Items:', JSON.stringify(state.items, null, 2));
      console.log('💰 Payment Method:', paymentMethod);
      console.log('📍 Delivery Address:', deliveryAddress);
      console.log('📍 Delivery Coordinates:', deliveryCoordinates);
      console.log('💸 Delivery Fee:', deliveryFeeCalculated);
      console.log('💵 Subtotal:', state.subtotal);
      console.log('💳 Total Price:', state.subtotal + deliveryFeeCalculated);
      
      // Create order via API
      console.log('🌐 Making API call to create order...');
      const response = await orderAPI.createOrder(orderData);
      console.log('✅ Order API Response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        // Clear cart immediately
        clearCart();
        
        // Show success toast
        showSuccess(
          'Order Placed Successfully! 🎉', 
          `Order #${response.data.id} is being prepared. Track your order in the Orders tab.`
        );
        
        // Navigate to orders after a brief delay to let user see the toast
        setTimeout(() => {
          onOrderComplete();
        }, 1500);
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error: any) {
      console.error('❌ ORDER CREATION ERROR - Full Debug Info:');
      console.error('🔴 Error Object:', error);
      console.error('🔴 Error Message:', error.message);
      console.error('🔴 Error Response:', error.response);
      console.error('🔴 Error Response Data:', error.response?.data);
      console.error('🔴 Error Response Status:', error.response?.status);
      console.error('🔴 Error Response Headers:', error.response?.headers);
      console.error('🔴 Error Config:', error.config);
      
      let errorMessage = 'Failed to place order. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showError('Order Failed', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddressSelect = (address: string, coordinates: LocationCoordinates) => {
    setDeliveryAddress(address);
    setDeliveryCoordinates(coordinates);
    
    // Calculate delivery fee based on distance (mock restaurant location)
    const restaurantCoordinates: LocationCoordinates = {
      latitude: 9.052232,
      longitude: 38.115485
    };
    
    const distance = calculateDistanceKm(restaurantCoordinates, coordinates);
    const baseFee = 2.50;
    const perKmFee = 1.00;
    const calculatedFee = baseFee + (distance * perKmFee);
    setDeliveryFeeCalculated(Math.round(calculatedFee * 100) / 100);
  };

  const renderOrderSummary = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Order Summary</Text>
      
      <View style={styles.restaurantInfo}>
        <Store size={20} color={Colors.primary.main} />
        <Text style={styles.restaurantName}>{state.restaurantName}</Text>
      </View>

      {state.items.map((item) => (
        <View key={item.menuId} style={styles.orderItem}>
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
          </View>
          <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
        </View>
      ))}

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>₹{state.subtotal.toFixed(2)}</Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Delivery Fee</Text>
        <Text style={styles.summaryValue}>₹{deliveryFeeCalculated.toFixed(2)}</Text>
      </View>
      
      <View style={[styles.summaryRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>₹{(state.subtotal + deliveryFeeCalculated).toFixed(2)}</Text>
      </View>
    </View>
  );

  const renderDeliverySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Delivery Address</Text>
      
      <MapAddressPicker
        initialAddress={deliveryAddress}
        onAddressSelect={handleAddressSelect}
        placeholder="Select your delivery address on the map"
      />
      
      {deliveryAddress ? (
        <View style={styles.selectedAddressContainer}>
          <MapIcon size={16} color={Colors.success} />
          <Text style={styles.selectedAddressText}>{deliveryAddress}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderPaymentSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Payment Method</Text>
      
      {/* Credit/Debit Card option removed */}
      {/* Cash on Delivery disabled */}
      <TouchableOpacity
        style={[styles.paymentOption, styles.disabledPayment]}
        disabled={true}
      >
        <CashIcon 
          size={24} 
          color={Colors.text.light} 
        />
        <Text style={[styles.paymentText, styles.disabledPaymentText]}>
          Cash on Delivery (Coming Soon)
        </Text>
      </TouchableOpacity>

      {/* Wallet Payment Option */}
      <TouchableOpacity
        style={[
          styles.paymentOption, 
          paymentMethod === PaymentMethod.WALLET && styles.selectedPayment,
          walletError && styles.disabledPayment
        ]}
        onPress={() => !walletError && setPaymentMethod(PaymentMethod.WALLET)}
        disabled={!!walletError}
      >
        <WalletIcon 
          size={24} 
          color={paymentMethod === PaymentMethod.WALLET ? Colors.primary.main : 
                 walletError ? Colors.text.light : Colors.text.secondary} 
        />
        <View style={styles.walletPaymentContent}>
          <Text style={[
            styles.paymentText, 
            paymentMethod === PaymentMethod.WALLET && styles.selectedPaymentText,
            walletError && styles.disabledPaymentText
          ]}>
            Digital Wallet
          </Text>
          {walletLoading ? (
            <ActivityIndicator size="small" color={Colors.text.secondary} />
          ) : walletError ? (
            <Text style={styles.walletErrorText}>{walletError}</Text>
          ) : (
            <Text style={styles.walletBalanceText}>
              Balance: ₹{walletBalance.toFixed(2)}
            </Text>
          )}
        </View>
        {paymentMethod === PaymentMethod.WALLET && !walletError && (
          <CheckIcon size={20} color={Colors.primary.main} />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderSpecialInstructions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Special Instructions</Text>
      <View style={styles.inputContainer}>
        <MessageCircle size={20} color={Colors.text.secondary} />
        <TextInput
          style={styles.textInput}
          placeholder="Any special requests? (Optional)"
          value={specialInstructions}
          onChangeText={setSpecialInstructions}
          multiline
          placeholderTextColor={Colors.text.placeholder}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <BackIcon size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderOrderSummary()}
        {renderDeliverySection()}
        {renderPaymentSection()}
        {renderSpecialInstructions()}
        
        {/* Spacer for place order button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.placeOrderContainer}>
        <TouchableOpacity 
          style={[styles.placeOrderButton, isProcessing && styles.processingButton]} 
          onPress={handlePlaceOrder}
          disabled={isProcessing}
        >
          <View style={styles.orderButtonContent}>
            {isProcessing ? (
              <>
                <ClockIcon size={20} color={Colors.text.white} />
                <Text style={styles.orderButtonText}>Processing...</Text>
              </>
            ) : (
              <>
                <Text style={styles.orderButtonText}>Place Order</Text>
                <Text style={styles.orderButtonPrice}>${(state.subtotal + deliveryFeeCalculated).toFixed(2)}</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.background.card,
    marginVertical: 4,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginLeft: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.main,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
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
    marginTop: 16,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background.secondary,
  },
  textInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Colors.text.primary,
    minHeight: 20,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: Colors.background.secondary,
  },
  selectedPayment: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main + '10',
  },
  paymentText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    marginLeft: 12,
  },
  selectedPaymentText: {
    color: Colors.primary.main,
    fontWeight: '500',
  },
  disabledPayment: {
    backgroundColor: Colors.background.secondary || '#F0F0F0',
    borderColor: Colors.border.light || '#E0E0E0',
    opacity: 0.6,
  },
  disabledPaymentText: {
    color: Colors.text.light || Colors.text.secondary,
  },
  walletPaymentContent: {
    flex: 1,
    marginLeft: 12,
  },
  walletBalanceText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  walletErrorText: {
    fontSize: 12,
    color: Colors.action.error,
    marginTop: 2,
  },
  addressHelper: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  addressHelperText: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 100,
  },
  placeOrderContainer: {
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
  placeOrderButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  processingButton: {
    backgroundColor: Colors.text.secondary,
  },
  orderButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  orderButtonPrice: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '700',
  },
  mapAddressContainer: {
    marginBottom: 12,
  },
  selectedAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '10',
    borderColor: Colors.success,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  selectedAddressText: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
});

export default CheckoutScreen;
