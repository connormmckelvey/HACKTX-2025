// Theme and styling configuration for the AR stargazing application

import { StyleSheet, Dimensions } from 'react-native';
import { UI_CONFIG, COLOR_SCHEMES } from '../config/constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base styles
export const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  camera: {
    flex: 1,
  },
  
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10, // Above black overlay
  },
  
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
});

// Debug box styles
export const debugStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: UI_CONFIG.DEBUG_BOX_POSITION.top,
    left: UI_CONFIG.DEBUG_BOX_POSITION.left,
    ...UI_CONFIG.DEBUG_BOX_STYLE,
    pointerEvents: 'none',
    zIndex: 1000, // Above everything else
  },
  
  text: {
    ...UI_CONFIG.DEBUG_TEXT_STYLE,
  },
  
  title: {
    ...UI_CONFIG.DEBUG_TEXT_STYLE,
    fontWeight: 'bold',
    marginBottom: 5,
  },
});

// Reticle styles
export const reticleStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: screenHeight / 2 - UI_CONFIG.RETICLE_SIZE / 2,
    left: screenWidth / 2 - UI_CONFIG.RETICLE_SIZE / 2,
    ...UI_CONFIG.RETICLE_STYLE,
    pointerEvents: 'none',
    zIndex: 1000, // Above everything else
  },
  
  crosshair: {
    position: 'absolute',
    backgroundColor: UI_CONFIG.RETICLE_COLOR,
  },
  
  horizontal: {
    width: 20,
    height: 1,
    top: UI_CONFIG.RETICLE_SIZE / 2 - 0.5,
    left: -6,
  },
  
  vertical: {
    width: 1,
    height: 20,
    left: UI_CONFIG.RETICLE_SIZE / 2 - 0.5,
    top: -6,
  },
});

// Permission screen styles
export const permissionStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  
  message: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});

// Loading screen styles
export const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
  
  subtext: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  
  spinner: {
    marginBottom: 20,
  },
});

// Star rendering styles (for Skia canvas)
export const starStyles = {
  // Base star paint configuration
  baseStarPaint: {
    color: COLOR_SCHEMES.DEFAULT.stars,
    style: 'fill' as const,
    antiAlias: true,
  },
  
  // Constellation line paint configuration
  constellationLinePaint: {
    color: COLOR_SCHEMES.DEFAULT.constellations,
    style: 'stroke' as const,
    strokeWidth: 0.8,
    antiAlias: true,
  },
  
  // Bright star paint (magnitude < 1.0)
  brightStarPaint: {
    color: '#FFFFFF',
    style: 'fill' as const,
    antiAlias: true,
  },
  
  // Medium star paint (magnitude 1.0 - 3.0)
  mediumStarPaint: {
    color: '#E0E0E0',
    style: 'fill' as const,
    antiAlias: true,
  },
  
  // Dim star paint (magnitude > 3.0)
  dimStarPaint: {
    color: '#B0B0B0',
    style: 'fill' as const,
    antiAlias: true,
  },
};

// Animation styles
export const animationStyles = StyleSheet.create({
  fadeIn: {
    opacity: 0,
  },
  
  fadeInActive: {
    opacity: 1,
  },
  
  slideUp: {
    transform: [{ translateY: 50 }],
    opacity: 0,
  },
  
  slideUpActive: {
    transform: [{ translateY: 0 }],
    opacity: 1,
  },
});

// Responsive styles
export const responsiveStyles = StyleSheet.create({
  // Small screens (phones in portrait)
  smallScreen: {
    fontSize: 10,
    padding: 8,
  },
  
  // Large screens (tablets)
  largeScreen: {
    fontSize: 14,
    padding: 12,
  },
});

// Color scheme variations
export const colorSchemeStyles = {
  default: {
    stars: '#FFFFFF',
    constellations: 'rgba(255, 255, 255, 0.3)',
    ui: '#FFFFFF',
  },
  nightVision: {
    stars: '#00FF00',
    constellations: 'rgba(0, 255, 0, 0.3)',
    ui: '#00FF00',
  },
  warm: {
    stars: '#FFD700',
    constellations: 'rgba(255, 215, 0, 0.3)',
    ui: '#FFD700',
  },
};

// Utility functions for dynamic styling
export const getStarColor = (magnitude: number): string => {
  if (magnitude < 1.0) return '#FFFFFF';
  if (magnitude < 3.0) return '#E0E0E0';
  return '#B0B0B0';
};

export const getStarSize = (magnitude: number, baseSize: number = 2): number => {
  // Brighter stars (lower magnitude) should be larger
  const sizeMultiplier = Math.max(0.5, 3.0 - magnitude);
  return baseSize * sizeMultiplier;
};

export const getConstellationOpacity = (distance: number): number => {
  // Fade constellation lines based on distance from center
  const maxDistance = Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight) / 2;
  const normalizedDistance = Math.min(distance / maxDistance, 1.0);
  return Math.max(0.1, 0.3 * (1.0 - normalizedDistance));
};
