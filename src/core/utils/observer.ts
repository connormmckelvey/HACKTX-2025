// Observer location and astronomical time calculations using astronomy-engine

import * as Astronomy from 'astronomy-engine';
import * as Location from 'expo-location';

export interface ObserverLocation {
  latitude: number;  // Degrees
  longitude: number; // Degrees
  altitude?: number; // Meters above sea level
}

export interface ObserverData {
  location: ObserverLocation;
  utcTime: Date;
  lst: number; // Local Sidereal Time in hours
  julianDate: number;
}

/**
 * Requests location permissions and gets current GPS coordinates
 */
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permissions:', error);
    return false;
  }
}

/**
 * Gets current GPS coordinates
 */
export async function getCurrentLocation(): Promise<ObserverLocation | null> {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 1000,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude || undefined,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

/**
 * Gets current UTC time
 */
export function getCurrentUTCTime(): Date {
  return new Date();
}

/**
 * Calculates Local Sidereal Time using astronomy-engine
 */
export function calculateLST(
  longitude: number,
  utcTime: Date
): number {
  try {
    // Convert longitude to hours (15 degrees = 1 hour)
    const longitudeHours = longitude / 15;
    
    // Calculate LST using astronomy-engine
    const lstTime = Astronomy.SiderealTime(utcTime);
    const lst = lstTime + longitudeHours;
    
    // Normalize to 0-24 range
    return ((lst % 24) + 24) % 24;
  } catch (error) {
    console.error('Error calculating LST:', error);
    // Fallback calculation
    const longitudeHours = longitude / 15;
    const utcHours = utcTime.getUTCHours() + utcTime.getUTCMinutes() / 60 + utcTime.getUTCSeconds() / 3600;
    const lst = (utcHours * 1.00273790935 + longitudeHours) % 24;
    return ((lst % 24) + 24) % 24;
  }
}

/**
 * Calculates Julian Date using astronomy-engine
 */
export function calculateJulianDate(utcTime: Date): number {
  try {
    const astroTime = Astronomy.MakeTime(utcTime);
    return astroTime.ut; // Extract the Julian date number
  } catch (error) {
    console.error('Error calculating Julian Date:', error);
    // Fallback calculation
    const year = utcTime.getUTCFullYear();
    const month = utcTime.getUTCMonth() + 1;
    const day = utcTime.getUTCDate();
    const hour = utcTime.getUTCHours();
    const minute = utcTime.getUTCMinutes();
    const second = utcTime.getUTCSeconds();
    
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    
    const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    
    return jdn + (hour - 12) / 24 + minute / 1440 + second / 86400;
  }
}

/**
 * Gets complete observer data including location, time, and astronomical calculations
 */
export async function getObserverData(): Promise<ObserverData | null> {
  try {
    let location = await getCurrentLocation();
    if (!location) {
      // Fallback to default location (Austin, TX)
      console.warn('Using fallback location (Austin, TX)');
      location = {
        latitude: 30.2672,
        longitude: -97.7431,
        altitude: 150,
      };
    }

    const utcTime = getCurrentUTCTime();
    const lst = calculateLST(location.longitude, utcTime);
    const julianDate = calculateJulianDate(utcTime);

    return {
      location,
      utcTime,
      lst,
      julianDate,
    };
  } catch (error) {
    console.error('Error getting observer data:', error);
    return null;
  }
}

/**
 * Formats LST for display
 */
export function formatLST(lst: number): string {
  const hours = Math.floor(lst);
  const minutes = Math.floor((lst - hours) * 60);
  const seconds = Math.floor(((lst - hours) * 60 - minutes) * 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Formats coordinates for display
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  const latDir = latitude >= 0 ? 'N' : 'S';
  const lonDir = longitude >= 0 ? 'E' : 'W';
  
  const latDeg = Math.abs(Math.floor(latitude));
  const latMin = Math.abs(Math.floor((latitude - Math.floor(latitude)) * 60));
  
  const lonDeg = Math.abs(Math.floor(longitude));
  const lonMin = Math.abs(Math.floor((longitude - Math.floor(longitude)) * 60));
  
  return `${latDeg}°${latMin}'${latDir} ${lonDeg}°${lonMin}'${lonDir}`;
}
