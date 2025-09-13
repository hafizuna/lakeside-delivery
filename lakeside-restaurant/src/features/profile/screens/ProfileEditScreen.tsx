import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ArrowBackIcon, ChevronDownIcon, LockIcon, NotificationIcon, CardIcon, ChevronForwardIcon } from '../../../shared/components/CustomIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '../../../shared/theme/colors';
import { Typography } from '../../../shared/theme/typography';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { apiService } from '../../../shared/services/api';

interface RestaurantProfile {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  logoUrl?: string;
  bannerUrl?: string;
  rating?: number;
  totalOrders: number;
  description?: string;
  commissionRate: number;
  status: 'OPEN' | 'CLOSED' | 'BUSY';
}

interface RestaurantForm {
  name: string;
  address: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  status: 'OPEN' | 'CLOSED' | 'BUSY';
}

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open', color: Colors.success.main },
  { value: 'BUSY', label: 'Busy', color: Colors.warning.main },
  { value: 'CLOSED', label: 'Closed', color: Colors.error.main },
];

type ProfileEditScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type ProfileEditScreenRouteProp = RouteProp<RootStackParamList, 'ProfileEdit'>;

const ProfileEditScreen: React.FC = () => {
  const navigation = useNavigation<ProfileEditScreenNavigationProp>();
  const route = useRoute<ProfileEditScreenRouteProp>();
  const restaurant = route.params?.restaurant;
  
  const [formData, setFormData] = useState<RestaurantForm>({
    name: '',
    address: '',
    description: '',
    logoUrl: '',
    bannerUrl: '',
    status: 'OPEN',
  });

  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadRestaurantData = () => {
    if (restaurant) {
      setFormData({
        name: restaurant.name,
        address: restaurant.address,
        description: restaurant.description || '',
        logoUrl: restaurant.logoUrl || '',
        bannerUrl: restaurant.bannerUrl || '',
        status: restaurant.status,
      });
    }
  };

  useEffect(() => {
    loadRestaurantData();
  }, []);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Restaurant name is required');
      return;
    }

    if (!formData.address.trim()) {
      Alert.alert('Error', 'Restaurant address is required');
      return;
    }

    try {
      setSaving(true);
      const profileData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        description: formData.description.trim(),
        logoUrl: formData.logoUrl.trim(),
        bannerUrl: formData.bannerUrl.trim(),
        status: formData.status,
      };

      const response = await apiService.updateProfile(profileData);
      
      if (response.success) {
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
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

  const getStatusColor = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(option => option.value === status);
    return statusOption?.color || Colors.text.secondary;
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
        <Text style={styles.title}>Edit Profile</Text>
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
          <Text style={styles.sectionTitle}>Restaurant Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Restaurant Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter restaurant name"
              placeholderTextColor={Colors.text.tertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
              placeholder="Enter restaurant address"
              placeholderTextColor={Colors.text.tertiary}
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Describe your restaurant"
              placeholderTextColor={Colors.text.tertiary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Images</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Logo URL</Text>
            <TextInput
              style={styles.input}
              value={formData.logoUrl}
              onChangeText={(text) => setFormData(prev => ({ ...prev, logoUrl: text }))}
              placeholder="https://example.com/logo.jpg"
              placeholderTextColor={Colors.text.tertiary}
              keyboardType="url"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Banner URL</Text>
            <TextInput
              style={styles.input}
              value={formData.bannerUrl}
              onChangeText={(text) => setFormData(prev => ({ ...prev, bannerUrl: text }))}
              placeholder="https://example.com/banner.jpg"
              placeholderTextColor={Colors.text.tertiary}
              keyboardType="url"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Status</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Status</Text>
            <TouchableOpacity 
              style={styles.statusSelector}
              onPress={() => setShowStatusPicker(!showStatusPicker)}
            >
              <View style={styles.statusInfo}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(formData.status) }]} />
                <Text style={styles.statusText}>
                  {STATUS_OPTIONS.find(option => option.value === formData.status)?.label}
                </Text>
              </View>
              <ChevronDownIcon 
                size={20} 
                color={Colors.text.secondary} 
              />
            </TouchableOpacity>
            
            {showStatusPicker && (
              <View style={styles.statusPicker}>
                {STATUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.statusOption,
                      formData.status === option.value && styles.selectedStatusOption
                    ]}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, status: option.value as any }));
                      setShowStatusPicker(false);
                    }}
                  >
                    <View style={styles.statusOptionInfo}>
                      <View style={[styles.statusDot, { backgroundColor: option.color }]} />
                      <Text style={[
                        styles.statusOptionText,
                        formData.status === option.value && styles.selectedStatusOptionText
                      ]}>
                        {option.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.statusDescription}>
            <Text style={styles.statusDescriptionText}>
              {formData.status === 'OPEN' && 'Your restaurant is accepting new orders'}
              {formData.status === 'BUSY' && 'Your restaurant is busy but still accepting orders with longer wait times'}
              {formData.status === 'CLOSED' && 'Your restaurant is not accepting new orders'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <LockIcon size={20} color={Colors.text.secondary} />
              <Text style={styles.settingLabel}>Change Password</Text>
            </View>
            <ChevronForwardIcon size={20} color={Colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <NotificationIcon size={20} color={Colors.text.secondary} />
              <Text style={styles.settingLabel}>Notification Settings</Text>
            </View>
            <ChevronForwardIcon size={20} color={Colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <CardIcon size={20} color={Colors.text.secondary} />
              <Text style={styles.settingLabel}>Payment Settings</Text>
            </View>
            <ChevronForwardIcon size={20} color={Colors.text.secondary} />
          </TouchableOpacity>
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
  statusSelector: {
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
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  statusPicker: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  selectedStatusOption: {
    backgroundColor: Colors.primary.light,
  },
  statusOptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusOptionText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  selectedStatusOptionText: {
    color: Colors.primary.dark,
    fontWeight: Typography.fontWeight.semiBold,
  },
  statusDescription: {
    backgroundColor: Colors.background.primary,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  statusDescriptionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  settingItem: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    marginLeft: 12,
  },
});

export default ProfileEditScreen;
