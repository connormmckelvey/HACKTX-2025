// Star interaction utilities for tap detection and name display

import { UI_CONFIG } from '../config/constants';
import { StarRenderData } from './starRendering';

export interface TapEvent {
  x: number;
  y: number;
  timestamp: number;
}

export interface StarTapResult {
  star: StarRenderData | null;
  distance: number;
  isWithinTapRadius: boolean;
}

export interface StarNameDisplay {
  starName: string;
  x: number;
  y: number;
  timestamp: number;
  duration: number;
}

/**
 * Calculates distance between tap point and star position
 */
export function calculateTapDistance(
  tapX: number,
  tapY: number,
  starX: number,
  starY: number
): number {
  const dx = tapX - starX;
  const dy = tapY - starY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Checks if tap is within star's tap radius
 */
export function isTapWithinStarRadius(
  tapX: number,
  tapY: number,
  star: StarRenderData,
  tapRadius: number = UI_CONFIG.STAR_TAP_RADIUS
): boolean {
  const distance = calculateTapDistance(tapX, tapY, star.x, star.y);
  return distance <= tapRadius;
}

/**
 * Finds the closest star to a tap point within the tap radius
 */
export function findClosestStarToTap(
  tapX: number,
  tapY: number,
  visibleStars: StarRenderData[],
  tapRadius: number = UI_CONFIG.STAR_TAP_RADIUS
): StarTapResult {
  let closestStar: StarRenderData | null = null;
  let closestDistance = Infinity;
  
  for (const star of visibleStars) {
    const distance = calculateTapDistance(tapX, tapY, star.x, star.y);
    
    if (distance <= tapRadius && distance < closestDistance) {
      closestStar = star;
      closestDistance = distance;
    }
  }
  
  return {
    star: closestStar,
    distance: closestDistance,
    isWithinTapRadius: closestStar !== null,
  };
}

/**
 * Creates a star name display object
 */
export function createStarNameDisplay(
  star: StarRenderData,
  tapX: number,
  tapY: number,
  duration: number = UI_CONFIG.STAR_NAME_DISPLAY_DURATION
): StarNameDisplay {
  return {
    starName: star.name,
    x: tapX,
    y: tapY,
    timestamp: Date.now(),
    duration,
  };
}

/**
 * Checks if a star name display should still be shown
 */
export function isStarNameDisplayActive(display: StarNameDisplay): boolean {
  const elapsed = Date.now() - display.timestamp;
  return elapsed < display.duration;
}

/**
 * Calculates optimal position for star name display
 * Ensures the text doesn't go off-screen
 */
export function calculateStarNamePosition(
  starX: number,
  starY: number,
  screenWidth: number,
  screenHeight: number,
  textWidth: number = 100, // Estimated text width
  textHeight: number = 20  // Estimated text height
): { x: number; y: number } {
  let displayX = starX;
  let displayY = starY - 30; // Position above the star
  
  // Adjust horizontal position to keep text on screen
  if (displayX - textWidth / 2 < 10) {
    displayX = textWidth / 2 + 10;
  } else if (displayX + textWidth / 2 > screenWidth - 10) {
    displayX = screenWidth - textWidth / 2 - 10;
  }
  
  // Adjust vertical position to keep text on screen
  if (displayY < 10) {
    displayY = starY + 30; // Position below the star if above is off-screen
  }
  
  if (displayY + textHeight > screenHeight - 10) {
    displayY = screenHeight - textHeight - 10;
  }
  
  return { x: displayX, y: displayY };
}

/**
 * Gets star name display style based on star magnitude
 */
export function getStarNameDisplayStyle(magnitude: number) {
  const baseStyle = UI_CONFIG.STAR_NAME_STYLE;
  
  // Brighter stars get more prominent text styling
  if (magnitude < 1.0) {
    return {
      ...baseStyle,
      fontSize: 16,
      fontWeight: 'bold' as const,
      color: '#FFFFFF',
    };
  } else if (magnitude < 2.0) {
    return {
      ...baseStyle,
      fontSize: 15,
      fontWeight: 'bold' as const,
      color: '#F8F8FF',
    };
  } else if (magnitude < 3.0) {
    return {
      ...baseStyle,
      fontSize: 14,
      fontWeight: '600' as const,
      color: '#F0F0F0',
    };
  } else {
    return {
      ...baseStyle,
      fontSize: 13,
      fontWeight: '500' as const,
      color: '#E0E0E0',
    };
  }
}

/**
 * Validates tap event data
 */
export function validateTapEvent(tapEvent: TapEvent): boolean {
  return (
    typeof tapEvent.x === 'number' &&
    typeof tapEvent.y === 'number' &&
    typeof tapEvent.timestamp === 'number' &&
    tapEvent.x >= 0 &&
    tapEvent.y >= 0 &&
    tapEvent.timestamp > 0
  );
}

/**
 * Debounces tap events to prevent multiple rapid taps
 */
export class TapDebouncer {
  private lastTapTime: number = 0;
  private debounceDelay: number = 300; // milliseconds
  
  constructor(debounceDelay: number = 300) {
    this.debounceDelay = debounceDelay;
  }
  
  canProcessTap(): boolean {
    const now = Date.now();
    if (now - this.lastTapTime >= this.debounceDelay) {
      this.lastTapTime = now;
      return true;
    }
    return false;
  }
  
  reset(): void {
    this.lastTapTime = 0;
  }
}
