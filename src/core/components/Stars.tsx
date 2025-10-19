// Stars component for react-three-fiber
// Renders all stars from the star catalog as 3D points

import React from 'react';
import { Points, PointMaterial } from '@react-three/drei/native';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
// Import Three.js more specifically to avoid multiple instances
import { AdditiveBlending, Points as ThreePoints } from 'three';

import { stars } from '../data/starCatalog';
import { RENDERING_CONFIG } from '../config/constants';
import { debugLog, log } from '../../config/debug';

interface StarsProps {
  // No props needed - stars are now static
}

export const Stars: React.FC<StarsProps> = () => {
  const pointsRef = useRef<ThreePoints>(null);

  // For React Native, we'll use a simple approach without custom textures
  // We'll create star shapes using geometry instead

  // Create star positions array
  const starPositions = React.useMemo(() => {
    debugLog('STAR_RENDERING', `Creating star positions for ${stars.length} stars`);
    debugLog('STAR_RENDERING', 'Sample star data:', stars.slice(0, 3));
    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);
    
    stars.forEach((star, index) => {
      const i = index * 3;
      
      // Scale star position to celestial sphere radius
      positions[i] = star.x * RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS;
      positions[i + 1] = star.y * RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS;
      positions[i + 2] = star.z * RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS;
      
      // Special handling for Polaris (North Star) - make it EXTREMELY visible
      if (star.id === "11734") {
        debugLog('STAR_RENDERING', 'Found Polaris (North Star) - making it extra bright');
        debugLog('STAR_RENDERING', 'Polaris original coords:', { x: star.x, y: star.y, z: star.z });
        debugLog('STAR_RENDERING', 'Polaris scaled coords:', { 
          x: star.x * RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS, 
          y: star.y * RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS, 
          z: star.z * RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS 
        });
        // Make Polaris bright and white with good size
        colors[i] = 1.0;     // Red - maximum brightness
        colors[i + 1] = 1.0; // Green - maximum brightness
        colors[i + 2] = 1.0; // Blue - maximum brightness (pure white)
        sizes[index] = 50;   // Larger size for North Star visibility
      } else {
        // Convert magnitude to brightness (brighter stars = whiter)
        const brightness = Math.max(0.4, 1.0 - (star.mag - 1.0) / 6.0); // Scale magnitude to 0-1
        colors[i] = brightness;     // Red
        colors[i + 1] = brightness; // Green  
        colors[i + 2] = brightness; // Blue
        // Much larger base sizes - stars were too tiny
        sizes[index] = Math.max(15, 35 - star.mag * 2); // Larger size based on magnitude
      }
    });
    
    console.log('Star positions created:', { 
      count: stars.length, 
      radius: RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS,
      samplePosition: { x: positions[0], y: positions[1], z: positions[2] }
    });
    
    // Debug: Check if Polaris is in the positions array
    const polarisIndex = stars.findIndex(star => star.id === "11734");
    if (polarisIndex !== -1) {
      const polarisPosIndex = polarisIndex * 3;
      console.log('Polaris position in array:', {
        index: polarisIndex,
        positionIndex: polarisPosIndex,
        x: positions[polarisPosIndex],
        y: positions[polarisPosIndex + 1], 
        z: positions[polarisPosIndex + 2],
        size: sizes[polarisIndex],
        color: { r: colors[polarisPosIndex], g: colors[polarisPosIndex + 1], b: colors[polarisPosIndex + 2] }
      });
    } else {
      debugLog('STAR_RENDERING', 'ERROR: Polaris not found in stars array!');
    }
    
    return { positions, colors, sizes };
  }, []);

  // Stars are now static - no rotation applied
  debugLog('STAR_RENDERING', 'Stars component rendering with positions:', starPositions.positions.length, 'points');

  return (
    <Points ref={pointsRef} positions={starPositions.positions} colors={starPositions.colors} sizes={starPositions.sizes}>
      <PointMaterial
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={1.0}
        alphaTest={0.1}
        size={1.0}
        // Use a simple star shape by adjusting the material properties
        blending={AdditiveBlending}
      />
    </Points>
  );
};
