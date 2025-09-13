import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../shared/theme';
import { Button, TextInput } from '../../../components/ui';
import {
  UserIcon,
  PhoneIcon,
  VehicleIcon,
  DocumentIcon,
  SettingsIcon,
  StarIcon,
  EditIcon,
  LogoutIcon,
  NotificationIcon,
  LocationIcon,
  CameraIcon,
} from '../../../shared/components/CustomIcons';

// Based on Prisma schema User and Driver models
interface DriverProfileData {
  id: number;
  name: string;
  phone: string;
  email: string;
  profileImageUrl?: string;
  rating: number;
  totalDeliveries: number;
  status: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  vehicleType: 'BIKE';
  currentLat?: number;
  currentLng?: number;
  isAvailable: boolean;
  walletBalance: number;
  joinedDate: string;
}

interface VehicleInfo {
  type: 'BIKE';
  make: string;
  model: string;
  licensePlate: string;
  color: string;
  year: string;
}

interface DocumentInfo {
  driverLicense: {
    number: string;
    expiryDate: string;
    verified: boolean;
  };
  vehicleRegistration: {
    number: string;
    expiryDate: string;
    verified: boolean;
  };
  insurance: {
    number: string;
    expiryDate: string;
    verified: boolean;
  };
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  
  // Mock driver data based on Prisma schema
  const [driverData, setDriverData] = useState<DriverProfileData>({
    id: 1,
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'rajesh.kumar@example.com',
    profileImageUrl: undefined,
    rating: 4.8,
    totalDeliveries: 247,
    status: 'ACTIVE',
    vehicleType: 'BIKE',
    currentLat: 28.4595,
    currentLng: 77.0266,
    isAvailable: true,
    walletBalance: 2450.75,
    joinedDate: '2024-01-15',
  });

  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    type: 'BIKE',
    make: 'Honda',
    model: 'Activa 6G',
    licensePlate: 'HR 26 AB 1234',
    color: 'Red',
    year: '2023',
  });

  const [documents, setDocuments] = useState<DocumentInfo>({
    driverLicense: {
      number: 'DL12345678901234',
      expiryDate: '2027-03-15',
      verified: true,
    },
    vehicleRegistration: {
      number: 'HR26202312345',
      expiryDate: '2027-06-20',
      verified: true,
    },
    insurance: {
      number: 'INS987654321',
      expiryDate: '2025-12-30',
      verified: false,
    },
  });

  const [settings, setSettings] = useState({
    notifications: true,
    locationSharing: true,
    autoAcceptOrders: false,
    darkMode: false,
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleProfileImagePicker = () => {
    Alert.alert(
      'Profile Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => console.log('Camera pressed') },
        { text: 'Gallery', onPress: () => console.log('Gallery pressed') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSaveProfile = () => {
    // TODO: Save profile to backend
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            // TODO: Clear auth token and navigate to login
            console.log('Logout pressed');
          }
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.profileImageContainer}>
        <TouchableOpacity onPress={handleProfileImagePicker}>
          {driverData.profileImageUrl ? (
            <Image 
              source={{ uri: driverData.profileImageUrl }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <UserIcon size={40} color={theme.colors.text.white} />
            </View>
          )}
          <View style={styles.cameraButton}>
            <CameraIcon size={16} color={theme.colors.text.white} />
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.profileInfo}>
        <Text style={styles.driverName}>{driverData.name}</Text>
        <Text style={styles.driverPhone}>{driverData.phone}</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <StarIcon size={16} color={theme.colors.action.warning} />
            <Text style={styles.statValue}>{driverData.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{driverData.totalDeliveries}</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: driverData.status === 'ACTIVE' ? theme.colors.driver.online : theme.colors.driver.offline }
            ]}>
              <Text style={styles.statusText}>
                {driverData.status === 'ACTIVE' ? 'Active' : driverData.status}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.editButton}
        onPress={() => setIsEditing(!isEditing)}
      >
        <EditIcon size={20} color={theme.colors.primary.main} />
      </TouchableOpacity>
    </View>
  );

  const renderPersonalInfo = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <UserIcon size={24} color={theme.colors.primary.main} />
        <Text style={styles.sectionTitle}>Personal Information</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          label="Full Name"
          value={driverData.name}
          onChangeText={(text) => setDriverData(prev => ({ ...prev, name: text }))}
          editable={isEditing}
          style={!isEditing && styles.disabledInput}
        />
        
        <TextInput
          label="Phone Number"
          value={driverData.phone}
          onChangeText={(text) => setDriverData(prev => ({ ...prev, phone: text }))}
          editable={isEditing}
          style={!isEditing && styles.disabledInput}
        />
        
        <TextInput
          label="Email Address"
          value={driverData.email}
          onChangeText={(text) => setDriverData(prev => ({ ...prev, email: text }))}
          editable={isEditing}
          style={!isEditing && styles.disabledInput}
        />
      </View>
    </View>
  );

  const renderVehicleInfo = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <VehicleIcon size={24} color={theme.colors.primary.main} />
        <Text style={styles.sectionTitle}>Vehicle Information</Text>
      </View>
      
      <View style={styles.vehicleGrid}>
        <View style={styles.vehicleItem}>
          <Text style={styles.vehicleLabel}>Type</Text>
          <Text style={styles.vehicleValue}>Motorcycle</Text>
        </View>
        
        <View style={styles.vehicleItem}>
          <Text style={styles.vehicleLabel}>Make</Text>
          <TextInput
            value={vehicleInfo.make}
            onChangeText={(text) => setVehicleInfo(prev => ({ ...prev, make: text }))}
            editable={isEditing}
            style={[styles.vehicleInput, !isEditing && styles.disabledInput]}
          />
        </View>
        
        <View style={styles.vehicleItem}>
          <Text style={styles.vehicleLabel}>Model</Text>
          <TextInput
            value={vehicleInfo.model}
            onChangeText={(text) => setVehicleInfo(prev => ({ ...prev, model: text }))}
            editable={isEditing}
            style={[styles.vehicleInput, !isEditing && styles.disabledInput]}
          />
        </View>
        
        <View style={styles.vehicleItem}>
          <Text style={styles.vehicleLabel}>License Plate</Text>
          <TextInput
            value={vehicleInfo.licensePlate}
            onChangeText={(text) => setVehicleInfo(prev => ({ ...prev, licensePlate: text }))}
            editable={isEditing}
            style={[styles.vehicleInput, !isEditing && styles.disabledInput]}
          />
        </View>
        
        <View style={styles.vehicleItem}>
          <Text style={styles.vehicleLabel}>Color</Text>
          <TextInput
            value={vehicleInfo.color}
            onChangeText={(text) => setVehicleInfo(prev => ({ ...prev, color: text }))}
            editable={isEditing}
            style={[styles.vehicleInput, !isEditing && styles.disabledInput]}
          />
        </View>
        
        <View style={styles.vehicleItem}>
          <Text style={styles.vehicleLabel}>Year</Text>
          <TextInput
            value={vehicleInfo.year}
            onChangeText={(text) => setVehicleInfo(prev => ({ ...prev, year: text }))}
            editable={isEditing}
            style={[styles.vehicleInput, !isEditing && styles.disabledInput]}
          />
        </View>
      </View>
    </View>
  );

  const renderDocuments = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <DocumentIcon size={24} color={theme.colors.primary.main} />
        <Text style={styles.sectionTitle}>Documents</Text>
      </View>
      
      <View style={styles.documentsContainer}>
        {Object.entries(documents).map(([key, doc]) => (
          <TouchableOpacity key={key} style={styles.documentItem}>
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle}>
                {key === 'driverLicense' ? 'Driver License' : 
                 key === 'vehicleRegistration' ? 'Vehicle Registration' : 'Insurance'}
              </Text>
              <Text style={styles.documentNumber}>{doc.number}</Text>
              <Text style={styles.documentExpiry}>Expires: {doc.expiryDate}</Text>
            </View>
            
            <View style={styles.documentStatus}>
              <View style={[
                styles.verificationBadge,
                { backgroundColor: doc.verified ? theme.colors.driver.online : theme.colors.action.warning }
              ]}>
                <Text style={styles.verificationText}>
                  {doc.verified ? 'Verified' : 'Pending'}
                </Text>
              </View>
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <SettingsIcon size={24} color={theme.colors.primary.main} />
        <Text style={styles.sectionTitle}>Settings & Preferences</Text>
      </View>
      
      <View style={styles.settingsContainer}>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <NotificationIcon size={20} color={theme.colors.text.secondary} />
            <Text style={styles.settingLabel}>Push Notifications</Text>
          </View>
          <Switch
            value={settings.notifications}
            onValueChange={(value) => setSettings(prev => ({ ...prev, notifications: value }))}
            trackColor={{ false: theme.colors.border.light, true: theme.colors.primary.light }}
            thumbColor={settings.notifications ? theme.colors.primary.main : theme.colors.text.secondary}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <LocationIcon size={20} color={theme.colors.text.secondary} />
            <Text style={styles.settingLabel}>Location Sharing</Text>
          </View>
          <Switch
            value={settings.locationSharing}
            onValueChange={(value) => setSettings(prev => ({ ...prev, locationSharing: value }))}
            trackColor={{ false: theme.colors.border.light, true: theme.colors.primary.light }}
            thumbColor={settings.locationSharing ? theme.colors.primary.main : theme.colors.text.secondary}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <SettingsIcon size={20} color={theme.colors.text.secondary} />
            <Text style={styles.settingLabel}>Auto Accept Orders</Text>
          </View>
          <Switch
            value={settings.autoAcceptOrders}
            onValueChange={(value) => setSettings(prev => ({ ...prev, autoAcceptOrders: value }))}
            trackColor={{ false: theme.colors.border.light, true: theme.colors.primary.light }}
            thumbColor={settings.autoAcceptOrders ? theme.colors.primary.main : theme.colors.text.secondary}
          />
        </View>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <PhoneIcon size={20} color={theme.colors.text.secondary} />
            <Text style={styles.settingLabel}>Support</Text>
          </View>
          <Text style={styles.settingValue}>Contact Help</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <DocumentIcon size={20} color={theme.colors.text.secondary} />
            <Text style={styles.settingLabel}>Terms & Privacy</Text>
          </View>
          <Text style={styles.settingValue}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWalletQuickView = () => (
    <TouchableOpacity 
      style={styles.walletCard}
      onPress={() => navigation.navigate('Wallet')}
    >
      <View style={styles.walletHeader}>
        <Text style={styles.walletTitle}>Wallet Balance</Text>
        <Text style={styles.walletBalance}>₹{driverData.walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
      </View>
      <Text style={styles.walletSubtext}>Tap to view earnings & withdraw</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderWalletQuickView()}
        {renderPersonalInfo()}
        {renderVehicleInfo()}
        {renderDocuments()}
        {renderSettings()}
        
        <View style={styles.actionButtons}>
          {isEditing && (
            <Button
              title="Save Changes"
              onPress={handleSaveProfile}
              variant="primary"
              style={styles.saveButton}
            />
          )}
          
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
          />
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  
  scrollView: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.layout.shadow.sm,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.background.secondary,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary.main,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.primary,
  },
  profileInfo: {
    flex: 1,
    marginLeft: theme.spacing.lg,
  },
  driverName: {
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  driverPhone: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.regular,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  statValue: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.regular,
    color: theme.colors.text.secondary,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border.light,
    marginHorizontal: theme.spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.layout.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.white,
  },
  editButton: {
    padding: theme.spacing.sm,
  },
  
  // Wallet Quick View
  walletCard: {
    backgroundColor: theme.colors.primary.main,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.layout.shadow.sm,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  walletTitle: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.white,
  },
  walletBalance: {
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.white,
  },
  walletSubtext: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.regular,
    color: theme.colors.primary.light,
  },
  
  // Section Styles
  section: {
    backgroundColor: theme.colors.background.card,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.layout.shadow.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  
  // Input Styles
  inputContainer: {
    gap: theme.spacing.md,
  },
  disabledInput: {
    backgroundColor: theme.colors.background.secondary,
    opacity: 0.8,
  },
  
  // Vehicle Info Styles
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  vehicleItem: {
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  vehicleLabel: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  vehicleValue: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.regular,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.layout.borderRadius.md,
  },
  vehicleInput: {
    marginBottom: 0,
  },
  
  // Documents Styles
  documentsContainer: {
    gap: theme.spacing.md,
  },
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.layout.borderRadius.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  documentNumber: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.regular,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  documentExpiry: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.regular,
    color: theme.colors.text.secondary,
  },
  documentStatus: {
    alignItems: 'flex-end',
  },
  verificationBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.layout.borderRadius.sm,
    marginBottom: theme.spacing.xs,
  },
  verificationText: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.white,
  },
  viewButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  viewButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.primary.main,
  },
  
  // Settings Styles
  settingsContainer: {
    gap: theme.spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.layout.borderRadius.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  settingValue: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.primary.main,
  },
  
  // Action Buttons
  actionButtons: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  saveButton: {
    backgroundColor: theme.colors.driver.online,
  },
  logoutButton: {
    borderColor: theme.colors.action.error,
  },
});
