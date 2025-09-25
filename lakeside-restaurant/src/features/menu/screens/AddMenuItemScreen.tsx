import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ArrowBackIcon, ChevronDownIcon } from '../../../shared/components/CustomIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../../../shared/theme/colors';
import { Typography } from '../../../shared/theme/typography';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { useMenu } from '../context/MenuContext';

interface MenuItemForm {
  itemName: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
  isAvailable: boolean;
}

// Categories are now loaded dynamically from the context

type AddMenuItemScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const AddMenuItemScreen: React.FC = () => {
  const navigation = useNavigation<AddMenuItemScreenNavigationProp>();
  const { addMenuItem, categoryObjects } = useMenu();
  const [formData, setFormData] = useState<MenuItemForm>({
    itemName: '',
    description: '',
    price: '',
    imageUrl: '',
    category: categoryObjects.length > 0 ? categoryObjects[0].name : 'General',
    isAvailable: true,
  });

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Update default category when categoryObjects are loaded
  useEffect(() => {
    if (categoryObjects.length > 0 && formData.category === 'General') {
      setFormData(prev => ({ ...prev, category: categoryObjects[0].name }));
    }
  }, [categoryObjects]);

  const handleSave = async () => {
    if (!formData.itemName.trim()) {
      Alert.alert('Error', 'Item name is required');
      return;
    }

    if (!formData.price.trim() || isNaN(parseFloat(formData.price))) {
      Alert.alert('Error', 'Valid price is required');
      return;
    }

    try {
      setSaving(true);
      
      // Find the categoryId from the selected category name
      const selectedCategory = categoryObjects.find(cat => cat.name === formData.category);
      
      const menuItemData = {
        itemName: formData.itemName.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl.trim(),
        categoryId: selectedCategory?.id || null,
        isAvailable: formData.isAvailable,
      };

      const success = await addMenuItem(menuItemData);
      
      if (success) {
        Alert.alert('Success', 'Menu item added successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to add menu item. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add menu item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel', 'Are you sure you want to cancel? Changes will be lost.', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Cancel', style: 'destructive', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <ArrowBackIcon size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Menu Item</Text>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.itemName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, itemName: text }))}
              placeholder="Enter item name"
              placeholderTextColor={Colors.text.tertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Enter item description"
              placeholderTextColor={Colors.text.tertiary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price *</Text>
            <TextInput
              style={styles.input}
              value={formData.price}
              onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
              placeholder="0.00"
              placeholderTextColor={Colors.text.tertiary}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category & Image</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity 
              style={styles.categorySelector}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={styles.categoryText}>{formData.category}</Text>
              <ChevronDownIcon 
                size={20} 
                color={Colors.text.secondary} 
              />
            </TouchableOpacity>
            
            {showCategoryPicker && (
              <View style={styles.categoryPicker}>
                {categoryObjects.map((categoryObj) => (
                  <TouchableOpacity
                    key={categoryObj.id}
                    style={[
                      styles.categoryOption,
                      formData.category === categoryObj.name && styles.selectedCategoryOption
                    ]}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, category: categoryObj.name }));
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      formData.category === categoryObj.name && styles.selectedCategoryOptionText
                    ]}>
                      {categoryObj.icon ? `${categoryObj.icon} ${categoryObj.name}` : categoryObj.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Image URL</Text>
            <TextInput
              style={styles.input}
              value={formData.imageUrl}
              onChangeText={(text) => setFormData(prev => ({ ...prev, imageUrl: text }))}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor={Colors.text.tertiary}
              keyboardType="url"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          
          <View style={styles.switchGroup}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Available for orders</Text>
              <Text style={styles.switchDescription}>
                Customers can order this item when available
              </Text>
            </View>
            <Switch
              value={formData.isAvailable}
              onValueChange={(value) => setFormData(prev => ({ ...prev, isAvailable: value }))}
              trackColor={{ false: Colors.border.light, true: Colors.primary.light }}
              thumbColor={formData.isAvailable ? Colors.primary.main : Colors.text.tertiary}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  saveButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.text.disabled,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categorySelector: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  categoryPicker: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  selectedCategoryOption: {
    backgroundColor: Colors.primary.light,
  },
  categoryOptionText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  selectedCategoryOptionText: {
    color: Colors.primary.dark,
    fontWeight: Typography.fontWeight.semiBold,
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 16,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
});

export default AddMenuItemScreen;
