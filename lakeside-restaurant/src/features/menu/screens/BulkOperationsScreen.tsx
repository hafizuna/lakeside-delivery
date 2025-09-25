import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
// Removed Picker dependency for better compatibility
import { useMenu } from '../context/MenuContext';
import { apiService } from '../../../shared/services/api';
import { Colors } from '../../../shared/theme/colors';
import { Typography } from '../../../shared/theme/typography';

interface BulkOperation {
  id: string;
  label: string;
  icon: string;
  requiresValue?: boolean;
  valueType?: 'category' | 'availability' | 'price';
}

const BULK_OPERATIONS: BulkOperation[] = [
  { id: 'update_availability', label: 'Update Availability', icon: 'eye', requiresValue: true, valueType: 'availability' },
  { id: 'change_category', label: 'Change Category', icon: 'folder', requiresValue: true, valueType: 'category' },
  { id: 'adjust_price', label: 'Adjust Price', icon: 'pricetag', requiresValue: true, valueType: 'price' },
  { id: 'delete', label: 'Delete Items', icon: 'trash', requiresValue: false },
];

export const BulkOperationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { menuItems, categoryObjects, loadMenuItems } = useMenu();
  
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [operationValue, setOperationValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  
  // Price adjustment state
  const [priceSign, setPriceSign] = useState('+');
  const [priceAmount, setPriceAmount] = useState('');
  
  // Update operationValue when price sign or amount changes
  useEffect(() => {
    if (selectedOperation === 'adjust_price' && priceAmount) {
      setOperationValue(priceSign + priceAmount);
    } else if (selectedOperation === 'adjust_price' && !priceAmount) {
      setOperationValue('');
    }
  }, [priceSign, priceAmount, selectedOperation]);
  
  // Reset price state when operation changes away from price
  useEffect(() => {
    if (selectedOperation !== 'adjust_price') {
      setPriceSign('+');
      setPriceAmount('');
    }
  }, [selectedOperation]);

  // Debug logging
  console.log('BulkOperationsScreen Debug:', {
    menuItemsCount: menuItems?.length || 0,
    categoryObjectsCount: categoryObjects?.length || 0,
    selectedItemsSize: selectedItems.size
  });

  const selectedOperation_obj = useMemo(() => 
    BULK_OPERATIONS.find(op => op.id === selectedOperation), 
    [selectedOperation]
  );

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(menuItems?.map(item => item.id) || []));
    }
    setSelectAll(!selectAll);
  };

  const toggleSelectItem = (itemId: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
    setSelectAll(newSelected.size === (menuItems?.length || 0));
  };

  const executeBulkOperation = async () => {
    if (selectedItems.size === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to perform bulk operations.');
      return;
    }

    if (!selectedOperation) {
      Alert.alert('No Operation Selected', 'Please select an operation to perform.');
      return;
    }

    if (selectedOperation_obj?.requiresValue && !operationValue) {
      Alert.alert('Missing Value', 'Please provide a value for the selected operation.');
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Confirm Bulk Operation',
      `Are you sure you want to ${selectedOperation_obj?.label.toLowerCase()} ${selectedItems.size} item(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', style: 'destructive', onPress: performOperation },
      ]
    );
  };

  const performOperation = async () => {
    try {
      setLoading(true);
      const itemIds = Array.from(selectedItems);

      switch (selectedOperation) {
        case 'update_availability':
          const isAvailable = operationValue === 'true';
          await apiService.bulkUpdateMenuItems({
            itemIds,
            updates: { isAvailable }
          });
          break;

        case 'change_category':
          const categoryId = parseInt(operationValue);
          await apiService.bulkUpdateMenuItems({
            itemIds,
            updates: { categoryId }
          });
          break;

        case 'adjust_price':
          // Validate and parse price adjustment
          const cleanValue = operationValue.replace(/[$,\s]/g, ''); // Remove $, commas, spaces
          const priceAdjustment = parseFloat(cleanValue);
          
          if (isNaN(priceAdjustment)) {
            Alert.alert('Invalid Price', 'Please enter a valid price adjustment (e.g., +2.50, -1.00)');
            return;
          }
          
          if (Math.abs(priceAdjustment) > 1000) {
            Alert.alert('Price Too Large', 'Price adjustment cannot exceed $1000');
            return;
          }
          
          await apiService.bulkUpdateMenuItems({
            itemIds,
            updates: { priceAdjustment }
          });
          break;

        case 'delete':
          await apiService.bulkDeleteMenuItems({ itemIds });
          break;
      }

      // Reload menu items and reset selections
      await loadMenuItems();
      setSelectedItems(new Set());
      setSelectAll(false);
      setSelectedOperation('');
      setOperationValue('');
      
      Alert.alert('Success', `Bulk operation completed successfully!`);
    } catch (error) {
      console.error('Bulk operation error:', error);
      Alert.alert('Error', 'Failed to complete bulk operation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderValueInput = () => {
    if (!selectedOperation_obj?.requiresValue) return null;

    switch (selectedOperation_obj.valueType) {
      case 'availability':
        return (
          <View style={styles.valueInputContainer}>
            <Text style={styles.label}>Availability:</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.optionButton, operationValue === 'true' && styles.selectedOptionButton]}
                onPress={() => setOperationValue('true')}
              >
                <Text style={[styles.optionButtonText, operationValue === 'true' && styles.selectedOptionText]}>Available</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, operationValue === 'false' && styles.selectedOptionButton]}
                onPress={() => setOperationValue('false')}
              >
                <Text style={[styles.optionButtonText, operationValue === 'false' && styles.selectedOptionText]}>Unavailable</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'category':
        return (
          <View style={styles.valueInputContainer}>
            <Text style={styles.label}>Category:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              <View style={styles.buttonGroup}>
                {categoryObjects && categoryObjects.length > 0 ? (
                  categoryObjects.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      style={[styles.categoryOptionButton, operationValue === category.id.toString() && styles.selectedOptionButton]}
                      onPress={() => setOperationValue(category.id.toString())}
                    >
                      <Text style={[styles.optionButtonText, operationValue === category.id.toString() && styles.selectedOptionText]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No categories available</Text>
                )}
              </View>
            </ScrollView>
          </View>
        );

      case 'price':
        return (
          <View style={styles.valueInputContainer}>
              <Text style={styles.label}>Price Adjustment:</Text>
              <Text style={styles.helperText}>Select + to increase or - to decrease prices, then enter the amount</Text>
              
              {/* Plus/Minus Toggle Buttons */}
              <View style={styles.signToggleContainer}>
                <TouchableOpacity
                  style={[styles.signButton, priceSign === '+' && styles.selectedSignButton]}
                  onPress={() => setPriceSign('+')}
                >
                  <Text style={[styles.signButtonText, priceSign === '+' && styles.selectedSignButtonText]}>+ Add</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.signButton, priceSign === '-' && styles.selectedSignButton]}
                  onPress={() => setPriceSign('-')}
                >
                  <Text style={[styles.signButtonText, priceSign === '-' && styles.selectedSignButtonText]}>- Subtract</Text>
                </TouchableOpacity>
              </View>
              
              {/* Amount Input */}
              <View style={styles.amountInputContainer}>
                <Text style={styles.amountInputLabel}>Amount ($):</Text>
                <TextInput
                  style={styles.amountInput}
                  value={priceAmount}
                  onChangeText={(text) => {
                    // Only allow numbers and one decimal point
                    const filteredText = text.replace(/[^0-9.]/g, '');
                    // Prevent multiple decimal points
                    const parts = filteredText.split('.');
                    if (parts.length > 2) {
                      return;
                    }
                    setPriceAmount(filteredText);
                  }}
                  placeholder="0.00"
                  placeholderTextColor={Colors.text.tertiary}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    // Dismiss keyboard when done
                    Keyboard.dismiss();
                  }}
                  blurOnSubmit={true}
                />
              </View>
              
              {/* Preview */}
              {priceAmount && (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewText}>
                    Preview: {priceSign}${priceAmount} per item
                  </Text>
                </View>
              )}
              
              {/* Quick Options */}
              <Text style={styles.quickOptionsLabel}>Quick Options:</Text>
              <View style={styles.priceInputContainer}>
                <TouchableOpacity
                  style={styles.priceButton}
                  onPress={() => {
                    setPriceSign('-');
                    setPriceAmount('5');
                  }}
                >
                  <Text style={styles.priceButtonText}>-$5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.priceButton}
                  onPress={() => {
                    setPriceSign('-');
                    setPriceAmount('1');
                  }}
                >
                  <Text style={styles.priceButtonText}>-$1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.priceButton}
                  onPress={() => {
                    setPriceSign('+');
                    setPriceAmount('1');
                  }}
                >
                  <Text style={styles.priceButtonText}>+$1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.priceButton}
                  onPress={() => {
                    setPriceSign('+');
                    setPriceAmount('5');
                  }}
                >
                  <Text style={styles.priceButtonText}>+$5</Text>
                </TouchableOpacity>
              </View>
            </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Bulk Operations</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
        {/* Selection Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            {selectedItems.size} of {menuItems?.length || 0} items selected
          </Text>
          <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllButton}>
          <Ionicons 
            name={selectAll ? "checkbox" : "square-outline"}
            size={16} 
            color={'#FF6B35'} 
          />
            <Text style={styles.selectAllText}>Select All</Text>
          </TouchableOpacity>
        </View>

        {/* Operation Selection */}
        <View style={styles.operationContainer}>
          <Text style={styles.sectionTitle}>Select Operation:</Text>
          <View style={styles.operationsGrid}>
            {BULK_OPERATIONS.map(operation => (
              <TouchableOpacity
                key={operation.id}
                style={[
                  styles.operationButton,
                  selectedOperation === operation.id && styles.selectedOperationButton
                ]}
                onPress={() => {
                  setSelectedOperation(operation.id);
                  setOperationValue('');
                }}
              >
                <Ionicons 
                  name={operation.icon as any} 
                  size={20} 
                  color={selectedOperation === operation.id ? Colors.text.inverse : Colors.primary.main} 
                />
                <Text style={[
                  styles.operationButtonText,
                  selectedOperation === operation.id && styles.selectedOperationText
                ]}>
                  {operation.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {renderValueInput()}
        </View>

        {/* Execute Button */}
        <TouchableOpacity
          style={[styles.executeButton, loading && styles.executeButtonDisabled]}
          onPress={executeBulkOperation}
          disabled={loading || selectedItems.size === 0 || !selectedOperation}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="flash" size={20} color="#FFF" />
              <Text style={styles.executeButtonText}>Execute Operation</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Menu Items List */}
        <View style={styles.itemsList}>
          <Text style={styles.sectionTitle}>Menu Items:</Text>
          {menuItems && menuItems.length > 0 ? (
            menuItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => toggleSelectItem(item.id)}
              >
                <View style={styles.menuItemContent}>
                  <Ionicons 
                    name={selectedItems.has(item.id) ? "checkbox" : "square-outline"} 
                    size={20} 
                    color={'#FF6B35'} 
                  />
                  <View style={styles.menuItemDetails}>
                    <Text style={styles.menuItemName}>{item.itemName}</Text>
                    <Text style={styles.menuItemInfo}>
                      {item.category?.name || 'Uncategorized'} • ${Number(item.price || 0).toFixed(2)} • 
                      {item.isAvailable ? ' Available' : ' Unavailable'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No menu items found</Text>
              <Text style={styles.emptySubtext}>Add some menu items first to perform bulk operations</Text>
            </View>
          )}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow.light,
    shadowOffset: Colors.shadow.offset,
    shadowOpacity: Colors.shadow.opacity,
    shadowRadius: Colors.shadow.radius,
    elevation: Colors.shadow.elevation,
  },
  summaryText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    marginLeft: 8,
    fontSize: Typography.fontSize.sm,
    color: '#FF6B35',
    fontWeight: Typography.fontWeight.semiBold,
  },
  operationContainer: {
    backgroundColor: Colors.background.primary,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow.light,
    shadowOffset: Colors.shadow.offset,
    shadowOpacity: Colors.shadow.opacity,
    shadowRadius: Colors.shadow.radius,
    elevation: Colors.shadow.elevation,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 12,
  },
  operationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  operationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedOperationButton: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  operationButtonText: {
    marginLeft: 8,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  selectedOperationText: {
    color: Colors.text.inverse,
  },
  valueInputContainer: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionButton: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryOptionButton: {
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginRight: 8,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedOptionButton: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  optionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  selectedOptionText: {
    color: Colors.text.inverse,
  },
  categoryScroll: {
    maxHeight: 50,
  },
  priceInput: {
    backgroundColor: Colors.background.primary,
    borderWidth: 2,
    borderColor: Colors.border.light,
    borderRadius: 12,
    padding: 12,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  helperText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  quickOptionsLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  priceInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priceButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedPriceButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  priceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  executeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary.main,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  executeButtonDisabled: {
    backgroundColor: Colors.text.disabled,
  },
  executeButtonText: {
    marginLeft: 8,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },
  itemsList: {
    marginTop: 16,
  },
  menuItem: {
    backgroundColor: Colors.background.primary,
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemDetails: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  menuItemInfo: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  // New price adjustment styles
  signToggleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  signButton: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    alignItems: 'center',
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedSignButton: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  signButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  selectedSignButtonText: {
    color: Colors.text.inverse,
  },
  amountInputContainer: {
    marginBottom: 16,
  },
  amountInputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  amountInput: {
    backgroundColor: Colors.background.primary,
    borderWidth: 2,
    borderColor: Colors.border.light,
    borderRadius: 12,
    padding: 16,
    fontSize: Typography.fontSize.lg,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.semiBold,
    textAlign: 'center',
  },
  previewContainer: {
    backgroundColor: '#FFF3E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  previewText: {
    fontSize: Typography.fontSize.md,
    color: '#FF6B35',
    fontWeight: Typography.fontWeight.semiBold,
    textAlign: 'center',
  },
});
