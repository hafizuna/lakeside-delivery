import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingsIcon, EditIcon, PlusIcon, BulkOperationsIcon, CategoryManagementIcon } from '../../../shared/components/CustomIcons';
import { Colors } from '../../../shared/theme/colors';
import { Typography } from '../../../shared/theme/typography';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useMenu } from '../context/MenuContext';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  sortOrder: number;
}

interface MenuItem {
  id: number;
  restaurantId: number;
  itemName: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  categoryId?: number;
  category?: Category;
}

type MenuScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const MenuScreen: React.FC = () => {
  const navigation = useNavigation<MenuScreenNavigationProp>();
  const { 
    menuItems, 
    categories, 
    categoryObjects,
    loading, 
    refreshing, 
    refreshMenuItems, 
    toggleAvailability,
    deleteMenuItem
  } = useMenu();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const onRefresh = async () => {
    await refreshMenuItems();
  };


  const addMenuItem = () => {
    navigation.navigate('AddMenuItem');
  };

  const editMenuItem = (item: MenuItem) => {
    navigation.navigate('EditMenuItem', { item });
  };

  const handleToggleAvailability = async (id: number) => {
    await toggleAvailability(id);
  };

  const handleDeleteMenuItem = (id: number) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this menu item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMenuItem(id);
          },
        },
      ]
    );
  };

  // Filter menu items by selected category
  const filteredMenuItems = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category?.name === selectedCategory || 
        (selectedCategory === 'Uncategorized' && (!item.category || !item.category.name)));

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity 
      style={styles.menuItemCard}
      onPress={() => editMenuItem(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemImageContainer}>
        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      </View>
      
      <View style={styles.itemInfo}>
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleContainer}>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category?.name || 'Uncategorized'}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={(e) => {
              e.stopPropagation();
              editMenuItem(item);
            }}
          >
            <EditIcon size={16} color={Colors.primary.main} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.itemDescription}>{item.description}</Text>
        
        <View style={styles.itemFooter}>
          <Text style={styles.itemPrice}>${Number(item.price || 0).toFixed(2)}</Text>
          <TouchableOpacity
            style={[
              styles.availabilityToggle,
              item.isAvailable ? styles.availableToggle : styles.unavailableToggle
            ]}
            onPress={(e) => {
              e.stopPropagation();
              handleToggleAvailability(item.id);
            }}
          >
            <Text style={[
              styles.availabilityText,
              item.isAvailable ? styles.availableText : styles.unavailableText
            ]}>
              {item.isAvailable ? 'Available' : 'Unavailable'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('BulkOperations')}
          >
            <BulkOperationsIcon size={20} color={Colors.text.inverse} />
            <Text style={styles.actionButtonText}>Bulk Actions</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.categoryButton}
            onPress={() => navigation.navigate('CategoryManagement')}
          >
            <CategoryManagementIcon size={20} color={Colors.text.inverse} />
            <Text style={styles.categoryButtonText}>Categories</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollContent}
        >
          <TouchableOpacity
            key="All"
            style={[
              styles.categoryFilterButton,
              selectedCategory === 'All' && styles.activeCategoryFilterButton
            ]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text style={[
              styles.categoryFilterButtonText,
              selectedCategory === 'All' && styles.activeCategoryFilterButtonText
            ]}>
              All
            </Text>
          </TouchableOpacity>
          {categoryObjects.map((categoryObj) => (
            <TouchableOpacity
              key={categoryObj.id}
              style={[
                styles.categoryFilterButton,
                selectedCategory === categoryObj.name && styles.activeCategoryFilterButton
              ]}
              onPress={() => setSelectedCategory(categoryObj.name)}
            >
              <Text style={[
                styles.categoryFilterButtonText,
                selectedCategory === categoryObj.name && styles.activeCategoryFilterButtonText
              ]}>
                {categoryObj.icon ? `${categoryObj.icon} ${categoryObj.name}` : categoryObj.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredMenuItems}
        renderItem={renderMenuItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.menuList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.floatingAddButton} onPress={addMenuItem}>
        <PlusIcon size={28} color={Colors.text.inverse} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    marginLeft: 6,
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary.main,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryButtonText: {
    marginLeft: 6,
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesScrollContent: {
    paddingHorizontal: 4,
  },
  categoryFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  activeCategoryFilterButton: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  categoryFilterButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  activeCategoryFilterButtonText: {
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.semiBold,
  },
  menuList: {
    paddingBottom: 100,
  },
  menuItemCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImageContainer: {
    marginRight: 16,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemTitleContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary.light,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  categoryText: {
    color: Colors.primary.dark,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  editButton: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 8,
    marginLeft: 12,
  },
  itemDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.main,
  },
  availabilityToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  availableToggle: {
    backgroundColor: Colors.success.light,
    borderColor: Colors.success.main,
  },
  unavailableToggle: {
    backgroundColor: Colors.error.light,
    borderColor: Colors.error.main,
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  availableText: {
    color: Colors.success.dark,
  },
  unavailableText: {
    color: Colors.error.dark,
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: Colors.primary.main,
    borderRadius: 28,
    padding: 16,
    shadowColor: Colors.shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default MenuScreen;
