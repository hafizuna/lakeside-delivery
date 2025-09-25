import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { ArrowBackIcon, PlusIcon, EditIcon, TrashIcon, TagIcon } from '../../../shared/components/CustomIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../../../shared/theme/colors';
import { Typography } from '../../../shared/theme/typography';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { apiService } from '../../../shared/services/api';

type CategoryManagementScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  menuItemCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  icon: string;
}

const CategoryManagementScreen: React.FC = () => {
  const navigation = useNavigation<CategoryManagementScreenNavigationProp>();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({ name: '', icon: '' });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCategories();
      
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        Alert.alert('Error', 'Failed to load categories');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const refreshCategories = async () => {
    try {
      setRefreshing(true);
      const response = await apiService.getCategories();
      
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error refreshing categories:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Category name is required');
      return;
    }

    try {
      setFormLoading(true);
      const response = await apiService.createCategory({
        name: formData.name.trim(),
        icon: formData.icon.trim() || null,
      });

      if (response.success && response.data) {
        setCategories([...categories, response.data]);
        setShowCreateModal(false);
        setFormData({ name: '', icon: '' });
        Alert.alert('Success', 'Category created successfully!');
      } else {
        Alert.alert('Error', response.message || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      Alert.alert('Error', 'Failed to create category');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!formData.name.trim() || !editingCategory) {
      Alert.alert('Validation Error', 'Category name is required');
      return;
    }

    try {
      setFormLoading(true);
      const response = await apiService.updateCategory(editingCategory.id, {
        name: formData.name.trim(),
        icon: formData.icon.trim() || null,
      });

      if (response.success && response.data) {
        setCategories(categories.map(cat => 
          cat.id === editingCategory.id ? response.data : cat
        ));
        setShowEditModal(false);
        setEditingCategory(null);
        setFormData({ name: '', icon: '' });
        Alert.alert('Success', 'Category updated successfully!');
      } else {
        Alert.alert('Error', response.message || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      Alert.alert('Error', 'Failed to update category');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCategory = (category: Category) => {
    if (category.menuItemCount > 0) {
      Alert.alert(
        'Cannot Delete Category',
        `This category contains ${category.menuItemCount} menu items. Please move or delete the menu items first.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.deleteCategory(category.id);
              
              if (response.success) {
                setCategories(categories.filter(cat => cat.id !== category.id));
                Alert.alert('Success', 'Category deleted successfully');
              } else {
                Alert.alert('Error', response.message || 'Failed to delete category');
              }
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const openCreateModal = () => {
    setFormData({ name: '', icon: '' });
    setShowCreateModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon || '',
    });
    setShowEditModal(true);
  };

  const renderCategoryItem = ({ item, index }: { item: Category; index: number }) => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryInfo}>
          {item.icon && <Text style={styles.categoryIcon}>{item.icon}</Text>}
          <View style={styles.categoryDetails}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.categoryCount}>
              {item.menuItemCount} {item.menuItemCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>
        
        <View style={styles.categoryActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(item)}
          >
            <EditIcon size={20} color={Colors.primary.main} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteCategory(item)}
          >
            <TrashIcon size={20} color={Colors.error.main} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.categorySortOrder}>
        <Text style={styles.sortOrderText}>Order: {item.sortOrder}</Text>
        <TagIcon size={16} color={Colors.text.secondary} />
      </View>
    </View>
  );

  const renderFormModal = () => (
    <Modal
      visible={showCreateModal || showEditModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        setShowCreateModal(false);
        setShowEditModal(false);
        setEditingCategory(null);
      }}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => {
              setShowCreateModal(false);
              setShowEditModal(false);
              setEditingCategory(null);
            }}
          >
            <ArrowBackIcon size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingCategory ? 'Edit Category' : 'Create Category'}
          </Text>
          <TouchableOpacity
            style={[styles.modalSaveButton, formLoading && styles.modalSaveButtonDisabled]}
            onPress={editingCategory ? handleEditCategory : handleCreateCategory}
            disabled={formLoading}
          >
            <Text style={styles.modalSaveButtonText}>
              {formLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Category Name *</Text>
            <TextInput
              style={styles.formInput}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter category name"
              placeholderTextColor={Colors.text.tertiary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Icon (Optional)</Text>
            <TextInput
              style={styles.formInput}
              value={formData.icon}
              onChangeText={(text) => setFormData(prev => ({ ...prev, icon: text }))}
              placeholder="🍔 (Enter emoji or icon)"
              placeholderTextColor={Colors.text.tertiary}
            />
            <Text style={styles.formHelperText}>
              Add an emoji or icon to represent this category
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowBackIcon size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Category Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <PlusIcon size={24} color={Colors.primary.main} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Categories Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create categories to organize your menu items better
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openCreateModal}>
              <PlusIcon size={20} color={Colors.text.inverse} />
              <Text style={styles.emptyButtonText}>Create First Category</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.categoriesList}
            showsVerticalScrollIndicator={false}
            onRefresh={refreshCategories}
            refreshing={refreshing}
          />
        )}
      </View>

      {renderFormModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
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
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  categoriesList: {
    paddingBottom: 20,
  },
  categoryItem: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: Colors.error.light,
  },
  categorySortOrder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  sortOrderText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.main,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  modalHeader: {
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
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  modalSaveButton: {
    backgroundColor: Colors.primary.main,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalSaveButtonDisabled: {
    backgroundColor: Colors.text.disabled,
  },
  modalSaveButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  formHelperText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: 6,
  },
});

export default CategoryManagementScreen;
