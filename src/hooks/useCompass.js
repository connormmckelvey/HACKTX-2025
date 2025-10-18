import { useState, useEffect, useRef } from 'react';
import { Magnetometer, Accelerometer, Gyroscope, DeviceMotion } from 'expo-sensors';
import { Platform } from 'react-native';
import geomagnetism from 'geomagnetism';

export const useCompass = (location) => {
  const [heading, setHeading] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [pitch, setPitch] = useState(0);

  // Sensor fusion variables
  const alpha = 0.8; // Low-pass filter coefficient for magnetometer
  const gyroAlpha = 0.98; // High-pass filter coefficient for gyroscope
  const filteredHeading = useRef(0);
  const gyroHeading = useRef(0);
  const lastGyroUpdate = useRef(Date.now());
  const headingOffset = useRef(0); // This will now store magnetic declination
  
  // DeviceMotion-based orientation (more stable than raw accelerometer)
  const [deviceOrientation, setDeviceOrientation] = useState({ pitch: 0, roll: 0, yaw: 0 });

  // Process DeviceMotion data for stable orientation
  const processDeviceMotion = (motionData) => {
    if (!motionData.rotation) return;
    
    const { alpha, beta, gamma } = motionData.rotation;
    
    // Convert DeviceMotion rotation to pitch/roll/yaw
    // DeviceMotion uses different conventions than raw accelerometer
    // alpha = rotation around Z axis (yaw/heading)
    // beta = rotation around X axis (pitch) 
    // gamma = rotation around Y axis (roll)
    
    // For stargazing, we care about pitch (beta) - how much device is tilted up/down
    // DeviceMotion beta: -180 to +180 degrees
    // We want: pointing down = negative, pointing up = positive
    const currentPitch = beta; // Direct use of DeviceMotion beta
    
    // Update pitch state
    setPitch(currentPitch);
    
    // Update device orientation state
    setDeviceOrientation({
      pitch: beta,
      roll: gamma, 
      yaw: alpha
    });
  };

  // Improved heading calculation with sensor fusion
  const calculateHeading = (magnetometerData, accelerometerData) => {
    if (!magnetometerData || !accelerometerData) return null;

    const { x: mx, y: my, z: mz } = magnetometerData;
    const { x: ax, y: ay, z: az } = accelerometerData;

    // Normalize accelerometer data for tilt compensation
    const norm = Math.sqrt(ax * ax + ay * ay + az * az);
    if (norm < 0.01) return null;

    const nx = ax / norm;
    const ny = ay / norm;
    const nz = az / norm;

    // Gimbal lock check: if the device is pointing straight up or down,
    // the heading is ambiguous.
    if (Math.abs(nx) > 0.99) {
      // Avoid calculation that would result in NaN and return null.
      // The calling function will skip this update.
      return null;
    }

    // Calculate roll for tilt compensation
    const roll = Math.asin(ny / Math.cos(deviceOrientation.pitch * Math.PI / 180));

    // Apply tilt compensation to magnetometer data (convert pitch back to radians for trig functions)
    const pitchRadForTilt = deviceOrientation.pitch * Math.PI / 180;
    const mx_comp = mx * Math.cos(pitchRadForTilt) + mz * Math.sin(pitchRadForTilt);
    const my_comp = mx * Math.sin(roll) * Math.sin(pitchRadForTilt) +
                   my * Math.cos(roll) -
                   mz * Math.sin(roll) * Math.cos(pitchRadForTilt);

    // Calculate heading from compensated magnetometer data
    let newHeading = Math.atan2(my_comp, mx_comp) * (180 / Math.PI);

    // Normalize to 0-360 degrees
    newHeading = (newHeading + 360) % 360;

    return newHeading;
  };

  // Low-pass filter for smoother readings
  const applyLowPassFilter = (newHeading) => {
    if (filteredHeading.current === 0) {
      filteredHeading.current = newHeading;
      return newHeading;
    }

    filteredHeading.current = alpha * filteredHeading.current + (1 - alpha) * newHeading;
    return filteredHeading.current;
  };

  useEffect(() => {
    // Update magnetic declination when location changes
    if (location) {
      try {
        const { latitude, longitude } = location.coords;
        const geo = geomagnetism.model().point(latitude, longitude);
        const declination = geo.decl;

        // Validate that declination is a valid number
        if (typeof declination === 'number' && !isNaN(declination) && isFinite(declination)) {
          headingOffset.current = declination; // Store declination in degrees
          console.log('Updated magnetic declination:', declination);
        } else {
          console.warn('Invalid declination value:', declination, 'using fallback of 0');
          headingOffset.current = 0; // Fallback to no declination correction
        }
      } catch (error) {
        console.error('Error calculating magnetic declination:', error);
        headingOffset.current = 0; // Fallback to no declination correction
      }
    }
  }, [location]);

  useEffect(() => {
    // Check if we're on a native platform that supports sensors
    const platformSupported = Platform.OS !== 'web';

    if (!platformSupported) {
      setIsSupported(false);
      return;
    }

    let magnetometerSubscription, deviceMotionSubscription;

    // Check if sensors are available and start listening
    const initializeSensors = async () => {
      try {
        // Check sensor availability - prioritize DeviceMotion for stable orientation
        const magnetometerAvailable = await Magnetometer.isAvailableAsync();
        const deviceMotionAvailable = await DeviceMotion.isAvailableAsync();

        setIsSupported(magnetometerAvailable && deviceMotionAvailable);

        if (magnetometerAvailable && deviceMotionAvailable) {
          // Set update intervals
          Magnetometer.setUpdateInterval(50); // 20 FPS
          DeviceMotion.setUpdateInterval(50); // 20 FPS for stable orientation

          let magnetometerData = null;

          // DeviceMotion listener (primary source for orientation)
          deviceMotionSubscription = DeviceMotion.addListener((data) => {
            // Process orientation from DeviceMotion (more stable)
            processDeviceMotion(data);
            
            // Process heading from magnetometer
            if (data.magneticField) {
              magnetometerData = data.magneticField;
              processSensorData(magnetometerData, null, null);
            }
          });

          // Magnetometer listener (backup for heading)
          magnetometerSubscription = Magnetometer.addListener((data) => {
            magnetometerData = data;
            processSensorData(magnetometerData, null, null);
          });

          console.log('DeviceMotion and Magnetometer initialized successfully');
        } else {
          console.warn('DeviceMotion not available, using fallback method');
          fallbackToDeviceMotion();
        }
      } catch (error) {
        console.warn('Sensor initialization failed:', error);
        fallbackToDeviceMotion();
      }
    };

    // Process magnetometer data for heading calculation
    const processSensorData = (magData, accData, gyroData) => {
      if (!magData) return;

      // Get absolute heading from magnetometer (simplified without accelerometer tilt compensation)
      // Since DeviceMotion handles orientation, we can use simpler magnetometer calculation
      const { x: mx, y: my, z: mz } = magData;
      
      // Calculate heading from magnetometer data
      let magHeading = Math.atan2(my, mx) * (180 / Math.PI);
      
      // Normalize to 0-360 degrees
      magHeading = (magHeading + 360) % 360;

      // Apply magnetic declination to get true north
      const declination = headingOffset.current;
      const trueNorthHeading = isNaN(declination) || !isFinite(declination)
        ? magHeading
        : (magHeading + declination) % 360;

      // Update magnetometer-based heading (low-pass filtered)
      const smoothedMagHeading = applyLowPassFilter(trueNorthHeading);
      
      setHeading(smoothedMagHeading);
      setAccuracy(0.9); // Good accuracy with DeviceMotion + Magnetometer
    };

    // Fallback function using DeviceMotion (with gyroscope if available)
    const fallbackToDeviceMotion = async () => {
      try {
        const { DeviceMotion } = await import('expo-sensors');
        const motionAvailable = await DeviceMotion.isAvailableAsync();

        if (motionAvailable) {
          DeviceMotion.setUpdateInterval(50); // Higher frequency for better tracking

          const subscription = DeviceMotion.addListener((motionData) => {
            if (motionData.rotation) {
              const rotation = motionData.rotation;

              // Use the same calculation as gyroscope integration
              const now = Date.now();
              const deltaTime = (now - lastGyroUpdate.current) / 1000;
              lastGyroUpdate.current = now;

              // DeviceMotion gives us rotation rate similar to gyroscope
              const rotationRate = {
                x: rotation.beta * (Math.PI / 180), // Convert to rad/s
                y: rotation.gamma * (Math.PI / 180),
                z: rotation.alpha * (Math.PI / 180)
              };

              // Integrate rotation (simplified gyroscope integration)
              const gyroRotation = rotationRate.z * deltaTime * (180 / Math.PI);
              gyroHeading.current = (gyroHeading.current + gyroRotation) % 360;

              // For absolute reference, use the magnetometer data if available in DeviceMotion
              if (motionData.magneticField) {
                // We have magnetic field data, use it for absolute reference
                const { x, y, z } = motionData.magneticField;
                const magHeading = Math.atan2(y, x) * (180 / Math.PI);
                const normalizedMagHeading = (magHeading + 360) % 360;

                // Apply declination
                const declination = headingOffset.current;
                const trueNorthHeading = isNaN(declination) || !isFinite(declination)
                  ? normalizedMagHeading
                  : (normalizedMagHeading + declination) % 360;

                // Combine with gyro using complementary filter
                const combinedHeading = (gyroAlpha * gyroHeading.current) + ((1 - gyroAlpha) * trueNorthHeading);

                setHeading(combinedHeading);
                setAccuracy(0.9); // Good accuracy with DeviceMotion
              } else {
                // No magnetic field data, use gyro only (will drift over time)
                setHeading(gyroHeading.current);
                setAccuracy(0.6); // Lower accuracy without magnetic reference
              }
            }
          });

          magnetometerSubscription = subscription;
          console.log('DeviceMotion fallback initialized');
        } else {
          setIsSupported(false);
        }
      } catch (fallbackError) {
        console.warn('DeviceMotion fallback not available:', fallbackError);
        setIsSupported(false);
      }
    };

    initializeSensors();

    return () => {
      if (magnetometerSubscription) magnetometerSubscription.remove();
      if (deviceMotionSubscription) deviceMotionSubscription.remove();
    };
  }, []);

  return {
    heading,
    accuracy,
    isSupported,
    pitch,
  };
};
