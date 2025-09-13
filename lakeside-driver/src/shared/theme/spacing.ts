export const Spacing = {
  // Base spacing unit (4px)
  base: 4,
  
  // Spacing scale
  xs: 4,      // 4px
  sm: 8,      // 8px
  md: 12,     // 12px
  lg: 16,     // 16px
  xl: 20,     // 20px
  '2xl': 24,  // 24px
  '3xl': 32,  // 32px
  '4xl': 40,  // 40px
  '5xl': 48,  // 48px
  '6xl': 64,  // 64px
  
  // Common spacing combinations
  padding: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    screen: 20,     // Default screen padding
    card: 16,       // Card padding
    button: 16,     // Button padding
  },
  
  margin: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    section: 24,    // Section margins
  },
};

export const Layout = {
  // Border radius (16-24px as per requirements)
  borderRadius: {
    sm: 8,      // Small radius
    md: 12,     // Medium radius
    lg: 16,     // Large radius (minimum per requirement)
    xl: 20,     // Extra large radius
    '2xl': 24,  // Maximum radius per requirement
    full: 9999, // Fully rounded
  },
  
  // Container dimensions
  container: {
    maxWidth: 400,  // Max width for mobile
    padding: 20,    // Container padding
  },
  
  // Component dimensions
  button: {
    height: 48,     // Standard button height
    minWidth: 120,  // Minimum button width
  },
  
  input: {
    height: 48,     // Standard input height
    minHeight: 48,  // Minimum input height
  },
  
  header: {
    height: 56,     // Header height
  },
  
  tabBar: {
    height: 60,     // Bottom tab bar height
  },
  
  // Icon sizes
  icon: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
  },
  
  // Shadow elevations (matching Material Design)
  shadow: {
    sm: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};
