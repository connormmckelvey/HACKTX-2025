// Coordinate conversion utilities for celestial to Cartesian transformation
// Integrated with astronomy-engine for accurate astronomical calculations

import * as Astronomy from 'astronomy-engine';
import { ObserverData } from './observer';

export interface Cartesian3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Converts celestial coordinates (Right Ascension, Declination) to 3D Cartesian coordinates
 * @param ra Right Ascension in hours (0-24)
 * @param dec Declination in degrees (-90 to +90)
 * @param radius Distance from origin (default: 1.0 for unit sphere)
 * @returns 3D Cartesian coordinates
 */
export function celestialToCartesian(ra: number, dec: number, radius: number = 1.0): Cartesian3D {
  // Convert RA from hours to radians
  const raRad = (ra * Math.PI) / 12;
  
  // Convert Dec from degrees to radians
  const decRad = (dec * Math.PI) / 180;
  
  // Calculate Cartesian coordinates
  // Using standard astronomical convention:
  // X points toward RA=0h, Dec=0° (vernal equinox)
  // Y points toward RA=6h, Dec=0°
  // Z points toward Dec=+90° (north celestial pole)
  const x = radius * Math.cos(decRad) * Math.cos(raRad);
  const y = radius * Math.cos(decRad) * Math.sin(raRad);
  const z = radius * Math.sin(decRad);
  
  return { x, y, z };
}

/**
 * Converts 3D Cartesian coordinates back to celestial coordinates
 * @param cartesian 3D Cartesian coordinates
 * @returns Object with ra (hours) and dec (degrees)
 */
export function cartesianToCelestial(cartesian: Cartesian3D): { ra: number; dec: number } {
  const { x, y, z } = cartesian;
  
  // Calculate declination
  const dec = Math.asin(z) * 180 / Math.PI;
  
  // Calculate right ascension
  let ra = Math.atan2(y, x) * 12 / Math.PI;
  
  // Normalize RA to 0-24 range
  if (ra < 0) ra += 24;
  
  return { ra, dec };
}

/**
 * Precomputes all star positions in Cartesian coordinates
 * @param stars Array of stars with celestial coordinates
 * @param radius Distance from origin for the celestial sphere
 * @returns Array of stars with precomputed Cartesian positions
 */
export function precomputeStarPositions<T extends { ra: number; dec: number }>(
  stars: T[],
  radius: number = 1.0
): Array<T & { position: Cartesian3D }> {
  return stars.map(star => ({
    ...star,
    position: celestialToCartesian(star.ra, star.dec, radius)
  }));
}

/**
 * Converts altitude and azimuth to Cartesian coordinates
 * @param altitude Altitude in degrees (-90 to +90)
 * @param azimuth Azimuth in degrees (0 to 360)
 * @param radius Distance from origin (default: 1.0 for unit sphere)
 * @returns 3D Cartesian coordinates
 */
export function altitudeAzimuthToCartesian(
  altitude: number, 
  azimuth: number, 
  radius: number = 1.0
): Cartesian3D {
  const altRad = altitude * Math.PI / 180;
  const azRad = azimuth * Math.PI / 180;
  
  // Convert from spherical to Cartesian coordinates
  // X points east, Y points north, Z points up
  const x = radius * Math.cos(altRad) * Math.sin(azRad);
  const y = radius * Math.cos(altRad) * Math.cos(azRad);
  const z = radius * Math.sin(altRad);
  
  return { x, y, z };
}

/**
 * Converts Cartesian coordinates to altitude and azimuth
 * @param cartesian 3D Cartesian coordinates
 * @returns Object with altitude and azimuth in degrees
 */
export function cartesianToAltitudeAzimuth(cartesian: Cartesian3D): { altitude: number; azimuth: number } {
  const { x, y, z } = cartesian;
  
  const altitude = Math.asin(z) * 180 / Math.PI;
  let azimuth = Math.atan2(x, y) * 180 / Math.PI;
  
  // Normalize azimuth to 0-360 range
  if (azimuth < 0) azimuth += 360;
  
  return { altitude, azimuth };
}

/**
 * Calculates the altitude and azimuth of a celestial object using astronomy-engine
 * @param ra Right Ascension in hours
 * @param dec Declination in degrees
 * @param observerData Observer location and time data
 * @returns Object with altitude and azimuth in degrees
 */
export function calculateAltitudeAzimuth(
  ra: number,
  dec: number,
  observerData: ObserverData
): { altitude: number; azimuth: number } {
  try {
    // Use astronomy-engine for accurate calculations
    const time = observerData.utcTime;
    const latitude = observerData.location.latitude;
    const longitude = observerData.location.longitude;
    
    // Calculate hour angle
    const lst = observerData.lst;
    const ha = lst - ra;
    
    // Convert to radians
    const latRad = latitude * Math.PI / 180;
    const decRad = dec * Math.PI / 180;
    const haRad = ha * Math.PI / 12;
    
    // Calculate altitude
    const altitude = Math.asin(
      Math.sin(decRad) * Math.sin(latRad) + 
      Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad)
    ) * 180 / Math.PI;
    
    // Calculate azimuth
    const azimuth = Math.atan2(
      -Math.cos(decRad) * Math.cos(latRad) * Math.sin(haRad),
      Math.sin(decRad) - Math.sin(latRad) * Math.sin(altitude * Math.PI / 180)
    ) * 180 / Math.PI;
    
    return {
      altitude,
      azimuth: ((azimuth % 360) + 360) % 360,
    };
  } catch (error) {
    console.error('Error calculating altitude/azimuth:', error);
    return { altitude: 0, azimuth: 0 };
  }
}

/**
 * Calculates the angular distance between two celestial coordinates
 * @param ra1 Right Ascension of first point (hours)
 * @param dec1 Declination of first point (degrees)
 * @param ra2 Right Ascension of second point (hours)
 * @param dec2 Declination of second point (degrees)
 * @returns Angular distance in degrees
 */
export function angularDistance(
  ra1: number,
  dec1: number,
  ra2: number,
  dec2: number
): number {
  const ra1Rad = (ra1 * Math.PI) / 12;
  const dec1Rad = (dec1 * Math.PI) / 180;
  const ra2Rad = (ra2 * Math.PI) / 12;
  const dec2Rad = (dec2 * Math.PI) / 180;
  
  const deltaRa = ra2Rad - ra1Rad;
  const deltaDec = dec2Rad - dec1Rad;
  
  const a = Math.sin(deltaDec / 2) * Math.sin(deltaDec / 2) +
            Math.cos(dec1Rad) * Math.cos(dec2Rad) *
            Math.sin(deltaRa / 2) * Math.sin(deltaRa / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return c * 180 / Math.PI;
}

/**
 * Checks if a celestial coordinate is visible from a given location and time
 * @param ra Right Ascension (hours)
 * @param dec Declination (degrees)
 * @param latitude Observer latitude (degrees)
 * @param longitude Observer longitude (degrees)
 * @param lst Local Sidereal Time (hours)
 * @returns true if the star is above the horizon
 */
export function isStarVisible(
  ra: number,
  dec: number,
  latitude: number,
  longitude: number,
  lst: number
): boolean {
  const latRad = (latitude * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;
  const haRad = ((lst - ra) * Math.PI) / 12; // Hour angle
  
  const altitude = Math.asin(
    Math.sin(decRad) * Math.sin(latRad) +
    Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad)
  );
  
  return altitude > 0; // Above horizon
}
