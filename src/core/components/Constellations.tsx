// Constellations component for react-three-fiber
// Renders constellation lines between stars

import React from 'react';
import { Line } from '@react-three/drei/native';
// Import Three.js more specifically to avoid multiple instances
import { Vector3, BufferGeometry, BufferAttribute } from 'three';

import { constellations } from '../data/starCatalog';
import { stars } from '../data/starCatalog';
import { RENDERING_CONFIG } from '../config/constants';
import { debugLog, error } from '../../config/debug';

interface ConstellationsProps {
  // No props needed
}

export const Constellations: React.FC<ConstellationsProps> = () => {
  // Calculate all line points in a single memoized array
  const allLinePoints = React.useMemo(() => {
    debugLog('CONSTELLATION_DATA', `Calculating points for ${constellations.length} constellations`);
    debugLog('CONSTELLATION_DATA', `RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS: ${RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS} (${typeof RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS})`);
    
    // Validate the radius constant
    if (typeof RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS !== 'number' || 
        isNaN(RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS) || 
        !isFinite(RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS)) {
      error('RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS is invalid:', RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS);
      return [];
    }
    
    const points: Vector3[] = [];

    // Loop through each constellation
    for (const constellation of constellations) {
      // Loop through the line pairs for that constellation
      for (const [starId1, starId2] of constellation.lines) {
        const star1 = stars.find(s => s.id === starId1);
        const star2 = stars.find(s => s.id === starId2);

        if (star1 && star2) {
          // Validate that star coordinates are valid numbers
          const isValidCoordinate = (coord: number) => 
            typeof coord === 'number' && !isNaN(coord) && isFinite(coord);
          
          // Check each coordinate individually for debugging
          const star1Valid = isValidCoordinate(star1.x) && isValidCoordinate(star1.y) && isValidCoordinate(star1.z);
          const star2Valid = isValidCoordinate(star2.x) && isValidCoordinate(star2.y) && isValidCoordinate(star2.z);
          
          if (star1Valid && star2Valid) {
            // Calculate the final coordinates
            const x1 = star1.x * RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS;
            const y1 = star1.y * RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS;
            const z1 = star1.z * RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS;
            const x2 = star2.x * RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS;
            const y2 = star2.y * RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS;
            const z2 = star2.z * RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS;
            
            // Double-check the calculated coordinates
            if (isValidCoordinate(x1) && isValidCoordinate(y1) && isValidCoordinate(z1) &&
                isValidCoordinate(x2) && isValidCoordinate(y2) && isValidCoordinate(z2)) {
              
              // Add the start point of the line segment
              points.push(new Vector3(x1, y1, z1));
              // Add the end point of the line segment
              points.push(new Vector3(x2, y2, z2));
            } else {
              error(`Calculated coordinates became invalid for constellation ${constellation.name}: ${starId1} -> ${starId2}`);
              error(`Star1 original: (${star1.x}, ${star1.y}, ${star1.z}), calculated: (${x1}, ${y1}, ${z1})`);
              error(`Star2 original: (${star2.x}, ${star2.y}, ${star2.z}), calculated: (${x2}, ${y2}, ${z2})`);
              error(`RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS: ${RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS}`);
            }
          } else {
            error(`Invalid coordinates for constellation ${constellation.name}: ${starId1} -> ${starId2}`);
            error(`Star1 (${starId1}): x=${star1.x} (${typeof star1.x}), y=${star1.y} (${typeof star1.y}), z=${star1.z} (${typeof star1.z})`);
            error(`Star2 (${starId2}): x=${star2.x} (${typeof star2.x}), y=${star2.y} (${typeof star2.y}), z=${star2.z} (${typeof star2.z})`);
          }
        } else {
          debugLog('CONSTELLATION_DATA', `Missing stars for constellation ${constellation.name}: ${starId1} -> ${starId2}`);
        }
      }
    }
    
    debugLog('CONSTELLATION_DATA', `Generated ${points.length} line points for constellations`);
    return points;
  }, []); // Empty dependency array means this runs only once

  if (allLinePoints.length === 0) {
    debugLog('CONSTELLATION_DATA', 'No valid constellation line points found');
    return null;
  }

  // Additional safety check: ensure all points are valid Vector3 objects
  const validPoints = allLinePoints.filter(point => 
    point instanceof Vector3 && 
    !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z) &&
    isFinite(point.x) && isFinite(point.y) && isFinite(point.z)
  );

  if (validPoints.length === 0) {
    debugLog('CONSTELLATION_DATA', 'No valid constellation line points after filtering');
    return null;
  }

  if (validPoints.length !== allLinePoints.length) {
    debugLog('CONSTELLATION_DATA', `Filtered out ${allLinePoints.length - validPoints.length} invalid constellation line points`);
  }

  // Create line geometry manually for better control
  const lineGeometry = React.useMemo(() => {
    debugLog('CONSTELLATION_DATA', `Creating line geometry with ${validPoints.length} valid points`);
    
    // Additional validation before creating geometry
    const finalValidPoints = validPoints.filter(point => {
      const isValid = point instanceof Vector3 && 
                     !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z) &&
                     isFinite(point.x) && isFinite(point.y) && isFinite(point.z);
      if (!isValid) {
        error(`Invalid point found:`, point);
      }
      return isValid;
    });
    
    debugLog('CONSTELLATION_DATA', `Final valid points after filtering: ${finalValidPoints.length}`);
    
    if (finalValidPoints.length === 0) {
      debugLog('CONSTELLATION_DATA', 'No valid points for constellation lines');
      return null;
    }
    
    const geometry = new BufferGeometry();
    const positions = new Float32Array(finalValidPoints.length * 3);
    
    for (let i = 0; i < finalValidPoints.length; i++) {
      const point = finalValidPoints[i];
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
      
      // Final check for each coordinate
      if (isNaN(positions[i * 3]) || isNaN(positions[i * 3 + 1]) || isNaN(positions[i * 3 + 2])) {
        error(`NaN found in position array at index ${i}:`, positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      }
    }
    
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    
    // Compute bounding sphere to check for NaN
    try {
      geometry.computeBoundingSphere();
      debugLog('CONSTELLATION_DATA', 'Bounding sphere computed successfully');
    } catch (error) {
      error('Error computing bounding sphere:', error);
    }
    
    return geometry;
  }, [validPoints]);

  // Render using manual geometry
  if (!lineGeometry) {
    console.log('No valid geometry to render');
    return null;
  }
  
  return (
    <lineSegments geometry={lineGeometry}>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.3} />
    </lineSegments>
  );
};