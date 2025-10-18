import { useState, useEffect, useRef } from 'react';
import { Magnetometer, Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';
import geomagnetism from 'geomagnetism';

export const useCompass = (location) => {
  const [heading, setHeading] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [isSupported, setIsSupported] = useState(false);

  // Sensor fusion variables
  const alpha = 0.8; // Low-pass filter coefficient
  const filteredHeading = useRef(0);
  const headingOffset = useRef(0); // This will now store magnetic declination
  const calibrationSamples = useRef([]);
  const maxCalibrationSamples = 50;

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

    // Calculate pitch and roll for tilt compensation
    const pitch = Math.asin(-nx);
    const roll = Math.asin(ny / Math.cos(pitch));

    // Apply tilt compensation to magnetometer data
    const mx_comp = mx * Math.cos(pitch) + mz * Math.sin(pitch);
    const my_comp = mx * Math.sin(roll) * Math.sin(pitch) +
                   my * Math.cos(roll) -
                   mz * Math.sin(roll) * Math.cos(pitch);

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
      const { latitude, longitude } = location.coords;
      const geo = geomagnetism.model().point(latitude, longitude);
      headingOffset.current = geo.decl; // Store declination in degrees
    }
  }, [location]);

  useEffect(() => {
    // Check if we're on a native platform that supports sensors
    const platformSupported = Platform.OS !== 'web';

    if (!platformSupported) {
      setIsSupported(false);
      return;
    }

    let magnetometerSubscription, accelerometerSubscription;

    // Check if sensors are available and start listening
    const initializeSensors = async () => {
      try {
        // Check magnetometer availability
        const magnetometerAvailable = await Magnetometer.isAvailableAsync();
        const accelerometerAvailable = await Accelerometer.isAvailableAsync();

        setIsSupported(magnetometerAvailable && accelerometerAvailable);

        if (magnetometerAvailable && accelerometerAvailable) {
          // Set update intervals for both sensors
          Magnetometer.setUpdateInterval(50); // 20 FPS for better responsiveness
          Accelerometer.setUpdateInterval(50);

          let magnetometerData = null;
          let accelerometerData = null;

          // Magnetometer listener
          magnetometerSubscription = Magnetometer.addListener((data) => {
            magnetometerData = data;
            processSensorData(magnetometerData, accelerometerData);
          });

          // Accelerometer listener
          accelerometerSubscription = Accelerometer.addListener((data) => {
            accelerometerData = data;
            processSensorData(magnetometerData, accelerometerData);
          });

        } else {
          console.warn('Sensors not available, using fallback method');
          fallbackToDeviceMotion();
        }
      } catch (error) {
        console.warn('Sensor initialization failed:', error);
        fallbackToDeviceMotion();
      }
    };

    // Process combined sensor data
    const processSensorData = (magData, accData) => {
      if (!magData || !accData) return;

      let newHeading = calculateHeading(magData, accData);
      if (newHeading === null || isNaN(newHeading)) {
        // If gimbal lock or other issue occurs, skip this update
        return;
      }

      // Apply low-pass filter for smoother readings
      const smoothedHeading = applyLowPassFilter(newHeading);

      // Apply magnetic declination to get true north
      const finalHeading = (smoothedHeading + headingOffset.current) % 360;

      setHeading(finalHeading);
      setAccuracy(1); // High accuracy with sensor fusion
    };

    // Fallback function using DeviceMotion
    const fallbackToDeviceMotion = async () => {
      try {
        const { DeviceMotion } = await import('expo-sensors');
        const isAvailable = await DeviceMotion.isAvailableAsync();

        if (isAvailable) {
          DeviceMotion.setUpdateInterval(100);

          const subscription = DeviceMotion.addListener((motionData) => {
            if (motionData.rotation) {
              const rotation = motionData.rotation;
              let heading = Math.atan2(rotation.gamma, rotation.beta) * (180 / Math.PI);
              heading = (heading + 360) % 360;

              if (isNaN(heading)) return; // Final safeguard for fallback

              // Apply low-pass filter even for fallback
              const smoothedHeading = applyLowPassFilter(heading);
              
              // Apply magnetic declination for fallback as well
              const finalHeading = (smoothedHeading + headingOffset.current) % 360;
              setHeading(finalHeading);
              setAccuracy(motionData.rotation.accuracy || 0.5); // Lower accuracy for fallback
            }
          });

          magnetometerSubscription = subscription;
        } else {
          setIsSupported(false);
          // Set a no-op calibration function for unsupported platforms
          setCalibrateCompass(() => () => {
            console.warn('Compass calibration not available on this platform');
          });
        }
      } catch (fallbackError) {
        console.warn('DeviceMotion fallback not available:', fallbackError);
        setIsSupported(false);
        // Set a no-op calibration function for unsupported platforms
        setCalibrateCompass(() => () => {
          console.warn('Compass calibration not available on this platform');
        });
      }
    };

    initializeSensors();

    return () => {
      if (magnetometerSubscription) magnetometerSubscription.remove();
      if (accelerometerSubscription) accelerometerSubscription.remove();
    };
  }, []);

  return {
    heading,
    accuracy,
    isSupported,
  };
};
