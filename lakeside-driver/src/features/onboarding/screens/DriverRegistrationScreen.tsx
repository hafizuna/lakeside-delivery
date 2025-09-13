import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../../shared/theme';
import { 
  VehicleIcon,
  DocumentIcon,
  CameraIcon,
  BikeIcon,
  BackIcon,
  CheckIcon
} from '../../../shared/components/CustomIcons';

interface DriverRegistrationScreenProps {
  navigation: any;
}

type VehicleType = 'bike' | 'motorcycle' | 'car';

export const DriverRegistrationScreen: React.FC<DriverRegistrationScreenProps> = ({ navigation }) => {
  const [vehicleType, setVehicleType] = useState<VehicleType>('bike');
  const [vehicleDetails, setVehicleDetails] = useState({
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    color: '',
  });
  const [documents, setDocuments] = useState({
    driverLicense: null,
    vehicleRegistration: null,
    insurance: null,
  });
  const [loading, setLoading] = useState(false);

  const handleVehicleDetailsChange = (field: string, value: string) => {
    setVehicleDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDocumentUpload = (documentType: string) => {
    // TODO: Implement camera/gallery picker
    Alert.alert('Document Upload', `${documentType} upload coming soon!`);
  };

  const validateForm = () => {
    const { make, model, year, licensePlate, color } = vehicleDetails;

    if (vehicleType !== 'bike') {
      if (!make.trim() || !model.trim() || !year.trim() || !licensePlate.trim() || !color.trim()) {
        Alert.alert('Error', 'Please fill in all vehicle details');
        return false;
      }

      if (parseInt(year) < 1990 || parseInt(year) > new Date().getFullYear()) {
        Alert.alert('Error', 'Please enter a valid vehicle year');
        return false;
      }
    }

    return true;
  };

  const handleCompleteRegistration = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      // TODO: Implement actual registration API call
      const registrationData = {
        vehicleType,
        vehicleDetails,
        documents,
      };
      console.log('Driver registration:', registrationData);
      
      // Mock success for now
      setTimeout(() => {
        setLoading(false);
        Alert.alert(
          'Registration Complete',
          'Your driver registration has been submitted for review. You will be notified once approved to start accepting deliveries.',
          [
            {
              text: 'Continue',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      }, 1500);
      
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Registration failed. Please try again.');
    }
  };

  const vehicleOptions = [
    { type: 'bike' as VehicleType, label: 'Bicycle', icon: BikeIcon },
    { type: 'motorcycle' as VehicleType, label: 'Motorcycle', icon: VehicleIcon },
    { type: 'car' as VehicleType, label: 'Car', icon: VehicleIcon },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={theme.colors.primary.main} />
      
      <LinearGradient
        colors={[theme.colors.primary.main, theme.colors.primary.dark]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BackIcon size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <DocumentIcon size={50} color="white" />
          <Text style={styles.headerTitle}>Driver Registration</Text>
          <Text style={styles.headerSubtitle}>Complete your profile</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            
            {/* Vehicle Type Selection */}
            <Text style={styles.fieldLabel}>Vehicle Type</Text>
            <View style={styles.vehicleTypeContainer}>
              {vehicleOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = vehicleType === option.type;
                
                return (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      styles.vehicleOption,
                      isSelected && styles.vehicleOptionSelected
                    ]}
                    onPress={() => setVehicleType(option.type)}
                  >
                    <IconComponent 
                      size={32} 
                      color={isSelected ? 'white' : theme.colors.primary.main} 
                    />
                    <Text style={[
                      styles.vehicleOptionText,
                      isSelected && styles.vehicleOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Vehicle Details (for non-bike vehicles) */}
            {vehicleType !== 'bike' && (
              <>
                <View style={styles.inputRow}>
                  <View style={[styles.inputContainer, { flex: 1, marginRight: theme.spacing.sm }]}>
                    <Text style={styles.fieldLabel}>Make</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Honda, Toyota, etc."
                      placeholderTextColor={theme.colors.text.secondary}
                      value={vehicleDetails.make}
                      onChangeText={(value) => handleVehicleDetailsChange('make', value)}
                      autoCapitalize="words"
                    />
                  </View>
                  
                  <View style={[styles.inputContainer, { flex: 1, marginLeft: theme.spacing.sm }]}>
                    <Text style={styles.fieldLabel}>Model</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Civic, Corolla, etc."
                      placeholderTextColor={theme.colors.text.secondary}
                      value={vehicleDetails.model}
                      onChangeText={(value) => handleVehicleDetailsChange('model', value)}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputContainer, { flex: 1, marginRight: theme.spacing.sm }]}>
                    <Text style={styles.fieldLabel}>Year</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="2020"
                      placeholderTextColor={theme.colors.text.secondary}
                      value={vehicleDetails.year}
                      onChangeText={(value) => handleVehicleDetailsChange('year', value)}
                      keyboardType="numeric"
                      maxLength={4}
                    />
                  </View>
                  
                  <View style={[styles.inputContainer, { flex: 1, marginLeft: theme.spacing.sm }]}>
                    <Text style={styles.fieldLabel}>Color</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Red, Blue, etc."
                      placeholderTextColor={theme.colors.text.secondary}
                      value={vehicleDetails.color}
                      onChangeText={(value) => handleVehicleDetailsChange('color', value)}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.fieldLabel}>License Plate</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ABC-1234"
                    placeholderTextColor={theme.colors.text.secondary}
                    value={vehicleDetails.licensePlate}
                    onChangeText={(value) => handleVehicleDetailsChange('licensePlate', value.toUpperCase())}
                    autoCapitalize="characters"
                  />
                </View>
              </>
            )}

            {/* Document Upload Section */}
            <Text style={[styles.sectionTitle, { marginTop: theme.spacing.xl }]}>
              Required Documents
            </Text>

            {/* Driver License */}
            <View style={styles.documentContainer}>
              <Text style={styles.fieldLabel}>Driver's License</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handleDocumentUpload('Driver License')}
              >
                <CameraIcon size={24} color={theme.colors.primary.main} />
                <Text style={styles.uploadButtonText}>Upload Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Vehicle Registration (for non-bike) */}
            {vehicleType !== 'bike' && (
              <View style={styles.documentContainer}>
                <Text style={styles.fieldLabel}>Vehicle Registration</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handleDocumentUpload('Vehicle Registration')}
                >
                  <CameraIcon size={24} color={theme.colors.primary.main} />
                  <Text style={styles.uploadButtonText}>Upload Photo</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Insurance (for non-bike) */}
            {vehicleType !== 'bike' && (
              <View style={styles.documentContainer}>
                <Text style={styles.fieldLabel}>Insurance</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => handleDocumentUpload('Insurance')}
                >
                  <CameraIcon size={24} color={theme.colors.primary.main} />
                  <Text style={styles.uploadButtonText}>Upload Photo</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Complete Registration Button */}
            <TouchableOpacity
              style={[
                styles.completeButton,
                loading && styles.completeButtonDisabled
              ]}
              onPress={handleCompleteRegistration}
              disabled={loading}
            >
              <LinearGradient
                colors={[theme.colors.primary.main, theme.colors.primary.dark]}
                style={styles.completeButtonGradient}
              >
                <Text style={styles.completeButtonText}>
                  {loading ? 'Submitting...' : 'Complete Registration'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.reviewText}>
              Your registration will be reviewed within 24-48 hours. 
              You'll receive a notification once approved.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing.xl,
    left: theme.spacing.lg,
    padding: theme.spacing.sm,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontFamily: theme.typography.weights.bold,
    color: 'white',
    marginTop: theme.spacing.md,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.regular,
    color: 'white',
    opacity: 0.9,
    marginTop: theme.spacing.xs,
  },
  content: {
    flex: 1,
    marginTop: -30,
  },
  scrollContent: {
    flexGrow: 1,
  },
  form: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xl,
    minHeight: '100%',
    ...theme.layout.shadow,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  fieldLabel: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  vehicleTypeContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  vehicleOption: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.layout.borderRadius,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.secondary,
  },
  vehicleOptionSelected: {
    borderColor: theme.colors.primary.main,
    backgroundColor: theme.colors.primary.main,
  },
  vehicleOptionText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
  },
  vehicleOptionTextSelected: {
    color: 'white',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.layout.borderRadius,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.regular,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  documentContainer: {
    marginBottom: theme.spacing.lg,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.layout.borderRadius,
    paddingVertical: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.weights.medium,
    color: theme.colors.primary.main,
    marginLeft: theme.spacing.sm,
  },
  completeButton: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.layout.borderRadius,
    overflow: 'hidden',
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonGradient: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.weights.bold,
    color: 'white',
  },
  reviewText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.weights.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
