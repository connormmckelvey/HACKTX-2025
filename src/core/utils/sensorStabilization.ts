// Sensor stabilization utilities using Complementary Filter
// Provides smooth, stable quaternion data for AR rendering

import { Quaternion } from './quaternion';
import { multiplyQuaternions, normalizeQuaternion, slerpQuaternions } from './quaternion';

export interface SensorFilter {
  alpha: number; // Complementary filter coefficient (0-1)
  previousQuaternion: Quaternion;
  isInitialized: boolean;
}

/**
 * Creates a new sensor filter instance
 * @param alpha Filter coefficient (0.1 = more smoothing, 0.9 = less smoothing)
 */
export function createSensorFilter(alpha: number = 0.1): SensorFilter {
  return {
    alpha,
    previousQuaternion: { x: 0, y: 0, z: 0, w: 1 },
    isInitialized: false,
  };
}

/**
 * Applies complementary filter to smooth quaternion data
 * @param filter Filter instance
 * @param rawQuaternion Raw quaternion from sensor
 * @returns Smoothed quaternion
 */
export function applyComplementaryFilter(
  filter: SensorFilter,
  rawQuaternion: Quaternion
): Quaternion {
  // Normalize the input quaternion
  const normalizedInput = normalizeQuaternion(rawQuaternion);
  
  if (!filter.isInitialized) {
    // First frame - initialize with current quaternion
    filter.previousQuaternion = normalizedInput;
    filter.isInitialized = true;
    return normalizedInput;
  }
  
  // Apply complementary filter: smoothed = alpha * previous + (1-alpha) * current
  const smoothedQuaternion = slerpQuaternions(
    filter.previousQuaternion,
    normalizedInput,
    1 - filter.alpha
  );
  
  // Update previous quaternion for next frame
  filter.previousQuaternion = smoothedQuaternion;
  
  return smoothedQuaternion;
}

/**
 * Applies low-pass filter as alternative smoothing method
 * @param filter Filter instance
 * @param rawQuaternion Raw quaternion from sensor
 * @param cutoffFrequency Cutoff frequency (0.1 = more smoothing, 0.9 = less smoothing)
 * @returns Smoothed quaternion
 */
export function applyLowPassFilter(
  filter: SensorFilter,
  rawQuaternion: Quaternion,
  cutoffFrequency: number = 0.1
): Quaternion {
  const normalizedInput = normalizeQuaternion(rawQuaternion);
  
  if (!filter.isInitialized) {
    filter.previousQuaternion = normalizedInput;
    filter.isInitialized = true;
    return normalizedInput;
  }
  
  // Low-pass filter: smoothed = previous + cutoff * (current - previous)
  const smoothedQuaternion = {
    x: filter.previousQuaternion.x + cutoffFrequency * (normalizedInput.x - filter.previousQuaternion.x),
    y: filter.previousQuaternion.y + cutoffFrequency * (normalizedInput.y - filter.previousQuaternion.y),
    z: filter.previousQuaternion.z + cutoffFrequency * (normalizedInput.z - filter.previousQuaternion.z),
    w: filter.previousQuaternion.w + cutoffFrequency * (normalizedInput.w - filter.previousQuaternion.w),
  };
  
  // Normalize the result
  const normalizedSmoothed = normalizeQuaternion(smoothedQuaternion);
  
  // Update previous quaternion
  filter.previousQuaternion = normalizedSmoothed;
  
  return normalizedSmoothed;
}

/**
 * Detects if quaternion change is too abrupt (indicating potential sensor noise)
 * @param previous Previous quaternion
 * @param current Current quaternion
 * @param threshold Threshold for detecting abrupt changes (default: 0.1)
 * @returns true if change is too abrupt
 */
export function isAbruptChange(
  previous: Quaternion,
  current: Quaternion,
  threshold: number = 0.1
): boolean {
  // Calculate angular difference between quaternions
  const dot = Math.abs(
    previous.x * current.x +
    previous.y * current.y +
    previous.z * current.z +
    previous.w * current.w
  );
  
  // Clamp dot product to avoid numerical errors
  const clampedDot = Math.min(1, Math.max(-1, dot));
  
  // Calculate angle between quaternions
  const angle = 2 * Math.acos(clampedDot);
  
  return angle > threshold;
}

/**
 * Adaptive filter that adjusts smoothing based on motion intensity
 * @param filter Filter instance
 * @param rawQuaternion Raw quaternion from sensor
 * @param baseAlpha Base smoothing coefficient
 * @param motionThreshold Motion threshold for adaptive adjustment
 * @returns Smoothed quaternion with adaptive smoothing
 */
export function applyAdaptiveFilter(
  filter: SensorFilter,
  rawQuaternion: Quaternion,
  baseAlpha: number = 0.1,
  motionThreshold: number = 0.05
): Quaternion {
  const normalizedInput = normalizeQuaternion(rawQuaternion);
  
  if (!filter.isInitialized) {
    filter.previousQuaternion = normalizedInput;
    filter.isInitialized = true;
    return normalizedInput;
  }
  
  // Detect motion intensity
  const isMovingFast = isAbruptChange(filter.previousQuaternion, normalizedInput, motionThreshold);
  
  // Adjust smoothing based on motion
  const adaptiveAlpha = isMovingFast ? baseAlpha * 0.5 : baseAlpha; // Less smoothing when moving fast
  
  // Apply complementary filter with adaptive coefficient
  const smoothedQuaternion = slerpQuaternions(
    filter.previousQuaternion,
    normalizedInput,
    1 - adaptiveAlpha
  );
  
  filter.previousQuaternion = smoothedQuaternion;
  
  return smoothedQuaternion;
}

/**
 * Resets the filter to initial state
 * @param filter Filter instance to reset
 */
export function resetSensorFilter(filter: SensorFilter): void {
  filter.previousQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  filter.isInitialized = false;
}

/**
 * Gets filter statistics for debugging
 * @param filter Filter instance
 * @returns Filter statistics
 */
export function getFilterStats(filter: SensorFilter): {
  isInitialized: boolean;
  alpha: number;
  previousMagnitude: number;
} {
  const magnitude = Math.sqrt(
    filter.previousQuaternion.x ** 2 +
    filter.previousQuaternion.y ** 2 +
    filter.previousQuaternion.z ** 2 +
    filter.previousQuaternion.w ** 2
  );
  
  return {
    isInitialized: filter.isInitialized,
    alpha: filter.alpha,
    previousMagnitude: magnitude,
  };
}
