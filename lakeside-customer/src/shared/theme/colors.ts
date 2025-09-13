export const Colors = {
  // Primary warm gradient colors (orange/yellow)
  primary: {
    main: '#FF6B35',        // Vibrant orange
    light: '#FF8A65',       // Lighter orange
    dark: '#E64100',        // Darker orange
    gradient: ['#FFB74D', '#FF8A50'],  // Yellow to orange gradient
  },
  
  // Secondary colors
  secondary: {
    main: '#FFC107',        // Warm yellow
    light: '#FFF176',       // Light yellow
    dark: '#FF8F00',        // Dark yellow/amber
  },
  
  // Background colors
  background: {
    primary: '#FFFFFF',      // Pure white
    secondary: '#F8F9FA',    // Very light gray
    card: '#FFFFFF',         // Card backgrounds
    overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlays
  },
  
  // Text colors
  text: {
    primary: '#1A1A1A',      // Almost black for headers
    secondary: '#666666',    // Medium gray for details
    light: '#999999',        // Light gray for subtle text
    white: '#FFFFFF',        // White text for dark backgrounds
    placeholder: '#CCCCCC',  // Placeholder text
  },
  
  // Action colors
  action: {
    success: '#4CAF50',      // Green for success states
    error: '#F44336',        // Red for errors
    warning: '#FF9800',      // Orange for warnings
    info: '#2196F3',         // Blue for info
  },
  
  // UI element colors
  border: {
    light: '#E0E0E0',        // Light borders
    medium: '#BDBDBD',       // Medium borders
    dark: '#757575',         // Dark borders
  },
  
  // Shadow colors
  shadow: {
    light: 'rgba(0, 0, 0, 0.08)',    // Light shadow
    medium: 'rgba(0, 0, 0, 0.16)',   // Medium shadow
    dark: 'rgba(0, 0, 0, 0.24)',     // Dark shadow
  },
  
  // Status colors for orders
  status: {
    pending: '#FF9800',      // Orange
    confirmed: '#2196F3',    // Blue
    preparing: '#FF6B35',    // Primary orange
    ready: '#4CAF50',        // Green
    delivered: '#4CAF50',    // Green
    cancelled: '#F44336',    // Red
  },
  
  // Rating colors
  rating: {
    star: '#FFD700',         // Gold for stars
    background: '#F5F5F5',   // Light gray background
  },

  // Convenience aliases for backward compatibility
  primaryColor: '#FF6B35',        // Primary color shortcut
  primaryLight: '#FFE5DB',   // Light primary for backgrounds
  primaryDark: '#E64100',    // Dark primary
  // background: '#F8F9FA',     // Default background
  // text: '#1A1A1A',           // Default text color
  // textSecondary: '#666666',  // Secondary text
  // border: '#E0E0E0',         // Default border
  success: '#4CAF50',        // Success color
  warning: '#FF9800',        // Warning color
  error: '#F44336'           // Error color
};
