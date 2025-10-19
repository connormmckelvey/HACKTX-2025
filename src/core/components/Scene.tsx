// Scene component for react-three-fiber
// Handles camera movement and 3D scene setup

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei/native';
// Import Three.js more specifically to avoid multiple instances
import { PerspectiveCamera as ThreePerspectiveCamera, Quaternion, Vector3 } from 'three';
import { AnimatedSensor, Value3D } from 'react-native-reanimated';

import { Stars } from './Stars';
import { Constellations } from './Constellations';
import { PolarisMarker } from './PolarisMarker';
import { SkyOrientation } from '../utils/skyOrientation';
import { SENSOR_CONFIG } from '../config/constants';
import { debugLog, log } from '../../config/debug';

interface SceneComponentProps {
  skyOrientation: SkyOrientation;
  rotationSensor: AnimatedSensor<Value3D>; // Sensor object passed from parent
  onSensorDataUpdate?: (data: { pitch: number; roll: number; yaw: number }) => void;
}

const Scene: React.FC<SceneComponentProps> = ({ skyOrientation, rotationSensor, onSensorDataUpdate }) => {
  const cameraRef = useRef<ThreePerspectiveCamera>(null);
  
  // Store the accumulated device rotation in a ref so it persists between frames
  const deviceQuaternionRef = useRef(new Quaternion());

  // Debug sensor initialization
  React.useEffect(() => {
    log('--- SCENE COMPONENT MOUNTED ---');
    debugLog('SENSOR_DATA', 'Rotation sensor object received:', rotationSensor);
  }, []);

  // Quaternion-based rotation logic
  useFrame((state, delta) => {
    if (!cameraRef.current) return;

    try {
      const gyroValue = rotationSensor.sensor.value;
      
      if (gyroValue && typeof gyroValue.x !== 'undefined') {
        const { x: vx, y: vy, z: vz } = gyroValue;

        // Extract Euler angles for debug display
        if (onSensorDataUpdate) {
          // Convert gyro values to approximate Euler angles for display
          const pitch = Math.atan2(vy, Math.sqrt(vx * vx + vz * vz));
          const roll = Math.atan2(-vx, vz);
          const yaw = Math.atan2(vx, vy);
          
          onSensorDataUpdate({ pitch, roll, yaw });
        }

        const axis = new Vector3(vx, vy, vz);
        const angle = axis.length() * delta;

        if (angle > 0) {
          const deltaRotation = new Quaternion();
          axis.normalize();
          deltaRotation.setFromAxisAngle(axis, angle);
          
          deviceQuaternionRef.current.multiply(deltaRotation);
          deviceQuaternionRef.current.normalize();
        }
        
        const skyQ = new Quaternion(
          skyOrientation.worldRotationQuaternion.x,
          skyOrientation.worldRotationQuaternion.y,
          skyOrientation.worldRotationQuaternion.z,
          skyOrientation.worldRotationQuaternion.w
        );
        const finalCameraQuaternion = new Quaternion().multiplyQuaternions(skyQ, deviceQuaternionRef.current);
        
        // Debug: Log camera rotation occasionally
        if (Math.random() < 0.01) { // Log 1% of the time to avoid spam
          console.log('Camera rotation:', {
            skyQ: { x: skyQ.x, y: skyQ.y, z: skyQ.z, w: skyQ.w },
            deviceQ: { x: deviceQuaternionRef.current.x, y: deviceQuaternionRef.current.y, z: deviceQuaternionRef.current.z, w: deviceQuaternionRef.current.w },
            finalQ: { x: finalCameraQuaternion.x, y: finalCameraQuaternion.y, z: finalCameraQuaternion.z, w: finalCameraQuaternion.w }
          });
        }
        
        cameraRef.current.setRotationFromQuaternion(finalCameraQuaternion);
      }
    } catch (error) {
      console.error('Error in Scene useFrame:', error);
    }
  });

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={[0, 0, 0]}
        fov={60}
        near={0.01}
        far={1000}
      />
      <Stars />
      <Constellations />
      <PolarisMarker />
    </>
  );
};

export { Scene };
