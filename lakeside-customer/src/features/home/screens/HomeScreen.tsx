import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, FlatList, StatusBar, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Menu, Bell, Star, MapPin, Clock } from 'lucide-react-native';
import { 
  SearchIcon, 
  FilterIcon, 
  CartIcon, 
  BurgerIcon, 
  PizzaIcon, 
  CoffeeIcon, 
  IceCreamIcon,
  SushiIcon 
} from '../../../shared/components/CustomIcons';
import { Colors, Typography, Spacing } from '../../../shared/theme';
// Removed TextInput import to use native component
import { restaurantAPI, Restaurant } from '../../../shared/services/api';
import { useCart } from '../../cart/context/CartContext';

interface HomeScreenProps {
  onRestaurantPress: (restaurant: Restaurant) => void;
  onCartPress: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onRestaurantPress, onCartPress }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { state } = useCart();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading restaurants...');
      
      // Set static categories immediately
      const staticCategories = [
        'Burgers',
        'Pizza', 
        'Cookies',
        'Chicken',
        'Seafood',
        'Vegetarian',
        'Desserts',
        'Beverages'
      ];
      setCategories(staticCategories);
      
      // Load restaurants from API
      const restaurantsResponse = await restaurantAPI.getRestaurants();
      
      console.log('Restaurants response:', restaurantsResponse);
      
      if (restaurantsResponse.success) {
        console.log('Setting restaurants:', restaurantsResponse.data);
        setRestaurants(restaurantsResponse.data);
      } else {
        console.error('Failed to load restaurants:', restaurantsResponse);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    try {
      const response = await restaurantAPI.getRestaurants({ search: query });
      if (response.success) {
        setRestaurants(response.data);
      }
    } catch (error) {
      console.error('Error searching restaurants:', error);
    }
  };

  const handleCategoryFilter = async (category: string) => {
    const newCategory = category === selectedCategory ? null : category;
    setSelectedCategory(newCategory);
    
    try {
      // For now, we'll just filter by search since we don't have category field in restaurants
      // In a real app, you'd filter by restaurant category or menu item categories
      const response = await restaurantAPI.getRestaurants({ 
        search: newCategory ? newCategory.toLowerCase() : undefined 
      });
      if (response.success) {
        setRestaurants(response.data);
      }
    } catch (error) {
      console.error('Error filtering restaurants:', error);
    }
  };

  const renderCategoryItem = ({ item }: { item: string }) => {
    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => handleCategoryFilter(item)}
      >
        <View style={[
          styles.categoryIcon,
          selectedCategory === item && styles.categoryIconSelected
        ]}>
          {getCategoryIcon(item)}
        </View>
        <Text style={styles.categoryText}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  const calculateDistance = (lat: number | string, lng: number | string) => {
    // Simple distance calculation - in real app would use user's location
    const distance = Math.random() * 5 + 0.5; // Random distance between 0.5-5.5 km
    return distance.toFixed(1);
  };

  const renderRestaurantItem = ({ item }: { item: Restaurant }) => {
    return (
      <TouchableOpacity
        style={styles.restaurantCard}
        onPress={() => onRestaurantPress(item)}
      >
        <Image
          source={{ uri: item.logoUrl || item.menus?.[0]?.imageUrl || 'https://via.placeholder.com/80x80' }}
          style={styles.restaurantImage}
        />
        <View style={styles.restaurantInfo}>
          <View style={styles.restaurantHeader}>
            <Text style={styles.restaurantName} numberOfLines={1}>{item.name}</Text>
            {item.rating && item.rating > 0 && (
              <View style={styles.ratingContainer}>
                <Star size={14} color="#FFD700" />
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
          <Text style={styles.restaurantAddress} numberOfLines={1}>{item.address}</Text>
          <View style={styles.restaurantMeta}>
            <Text style={styles.restaurantDistance}>{calculateDistance(item.lat, item.lng)} km away</Text>
            {item.totalOrders && item.totalOrders > 0 && (
              <Text style={styles.orderCount}>• {item.totalOrders} orders</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getCategoryIcon = (category: string) => {
    const size = 24;
    const color = selectedCategory === category ? Colors.background.primary : Colors.primary.main;
    
    switch(category) {
      case 'Burgers': 
        return <BurgerIcon size={size} color={color} />;
      case 'Pizza': 
        return <PizzaIcon size={size} color={color} />;
      case 'Desserts': 
      case 'Cookies': 
        return <IceCreamIcon size={size} color={color} />;
      case 'Coffee':
      case 'Beverages':
        return <CoffeeIcon size={size} color={color} />;
      case 'Seafood':
        return <SushiIcon size={size} color={color} />;
      case 'Salads':
      case 'Vegetarian':
        return <SushiIcon size={size} color={color} />; // Using sushi for healthy options
      case 'Chicken':
        return <BurgerIcon size={size} color={color} />;
      default: 
        return <PizzaIcon size={size} color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Menu size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.cartButton} onPress={onCartPress}>
            <CartIcon size={28} color={Colors.text.primary} count={state.totalItems} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Compact Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={require('../../../../assets/images/pizza.jpg')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>A special dish</Text>
              <Text style={styles.heroSubtitle}>prepared for you</Text>
              <Text style={styles.heroDescription}>Our food delivery app brings your favourite dishes to you.</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[
            styles.searchInputWrapper,
            { borderColor: isSearchFocused ? Colors.primary.main : '#333333' }
          ]}>
            <View style={styles.searchIconContainer}>
              <SearchIcon size={22} color={Colors.primary.main} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="What are you craving today?"
              value={searchQuery}
              onChangeText={handleSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholderTextColor={Colors.text.secondary}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <FilterIcon size={20} color={Colors.primary.main} />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item, index) => `category-${index}-${item}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        {/* Restaurants Section */}
        <View style={styles.restaurantsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Restaurants</Text>
          </View>
          
          <FlatList
            data={restaurants}
            renderItem={renderRestaurantItem}
            keyExtractor={(item) => `restaurant-${item.id}`}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            getItemLayout={(data, index) => (
              { length: 108, offset: 108 * index, index }
            )}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={100}
            windowSize={10}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.padding.screen,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background.primary,
  },
  menuButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartButton: {
    padding: 8,
    marginRight: 8,
  },
  notificationButton: {
    padding: 8,
  },
  heroSection: {
    marginHorizontal: Spacing.padding.screen,
    marginBottom: Spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
    height: 160,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroContent: {
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold' as const,
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroDescription: {
    fontSize: Typography.fontSize.sm,
    color: '#FFFFFF',
    lineHeight: 18,
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  searchContainer: {
    paddingHorizontal: Spacing.padding.screen,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: Colors.background.primary,
    borderRadius: 30,
    paddingHorizontal: 4,
    paddingVertical: 4,
    shadowColor: Colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  searchIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginHorizontal: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontWeight: '500' as const,
    minWidth: 200, // Ensure minimum width for search input
    paddingVertical: 8, // Add vertical padding for better touch target
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoriesSection: {
    marginBottom: Spacing.xl,
  },
  categoriesList: {
    paddingHorizontal: Spacing.padding.screen,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryIconSelected: {
    backgroundColor: Colors.primary.main,
  },
  categoryText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.primary,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  restaurantsSection: {
    paddingHorizontal: Spacing.padding.screen,
    paddingBottom: 100, // Extra padding for bottom navigation
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold' as const,
    color: Colors.text.primary,
  },
  sectionCount: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    shadowColor: Colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  restaurantImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  restaurantInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'space-between',
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold' as const,
    color: Colors.text.primary,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.primary,
    marginLeft: 2,
    fontWeight: '600' as const,
  },
  restaurantAddress: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantDistance: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontWeight: '600' as const,
  },
  orderCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    padding: Spacing.lg,
  },
});
