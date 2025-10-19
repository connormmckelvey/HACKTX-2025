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
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Light filtering for responsiveness - reduced for debugging
  const pitchHistory = useRef([]);
  const rollHistory = useRef([]);
  const headingHistory = useRef([]);
  const HISTORY_LENGTH = 1; // Minimal filtering for maximum responsiveness
  const STABILITY_THRESHOLD = 0.1; // Very sensitive for debugging
  
  // Magnetic declination
  const headingOffset = useRef(0);
  const calibrationSamples = useRef([]);
  const isCalibratingRef = useRef(false);
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
    newHeading = (newHeading + 360) % 360;
    
    return newHeading;
  };

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

  // Low-pass filter for smoothing heading values - more responsive for debugging
  const applyLowPassFilter = (newValue) => {
    const alpha = 0.7; // Increased from 0.3 to 0.7 for much more responsive heading
    const lastValue = headingHistory.current[headingHistory.current.length - 1] || newValue;
    return alpha * newValue + (1 - alpha) * lastValue;
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
    
    // Apply minimal smoothing for debugging
    const smoothedPitch = smoothValue(rawPitch, pitchHistory);
    const smoothedRoll = rawRoll; // Use raw roll for maximum responsiveness
    
    // Always update values for debugging
    setPitch(smoothedPitch);
    setRoll(smoothedRoll);
    
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
    } else {
      // NO MAGNETOMETER DATA - Use fixed heading (North = 0°)
      console.log('🔄 DeviceMotion: No magnetometer data, using fixed heading (North = 0°)', {
        rawRoll: rawRoll,
        smoothedRoll: smoothedRoll,
        timestamp: new Date().toISOString()
      });
      
      // Use fixed heading pointing North (0°) when magnetometer is not available
      // This prevents the constellation from moving with device rotation
      setHeading(0);
      setAccuracy(0.3); // Lower accuracy since we're using fixed heading
      
      console.log('🔄 DeviceMotion: Fixed heading calculation:', {
        rawRoll: rawRoll,
        smoothedRoll: smoothedRoll,
        finalHeading: 0,
        note: 'No magnetometer data, using fixed North heading to prevent constellation drift',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Process DeviceOrientationEvent data (Web API) with filtering
  const processDeviceOrientation = (event) => {
    const { alpha, beta, gamma } = event;
    
    // Debug all orientation values - log EVERY event for debugging
    console.log('🔍 Raw Orientation Event:', {
      alpha: alpha,
      beta: beta,
      gamma: gamma,
      hasAlpha: alpha !== null && !isNaN(alpha),
      hasBeta: beta !== null && !isNaN(beta),
      hasGamma: gamma !== null && !isNaN(gamma),
      alphaType: typeof alpha,
      betaType: typeof beta,
      gammaType: typeof gamma,
      timestamp: new Date().toISOString()
    });
    
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
    
    // Process heading - alpha represents compass direction (0-360°)
    // TEMPORARY: Force roll-based heading for testing
    console.log('🧪 Testing roll-based heading - alpha check:', {
      alpha: alpha,
      alphaIsNull: alpha === null,
      alphaIsNaN: isNaN(alpha),
      willUseRollBased: alpha === null || isNaN(alpha)
    });
    
    // TEMPORARY: Always use fixed heading for testing
    // Use fixed heading pointing North (0°) when magnetometer is not available
    // This prevents the constellation from moving with device rotation
    const finalHeading = 0;
    
    setHeading(finalHeading);
    setAccuracy(0.3); // Lower accuracy since we're using fixed heading
    
    console.log('🔄 FORCED Fixed heading calculation:', {
      roll: roll,
      finalHeading: finalHeading,
      note: 'FORCED fixed North heading to prevent constellation drift',
      timestamp: new Date().toISOString()
    });
    
    // Skip the alpha-based calculation for now
    return;
    
    if (alpha !== null && !isNaN(alpha)) {
      // Apply magnetic declination correction
      const declination = headingOffset.current;
      const trueNorthHeading = isNaN(declination) || !isFinite(declination)
        ? alpha
        : (alpha + declination) % 360;
      
      // TEMPORARY: Skip smoothing for debugging - use raw heading
      // const smoothedHeading = smoothValue(trueNorthHeading, headingHistory);
      const smoothedHeading = trueNorthHeading; // Use raw value for debugging
      
      // Update heading immediately for more responsive movement
      setHeading(smoothedHeading);
      setAccuracy(0.8);
      
      // Debug logging for heading - log EVERY heading calculation
      console.log('Heading Debug:', {
        alpha: alpha,
        declination: declination,
        trueNorthHeading: trueNorthHeading,
        smoothedHeading: smoothedHeading,
        timestamp: new Date().toISOString()
      });
    } else {
      // ALPHA VALUES ARE NULL - Use fixed heading (North = 0°)
      // Since alpha is not available, use fixed North heading to prevent constellation drift
      
      // Use fixed heading pointing North (0°) when alpha is not available
      // This prevents the constellation from moving with device rotation
      const finalHeading = 0;
      
      setHeading(finalHeading);
      setAccuracy(0.3); // Lower accuracy since we're using fixed heading
      
      console.log('🔄 Fixed heading calculation:', {
        roll: roll,
        finalHeading: finalHeading,
        note: 'Alpha values not available, using fixed North heading to prevent constellation drift',
        timestamp: new Date().toISOString()
      });
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
        // Try absolute orientation first, then fall back to regular orientation
        if ('ondeviceorientationabsolute' in window) {
          window.addEventListener('deviceorientationabsolute', processDeviceOrientation);
          console.log('✅ Using deviceorientationabsolute event - should provide alpha values');
        } else if ('ondeviceorientation' in window) {
          window.addEventListener('deviceorientation', processDeviceOrientation);
          console.log('⚠️ Using deviceorientation event - alpha values may be null');
        } else {
          console.warn('❌ Device orientation not supported');
          setIsSupported(false);
          return;
        }
        
        // Add a test listener to see if ANY orientation events are firing
        window.addEventListener('deviceorientation', (event) => {
          console.log('🚨 TEST: deviceorientation event fired!', {
            alpha: event.alpha,
            beta: event.beta,
            gamma: event.gamma,
            timestamp: new Date().toISOString()
          });
        });
        
        window.addEventListener('deviceorientationabsolute', (event) => {
          console.log('🚨 TEST: deviceorientationabsolute event fired!', {
            alpha: event.alpha,
            beta: event.beta,
            gamma: event.gamma,
            timestamp: new Date().toISOString()
          });
        });
        
        // Also try to listen to both events to see which one gives us alpha values
        if ('ondeviceorientation' in window) {
          window.addEventListener('deviceorientation', (event) => {
            console.log('Regular deviceorientation alpha:', event.alpha);
          });
        }
        
        if ('ondeviceorientationabsolute' in window) {
          window.addEventListener('deviceorientationabsolute', (event) => {
            console.log('Absolute deviceorientation alpha:', event.alpha);
          });
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
    }
  };

  // Process combined sensor data
  const processSensorData = (magData, accData) => {
    if (!magData || !accData) return;

    const newHeading = calculateHeading(magData, accData);
    if (newHeading === null) return;

    // Apply low-pass filter for smoother readings
    const smoothedHeading = applyLowPassFilter(newHeading);

    // If currently calibrating, collect samples
    if (isCalibratingRef.current) {
      calibrationSamples.current.push(smoothedHeading);
      // limit samples
      if (calibrationSamples.current.length > maxCalibrationSamples) {
        calibrationSamples.current.shift();
      }
    }

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
    calibrateCompass,
    isCalibrating,
    processSensorData,
    initializeOrientation,
    processDeviceMotion,
    processDeviceOrientation,
    calculateHeading,
    smoothValue,
    isStable,
    applyLowPassFilter,
  };
};