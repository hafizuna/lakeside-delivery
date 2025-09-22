import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../shared/theme/colors';
import { useLocation } from '../../../shared/context/LocationContext';
import { LocationCoordinates } from '../../../shared/services/locationService';
import { BackIcon, MapIcon, HomeIcon, WorkIcon, LocationIcon } from '../../../shared/components/CustomIcons';
import MapAddressPicker from '../../../shared/components/MapAddressPicker';

interface SavedAddressesScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

const SavedAddressesScreen: React.FC<SavedAddressesScreenProps> = ({ navigation }) => {
  const { 
    state: { savedAddresses, currentLocation },
    deleteAddress,
    setDefaultAddress,
    saveAddress,
    reverseGeocodeLocation,
  } = useLocation();

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [newAddressCoordinates, setNewAddressCoordinates] = useState<LocationCoordinates | null>(null);
  const [newAddressText, setNewAddressText] = useState('');

  const getAddressIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'home':
        return <HomeIcon size={20} color={Colors.primary.main} />;
      case 'work':
        return <WorkIcon size={20} color={Colors.action.info} />;
      default:
        return <LocationIcon size={20} color={Colors.text.secondary} />;
    }
  };

  const handleDeleteAddress = (addressId: string, addressLabel: string) => {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete "${addressLabel}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAddress(addressId),
        },
      ]
    );
  };

  const handleSetDefault = (addressId: string) => {
    setDefaultAddress(addressId);
  };

  const handleAddCurrentLocation = async () => {
    if (!currentLocation) {
      Alert.alert('Location Required', 'Please enable location services to add your current location.');
      return;
    }

    // Show label selection alert
    Alert.alert(
      'Add Current Location',
      'What would you like to call this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Home',
          onPress: () => addCurrentLocationWithLabel('Home')
        },
        {
          text: 'Work', 
          onPress: () => addCurrentLocationWithLabel('Work')
        },
        {
          text: 'Other',
          onPress: () => promptCustomLabel()
        }
      ]
    );
  };

  const addCurrentLocationWithLabel = async (label: string) => {
    setIsAddingAddress(true);
    
    try {
      const address = await reverseGeocodeLocation(currentLocation!);
      const addressText = address 
        ? `${address.address}, ${address.city}` 
        : 'Current location';
        
      const newAddress = {
        id: `address_${Date.now()}`,
        label,
        address: addressText,
        coordinates: currentLocation!,
        isDefault: savedAddresses.length === 0,
      };

      await saveAddress(newAddress);
      Alert.alert('Success', `${label} address saved successfully!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save address. Please try again.');
    } finally {
      setIsAddingAddress(false);
    }
  };

  const promptCustomLabel = () => {
    Alert.prompt(
      'Custom Address Label',
      'Enter a name for this address:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (label?: string) => {
            if (label && label.trim()) {
              addCurrentLocationWithLabel(label.trim());
            }
          }
        }
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const handleAddNewAddress = () => {
    setNewAddressLabel('');
    setNewAddressText('');
    setNewAddressCoordinates(null);
    setShowAddModal(true);
  };

  const handleAddressSelect = (address: string, coordinates: LocationCoordinates) => {
    setNewAddressText(address);
    setNewAddressCoordinates(coordinates);
  };

  const handleSaveNewAddress = async () => {
    if (!newAddressLabel.trim()) {
      Alert.alert('Label Required', 'Please enter a label for this address.');
      return;
    }

    if (!newAddressText || !newAddressCoordinates) {
      Alert.alert('Address Required', 'Please select an address using the map.');
      return;
    }

    setIsAddingAddress(true);
    
    try {
      const newAddress = {
        id: `address_${Date.now()}`,
        label: newAddressLabel.trim(),
        address: newAddressText,
        coordinates: newAddressCoordinates,
        isDefault: savedAddresses.length === 0,
      };

      await saveAddress(newAddress);
      Alert.alert('Success', `${newAddressLabel} address saved successfully!`);
      setShowAddModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save address. Please try again.');
    } finally {
      setIsAddingAddress(false);
    }
  };

  const renderAddressCard = (address: any) => (
    <TouchableOpacity
      key={address.id}
      style={[styles.addressCard, address.isDefault && styles.defaultAddressCard]}
    >
      <View style={styles.addressMain}>
        <View style={styles.addressIcon}>
          {getAddressIcon(address.label)}
        </View>
        
        <View style={styles.addressDetails}>
          <View style={styles.addressHeader}>
            <Text style={styles.addressLabel}>{address.label}</Text>
            {address.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>DEFAULT</Text>
              </View>
            )}
          </View>
          <Text style={styles.addressText} numberOfLines={2}>
            {address.address}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => {
            // Show action sheet with options
            Alert.alert(
              address.label,
              'Choose an action:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Set as Default',
                  onPress: () => handleSetDefault(address.id),
                  style: 'default',
                },
                {
                  text: 'Delete',
                  onPress: () => handleDeleteAddress(address.id, address.label),
                  style: 'destructive',
                },
              ]
            );
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MapIcon size={48} color={Colors.text.secondary} />
      <Text style={styles.emptyTitle}>No Saved Addresses</Text>
      <Text style={styles.emptySubtitle}>
        Save your frequently used addresses for quick ordering
      </Text>
      
      <TouchableOpacity
        style={styles.addCurrentLocationButton}
        onPress={handleAddCurrentLocation}
        disabled={isAddingAddress}
      >
        <LocationIcon size={20} color={Colors.text.white} />
        <Text style={styles.addCurrentLocationText}>
          {isAddingAddress ? 'Adding...' : 'Add Current Location'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <BackIcon size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddNewAddress}
        >
          <Ionicons name="add" size={24} color={Colors.primary.main} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {savedAddresses.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Quick Add Current Location */}
            <View style={styles.quickActionsCard}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={handleAddCurrentLocation}
                disabled={isAddingAddress}
              >
                <LocationIcon size={20} color={Colors.primary.main} />
                <Text style={styles.quickActionText}>
                  {isAddingAddress ? 'Adding Current Location...' : 'Add Current Location'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Saved Addresses */}
            <View style={styles.addressesSection}>
              <Text style={styles.sectionTitle}>Your Addresses</Text>
              {savedAddresses.map(renderAddressCard)}
            </View>
          </>
        )})
      </ScrollView>
      
      {/* Add Address Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAddModal(false)}
            >
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Address</Text>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!newAddressLabel.trim() || !newAddressText || !newAddressCoordinates) && styles.saveButtonDisabled
              ]}
              onPress={handleSaveNewAddress}
              disabled={!newAddressLabel.trim() || !newAddressText || !newAddressCoordinates || isAddingAddress}
            >
              <Text style={[
                styles.saveButtonText,
                (!newAddressLabel.trim() || !newAddressText || !newAddressCoordinates) && styles.saveButtonTextDisabled
              ]}>
                {isAddingAddress ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Address Label Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Address Label</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Home, Work, Gym"
                value={newAddressLabel}
                onChangeText={setNewAddressLabel}
                placeholderTextColor={Colors.text.placeholder}
              />
            </View>

            {/* Quick Label Buttons */}
            <View style={styles.quickLabelsSection}>
              <Text style={styles.quickLabelsTitle}>Quick Labels</Text>
              <View style={styles.quickLabelsRow}>
                <TouchableOpacity
                  style={[
                    styles.quickLabelButton,
                    newAddressLabel === 'Home' && styles.quickLabelButtonSelected
                  ]}
                  onPress={() => setNewAddressLabel('Home')}
                >
                  <HomeIcon size={20} color={newAddressLabel === 'Home' ? Colors.text.white : Colors.primary.main} />
                  <Text style={[
                    styles.quickLabelText,
                    newAddressLabel === 'Home' && styles.quickLabelTextSelected
                  ]}>Home</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.quickLabelButton,
                    newAddressLabel === 'Work' && styles.quickLabelButtonSelected
                  ]}
                  onPress={() => setNewAddressLabel('Work')}
                >
                  <WorkIcon size={20} color={newAddressLabel === 'Work' ? Colors.text.white : Colors.action.info} />
                  <Text style={[
                    styles.quickLabelText,
                    newAddressLabel === 'Work' && styles.quickLabelTextSelected
                  ]}>Work</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.quickLabelButton,
                    newAddressLabel === 'Other' && styles.quickLabelButtonSelected
                  ]}
                  onPress={() => setNewAddressLabel('Other')}
                >
                  <LocationIcon size={20} color={newAddressLabel === 'Other' ? Colors.text.white : Colors.text.secondary} />
                  <Text style={[
                    styles.quickLabelText,
                    newAddressLabel === 'Other' && styles.quickLabelTextSelected
                  ]}>Other</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Map Address Picker */}
            <View style={styles.mapSection}>
              <Text style={styles.inputLabel}>Select Address Location</Text>
              <MapAddressPicker
                onAddressSelect={handleAddressSelect}
                placeholder="Tap to select address on map"
                initialAddress={newAddressText}
                showSavedAddresses={false}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    paddingVertical: 16,
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
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  quickActionsCard: {
    backgroundColor: Colors.background.card,
    margin: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  quickActionText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    marginLeft: 12,
  },
  addressesSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  addressCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  defaultAddressCard: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.main + '08',
  },
  addressMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressDetails: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginRight: 8,
  },
  defaultBadge: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text.white,
  },
  addressText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  menuButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  addCurrentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addCurrentLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.white,
    marginLeft: 8,
  },
  // Modal Styles
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
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary.main,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.text.light,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.white,
  },
  saveButtonTextDisabled: {
    color: Colors.text.secondary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
  },
  quickLabelsSection: {
    marginBottom: 24,
  },
  quickLabelsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  quickLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickLabelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  quickLabelButtonSelected: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  quickLabelText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
    marginLeft: 8,
  },
  quickLabelTextSelected: {
    color: Colors.text.white,
  },
  mapSection: {
    marginBottom: 24,
  },
});

export default SavedAddressesScreen;
