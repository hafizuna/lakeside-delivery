import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { Colors, Typography, Spacing } from '../../../shared/theme';
import { Button } from '../../../components/ui';

const { width } = Dimensions.get('window');

interface OnboardingContainerProps {
  onFinish: () => void;
}

export const OnboardingContainer: React.FC<OnboardingContainerProps> = ({
  onFinish,
}) => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const animationRef = useRef<LottieView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const screens = [
    {
      emoji: '💰',
      title: 'Earn Money on Your Schedule',
      subtitle: 'Work when you want, where you want. Be your own boss and maximize your earnings with flexible delivery opportunities!',
      animation: require('../../../../assets/lottie/wondering.json'),
      gradientColors: Colors.primary.gradient || [Colors.primary.main, Colors.primary.dark]
    },
    {
      emoji: '📍', 
      title: 'Smart Routes, More Deliveries',
      subtitle: 'Our intelligent routing system helps you complete more deliveries in less time, increasing your daily earnings',
      animation: require('../../../../assets/lottie/cheffs.json'),
      gradientColors: [Colors.secondary.main, Colors.primary.main]
    },
    {
      emoji: '⭐',
      title: 'Build Your Reputation, Grow Your Income', 
      subtitle: 'Earn more with tips and bonuses. Top-rated drivers get priority access to high-value orders!',
      animation: require('../../../../assets/lottie/bikers.json'),
      gradientColors: [Colors.action.success, Colors.primary.main]
    }
  ];

  // Play animation when screen changes with smooth transition
  useEffect(() => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Play new animation
      animationRef.current?.play();
      
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
    
    // Slide animation for text
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, [currentScreen]);

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      onFinish();
    }
  };

  // Function to reset onboarding (for testing)
  const resetOnboarding = async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem('@driver_onboarding_seen');
    await AsyncStorage.removeItem('@driver_user');
    console.log('Driver onboarding reset - restart app to see onboarding again');
  };

  const currentScreenData = screens[currentScreen];

  return (
    <LinearGradient
      colors={Colors.primary.gradient || [Colors.primary.main, Colors.primary.dark]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Button
              title="Skip"
              onPress={onFinish}
              variant="text"
              size="small"
              textStyle={styles.skipText}
            />
          </View>

          <View style={styles.animationContainer}>
            <Animated.View style={[
              styles.animationWrapper, 
              { opacity: fadeAnim, backgroundColor: 'transparent' }
            ]}>
              <LottieView
                ref={animationRef}
                source={currentScreenData.animation}
                style={styles.lottieAnimation}
                autoPlay
                loop
                speed={1.0}
                onAnimationFailure={() => console.log('Animation failed to load')}
              />
              {/* Fallback emoji if Lottie fails - hidden by default */}
              <View style={[styles.emojiOverlay, { opacity: 0 }]}>
                <Text style={styles.animationText}>{currentScreenData.emoji}</Text>
              </View>
            </Animated.View>
          </View>

          <Animated.View style={[styles.textContent, { transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.title}>{currentScreenData.title}</Text>
            <Text style={styles.subtitle}>{currentScreenData.subtitle}</Text>
          </Animated.View>

          <View style={styles.footer}>
            <View style={styles.pagination}>
              {screens.map((_, index) => (
                <View 
                  key={index}
                  style={[
                    styles.dot,
                    index === currentScreen && styles.activeDot
                  ]} 
                />
              ))}
            </View>
            
            <Button
              title={currentScreen === screens.length - 1 ? "Start Earning" : "Next"}
              onPress={handleNext}
              variant="secondary"
              fullWidth
              style={styles.nextButton}
            />
            
            {/* Reset button for testing - remove in production */}
            {__DEV__ && (
              <Button
                title="Reset Driver Onboarding (Dev)"
                onPress={resetOnboarding}
                variant="text"
                size="small"
                style={styles.resetButton}
              />
            )}
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.padding.screen,
  },
  header: {
    alignItems: 'flex-end',
    paddingTop: Spacing.lg,
  },
  skipText: {
    color: Colors.text.white,
  },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationWrapper: {
    width: width * 0.7,
    height: width * 0.7,
    backgroundColor: 'transparent',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Spacing.padding,
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  emojiOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.3,
  },
  animationText: {
    fontSize: 60,
  },
  textContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing['3xl'],
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.white,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  footer: {
    paddingBottom: Spacing['2xl'],
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.text.white,
    opacity: 0.3,
    marginHorizontal: Spacing.xs,
  },
  activeDot: {
    opacity: 1,
    width: 24,
  },
  nextButton: {
    backgroundColor: Colors.background.primary,
  },
  resetButton: {
    marginTop: Spacing.md,
  },
});