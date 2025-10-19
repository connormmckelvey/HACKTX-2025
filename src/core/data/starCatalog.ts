// Star catalog data loaded from JSON files
// Based on HYG catalog with pre-computed Cartesian coordinates

import starsData from '../../../assets/stars.json';
import constellationsData from '../../../assets/constellations.json';

export interface Star {
  id: string;
  name: string;
  mag: number;
  x: number;
  y: number;
  z: number;
}

export interface Constellation {
  name: string;
  lines: Array<[string, string]>; // Array of [starId1, starId2] pairs
}

// Load stars from JSON file
export const stars: Star[] = starsData.map(star => ({
  id: star.id,
  name: star.name,
  mag: star.mag,
  x: star.x,
  y: star.y,
  z: star.z,
}));

// Load constellations from JSON file
export const constellations: Constellation[] = constellationsData.map(constellation => ({
  name: constellation.name,
  lines: constellation.lines.map(line => [line[0], line[1]] as [string, string]),
}));

// Helper function to get stars by constellation
export function getStarsByConstellation(constellationName: string): Star[] {
  const constellation = constellations.find(c => c.name === constellationName);
  if (!constellation) return [];
  
  const starIds = new Set<string>();
  constellation.lines.forEach(([id1, id2]) => {
    starIds.add(id1);
    starIds.add(id2);
  });
  
  return stars.filter(star => starIds.has(star.id));
}

// Helper function to get constellation by name
export function getConstellationByName(name: string): Constellation | undefined {
  return constellations.find(constellation => constellation.name === name);
}

// Helper function to find star by ID
export function getStarById(id: string): Star | undefined {
  return stars.find(star => star.id === id);
}

// Helper function to get brightest stars
export function getBrightestStars(count: number = 50): Star[] {
  return stars
    .filter(star => star.mag <= 3.0) // Only stars brighter than magnitude 3
    .sort((a, b) => a.mag - b.mag) // Sort by magnitude (lower = brighter)
    .slice(0, count);
}
