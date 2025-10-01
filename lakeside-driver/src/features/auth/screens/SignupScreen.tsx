import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Car, FileText } from 'lucide-react-native';
import { PhoneIcon, LockIcon, EyeIcon, EyeOffIcon } from '../../../shared/components/CustomIcons';
import LottieView from 'lottie-react-native';
import { Colors, Typography, Spacing, Layout } from '../../../shared/theme';
import { Button, TextInput } from '../../../components/ui';
import { useToast } from '../../../shared/context/ToastContext';

interface SignupScreenProps {
  onSignup: (userData: { 
    name: string; 
    phone: string; 
    password: string;
    vehicleType: string;
    vehiclePlate: string;
    licenseNumber: string;
  }) => void;
  onNavigateToLogin: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({
  onSignup,
  onNavigateToLogin,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  // Personal Info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Vehicle Info
  const [vehicleType, setVehicleType] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError, showWarning } = useToast();

  const validateStep1 = () => {
    if (!name.trim()) {
      showWarning('Missing Name', 'Please enter your full name to continue.');
      return false;
    }
    
    if (!phone.trim()) {
      showWarning('Missing Phone Number', 'Please enter your phone number to continue.');
      return false;
    }
    
    if (phone.length < 10) {
      showError('Invalid Phone Number', 'Please enter a valid phone number (at least 10 digits).');
      return false;
    }
    
    if (!password.trim()) {
      showWarning('Missing Password', 'Please create a password to continue.');
      return false;
    }
    
    if (password.length < 6) {
      showError('Weak Password', 'Password must be at least 6 characters long.');
      return false;
    }
    
    if (password !== confirmPassword) {
      showError('Password Mismatch', 'Passwords do not match. Please try again.');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    if (!vehicleType.trim()) {
      showWarning('Missing Vehicle Type', 'Please select your vehicle type.');
      return false;
    }
    
    if (!vehiclePlate.trim()) {
      showWarning('Missing License Plate', 'Please enter your vehicle license plate.');
      return false;
    }
    
    if (!licenseNumber.trim()) {
      showWarning('Missing License Number', 'Please enter your driver license number.');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleSignup = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      await onSignup({ 
        name, 
        phone, 
        password,
        vehicleType,
        vehiclePlate,
        licenseNumber
      });
      showSuccess('Application Submitted! 🎉', 'Your driver application is under review. We\'ll notify you once approved!');
    } catch (error: any) {
      console.error('Signup failed:', error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      showError('Registration Failed', errorMessage);
    }
    setLoading(false);
  };

  const VehicleTypeButton = ({ type, icon }: { type: string; icon: string }) => (
    <TouchableOpacity
      style={[
        styles.vehicleTypeButton,
        vehicleType === type && styles.vehicleTypeButtonActive
      ]}
      onPress={() => setVehicleType(type)}
    >
      <Text style={styles.vehicleIcon}>{icon}</Text>
      <Text style={[
        styles.vehicleTypeText,
        vehicleType === type && styles.vehicleTypeTextActive
      ]}>{type}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={[Colors.background.secondary, Colors.background.primary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.animationContainer}>
              <View style={styles.animationWrapper}>
                <LottieView
                  source={require('../../../../assets/lottie/boarding.json')}
                  style={styles.lottieAnimation}
                  autoPlay
                  loop
                  speed={0.8}
                  onAnimationLoaded={() => console.log('✅ Driver signup animation loaded')}
                  onAnimationFailure={(error) => console.log('❌ Driver signup animation failed:', error)}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.title}>Become a Driver</Text>
            <Text style={styles.subtitle}>
              {currentStep === 1 ? 'Personal Information' : 'Vehicle & License Details'}
            </Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill,
                { width: currentStep === 1 ? '50%' : '100%' }
              ]} />
            </View>
            <Text style={styles.progressText}>Step {currentStep} of 2</Text>
          </View>

          {currentStep === 1 ? (
            <View style={styles.form}>
              <TextInput
                label="Full Name"
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                leftIcon={<User size={20} color={Colors.text.secondary} />}
              />

              <TextInput
                label="Phone Number"
                placeholder="Enter your phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
                leftIcon={<PhoneIcon size={20} color={Colors.text.secondary} />}
              />

              <TextInput
                label="Password"
                placeholder="Create a strong password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                leftIcon={<LockIcon size={20} color={Colors.text.secondary} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOffIcon size={20} color={Colors.text.secondary} />
                    ) : (
                      <EyeIcon size={20} color={Colors.text.secondary} />
                    )}
                  </TouchableOpacity>
                }
              />

              <TextInput
                label="Confirm Password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                leftIcon={<LockIcon size={20} color={Colors.text.secondary} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <EyeOffIcon size={20} color={Colors.text.secondary} />
                    ) : (
                      <EyeIcon size={20} color={Colors.text.secondary} />
                    )}
                  </TouchableOpacity>
                }
              />
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.sectionTitle}>Select Vehicle Type</Text>
              <View style={styles.vehicleTypeContainer}>
                <VehicleTypeButton type="Bike" icon="🏍️" />
                <VehicleTypeButton type="Car" icon="🚗" />
                <VehicleTypeButton type="Scooter" icon="🛵" />
              </View>

              <TextInput
                label="Vehicle License Plate"
                placeholder="e.g., ABC-1234"
                value={vehiclePlate}
                onChangeText={setVehiclePlate}
                autoCapitalize="characters"
                leftIcon={<Car size={20} color={Colors.text.secondary} />}
              />

              <TextInput
                label="Driver License Number"
                placeholder="Enter your license number"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                autoCapitalize="characters"
                leftIcon={<FileText size={20} color={Colors.text.secondary} />}
              />

              <TouchableOpacity style={styles.uploadSection}>
                <Text style={styles.uploadTitle}>📄 Upload Documents</Text>
                <Text style={styles.uploadSubtitle}>License, Insurance, Vehicle Registration</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.buttonContainer}>
            {currentStep === 1 ? (
              <Button
                title="Next"
                onPress={handleNext}
                fullWidth
                size="large"
              />
            ) : (
              <>
                <Button
                  title="Submit Application"
                  onPress={handleSignup}
                  loading={loading}
                  fullWidth
                  size="large"
                />
                <Button
                  title="Back"
                  onPress={() => setCurrentStep(1)}
                  variant="outline"
                  fullWidth
                  size="large"
                  style={styles.backButton}
                />
              </>
            )}
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already a driver? </Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.padding.screen,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  animationContainer: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  animationWrapper: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  lottieAnimation: {
    width: 220,
    height: 120,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: Spacing['2xl'],
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border.light,
    borderRadius: 2,
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.main,
    borderRadius: 2,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  vehicleTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  vehicleTypeButton: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.light,
    marginHorizontal: Spacing.xs,
  },
  vehicleTypeButtonActive: {
    borderColor: Colors.primary.main,
    backgroundColor: Colors.primary.light + '20',
  },
  vehicleIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  vehicleTypeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  vehicleTypeTextActive: {
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.semiBold,
  },
  uploadSection: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  uploadTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  uploadSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  buttonContainer: {
    marginBottom: Spacing.xl,
  },
  backButton: {
    marginTop: Spacing.md,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  loginLink: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.semiBold,
  },
});