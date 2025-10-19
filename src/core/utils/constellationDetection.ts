// Constellation Detection Utility
// Determines which constellation the user is looking at based on device orientation

import { Quaternion, Vector3 } from 'three';
import { ObserverData } from './observer';
import { getConstellationByName, Constellation, getStarsByConstellation } from '../data/starCatalog';

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
  
  // Debug: Log direction occasionally
  if (Math.random() < 0.005) { // Less frequent logging
    console.log(`Looking at: RA=${normalizedRA.toFixed(1)}°, Dec=${dec.toFixed(1)}°`);
  }
  
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
  
  // Constellation detection based on star positions
  for (const constellationName of constellations) {
    const constellation = getConstellationByName(constellationName);
    if (!constellation) continue;
    
    // Get stars for this constellation
    const constellationStars = getStarsByConstellation(constellationName);
    if (constellationStars.length === 0) continue;
    
    // Calculate constellation center from star positions
    // Use weighted average based on star magnitude (brighter stars have more weight)
    let centerX = 0, centerY = 0, centerZ = 0;
    let totalWeight = 0;
    
    constellationStars.forEach(star => {
      // Weight by inverse magnitude (brighter stars = lower magnitude = higher weight)
      const weight = Math.max(0.1, 6 - star.mag); // Brighter stars get more weight
      centerX += star.x * weight;
      centerY += star.y * weight;
      centerZ += star.z * weight;
      totalWeight += weight;
    });
    
    // Weighted average the positions to get center
    centerX /= totalWeight;
    centerY /= totalWeight;
    centerZ /= totalWeight;
    
    // Convert to spherical coordinates (RA/Dec)
    const centerRA = Math.atan2(centerY, centerX) * (180 / Math.PI);
    const centerDec = Math.asin(centerZ) * (180 / Math.PI);
    
    // Calculate distance from constellation center
    const raDiff = Math.abs(normalizedRA - centerRA);
    const decDiff = Math.abs(dec - centerDec);
    
    // Simple distance-based confidence
    const distance = Math.sqrt(raDiff * raDiff + decDiff * decDiff);
    const confidence = Math.max(0, 1 - distance / 30); // Max distance of 30 degrees (more restrictive)
    
    // Only log occasionally to avoid spam
    if (Math.random() < 0.005) { // Less frequent logging
      console.log(`Constellation ${constellationName}: centerRA=${centerRA.toFixed(1)}, centerDec=${centerDec.toFixed(1)}, distance=${distance.toFixed(1)}, confidence=${confidence.toFixed(3)}`);
    }
    
    if (confidence > bestConfidence) {
      bestMatch = constellation;
      bestConfidence = confidence;
    }
  }
  
  // Only return a constellation if confidence is above threshold
  const MIN_CONFIDENCE_THRESHOLD = 0.1; // 10% minimum confidence (more permissive)
  
  // Debug: Log best match occasionally
  if (Math.random() < 0.005) { // Less frequent logging
    if (bestMatch && bestConfidence >= MIN_CONFIDENCE_THRESHOLD) {
      console.log(`Best match: ${bestMatch.name} (confidence: ${bestConfidence.toFixed(3)})`);
    } else {
      console.log(`No constellation detected - best confidence: ${bestConfidence.toFixed(3)} (threshold: ${MIN_CONFIDENCE_THRESHOLD})`);
    }
  }
  
  return {
    constellation: bestConfidence >= MIN_CONFIDENCE_THRESHOLD ? bestMatch : null,
    confidence: bestConfidence >= MIN_CONFIDENCE_THRESHOLD ? bestConfidence : 0,
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
