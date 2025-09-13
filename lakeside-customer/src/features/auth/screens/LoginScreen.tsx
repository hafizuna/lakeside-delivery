import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PhoneIcon, LockIcon, EyeIcon, EyeOffIcon } from '../../../shared/components/CustomIcons';
import LottieView from 'lottie-react-native';
import { Colors, Typography, Spacing, Layout } from '../../../shared/theme';
import { Button, TextInput } from '../../../components/ui';
import { useToast } from '../../../shared/context/ToastContext';

interface LoginScreenProps {
  onLogin: (phone: string, password: string) => void;
  onNavigateToSignup: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onNavigateToSignup,
}) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError, showWarning } = useToast();

  const handleLogin = async () => {
    // Validation
    if (!phone.trim()) {
      showWarning('Missing Phone Number', 'Please enter your phone number to continue.');
      return;
    }
    
    if (!password.trim()) {
      showWarning('Missing Password', 'Please enter your password to continue.');
      return;
    }
    
    if (phone.length < 10) {
      showError('Invalid Phone Number', 'Please enter a valid phone number (at least 10 digits).');
      return;
    }

    setLoading(true);
    try {
      await onLogin(phone, password);
      showSuccess('Welcome back! 🎉', 'You have successfully logged in.');
    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMessage = error.message || 'Login failed. Please check your credentials and try again.';
      showError('Login Failed', errorMessage);
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
                  onAnimationLoaded={() => console.log('✅ Boarding animation loaded')}
                  onAnimationFailure={(error) => console.log('❌ Boarding animation failed:', error)}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue to Lakeside Delivery</Text>
          </View>

          <View style={styles.form}>
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
              placeholder="Enter your password"
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
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="large"
            />
          </View>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onNavigateToSignup}>
              <Text style={styles.signupLink}>Sign Up</Text>
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
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['2xl'],
  },
  animationContainer: {
    marginBottom: Spacing['2xl'],
    alignItems: 'center',
  },
  animationWrapper: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.1)', // Temporary debug background
  },
  lottieAnimation: {
    width: 300,
    height: 180,
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
    marginBottom: Spacing['2xl'],
  },
  buttonContainer: {
    marginBottom: Spacing['2xl'],
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  signupLink: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.semiBold,
  },
});
