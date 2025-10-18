import { useState, useEffect } from 'react';
import { Magnetometer } from 'expo-sensors';
import { Platform } from 'react-native';

export const useCompass = () => {
  const [heading, setHeading] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if we're on a native platform that supports sensors
    const platformSupported = Platform.OS !== 'web';

    if (!platformSupported) {
      setIsSupported(false);
      return;
    }

    // Check if Magnetometer is available (more accurate for compass)
    const checkAvailability = async () => {
      try {
        const isAvailable = await Magnetometer.isAvailableAsync();
        setIsSupported(isAvailable);

        if (isAvailable) {
          // Enable magnetometer updates for better accuracy
          Magnetometer.setUpdateInterval(100); // 10 FPS

          const subscription = Magnetometer.addListener((magnetometerData) => {
            if (magnetometerData) {
              // Calculate heading from magnetometer data
              // Magnetometer provides raw magnetic field values
              const { x, y, z } = magnetometerData;

              // Calculate heading using magnetometer data
              // This provides better accuracy than DeviceMotion for compass direction
              let heading = Math.atan2(y, x) * (180 / Math.PI);

              // Adjust for device orientation and normalize to 0-360
              heading = (heading + 360) % 360;

              setHeading(heading);
              setAccuracy(1); // Magnetometer typically provides better accuracy
            }
          });

          return () => {
            subscription && subscription.remove();
          };
        }
      } catch (error) {
        console.warn('Magnetometer not available, falling back to DeviceMotion:', error);
        // Fallback to DeviceMotion if Magnetometer fails
        fallbackToDeviceMotion();
      }
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
              setHeading(heading);
              setAccuracy(motionData.rotation.accuracy || 0);
            }
          });

          return () => {
            subscription && subscription.remove();
          };
        }
      } catch (fallbackError) {
        console.warn('Compass fallback not available:', fallbackError);
        setIsSupported(false);
      }
    };

    checkAvailability();
  }, []);

  return { heading, accuracy, isSupported };
};
