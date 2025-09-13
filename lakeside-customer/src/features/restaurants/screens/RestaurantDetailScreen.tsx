import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Receipt, MapPin, Clock, Users } from 'lucide-react-native';
import { BackIcon, HeartIcon, PlusIcon, ClockIcon } from '../../../shared/components/CustomIcons';
import { Colors } from '../../../shared/theme/colors';
import { Spacing } from '../../../shared/theme/spacing';
import { Typography } from '../../../shared/theme/typography';
import { Restaurant, MenuItem } from '../../../shared/services/api';
import { useCart } from '../../cart/context/CartContext';
import { useToast } from '../../../shared/context/ToastContext';

const { width } = Dimensions.get('window');

interface RestaurantDetailScreenProps {
  restaurantId: number;
  onBackPress: () => void;
}

export const RestaurantDetailScreen: React.FC<RestaurantDetailScreenProps> = ({
  restaurantId,
  onBackPress,
}) => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem, state } = useCart();
  const { showSuccess, showWarning, showError } = useToast();

  const handleAddToCart = (item: MenuItem) => {
    if (!restaurant) {
      showError('Error', 'Restaurant information not available.');
      return;
    }
    
    // Check if adding from different restaurant
    if (state.restaurantId && state.restaurantId !== restaurant.id) {
      showWarning(
        'Different Restaurant', 
        `Your cart contains items from ${state.restaurantName}. This will clear your current cart and add the new item.`
      );
      
      // Clear cart and add new item after a short delay
      setTimeout(() => {
        addItem({
          id: item.id,
          menuId: item.id,
          itemName: item.itemName,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
        });
        showSuccess('Added to Cart! 🛒', `${item.itemName} has been added to your cart.`);
      }, 1500);
    } else {
      addItem({
        id: item.id,
        menuId: item.id,
        itemName: item.itemName,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
      });
      showSuccess('Added to Cart! 🛒', `${item.itemName} has been added to your cart.`);
    }
  };

  useEffect(() => {
    loadRestaurantDetails();
  }, [restaurantId]);

  const loadRestaurantDetails = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockRestaurant: Restaurant = {
        id: restaurantId,
        name: 'Sample Restaurant',
        address: '123 Main St',
        lat: 34.0522,
        lng: -118.2437,
        status: 'OPEN',
        logoUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=100&h=100&fit=crop',
        bannerUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=200&fit=crop',
        rating: 4.5,
        totalOrders: 127,
        description: 'Premium food made with fresh ingredients',
        menus: [
          {
            id: 1,
            restaurantId: restaurantId,
            itemName: 'Classic Burger',
            description: 'Juicy beef patty with lettuce and tomato',
            price: 12.99,
            imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop',
            isAvailable: true
          },
          {
            id: 2,
            restaurantId: restaurantId,
            itemName: 'Chicken Burger',
            description: 'Grilled chicken breast with avocado',
            price: 11.99,
            imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e2dea5f0?w=300&h=200&fit=crop',
            isAvailable: true
          }
        ]
      };
      setRestaurant(mockRestaurant);
    } catch (error) {
      console.error('Error loading restaurant details:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <View style={styles.menuItem}>
      <Image
        source={{ uri: item.imageUrl || 'https://via.placeholder.com/80x80' }}
        style={styles.menuItemImage as any}
      />
      <View style={styles.menuItemInfo}>
        <Text style={styles.menuItemName}>{item.itemName}</Text>
        <Text style={styles.menuItemDescription} numberOfLines={2}>
          {item.description || 'Delicious food item'}
        </Text>
        <Text style={styles.menuItemPrice}>${typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleAddToCart(item)}
      >
        <PlusIcon size={20} color={Colors.background.primary} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.main} />
            <Text style={styles.loadingText}>Loading restaurant...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <View style={styles.errorContent}>
              <Text style={styles.errorEmoji}>🍽️</Text>
              <Text style={styles.errorTitle}>Restaurant not found</Text>
              <Text style={styles.errorMessage}>We couldn't find this restaurant. It might have been moved or removed.</Text>
              <TouchableOpacity
                style={styles.modernBackButton}
                onPress={onBackPress}
              >
                <Text style={styles.modernBackButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section with Banner */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: restaurant.bannerUrl || restaurant.menus?.[0]?.imageUrl || 'https://via.placeholder.com/400x200' }}
            style={styles.heroImage}
          />
          
          {/* Enhanced Hero Overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
            style={styles.heroOverlay}
          />
          
          {/* Header Controls */}
          <View style={styles.headerControls}>
            <TouchableOpacity 
              style={[styles.controlButton, styles.backControlButton]} 
              onPress={onBackPress}
            >
              <BackIcon size={24} color={Colors.text.white} />
            </TouchableOpacity>
            <View style={styles.rightControls}>
              {/* Restaurant Status Badge */}
              <View style={[
                styles.statusBadge,
                restaurant.status === 'OPEN' ? styles.statusOpen : styles.statusClosed
              ]}>
                <Text style={styles.statusText}>
                  {restaurant.status === 'OPEN' ? '🟢 Open' : '🔴 Closed'}
                </Text>
              </View>
              <TouchableOpacity style={[styles.controlButton, styles.heartControlButton]}>
                <HeartIcon size={24} color={Colors.text.white} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Restaurant Logo with enhanced styling */}
          {restaurant.logoUrl && (
            <View style={styles.logoContainer}>
              <View style={styles.logoWrapper}>
                <Image
                  source={{ uri: restaurant.logoUrl }}
                  style={styles.logoImage}
                />
              </View>
            </View>
          )}
        </View>

        {/* Restaurant Info Card */}
        <View style={styles.infoCard}>
          {/* Restaurant Basic Info */}
          <View style={styles.restaurantBasicInfo}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            {restaurant.description && (
              <Text style={styles.restaurantDescription}>{restaurant.description}</Text>
            )}
            <View style={styles.addressContainer}>
              <MapPin size={16} color={Colors.text.secondary} />
              <Text style={styles.restaurantAddress}>{restaurant.address}</Text>
            </View>
          </View>

          {/* Restaurant Stats */}
          <View style={styles.statsContainer}>
            {restaurant.rating && restaurant.rating > 0 && (
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Star size={20} color="#FFD700" fill="#FFD700" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{restaurant.rating.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
              </View>
            )}
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <ClockIcon size={20} color={Colors.primary.main} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>20-30</Text>
                <Text style={styles.statLabel}>Minutes</Text>
              </View>
            </View>
            
            <View style={styles.statDivider} />
            
            {restaurant.totalOrders && restaurant.totalOrders > 0 && (
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Receipt size={20} color={Colors.text.secondary} />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statValue}>{restaurant.totalOrders}+</Text>
                  <Text style={styles.statLabel}>Orders</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Our Menu</Text>
            <Text style={styles.menuSubtitle}>Fresh & delicious items</Text>
          </View>
          
          {restaurant.menus && restaurant.menus.length > 0 ? (
            <View style={styles.menuGrid}>
              {restaurant.menus.map((item, index) => (
                <View key={item.id} style={[
                  styles.modernMenuItem,
                  !item.isAvailable && styles.unavailableMenuItem
                ]}>
                  <View style={styles.menuItemImageContainer}>
                    <Image
                      source={{ uri: item.imageUrl || 'https://via.placeholder.com/120x120' }}
                      style={[
                        styles.modernMenuItemImage,
                        !item.isAvailable && styles.unavailableImage
                      ]}
                    />
                    {!item.isAvailable && (
                      <View style={styles.unavailableOverlay}>
                        <Text style={styles.soldOutOverlayText}>Sold Out</Text>
                      </View>
                    )}
                    {item.isAvailable && (
                      <TouchableOpacity
                        style={styles.modernAddButton}
                        onPress={() => handleAddToCart(item)}
                      >
                        <PlusIcon size={18} color={Colors.text.white} />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <View style={styles.modernMenuItemInfo}>
                    <Text style={[
                      styles.modernMenuItemName,
                      !item.isAvailable && styles.unavailableText
                    ]} numberOfLines={2}>
                      {item.itemName}
                    </Text>
                    {item.description && (
                      <Text style={[
                        styles.modernMenuItemDescription,
                        !item.isAvailable && styles.unavailableDescription
                      ]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                    <View style={styles.priceContainer}>
                      <Text style={[
                        styles.modernMenuItemPrice,
                        !item.isAvailable && styles.unavailablePrice
                      ]}>
                        ${typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
                      </Text>
                      <View style={[
                        styles.availabilityBadge,
                        item.isAvailable ? styles.availableBadge : styles.soldOutBadge
                      ]}>
                        <Text style={styles.availabilityBadgeText}>
                          {item.isAvailable ? '✓ Available' : '✗ Sold Out'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noMenuContainer}>
              <Text style={styles.noMenuText}>No menu items available</Text>
              <Text style={styles.noMenuSubtext}>Check back later for delicious options</Text>
            </View>
          )}
        </View>
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.padding.screen,
  },
  // Hero Section Styles
  heroSection: {
    position: 'relative',
    height: 300,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background.secondary,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  backControlButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heartControlButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginLeft: 12,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statusOpen: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
  },
  statusClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.white,
  },
  logoContainer: {
    position: 'absolute',
    bottom: -30,
    right: 20,
    zIndex: 2,
  },
  logoWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: Colors.background.primary,
  },

  // Info Card Styles
  infoCard: {
    backgroundColor: Colors.background.primary,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  restaurantBasicInfo: {
    marginBottom: 24,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  restaurantDescription: {
    fontSize: 16,
    color: Colors.text.secondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantAddress: {
    fontSize: 15,
    color: Colors.text.secondary,
    marginLeft: 8,
    flex: 1,
  },

  // Stats Container Styles
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border.light,
    marginHorizontal: 16,
  },

  // Menu Section Styles
  menuSection: {
    backgroundColor: Colors.background.primary,
    paddingTop: 32,
    paddingHorizontal: 20,
  },
  menuHeader: {
    marginBottom: 24,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modernMenuItem: {
    width: (width - 60) / 2,
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItemImageContainer: {
    position: 'relative',
    height: 120,
  },
  modernMenuItemImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background.secondary,
  },
  modernAddButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modernMenuItemInfo: {
    padding: 12,
  },
  modernMenuItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 6,
    lineHeight: 20,
  },
  modernMenuItemDescription: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernMenuItemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary.main,
  },
  // Enhanced availability styles
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  availableBadge: {
    backgroundColor: Colors.action.success,
  },
  soldOutBadge: {
    backgroundColor: Colors.action.error,
  },
  availabilityBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.text.white,
    letterSpacing: 0.5,
  },

  // Unavailable menu item styles
  unavailableMenuItem: {
    opacity: 0.7,
  },
  unavailableImage: {
    opacity: 0.5,
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableText: {
    opacity: 0.6,
  },
  unavailableDescription: {
    opacity: 0.5,
  },
  unavailablePrice: {
    opacity: 0.6,
    textDecorationLine: 'line-through',
  },
  soldOutOverlayText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.white,
    textAlign: 'center',
  },

  // No Menu Styles
  noMenuContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noMenuText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  noMenuSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  
  bottomSpacing: {
    height: 40,
  },

  // Enhanced Loading & Error Styles
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 16,
    fontWeight: '500',
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 280,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  modernBackButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: Colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modernBackButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Legacy styles (can be removed later)
  backButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
