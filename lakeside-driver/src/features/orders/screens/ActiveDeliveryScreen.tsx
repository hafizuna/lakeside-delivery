import React, { useLayoutEffect, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useOrders } from '../context/OrderContext';
import { useDeliveryStatusManager } from '../hooks/useDeliveryStatusManager';
import MockMapView from '../components/MockMapView';
import SuccessModal from '../../../components/modals/SuccessModal';
import { Colors } from '../../../shared/theme/colors';
import { Typography } from '../../../shared/theme/typography';
import { Spacing } from '../../../shared/theme/spacing';

type NavigationProp = {
  goBack: () => void;
};

interface ActiveDeliveryScreenProps {
  onDeliveryComplete?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ActiveDeliveryScreen: React.FC<ActiveDeliveryScreenProps> = ({ onDeliveryComplete }) => {
  const navigation = useNavigation<NavigationProp>();
  const { activeOrder } = useOrders();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [deliveryEarning, setDeliveryEarning] = useState(0);

  const {
    currentStatus,
    actionButtonText,
    isLoading,
    canProceedToNext,
    handleStatusTransition,
  } = useDeliveryStatusManager(activeOrder);

  // Watch for delivery completion and automatically navigate
  useEffect(() => {
    if (currentStatus === 'DELIVERED' && onDeliveryComplete) {
      // Small delay to ensure UI updates are complete
      const timer = setTimeout(() => {
        onDeliveryComplete();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentStatus, onDeliveryComplete]);

  // Hide tab bar when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Hide tab bar when screen is focused
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' }
        });
      }
      
      return () => {
        // Show tab bar when screen is unfocused
        if (parent) {
          parent.setOptions({
            tabBarStyle: {
              display: 'flex',
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            }
          });
        }
      };
    }, [navigation])
  );

  const handleBackPress = () => {
    Alert.alert(
      'Exit Delivery?',
      'Are you sure you want to exit the active delivery? This will not cancel your assignment.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Exit', onPress: () => navigation.goBack() },
      ]
    );
  };

  const handleStatusButtonPress = async () => {
    console.log('🚚 === BUTTON PRESS DEBUG ===');
    console.log('Current Status:', currentStatus);
    console.log('Action Button Text:', actionButtonText);
    console.log('Driver Earning:', activeOrder?.driverEarning);
    console.log('=== END BUTTON PRESS DEBUG ===');
    
    if (currentStatus === 'DELIVERED') {
      Alert.alert(
        'Delivery Complete!',
        'Great job! The delivery has been completed successfully.',
        [{ text: 'Continue', onPress: () => {
          if (onDeliveryComplete) {
            onDeliveryComplete();
          } else {
            navigation.goBack();
          }
        }}]
      );
      return;
    }

    // Check if this is the "Mark as Delivered" action
    if (currentStatus === 'EN_ROUTE_TO_CUSTOMER') {
      console.log('✅ DETECTED: Mark as Delivered action!');
      // Store earning amount before transition
      const earning = parseFloat(activeOrder?.driverEarning?.toString() || '0');
      console.log('💰 Setting earning amount:', earning);
      setDeliveryEarning(earning);
      
      console.log('🔄 Performing status transition...');
      // Perform the delivery completion
      await handleStatusTransition();
      
      console.log('🎉 Showing success modal...');
      // Show success modal after completion
      setShowSuccessModal(true);
      
      console.log('🟢 Success modal state set to true');
    } else {
      console.log('🔄 Regular status transition for:', currentStatus);
      // Regular status transition
      await handleStatusTransition();
    }
  };

  const handleCallRestaurant = () => {
    // Restaurant phone is now available from the transformed API response
    const restaurantPhone = activeOrder?.restaurantPhone;
    
    if (!restaurantPhone) {
      Alert.alert(
        'Phone Not Available',
        'Restaurant phone number is not available. Please contact support if needed.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Call Restaurant',
      `Would you like to call ${activeOrder?.restaurantName}?\n${restaurantPhone}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${restaurantPhone}`) },
      ]
    );
  };

  const getStatusText = () => {
    switch (currentStatus) {
      case 'ASSIGNED':
        return 'Order Assigned';
      case 'EN_ROUTE_TO_RESTAURANT':
        return 'Going to Restaurant';
      case 'WAITING_AT_RESTAURANT':
        return 'Waiting at Restaurant';
      case 'PICKED_UP':
        return 'Order Picked Up';
      case 'EN_ROUTE_TO_CUSTOMER':
        return 'Delivering to Customer';
      case 'DELIVERED':
        return 'Order Delivered';
      default:
        return 'Active Delivery';
    }
  };

  const formatEarnings = (amount: any): string => {
    const safeAmount = typeof amount === 'number' ? amount : 0;
    return `$${safeAmount.toFixed(2)}`;
  };

  const handleSuccessModalDismiss = () => {
    setShowSuccessModal(false);
    // Navigate after modal dismisses
    setTimeout(() => {
      if (onDeliveryComplete) {
        onDeliveryComplete();
      } else {
        navigation.goBack();
      }
    }, 300);
  };

  // Handle case where order becomes null after delivery completion
  useEffect(() => {
    if (!activeOrder) {
      console.log('ActiveDeliveryScreen: Order is null, navigating back');
      // Small delay to prevent navigation issues
      setTimeout(() => {
        if (onDeliveryComplete) {
          onDeliveryComplete();
        } else {
          navigation.goBack();
        }
      }, 100);
    }
  }, [activeOrder, navigation, onDeliveryComplete]);

  if (!activeOrder) {
    return (
      <View style={styles.container}>
        <Text>Delivery completed! Redirecting...</Text>
      </View>
    );
  }

  // Debug: Log the order data to verify transformation worked correctly
  console.log('=== ActiveDeliveryScreen - Debug Data ===');
  console.log('Order ID:', activeOrder?.id);
  console.log('Restaurant Name:', activeOrder?.restaurantName);
  console.log('Restaurant Address:', activeOrder?.restaurantAddress);
  console.log('Restaurant Phone:', activeOrder?.restaurantPhone);
  console.log('Customer Name:', activeOrder?.customerName);
  console.log('Customer Phone:', activeOrder?.customerPhone);
  console.log('Items Count:', activeOrder?.items?.length || 0);
  console.log('Items (raw):', activeOrder?.items);
  console.log('Items type:', typeof activeOrder?.items);
  console.log('Items isArray:', Array.isArray(activeOrder?.items));
  console.log('Items length:', activeOrder?.items?.length);
  
  // Safe logging of items
  if (Array.isArray(activeOrder?.items)) {
    console.log('Items (mapped):', activeOrder.items.map(item => `${item.quantity}x ${item.itemName} - $${item.price}`));
  } else {
    console.log('Items is NOT an array, cannot use .map()');
    console.log('Items keys (if object):', activeOrder?.items ? Object.keys(activeOrder.items) : 'N/A');
  }
  console.log('Total Amount:', activeOrder?.totalAmount);
  console.log('Driver Earning:', activeOrder?.driverEarning);
  console.log('Status:', activeOrder?.status);
  console.log('Current Delivery Status (useDeliveryStatusManager):', currentStatus);
  console.log('Status Text Display:', getStatusText());
  console.log('=== Full Order Object ===');
  console.log(JSON.stringify(activeOrder, null, 2));
  console.log('=== End Debug ===');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Full Screen Map */}
      <MockMapView
        deliveryStatus={currentStatus}
        restaurant={{
          name: activeOrder.restaurantName || 'Restaurant',
          address: activeOrder.restaurantAddress || 'Restaurant Address',
          coordinates: { latitude: 37.7849, longitude: -122.4094 }
        }}
        customer={{
          name: activeOrder.customerName || 'Customer',
          address: activeOrder.deliveryAddress || 'Delivery Address',
          coordinates: { latitude: 37.7749, longitude: -122.4194 }
        }}
        style={styles.fullScreenMap}
      />

      {/* Top Status and Cancel Button */}
      <View style={styles.topOverlay}>
        <Text style={styles.topStatusText}>{getStatusText()}</Text>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={handleBackPress}
        >
          <Ionicons name="close" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* Bottom Modal Overlay */}
      <View style={styles.bottomModal}>
        {/* Restaurant Info */}
        <View style={styles.restaurantSection}>
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>{activeOrder.restaurantName || 'Restaurant'}</Text>
            <Text style={styles.restaurantAddress}>{activeOrder.restaurantAddress || 'Restaurant Address'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.callButton} 
            onPress={handleCallRestaurant}
          >
            <Ionicons name="call" size={20} color={Colors.primary.main} />
          </TouchableOpacity>
        </View>

        {/* Order Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {(() => {
            // Extra defensive check to prevent iterator errors
            const items = activeOrder?.items;
            
            // Log the actual structure for debugging
            console.log('=== Items Debug ===');
            console.log('Items type:', typeof items);
            console.log('Items isArray:', Array.isArray(items));
            console.log('Items:', items);
            console.log('Items length:', items?.length);
            console.log('=== End Items Debug ===');
            
            if (!items) {
              return <Text style={styles.itemName}>No items data</Text>;
            }
            
            if (!Array.isArray(items)) {
              return <Text style={styles.itemName}>Items data format error</Text>;
            }
            
            if (items.length === 0) {
              return <Text style={styles.itemName}>No items available</Text>;
            }
            
            return items.map((item, index) => {
              // Additional safety check for each item
              if (!item || typeof item !== 'object') {
                return (
                  <View key={index} style={styles.orderItem}>
                    <Text style={styles.itemName}>Invalid item data</Text>
                  </View>
                );
              }
              
              return (
                <View key={index} style={styles.orderItem}>
                  <Text style={styles.itemQuantity}>{item.quantity || 0}x</Text>
                  <Text style={styles.itemName}>{item.itemName || 'Unknown Item'}</Text>
                  <Text style={styles.itemPrice}>${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</Text>
                </View>
              );
            });
          })()}
        </View>

        {/* Order Info */}
        <View style={styles.orderInfoSection}>
          <Text style={styles.orderIdText}>Order #{activeOrder.orderNumber || activeOrder.id}</Text>
          <Text style={styles.customerText}>Customer: {activeOrder.customerName || 'Customer'}</Text>
        </View>

        {/* Red Action Button - Always visible like in screenshot */}
        <TouchableOpacity 
          style={[
            styles.redActionButton,
            isLoading && styles.actionButtonLoading,
            currentStatus === 'DELIVERED' && styles.actionButtonSuccess
          ]}
          onPress={handleStatusButtonPress}
          disabled={isLoading || !canProceedToNext}
        >
          <Text style={styles.redActionButtonText}>
            {isLoading ? 'Processing...' : (actionButtonText || 'Reached Store For Pickup')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title="Delivery Complete!"
        message="Great job! Keep up the excellent work!"
        amount={deliveryEarning}
        currency="₹"
        duration={8000}
        onDismiss={handleSuccessModalDismiss}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fullScreenMap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
  },
  topOverlay: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  topStatusText: {
    color: '#000',
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bottomModal: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    left: screenWidth * 0.1, // 10% margin on left
    width: screenWidth * 0.8, // 80% width so map is visible behind
    backgroundColor: 'white',
    borderRadius: 16,
    padding: Spacing.md, // Reduced padding
    maxHeight: screenHeight * 0.35, // Reduced from 0.5 to 0.35
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    zIndex: 5,
  },
  restaurantSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md, // Reduced from lg
    paddingBottom: Spacing.sm, // Reduced from md
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  restaurantInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  itemsSection: {
    marginBottom: Spacing.sm, // Reduced from lg
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  itemQuantity: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.primary.main,
    width: 30,
  },
  itemName: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    marginHorizontal: Spacing.sm,
  },
  itemPrice: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  orderInfoSection: {
    marginBottom: Spacing.sm, // Reduced from lg
    paddingTop: Spacing.sm, // Reduced from md
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  orderIdText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  customerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  actionButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redActionButton: {
    backgroundColor: '#FF3B30', // Red color like in screenshot
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  actionButtonLoading: {
    backgroundColor: Colors.background.secondary,
    opacity: 0.7,
  },
  actionButtonSuccess: {
    backgroundColor: Colors.action.success,
  },
  actionButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
  },
  redActionButtonText: {
    color: 'white',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    letterSpacing: 0.5,
  },
});

export default ActiveDeliveryScreen;
