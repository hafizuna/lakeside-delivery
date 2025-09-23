import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { 
  BackIcon,
  SaveIcon,
  CameraIcon,
  ProfileIcon 
} from '../../../shared/components/CustomIcons';
import { Colors } from '../../../shared/theme/colors';
import { authAPI, User as UserType } from '../../../shared/services/api';
import { useToast } from '../../../shared/context/ToastContext';

interface EditProfileScreenProps {
  onBackPress: () => void;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onBackPress }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });
  
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadUserProfile();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need camera roll permissions to change your profile picture.'
        );
      }
    }
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      if (response.success && response.user) {
        setUser(response.user);
        setFormData({
          name: response.user.name || '',
          phone: response.user.phone || '',
          email: response.user.email || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showError('Error', 'Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Update Profile Picture',
      'Choose an option to update your profile picture',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Camera',
          onPress: () => pickImage('camera')
        },
        {
          text: 'Photo Library',
          onPress: () => pickImage('library')
        }
      ]
    );
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      let result;
      
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is required to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
        showSuccess('Image Selected', 'Profile picture updated. Don\'t forget to save changes!');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showError('Error', 'Failed to select image');
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showError('Validation Error', 'Name is required');
      return;
    }

    if (!formData.phone.trim()) {
      showError('Validation Error', 'Phone number is required');
      return;
    }

    setSaving(true);
    try {
      // In a real implementation, you'd call an update profile API
      // await authAPI.updateProfile(formData, profileImage);
      
      // For now, we'll simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showSuccess('Profile Updated', 'Your profile has been updated successfully!');
      onBackPress();
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Update Failed', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (!user) return false;
    return (
      formData.name !== (user.name || '') ||
      formData.phone !== (user.phone || '') ||
      formData.email !== (user.email || '') ||
      profileImage !== null
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary.main} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.main} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <BackIcon size={24} color={Colors.text.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          style={[styles.saveButton, (!hasChanges() || saving) && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={!hasChanges() || saving}
        >
          <SaveIcon size={20} color={!hasChanges() || saving ? Colors.text.secondary : Colors.text.white} />
          <Text style={[
            styles.saveButtonText, 
            (!hasChanges() || saving) && styles.saveButtonTextDisabled
          ]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <TouchableOpacity style={styles.profilePictureContainer} onPress={handleImagePicker}>
            <View style={styles.profilePicture}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <ProfileIcon size={60} color={Colors.text.white} />
              )}
            </View>
            <View style={styles.cameraIcon}>
              <CameraIcon size={20} color={Colors.text.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.profilePictureLabel}>Tap to change profile picture</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Name Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.text.placeholder}
              editable={!saving}
            />
          </View>

          {/* Phone Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              placeholder="Enter your phone number"
              placeholderTextColor={Colors.text.placeholder}
              keyboardType="phone-pad"
              editable={!saving}
            />
          </View>

          {/* Email Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="Enter your email address"
              placeholderTextColor={Colors.text.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!saving}
            />
          </View>

          {/* Save Button (Mobile) */}
          <TouchableOpacity 
            style={[styles.mobileButton, (!hasChanges() || saving) && styles.mobileButtonDisabled]}
            onPress={handleSave}
            disabled={!hasChanges() || saving}
          >
            <Text style={[
              styles.mobileButtonText,
              (!hasChanges() || saving) && styles.mobileButtonTextDisabled
            ]}>
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    backgroundColor: Colors.primary.main,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.white,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  saveButtonDisabled: {
    backgroundColor: 'transparent',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.white,
    marginLeft: 4,
  },
  saveButtonTextDisabled: {
    color: Colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.background.primary,
  },
  profilePictureContainer: {
    position: 'relative',
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.background.primary,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.background.primary,
  },
  profilePictureLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 12,
  },
  formSection: {
    backgroundColor: Colors.background.primary,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Colors.background.secondary,
  },
  mobileButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  mobileButtonDisabled: {
    backgroundColor: Colors.text.light,
  },
  mobileButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.white,
  },
  mobileButtonTextDisabled: {
    color: Colors.text.secondary,
  },
});

export default EditProfileScreen;
