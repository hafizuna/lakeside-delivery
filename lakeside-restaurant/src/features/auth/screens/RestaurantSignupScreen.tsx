import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { Colors } from '../../../shared/theme/colors';
import { Typography } from '../../../shared/theme/typography';
import { Spacing } from '../../../shared/theme/spacing';
import Button from '../../../components/ui/Button';
import TextInput from '../../../components/ui/TextInput';
import { useAuth } from '../context/AuthContext';

type RestaurantSignupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'RestaurantSignup'>;

interface FormData {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
  businessLicense: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  businessLicense?: string;
  general?: string;
}

const RestaurantSignupScreen: React.FC = () => {
  const navigation = useNavigation<RestaurantSignupScreenNavigationProp>();
  const { register, loading } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessLicense: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Restaurant name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Restaurant name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Restaurant name must be at least 2 characters';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(\+251|0)[79]\d{8}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid Ethiopian phone number';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }


    // Business license validation (optional but if provided, should be valid URL)
    if (formData.businessLicense.trim() && !isValidUrl(formData.businessLicense.trim())) {
      newErrors.businessLicense = 'Please enter a valid URL for business license document';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    try {
      const signupData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        businessLicense: formData.businessLicense.trim() || undefined,
      };

      const result = await register(signupData);
      
      if (result.success) {
        Alert.alert(
          'Registration Submitted!',
          'Your restaurant registration has been submitted successfully. Please wait for admin approval before you can log in and start receiving orders.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        setErrors({ general: result.message || 'Registration failed. Please check your information and try again.' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'An error occurred during registration. Please try again.' });
    }
  };

  const handleBusinessLicenseInfo = () => {
    Alert.alert(
      'Business License Information',
      'Provide a link to your business license document. This can be a cloud storage link (Google Drive, Dropbox, etc.) or any publicly accessible URL. This field is optional but providing it may help speed up the approval process.',
      [
        { text: 'Learn More', onPress: () => Linking.openURL('https://example.com/business-license-help') },
        { text: 'Got it', style: 'cancel' }
      ]
    );
  };

  return (
    <LinearGradient
      colors={[Colors.background.secondary, Colors.background.primary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="restaurant" size={60} color={Colors.primary.main} />
              </View>
              <Text style={styles.title}>Register Your Restaurant</Text>
              <Text style={styles.subtitle}>Apply to join our platform - pending admin approval</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* General Error */}
            {errors.general && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={Colors.error.main} />
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            )}

            {/* Restaurant Name */}
            <TextInput
              label="Restaurant Name *"
              placeholder="Enter your restaurant name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              error={errors.name}
              containerStyle={styles.inputContainer}
            />

            {/* Phone Number */}
            <TextInput
              label="Phone Number *"
              placeholder="+251912345678 or 0912345678"
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType="phone-pad"
              error={errors.phone}
              containerStyle={styles.inputContainer}
            />

            {/* Password */}
            <View style={styles.passwordContainer}>
              <TextInput
                label="Password *"
                placeholder="Create a secure password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                error={errors.password}
                containerStyle={styles.inputContainer}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={Colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View style={styles.passwordContainer}>
              <TextInput
                label="Confirm Password *"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                error={errors.confirmPassword}
                containerStyle={styles.inputContainer}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color={Colors.text.secondary}
                />
              </TouchableOpacity>
            </View>


            {/* Business License */}
            <View style={styles.businessLicenseContainer}>
              <View style={styles.businessLicenseHeader}>
                <Text style={styles.businessLicenseLabel}>Business License (Optional)</Text>
                <TouchableOpacity
                  style={styles.infoButton}
                  onPress={handleBusinessLicenseInfo}
                >
                  <Ionicons name="information-circle-outline" size={20} color={Colors.primary.main} />
                </TouchableOpacity>
              </View>
              <TextInput
                placeholder="https://example.com/your-business-license"
                value={formData.businessLicense}
                onChangeText={(value) => handleInputChange('businessLicense', value)}
                error={errors.businessLicense}
                containerStyle={styles.inputContainer}
                keyboardType="url"
              />
              <Text style={styles.helpText}>
                Provide a link to your business license document - helps speed up approval
              </Text>
            </View>
          </View>

          {/* Terms and Register Button */}
          <View style={styles.footer}>
            <Text style={styles.termsText}>
              By registering, you agree to our{' '}
              <TouchableOpacity onPress={() => Linking.openURL('https://example.com/terms')}>
                <Text style={styles.linkText}>Terms of Service</Text>
              </TouchableOpacity>
              {' '}and{' '}
              <TouchableOpacity onPress={() => Linking.openURL('https://example.com/privacy')}>
                <Text style={styles.linkText}>Privacy Policy</Text>
              </TouchableOpacity>
            </Text>

            <Button
              title={loading ? "Creating Account..." : "Register Restaurant"}
              onPress={handleSignup}
              disabled={loading}
              size="large"
              style={styles.registerButton}
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: Spacing.lg,
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: Spacing.xs,
    marginBottom: Spacing.md,
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${Colors.primary.main}15`,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error.light,
    padding: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error.main,
  },
  generalErrorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error.dark,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordToggle: {
    position: 'absolute',
    right: Spacing.md,
    top: 38,
    padding: Spacing.xs,
  },
  businessLicenseContainer: {
    marginBottom: Spacing.md,
  },
  businessLicenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  businessLicenseLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    flex: 1,
  },
  infoButton: {
    padding: Spacing.xs,
  },
  helpText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  footer: {
    marginBottom: Spacing.xl,
  },
  termsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  linkText: {
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.medium,
  },
  registerButton: {
    marginBottom: Spacing.lg,
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

export default RestaurantSignupScreen;
