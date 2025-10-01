import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../shared/theme';
import { useAuth } from '../features/auth/context/AuthContext';

// Import screens
import { OnboardingContainer } from '../features/onboarding/screens/OnboardingContainer';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { SignupScreen } from '../features/auth/screens/SignupScreen';
import { MainNavigator } from './MainNavigator';

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={Colors.primary.main} />
  </View>
);

export const AppNavigator: React.FC = () => {
  const { 
    isLoading, 
    isAuthenticated, 
    hasSeenOnboarding, 
    login, 
    signup,
    finishOnboarding 
  } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasSeenOnboarding ? (
          <Stack.Screen name="Onboarding">
            {() => <OnboardingContainer onFinish={finishOnboarding} />}
          </Stack.Screen>
        ) : !isAuthenticated ? (
          <>
            <Stack.Screen name="Login">
              {({ navigation }) => (
                <LoginScreen
                  onLogin={login}
                  onNavigateToSignup={() => navigation.navigate('Signup')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Signup">
              {({ navigation }) => (
                <SignupScreen
                  onSignup={signup}
                  onNavigateToLogin={() => navigation.navigate('Login')}
                />
              )}
            </Stack.Screen>
          </>
        ) : (
          <Stack.Screen name="Home">
            {() => <MainNavigator />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
});