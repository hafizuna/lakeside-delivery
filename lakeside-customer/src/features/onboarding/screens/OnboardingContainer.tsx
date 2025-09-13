import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, Animated } from 'react-native';
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
      emoji: '🤔',
      title: 'Have You Wondered What to Eat?',
      subtitle: 'Discover endless food possibilities and never wonder about your next meal again!',
animation: require('../../../../assets/lottie/wondering.json'),
      gradientColors: Colors.primary.gradient || [Colors.primary.main, Colors.primary.dark]
    },
    {
      emoji: '👨‍🍳', 
      title: 'Pick the Best Food with the Best Chefs',
      subtitle: 'Experience culinary excellence from top-rated chefs in your area, crafted with passion and precision',
animation: require('../../../../assets/lottie/cheffs.json'),
      gradientColors: [Colors.secondary.main, Colors.primary.main]
    },
    {
      emoji: '🚴‍♂️',
      title: 'Our Bikers Are Fast & You Can Track Them', 
      subtitle: 'Lightning-fast delivery with real-time tracking. Watch your order journey from kitchen to your door!',
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
    await AsyncStorage.removeItem('@onboarding_seen');
    await AsyncStorage.removeItem('@user');
    console.log('Onboarding reset - restart app to see onboarding again');
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
              title={currentScreen === screens.length - 1 ? "Get Started" : "Next"}
              onPress={handleNext}
              variant="secondary"
              fullWidth
              style={styles.nextButton}
            />
            
            {/* Reset button for testing - remove in production */}
            {__DEV__ && (
              <Button
                title="Reset Onboarding (Dev)"
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
    backgroundColor: 'transparent', // Options: 'transparent' | 'rgba(255,255,255,0.1)' | Colors.background.primary
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
    opacity: 0.3, // Show emoji as subtle background
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
