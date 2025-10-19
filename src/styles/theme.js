import { Platform } from 'react-native';

const theme = {
  colors: {
    // Primary colors from Login.js
    primary: '#4a5c47', // Muted green accent
    background: '#1a1512', // Dark brown/black background
    backgroundSecondary: '#2a221b', // Darker brown for inputs/cards
    
    // Text colors from Login.js
    textPrimary: '#f5e6d3', // Cream/beige primary text
    textSecondary: '#b5a792', // Muted gold/beige secondary text
    
    // Legacy colors (keeping for compatibility but updating)
    deepSpace: '#1a1512', // Updated to match background
    secondaryBlue: '#2a221b', // Updated to match secondary background
    purpleAccent: '#4a5c47', // Updated to match primary
    white: '#f5e6d3', // Updated to match text primary
    black: '#1a1512', // Updated to match background
    
    // Card colors updated to match theme
    cardBackground: 'rgba(42, 34, 27, 0.8)', // Semi-transparent secondary background
    cardBorder: 'rgba(139, 115, 85, 0.2)', // Muted gold border
    cardBackgroundSolid: '#2a221b', // Solid secondary background
    
    // Text colors updated
    textMuted: 'rgba(181, 167, 146, 0.6)', // Muted secondary text
    
    // Overlay colors updated
    overlay: 'rgba(26, 21, 18, 0.7)', // Background with transparency
    overlayLight: 'rgba(26, 21, 18, 0.5)', // Lighter overlay
    overlayDark: 'rgba(26, 21, 18, 0.9)', // Darker overlay
    
    // Status colors (keeping original for contrast)
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
  },
  
  typography: {
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
    fontFamilyBold: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
    
    // Font sizes
    h1: 32,
    h2: 28,
    h3: 24,
    h4: 20,
    body: 16,
    caption: 14,
    small: 12,
    
    // Font weights
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 15,
    xl: 20,
    round: 50,
  },
  
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
  
  gradients: {
    primary: ['#1a1512', '#2a221b', '#4a5c47'],
    card: ['rgba(42, 34, 27, 0.8)', 'rgba(42, 34, 27, 0.4)'],
    overlay: ['rgba(26, 21, 18, 0.8)', 'rgba(26, 21, 18, 0.4)'],
  },
  
  layout: {
    screenPadding: 20,
    cardPadding: 20,
    buttonPadding: 16,
    inputPadding: 12,
    
    // Touch targets
    minTouchTarget: 44,
    
    // Common dimensions
    headerHeight: 60,
    tabBarHeight: 80,
    buttonHeight: 48,
    inputHeight: 44,
  },
};

export default theme;
