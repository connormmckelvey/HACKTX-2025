// Sky orientation calculations using astronomy-engine
// Determines the initial "world rotation" quaternion based on observer location and time

import * as Astronomy from 'astronomy-engine';
import { ObserverData } from './observer';
import { Quaternion } from './quaternion';
import { multiplyQuaternions, axisAngleToQuaternion, invertQuaternion } from './quaternion';

export interface SkyOrientation {
  worldRotationQuaternion: Quaternion;
  celestialPoleElevation: number;
  meridianOffset: number;
}

/**
 * Calculates the elevation of the celestial pole based on observer latitude
 */
export function calculateCelestialPoleElevation(latitude: number): number {
  return latitude; // For northern hemisphere, celestial pole elevation = latitude
}

/**
 * Calculates the meridian offset based on Local Sidereal Time
 */
export function calculateMeridianOffset(lst: number): number {
  // Convert LST to radians
  return (lst * Math.PI) / 12;
}

/**
 * Creates a quaternion rotation around the Z-axis (yaw)
 */
function createYawRotation(angle: number): Quaternion {
  return axisAngleToQuaternion({ x: 0, y: 0, z: 1 }, angle);
}

/**
 * Creates a quaternion rotation around the X-axis (pitch)
 */
function createPitchRotation(angle: number): Quaternion {
  return axisAngleToQuaternion({ x: 1, y: 0, z: 0 }, angle);
}

/**
 * Creates a quaternion rotation around the Y-axis (roll)
 */
function createRollRotation(angle: number): Quaternion {
  return axisAngleToQuaternion({ x: 0, y: 1, z: 0 }, angle);
}

/**
 * Calculates the world rotation quaternion based on observer data
 * This quaternion transforms from celestial coordinates to device coordinates
 */
export function calculateWorldRotationQuaternion(observerData: ObserverData): Quaternion {
  const { location, lst } = observerData;
  const { latitude, longitude } = location;

  // Step 1: Rotate around Z-axis to align with meridian (LST offset)
  const meridianOffset = calculateMeridianOffset(lst);
  const meridianRotation = createYawRotation(meridianOffset);

  // Step 2: Rotate around X-axis to account for latitude
  // This aligns the celestial pole with the observer's horizon
  const latitudeRotation = createPitchRotation(-latitude * Math.PI / 180);

  // Step 3: Rotate around Z-axis to account for longitude
  // This aligns the local meridian with the prime meridian
  const longitudeRotation = createYawRotation(longitude * Math.PI / 180);

  // Combine rotations: longitude * latitude * meridian
  // This gives us the transformation from celestial coordinates to local coordinates
  let worldRotation = multiplyQuaternions(latitudeRotation, meridianRotation);
  worldRotation = multiplyQuaternions(longitudeRotation, worldRotation);

  return worldRotation;
}

/**
 * Calculates the complete sky orientation including world rotation quaternion
 */
export function calculateSkyOrientation(observerData: ObserverData): SkyOrientation {
  const worldRotationQuaternion = calculateWorldRotationQuaternion(observerData);
  const celestialPoleElevation = calculateCelestialPoleElevation(observerData.location.latitude);
  const meridianOffset = calculateMeridianOffset(observerData.lst);

  return {
    worldRotationQuaternion,
    celestialPoleElevation,
    meridianOffset,
  };
}

/**
 * Gets the inverse world rotation quaternion for transforming from device to celestial coordinates
 */
export function getInverseWorldRotationQuaternion(skyOrientation: SkyOrientation): Quaternion {
  return invertQuaternion(skyOrientation.worldRotationQuaternion);
}

/**
 * Calculates the altitude and azimuth of a celestial object
 * This is used for debugging and verification
 */
export function calculateAltitudeAzimuth(
  ra: number, // Right Ascension in hours
  dec: number, // Declination in degrees
  observerData: ObserverData
): { altitude: number; azimuth: number } {
  try {
    // Calculate altitude and azimuth using spherical trigonometry
    const latitude = observerData.location.latitude;
    const lst = observerData.lst;
    const ha = lst - ra; // Hour angle
    
    const latRad = latitude * Math.PI / 180;
    const decRad = dec * Math.PI / 180;
    const haRad = ha * Math.PI / 12;
    
    const altitude = Math.asin(
      Math.sin(decRad) * Math.sin(latRad) + 
      Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad)
    ) * 180 / Math.PI;
    
    const azimuth = Math.atan2(
      -Math.cos(decRad) * Math.cos(latRad) * Math.sin(haRad),
      Math.sin(decRad) - Math.sin(latRad) * Math.sin(altitude * Math.PI / 180)
    ) * 180 / Math.PI;
    
    return {
      altitude: altitude,
      azimuth: ((azimuth % 360) + 360) % 360,
    };
  } catch (error) {
    console.error('Error calculating altitude/azimuth:', error);
    return { altitude: 0, azimuth: 0 };
  }
}

/**
 * Validates that the sky orientation calculation is reasonable
 */
export function validateSkyOrientation(skyOrientation: SkyOrientation): boolean {
  const { worldRotationQuaternion, celestialPoleElevation } = skyOrientation;
  
  // Check that the quaternion is normalized
  const magnitude = Math.sqrt(
    worldRotationQuaternion.x ** 2 +
    worldRotationQuaternion.y ** 2 +
    worldRotationQuaternion.z ** 2 +
    worldRotationQuaternion.w ** 2
  );
  
  if (Math.abs(magnitude - 1.0) > 0.01) {
    console.warn('World rotation quaternion is not normalized:', magnitude);
    return false;
  }
  
  // Check that celestial pole elevation is reasonable
  if (Math.abs(celestialPoleElevation) > 90) {
    console.warn('Celestial pole elevation is out of range:', celestialPoleElevation);
    return false;
  }
  
  return true;
}
