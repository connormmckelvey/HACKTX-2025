// Special marker component for Polaris (North Star)
// Renders as a separate, highly visible object to help locate it

import React from 'react';
import { Sphere } from '@react-three/drei/native';
import { Mesh } from 'three';
import { useRef } from 'react';
import { debugLog } from '../../config/debug';

interface PolarisMarkerProps {
  // No props needed - uses fixed position
}

export const PolarisMarker: React.FC<PolarisMarkerProps> = () => {
  const meshRef = useRef<Mesh>(null);

  // Polaris coordinates from the star catalog
  const polarisX = 0.010128125287969003;
  const polarisY = 0.007897668884809868;
  const polarisZ = 0.9999175205507388;

  // Scale to celestial sphere radius
  const radius = 0.5; // RENDERING_CONFIG.CELESTIAL_SPHERE_RADIUS
  const x = polarisX * radius;
  const y = polarisY * radius;
  const z = polarisZ * radius;

  debugLog('STAR_RENDERING', 'PolarisMarker rendering at:', { x, y, z });

  return (
    <Sphere
      ref={meshRef}
      position={[x, y, z]}
      args={[0.005, 16, 16]} // radius reduced from 0.02 to 0.005 (25% of original)
    >
      <meshBasicMaterial
        color="#FFFFFF" // Changed from red to white
        transparent={false}
        opacity={1.0}
      />
    </Sphere>
  );
};
