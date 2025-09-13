import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User } from 'lucide-react-native';
import { PhoneIcon, LockIcon, EyeIcon, EyeOffIcon } from '../../../shared/components/CustomIcons';
import LottieView from 'lottie-react-native';
import { Colors, Typography, Spacing, Layout } from '../../../shared/theme';
import { Button, TextInput } from '../../../components/ui';
import { useToast } from '../../../shared/context/ToastContext';

interface SignupScreenProps {
  onSignup: (userData: { name: string; phone: string; password: string }) => void;
  onNavigateToLogin: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({
  onSignup,
  onNavigateToLogin,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError, showWarning } = useToast();

  const handleSignup = async () => {
    // Validation
    if (!name.trim()) {
      showWarning('Missing Name', 'Please enter your full name to continue.');
      return;
    }
    
    if (!phone.trim()) {
      showWarning('Missing Phone Number', 'Please enter your phone number to continue.');
      return;
    }
    
    if (phone.length < 10) {
      showError('Invalid Phone Number', 'Please enter a valid phone number (at least 10 digits).');
      return;
    }
    
    if (!password.trim()) {
      showWarning('Missing Password', 'Please create a password to continue.');
      return;
    }
    
    if (password.length < 6) {
      showError('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }
    
    if (password !== confirmPassword) {
      showError('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);
    try {
      await onSignup({ name, phone, password });
      showSuccess('Account Created! 🎉', 'Welcome to Lakeside Delivery! You can now start ordering.');
    } catch (error: any) {
      console.error('Signup failed:', error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      showError('Registration Failed', errorMessage);
    }
    setLoading(false);
  };

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
                  onAnimationLoaded={() => console.log('✅ Signup boarding animation loaded')}
                  onAnimationFailure={(error) => console.log('❌ Signup boarding animation failed:', error)}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Lakeside Delivery and start ordering!</Text>
          </View>

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
              placeholder="Create a password"
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
                    <EyeIcon size={20} color={Colors.text.secondary} />
                  ) : (
                    <EyeOffIcon size={20} color={Colors.text.secondary} />
                  )}
                </TouchableOpacity>
              }
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
              fullWidth
              size="large"
            />
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
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
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.1)', // Temporary debug background
  },
  lottieAnimation: {
    width: 250,
    height: 140,
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
  form: {
    marginBottom: Spacing.xl,
  },
  buttonContainer: {
    marginBottom: Spacing.xl,
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
