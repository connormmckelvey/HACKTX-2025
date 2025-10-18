import { useState, useEffect, useRef } from 'react';
import { Magnetometer, DeviceMotion } from 'expo-sensors';
import { Platform } from 'react-native';
import geomagnetism from 'geomagnetism';

export const useCompass = (location) => {
  const [heading, setHeading] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [isPointingSkyward, setIsPointingSkyward] = useState(false);
  const [orientationPermission, setOrientationPermission] = useState(null);

  // Heavy filtering for stability
  const pitchHistory = useRef([]);
  const rollHistory = useRef([]);
  const headingHistory = useRef([]);
  const HISTORY_LENGTH = 10; // Keep last 10 readings
  const STABILITY_THRESHOLD = 5; // Degrees of change to consider stable
  
  // Magnetic declination
  const headingOffset = useRef(0);
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

  // Simple smoothing function
  const smoothValue = (newValue, historyRef) => {
    historyRef.current.push(newValue);
    if (historyRef.current.length > HISTORY_LENGTH) {
      historyRef.current.shift();
    }
    
    // Calculate average of recent values
    const sum = historyRef.current.reduce((a, b) => a + b, 0);
    return sum / historyRef.current.length;
  };

  // Check if value is stable (not changing much)
  const isStable = (historyRef) => {
    if (historyRef.current.length < 3) return false;
    
    const recent = historyRef.current.slice(-3);
    const max = Math.max(...recent);
    const min = Math.min(...recent);
    
    return (max - min) < STABILITY_THRESHOLD;
  };

  // Process DeviceMotion data with heavy filtering
  const processDeviceMotion = (motionData) => {
    if (!motionData.rotation || !motionData.accelerationIncludingGravity) return;
    
    const { alpha, beta, gamma } = motionData.rotation;
    const { x: gx, y: gy, z: gz } = motionData.accelerationIncludingGravity;
    
    // Use gravity vector for more stable pitch calculation
    const gravityMagnitude = Math.sqrt(gx * gx + gy * gy + gz * gz);
    if (gravityMagnitude < 0.1) return;
    
    // Normalize gravity vector
    const ngx = gx / gravityMagnitude;
    const ngy = gy / gravityMagnitude;
    const ngz = gz / gravityMagnitude;
    
    // Calculate pitch from gravity vector (more stable)
    const rawPitch = Math.asin(-ngz) * (180 / Math.PI);
    const rawRoll = gamma;
    
    // Apply heavy smoothing
    const smoothedPitch = smoothValue(rawPitch, pitchHistory);
    const smoothedRoll = smoothValue(rawRoll, rollHistory);
    
    // Only update if values are stable
    if (isStable(pitchHistory)) {
      setPitch(smoothedPitch);
    }
    
    if (isStable(rollHistory)) {
      setRoll(smoothedRoll);
    }
    
    // Simple sky detection with buffer zones
    // Based on user feedback: phone standing up is ~3°, so sky detection should be LESS than 8°
    // 90° = pointing at ground, 3° = pointing at sky, <8° = pointing skyward (with buffer)
    const skyThreshold = 8; // Degrees - if pitch is LESS than this, pointing skyward
    const pointingSkyward = smoothedPitch < skyThreshold;
    setIsPointingSkyward(pointingSkyward);
    
    // Process heading from magnetometer if available
    if (motionData.magneticField) {
      const { x: mx, y: my, z: mz } = motionData.magneticField;
      
      // Simple heading calculation
      let magHeading = Math.atan2(my, mx) * (180 / Math.PI);
      magHeading = (magHeading + 360) % 360;
      
      // Apply magnetic declination
      const declination = headingOffset.current;
      const trueNorthHeading = isNaN(declination) || !isFinite(declination)
        ? magHeading
        : (magHeading + declination) % 360;
      
      // Apply smoothing to heading
      const smoothedHeading = smoothValue(trueNorthHeading, headingHistory);
      
      if (isStable(headingHistory)) {
        setHeading(smoothedHeading);
        setAccuracy(0.8); // Good accuracy with smoothing
      }
    }
  };

  // Process DeviceOrientationEvent data (Web API) with filtering
  const processDeviceOrientation = (event) => {
    const { alpha, beta, gamma } = event;
    
    if (beta === null || isNaN(beta)) return;
    
    // Apply heavy smoothing
    const smoothedPitch = smoothValue(beta, pitchHistory);
    const smoothedRoll = smoothValue(gamma, rollHistory);
    
    // Only update if values are stable
    if (isStable(pitchHistory)) {
      setPitch(smoothedPitch);
    }
    
    if (isStable(rollHistory)) {
      setRoll(smoothedRoll);
    }
    
    // Simple sky detection
    // Based on user feedback: phone standing up is ~3°, so sky detection should be LESS than 8°
    // 90° = pointing at ground, 3° = pointing at sky, <8° = pointing skyward (with buffer)
    const skyThreshold = 8; // Degrees - if pitch is LESS than this, pointing skyward
    const pointingSkyward = smoothedPitch < skyThreshold;
    setIsPointingSkyward(pointingSkyward);
    
    // Process heading
    if (alpha !== null && !isNaN(alpha)) {
      const declination = headingOffset.current;
      const trueNorthHeading = isNaN(declination) || !isFinite(declination)
        ? alpha
        : (alpha + declination) % 360;
      
      const smoothedHeading = smoothValue(trueNorthHeading, headingHistory);
      
      if (isStable(headingHistory)) {
        setHeading(smoothedHeading);
        setAccuracy(0.8);
      }
    }
  };

  // Request permission for device orientation (iOS)
  const requestOrientationPermission = async () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          try {
            const permission = await DeviceOrientationEvent.requestPermission();
            setOrientationPermission(permission);
            return permission === 'granted';
          } catch (error) {
            console.error('Error requesting orientation permission:', error);
            setOrientationPermission('denied');
            return false;
          }
        } else {
          setOrientationPermission('granted');
          return true;
        }
      } else {
        setOrientationPermission('denied');
        return false;
      }
    }
    
    setOrientationPermission('granted');
    return true;
  };

  // Initialize orientation detection
  const initializeOrientation = async () => {
    if (Platform.OS === 'web') {
      const hasPermission = await requestOrientationPermission();
      
      if (hasPermission) {
        if ('ondeviceorientationabsolute' in window) {
          window.addEventListener('deviceorientationabsolute', processDeviceOrientation);
          console.log('Using deviceorientationabsolute event with heavy filtering');
        } else if ('ondeviceorientation' in window) {
          window.addEventListener('deviceorientation', processDeviceOrientation);
          console.log('Using deviceorientation event with heavy filtering');
        } else {
          console.warn('Device orientation not supported');
          setIsSupported(false);
          return;
        }
        
        setIsSupported(true);
        return () => {
          window.removeEventListener('deviceorientationabsolute', processDeviceOrientation);
          window.removeEventListener('deviceorientation', processDeviceOrientation);
        };
      } else {
        setIsSupported(false);
        return;
      }
    } else {
      try {
        const deviceMotionAvailable = await DeviceMotion.isAvailableAsync();
        
        if (deviceMotionAvailable) {
          DeviceMotion.setUpdateInterval(100); // Slower updates for stability
          
          const subscription = DeviceMotion.addListener(processDeviceMotion);
          setIsSupported(true);
          
          return () => subscription.remove();
        } else {
          setIsSupported(false);
          return;
        }
      } catch (error) {
        console.error('Error initializing DeviceMotion:', error);
        setIsSupported(false);
        return;
      }
    };

    // Process combined sensor data
    const processSensorData = (magData, accData) => {
      if (!magData || !accData) return;

      const newHeading = calculateHeading(magData, accData);
      if (newHeading === null) return;

      // Apply low-pass filter for smoother readings
      const smoothedHeading = applyLowPassFilter(newHeading);

      // Apply calibration offset if available
      const finalHeading = (smoothedHeading + headingOffset.current) % 360;

      setHeading(finalHeading);
      setAccuracy(1); // High accuracy with sensor fusion
    };

    // Calibration function
    const calibrateCompass = () => {
      setIsCalibrating(true);
      calibrationSamples.current = [];

      // Collect samples while user rotates device
      const calibrationTimeout = setTimeout(() => {
        if (calibrationSamples.current.length >= 10) {
          // Calculate average offset from true north (assuming user pointed north)
          const avgOffset = calibrationSamples.current.reduce((sum, sample) => sum + sample, 0) / calibrationSamples.current.length;
          headingOffset.current = -avgOffset; // Correct for the offset
          console.log('Compass calibrated with offset:', headingOffset.current);
        }
        setIsCalibrating(false);
      }, 10000); // 10 second calibration period

      return () => clearTimeout(calibrationTimeout);
    };

  // Update magnetic declination when location changes
  useEffect(() => {
    if (location) {
      try {
        const { latitude, longitude } = location.coords;
        const geo = geomagnetism.model().point(latitude, longitude);
        const declination = geo.decl;

        if (typeof declination === 'number' && !isNaN(declination) && isFinite(declination)) {
          headingOffset.current = declination;
          console.log('Updated magnetic declination:', declination);
        } else {
          headingOffset.current = 0;
        }
      } catch (error) {
        console.error('Error calculating magnetic declination:', error);
        headingOffset.current = 0;
      }
    }
  }, [location]);

  // Initialize orientation detection
  useEffect(() => {
    let cleanup;
    
    const init = async () => {
      cleanup = await initializeOrientation();
    };
    
    init();

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return {
    heading,
    accuracy,
    isSupported,
    pitch,
    roll,
    isPointingSkyward,
    orientationPermission,
    requestOrientationPermission,
  };
};