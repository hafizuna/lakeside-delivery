export const Typography = {
  // Font families (legacy support)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    light: 'System',
  },
  
  // Font sizes (legacy support)
  fontSize: {
    xs: 10,      // Extra small
    sm: 12,      // Small
    base: 14,    // Base size
    md: 16,      // Medium
    lg: 18,      // Large
    xl: 20,      // Extra large
    '2xl': 24,   // 2X Large
    '3xl': 28,   // 3X Large
    '4xl': 32,   // 4X Large
    '5xl': 36,   // 5X Large
  },
  
  // Font weights (legacy support)
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },
  
  // New structure for consistency
  sizes: {
    xs: 10,      // Extra small
    sm: 12,      // Small
    base: 14,    // Base size
    md: 16,      // Medium
    lg: 18,      // Large
    xl: 20,      // Extra large
    xxl: 24,     // 2X Large
    xxxl: 28,    // 3X Large
    xxxxl: 32,   // 4X Large
    xxxxxl: 36,  // 5X Large
  },
  
  // New structure for consistency
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Text styles (combinations)
  textStyles: {
    // Headers
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 1.2,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 1.3,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 1.3,
    },
    h5: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 1.4,
    },
    h6: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 1.4,
    },
    
    // Body text
    bodyLarge: {
      fontSize: 18,
      fontWeight: '400',
      lineHeight: 1.6,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.5,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 1.5,
    },
    
    // Special text
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 1.4,
    },
    overline: {
      fontSize: 10,
      fontWeight: '500',
      lineHeight: 1.4,
      letterSpacing: 1.5,
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 1.2,
    },
    subtitle1: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 1.4,
    },
    subtitle2: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 1.4,
    },
  },
};
