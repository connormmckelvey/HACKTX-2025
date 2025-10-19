// Enhanced star rendering utilities with glow effects and magnitude-based scaling

import { RENDERING_CONFIG } from '../config/constants';

export interface StarRenderData {
  x: number;
  y: number;
  z: number;
  magnitude: number;
  id: string;
  name: string;
  size: number;
  glowSize: number;
  color: string;
  glowColor: string;
  alpha: number;
  glowAlpha: number;
}

/**
 * Calculates star size based on magnitude
 * Lower magnitude = brighter = larger star
 */
export function calculateStarSize(magnitude: number, baseSize: number = RENDERING_CONFIG.STAR_BASE_SIZE): number {
  // Brighter stars (lower magnitude) should be larger
  // Balanced scaling for good visibility without being overwhelming
  const sizeMultiplier = Math.max(0.8, Math.pow(2.5 - magnitude, 1.0));
  return Math.max(1.5, baseSize * sizeMultiplier);
}

/**
 * Calculates star glow size based on star size
 */
export function calculateGlowSize(starSize: number): number {
  return starSize * 1.8; // Reduced from 2.5 to prevent excessive glow
}

/**
 * Calculates star color based on magnitude
 * Brighter stars get whiter colors, dimmer stars get grayer
 */
export function calculateStarColor(magnitude: number): string {
  if (magnitude < 0.5) return '#FFFFFF'; // Very bright stars (Sirius, etc.)
  if (magnitude < 1.0) return '#F8F8FF'; // Bright stars
  if (magnitude < 2.0) return '#F0F0F0'; // Medium bright stars
  if (magnitude < 3.0) return '#E0E0E0'; // Medium stars
  if (magnitude < 4.0) return '#C0C0C0'; // Dim stars
  return '#A0A0A0'; // Very dim stars
}

/**
 * Calculates star glow color based on magnitude
 * Glow color matches star color but with transparency
 */
export function calculateGlowColor(magnitude: number): string {
  const baseColor = calculateStarColor(magnitude);
  // Convert hex to rgba with glow alpha
  const alpha = RENDERING_CONFIG.STAR_GLOW_ALPHA;
  
  if (baseColor.startsWith('#')) {
    const hex = baseColor.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  return baseColor;
}

/**
 * Calculates star alpha based on magnitude and distance
 * Closer stars are more opaque, distant stars are more transparent
 */
export function calculateStarAlpha(magnitude: number, distance: number = 1.0): number {
  // Base alpha from magnitude
  let baseAlpha: number = RENDERING_CONFIG.STAR_ALPHA;
  
  // Adjust alpha based on magnitude (brighter stars more opaque)
  if (magnitude < 1.0) baseAlpha = 1.0;
  else if (magnitude < 2.0) baseAlpha = 0.95;
  else if (magnitude < 3.0) baseAlpha = 0.9;
  else if (magnitude < 4.0) baseAlpha = 0.8;
  else if (magnitude < 5.0) baseAlpha = 0.7;
  else baseAlpha = 0.6;
  
  // Adjust alpha based on distance (closer stars more opaque)
  const distanceAlpha = Math.max(0.3, 1.0 - (distance - 1.0) * 0.2);
  
  return Math.min(baseAlpha, distanceAlpha);
}

/**
 * Calculates glow alpha based on star magnitude
 */
export function calculateGlowAlpha(magnitude: number): number {
  // Brighter stars have more prominent glow
  if (magnitude < 1.0) return RENDERING_CONFIG.STAR_GLOW_ALPHA * 1.5;
  if (magnitude < 2.0) return RENDERING_CONFIG.STAR_GLOW_ALPHA * 1.2;
  if (magnitude < 3.0) return RENDERING_CONFIG.STAR_GLOW_ALPHA;
  return RENDERING_CONFIG.STAR_GLOW_ALPHA * 0.8;
}

/**
 * Creates complete star render data with all visual properties
 */
export function createStarRenderData(
  x: number,
  y: number,
  z: number,
  magnitude: number,
  id: string,
  name: string
): StarRenderData {
  const size = calculateStarSize(magnitude);
  const glowSize = calculateGlowSize(size);
  const color = calculateStarColor(magnitude);
  const glowColor = calculateGlowColor(magnitude);
  const alpha = calculateStarAlpha(magnitude);
  const glowAlpha = calculateGlowAlpha(magnitude);
  
  return {
    x,
    y,
    z,
    magnitude,
    id,
    name,
    size,
    glowSize,
    color,
    glowColor,
    alpha,
    glowAlpha,
  };
}

/**
 * Determines if a star should have enhanced rendering (glow, larger size)
 * Based on magnitude threshold
 */
export function shouldEnhanceStar(magnitude: number): boolean {
  return magnitude <= 3.0; // Enhance stars brighter than magnitude 3
}

/**
 * Gets star brightness level for rendering optimization
 * Returns 0-3 where 0 is dimmest, 3 is brightest
 */
export function getStarBrightnessLevel(magnitude: number): number {
  if (magnitude < 1.0) return 3; // Very bright
  if (magnitude < 2.0) return 2; // Bright
  if (magnitude < 3.0) return 1; // Medium
  return 0; // Dim
}

/**
 * Calculates constellation line opacity based on star brightness
 * Lines connecting brighter stars are more visible
 */
export function calculateConstellationLineOpacity(
  star1Magnitude: number,
  star2Magnitude: number
): number {
  const avgMagnitude = (star1Magnitude + star2Magnitude) / 2;
  
  // Brighter constellation lines are more visible
  if (avgMagnitude < 2.0) return RENDERING_CONFIG.CONSTELLATION_LINE_ALPHA * 1.5;
  if (avgMagnitude < 3.0) return RENDERING_CONFIG.CONSTELLATION_LINE_ALPHA * 1.2;
  if (avgMagnitude < 4.0) return RENDERING_CONFIG.CONSTELLATION_LINE_ALPHA;
  return RENDERING_CONFIG.CONSTELLATION_LINE_ALPHA * 0.8;
}

/**
 * Validates star render data for debugging
 */
export function validateStarRenderData(starData: StarRenderData): boolean {
  return (
    starData.size > 0 &&
    starData.glowSize > 0 &&
    starData.alpha >= 0 && starData.alpha <= 1 &&
    starData.glowAlpha >= 0 && starData.glowAlpha <= 1 &&
    starData.x >= 0 && starData.y >= 0 &&
    starData.magnitude >= -2 && starData.magnitude <= 10
  );
}
