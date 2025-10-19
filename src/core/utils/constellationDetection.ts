// Constellation Detection Utility
// Determines which constellation the user is looking at based on device orientation

import { Quaternion, Vector3 } from 'three';
import { ObserverData } from './observer';
import { getConstellationByName, Constellation } from '../data/starCatalog';

export interface ConstellationDetectionResult {
  constellation: Constellation | null;
  confidence: number;
  direction: Vector3;
}

/**
 * Detects which constellation the user is looking at based on device orientation
 * @param deviceQuaternion - Current device orientation quaternion
 * @param observerData - Observer location and time data
 * @returns Detection result with constellation and confidence
 */
export function detectConstellation(
  deviceQuaternion: Quaternion,
  observerData: ObserverData
): ConstellationDetectionResult {
  // Convert device quaternion to direction vector
  const forward = new Vector3(0, 0, -1);
  forward.applyQuaternion(deviceQuaternion);
  
  // Convert to celestial coordinates (right ascension and declination)
  const ra = Math.atan2(forward.y, forward.x) * (180 / Math.PI);
  const dec = Math.asin(forward.z) * (180 / Math.PI);
  
  // Normalize RA to 0-360 range
  const normalizedRA = ((ra % 360) + 360) % 360;
  
  // Find the constellation that best matches this direction
  const constellations = [
    'Ursa Major', 'Ursa Minor', 'Orion', 'Cassiopeia', 'Leo', 'Virgo',
    'Scorpius', 'Sagittarius', 'Aquarius', 'Pisces', 'Aries', 'Taurus',
    'Gemini', 'Cancer', 'Libra', 'Capricornus', 'Perseus', 'Andromeda',
    'Pegasus', 'Cygnus', 'Lyra', 'Aquila', 'Delphinus', 'Bootes',
    'Corona Borealis', 'Hercules', 'Draco', 'Cepheus', 'Lacerta',
    'Vulpecula', 'Sagitta', 'Equuleus', 'Canis Major', 'Canis Minor',
    'Monoceros', 'Lepus', 'Columba', 'Puppis', 'Vela', 'Carina',
    'Crux', 'Centaurus', 'Lupus', 'Ara', 'Corona Australis',
    'Telescopium', 'Microscopium', 'Indus', 'Pavo', 'Grus',
    'Phoenix', 'Tucana', 'Hydrus', 'Octans', 'Apus', 'Musca',
    'Chamaeleon', 'Volans', 'Mensa', 'Dorado', 'Reticulum',
    'Horologium', 'Pictor', 'Caelum', 'Eridanus', 'Fornax',
    'Sculptor', 'Antlia', 'Pyxis', 'Sextans', 'Crater',
    'Corvus', 'Coma Berenices', 'Canes Venatici', 'Lynx',
    'Camelopardalis', 'Auriga', 'Lynx', 'Monoceros'
  ];
  
  let bestMatch: Constellation | null = null;
  let bestConfidence = 0;
  
  // Simple constellation detection based on RA/Dec ranges
  // This is a simplified approach - in reality, you'd need more sophisticated
  // constellation boundary detection
  for (const constellationName of constellations) {
    const constellation = getConstellationByName(constellationName);
    if (!constellation) continue;
    
    // Calculate distance from constellation center
    const constellationRA = constellation.centerRA || 0;
    const constellationDec = constellation.centerDec || 0;
    
    const raDiff = Math.abs(normalizedRA - constellationRA);
    const decDiff = Math.abs(dec - constellationDec);
    
    // Simple distance-based confidence
    const distance = Math.sqrt(raDiff * raDiff + decDiff * decDiff);
    const confidence = Math.max(0, 1 - distance / 90); // Max distance of 90 degrees
    
    if (confidence > bestConfidence) {
      bestMatch = constellation;
      bestConfidence = confidence;
    }
  }
  
  return {
    constellation: bestMatch,
    confidence: bestConfidence,
    direction: forward
  };
}

/**
 * Gets a user-friendly constellation name for display
 */
export function getConstellationDisplayName(constellation: Constellation | null): string {
  if (!constellation) return 'Unknown Constellation';
  return constellation.name || 'Unknown Constellation';
}

/**
 * Checks if a constellation has cultural stories available
 */
export function hasCulturalStories(constellation: Constellation | null): boolean {
  if (!constellation) return false;
  
  // List of constellations with known cultural stories
  const constellationsWithStories = [
    'Ursa Major', 'Ursa Minor', 'Orion', 'Cassiopeia', 'Leo', 'Scorpius',
    'Sagittarius', 'Taurus', 'Gemini', 'Cancer', 'Virgo', 'Libra',
    'Capricornus', 'Aquarius', 'Pisces', 'Aries', 'Perseus', 'Andromeda',
    'Pegasus', 'Cygnus', 'Lyra', 'Aquila', 'Bootes', 'Corona Borealis',
    'Hercules', 'Draco', 'Cepheus', 'Canis Major', 'Canis Minor',
    'Centaurus', 'Crux', 'Lupus', 'Ara', 'Corona Australis'
  ];
  
  return constellationsWithStories.includes(constellation.name);
}
