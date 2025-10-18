import { useState, useEffect, useRef } from 'react';
import { Magnetometer, Accelerometer, Gyroscope } from 'expo-sensors';
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

    // Calculate pitch (angle from horizontal - positive when pointing up, negative when pointing down)
    const currentPitch = Math.asin(-nx) * (180 / Math.PI); // Convert to degrees

    // Update pitch state
    setPitch(currentPitch);

    // Gimbal lock check: if the device is pointing straight up or down,
    // the heading is ambiguous.
    if (Math.abs(nx) > 0.99) {
      // Avoid calculation that would result in NaN and return null.
      // The calling function will skip this update.
      return null;
    }

    // Calculate roll for tilt compensation
    const roll = Math.asin(ny / Math.cos(currentPitch * Math.PI / 180));

    // Apply tilt compensation to magnetometer data (convert pitch back to radians for trig functions)
    const pitchRad = currentPitch * Math.PI / 180;
    const mx_comp = mx * Math.cos(pitchRad) + mz * Math.sin(pitchRad);
    const my_comp = mx * Math.sin(roll) * Math.sin(pitchRad) +
                   my * Math.cos(roll) -
                   mz * Math.sin(roll) * Math.cos(pitchRad);

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

    let magnetometerSubscription, accelerometerSubscription, gyroscopeSubscription;

    // Check if sensors are available and start listening
    const initializeSensors = async () => {
      try {
        // Check sensor availability
        const magnetometerAvailable = await Magnetometer.isAvailableAsync();
        const accelerometerAvailable = await Accelerometer.isAvailableAsync();
        const gyroscopeAvailable = await Gyroscope.isAvailableAsync();

        setIsSupported(magnetometerAvailable && accelerometerAvailable && gyroscopeAvailable);

        if (magnetometerAvailable && accelerometerAvailable && gyroscopeAvailable) {
          // Set update intervals for all sensors (gyroscope needs higher frequency for smooth integration)
          Magnetometer.setUpdateInterval(50); // 20 FPS
          Accelerometer.setUpdateInterval(50);
          Gyroscope.setUpdateInterval(20); // 50 FPS for gyroscope integration

          let magnetometerData = null;
          let accelerometerData = null;
          let gyroscopeData = null;

          // Magnetometer listener
          magnetometerSubscription = Magnetometer.addListener((data) => {
            magnetometerData = data;
            processSensorData(magnetometerData, accelerometerData, gyroscopeData);
          });

          // Accelerometer listener
          accelerometerSubscription = Accelerometer.addListener((data) => {
            accelerometerData = data;
            processSensorData(magnetometerData, accelerometerData, gyroscopeData);
          });

          // Gyroscope listener
          gyroscopeSubscription = Gyroscope.addListener((data) => {
            gyroscopeData = data;
            processSensorData(magnetometerData, accelerometerData, gyroscopeData);
          });

          console.log('All sensors initialized successfully');
        } else {
          console.warn('Not all sensors available, using fallback method');
          fallbackToDeviceMotion();
        }
      } catch (error) {
        console.warn('Sensor initialization failed:', error);
        fallbackToDeviceMotion();
      }
    };

    // Process combined sensor data with gyroscope integration
    const processSensorData = (magData, accData, gyroData) => {
      if (!magData || !accData) return;

      // Get absolute heading from magnetometer
      let magHeading = calculateHeading(magData, accData);
      if (magHeading === null || isNaN(magHeading)) {
        return; // Skip if magnetometer data is invalid
      }

      // Apply magnetic declination to get true north
      const declination = headingOffset.current;
      const trueNorthHeading = isNaN(declination) || !isFinite(declination)
        ? magHeading
        : (magHeading + declination) % 360;

      // Update magnetometer-based heading (low-pass filtered)
      const smoothedMagHeading = applyLowPassFilter(trueNorthHeading);

      // Process gyroscope data for relative rotation
      if (gyroData) {
        const now = Date.now();
        const deltaTime = (now - lastGyroUpdate.current) / 1000; // Convert to seconds
        lastGyroUpdate.current = now;

        // Gyroscope gives angular velocity in rad/s
        // Integrate to get rotation change
        const gyroRotation = gyroData.z * deltaTime * (180 / Math.PI); // Convert to degrees

        // Update gyro-based heading (high-pass filtered for smooth relative tracking)
        gyroHeading.current = (gyroHeading.current + gyroRotation) % 360;

        // Combine magnetometer (absolute) and gyroscope (relative) using complementary filter
        // This gives us the best of both: absolute reference + smooth tracking
        const combinedHeading = (gyroAlpha * gyroHeading.current) + ((1 - gyroAlpha) * smoothedMagHeading);

        setHeading(combinedHeading);
        setAccuracy(1); // High accuracy with full sensor fusion
      } else {
        // Fallback to magnetometer-only if no gyroscope data
        setHeading(smoothedMagHeading);
        setAccuracy(0.8); // Slightly lower accuracy without gyroscope
      }
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
      if (accelerometerSubscription) accelerometerSubscription.remove();
      if (gyroscopeSubscription) gyroscopeSubscription.remove();
    };
  }, []);

  return {
    heading,
    accuracy,
    isSupported,
    pitch,
  };
};
