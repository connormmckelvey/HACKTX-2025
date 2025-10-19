import React, { useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Text, Modal, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StargazerView } from '../core/components/StargazerView';
import { getObserverData, ObserverData } from '../core/utils/observer';
import { debugLog } from '../config/debug';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';
import { detectConstellation, getConstellationDisplayName, hasCulturalStories } from '../core/utils/constellationDetection';
import { CulturalInfoOverlay } from '../core/components/CulturalInfoOverlay';
import { Quaternion } from 'three';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ARCoreViewProps {
  onPhotoCapture?: (uri: string) => void;
}

export default function ARCoreView({ onPhotoCapture }: ARCoreViewProps) {
  const [observer, setObserver] = useState<ObserverData | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  
  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  
  // Constellation detection state
  const [detectedConstellation, setDetectedConstellation] = useState<string>('');
  const [constellationConfidence, setConstellationConfidence] = useState(0);
  const [showCulturalInfo, setShowCulturalInfo] = useState(false);
  const [selectedCulture, setSelectedCulture] = useState<string>('');
  const [deviceQuaternion, setDeviceQuaternion] = useState<Quaternion>(new Quaternion());
  
  console.log('🔄 ARCoreView initialized with onPhotoCapture:', typeof onPhotoCapture, !!onPhotoCapture);
  
  useEffect(() => { 
    getObserverData().then(setObserver); 
  }, []);

  // Debug camera state changes
  useEffect(() => {
    console.log('📷 Camera state changed:', cameraEnabled);
  }, [cameraEnabled]);

  // Debug camera permissions
  useEffect(() => {
    console.log('📷 Camera permission:', permission);
  }, [permission]);
  
  // Handle sensor data updates from StargazerView (for debug display)
  const handleSensorDataUpdate = React.useCallback((data: { pitch: number; roll: number; yaw: number }) => {
    // This is just for debug display - constellation detection uses quaternion directly
    console.log('Sensor data:', data);
  }, []);

  // Handle device quaternion updates for constellation detection
  const handleDeviceQuaternionUpdate = React.useCallback((quaternion: Quaternion) => {
    setDeviceQuaternion(quaternion);
    
    // Detect constellation based on current device orientation
    if (observer) {
      const detectionResult = detectConstellation(quaternion, observer);
      if (detectionResult.constellation) {
        setDetectedConstellation(detectionResult.constellation.name);
        setConstellationConfidence(detectionResult.confidence);
      } else {
        setDetectedConstellation('');
        setConstellationConfidence(0);
      }
    }
  }, [observer]);

  // Constellation detection function (for manual trigger)
  const detectCurrentConstellation = () => {
    if (!observer) return;
    
    const detectionResult = detectConstellation(deviceQuaternion, observer);
    if (detectionResult.constellation) {
      setDetectedConstellation(detectionResult.constellation.name);
      setConstellationConfidence(detectionResult.confidence);
    } else {
      // Fallback to time-based detection if no constellation found
      const currentHour = new Date().getHours();
      const currentMonth = new Date().getMonth();
      
      let constellationName = '';
      let confidence = 0.7;
      
      if (currentMonth >= 2 && currentMonth <= 4) { // Spring
        if (currentHour >= 20 || currentHour <= 4) constellationName = 'Orion';
        else if (currentHour >= 5 && currentHour <= 7) constellationName = 'Leo';
        else constellationName = 'Ursa Major';
      } else if (currentMonth >= 5 && currentMonth <= 7) { // Summer
        if (currentHour >= 20 || currentHour <= 4) constellationName = 'Scorpius';
        else if (currentHour >= 5 && currentHour <= 7) constellationName = 'Virgo';
        else constellationName = 'Cygnus';
      } else if (currentMonth >= 8 && currentMonth <= 10) { // Fall
        if (currentHour >= 20 || currentHour <= 4) constellationName = 'Pegasus';
        else if (currentHour >= 5 && currentHour <= 7) constellationName = 'Andromeda';
        else constellationName = 'Cassiopeia';
      } else { // Winter
        if (currentHour >= 20 || currentHour <= 4) constellationName = 'Taurus';
        else if (currentHour >= 5 && currentHour <= 7) constellationName = 'Gemini';
        else constellationName = 'Orion';
      }
      
      setDetectedConstellation(constellationName);
      setConstellationConfidence(confidence);
    }
    
    console.log('🔍 Constellation detected:', detectedConstellation, 'confidence:', constellationConfidence);
  };
  
  // Handle constellation info button press
  const handleConstellationInfo = () => {
    detectCurrentConstellation();
    
    if (detectedConstellation) {
      console.log('📚 Showing cultural info for:', detectedConstellation);
      setShowCulturalInfo(true);
    } else {
      Alert.alert(
        'No Constellation Detected',
        'Try looking at a different part of the sky or check your device orientation.',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Handle cultural info close
  const handleCloseCulturalInfo = () => {
    setShowCulturalInfo(false);
    setSelectedCulture('');
  };
  
  // Handle culture change
  const handleCultureChange = (culture: string) => {
    setSelectedCulture(culture);
  };
  
  const handleTakePicture = async () => {
    console.log('📸 ARCoreView capture button pressed!', {
      cameraRef: !!cameraRef.current,
      cameraEnabled: cameraEnabled,
      onPhotoCapture: !!onPhotoCapture
    });
    
    if (cameraRef.current && cameraEnabled) {
      try {
        // Add a small delay to ensure camera is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if camera is still enabled after delay
        if (!cameraEnabled || !cameraRef.current) {
          console.log('❌ Camera disabled or ref became null during photo capture');
          return;
        }

        console.log('📸 Taking picture with ARCoreView camera...');
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        // Check if camera is still enabled after photo capture
        if (!cameraEnabled) {
          console.log('❌ Camera disabled during photo capture, discarding photo');
          return;
        }
        
        console.log('📸 Photo taken successfully, calling onPhotoCapture:', photo.uri);
        if (onPhotoCapture) {
          onPhotoCapture(photo.uri);
          console.log('✅ onPhotoCapture callback executed successfully');
        } else {
          console.log('❌ onPhotoCapture callback is undefined!');
        }
      } catch (error) {
        // Check if it's the unmounted error specifically first
        if (error.message && error.message.includes('unmounted')) {
          console.log('Camera was unmounted during photo capture - this is expected if camera was disabled');
          return; // Don't show error alert for this case
        }
        
        // Only log as error if it's not an expected unmounted error
        console.error('Error taking picture:', error);
      }
    } else {
      console.log('❌ ARCoreView camera not ready - ref:', !!cameraRef.current, 'enabled:', cameraEnabled);
    }
  };
  
  if (!observer) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.black }} />;
  }
  
  return (
    <View style={styles.container}>
      {/* Debug: Log what's being rendered */}
      {console.log('📷 Rendering - cameraEnabled:', cameraEnabled)}
      
      {/* Camera Background - Only when camera is enabled AND permission granted */}
      {cameraEnabled && permission?.granted && (
        <>
          {console.log('📷 Rendering CameraView component with permission')}
          <CameraView
            ref={cameraRef}
            style={styles.cameraBackground}
            facing="back"
            onCameraReady={() => {
              debugLog('CAMERA_EVENTS', 'Camera ready');
              console.log('📷 Camera is ready and should be showing');
            }}
            onMountError={(error) => {
              console.error('📷 Camera mount error:', error);
            }}
          />
        </>
      )}
      
      {/* Black Background - When camera is disabled OR permission not granted */}
      {(!cameraEnabled || !permission?.granted) && (
        <>
          {console.log('📷 Rendering black background - cameraEnabled:', cameraEnabled, 'permission granted:', permission?.granted)}
          <View style={styles.blackBackground} />
        </>
      )}
      
      {/* AR Stargazer View - Always on top, always transparent */}
      <StargazerView 
        observerData={observer} 
        blackBackgroundEnabled={false}
        cameraEnabled={cameraEnabled}
        onBlackBackgroundToggle={() => setCameraEnabled(!cameraEnabled)}
        onSensorDataUpdate={handleSensorDataUpdate}
        onDeviceQuaternionUpdate={handleDeviceQuaternionUpdate}
      />
      
      {/* Camera Toggle Button - Top Right Corner */}
      <TouchableOpacity 
        style={styles.cameraToggleButton}
        onPress={async () => {
          console.log('📷 Camera toggle pressed. Current state:', cameraEnabled, '-> New state:', !cameraEnabled);
          
          if (!cameraEnabled) {
            // Trying to enable camera - check permissions first
            if (!permission?.granted) {
              console.log('📷 Camera permission not granted, requesting...');
              const result = await requestPermission();
              console.log('📷 Permission request result:', result);
              if (!result.granted) {
                Alert.alert(
                  'Camera Permission Required',
                  'Please grant camera permission to use the AR camera feature.',
                  [{ text: 'OK' }]
                );
                return;
              }
            }
          }
          
          setCameraEnabled(!cameraEnabled);
        }}
      >
        <Ionicons 
          name={cameraEnabled ? "camera" : "camera-outline"} 
          size={24} 
          color={theme.colors.primary} 
        />
        <Text style={styles.cameraToggleText}>
          {cameraEnabled ? 'Camera Off' : 'Camera On'}
        </Text>
      </TouchableOpacity>
      
      {/* Camera Capture Button - Only when camera is on */}
      {cameraEnabled && (
        <TouchableOpacity 
          style={styles.captureButton}
          onPress={handleTakePicture}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      )}
      
      {/* Constellation Info Button - Always visible */}
      <TouchableOpacity 
        style={styles.constellationInfoButton}
        onPress={handleConstellationInfo}
      >
        <Ionicons name="book" size={20} color={theme.colors.primary} />
        <Text style={styles.constellationInfoText}>
          Learn About This Constellation
        </Text>
      </TouchableOpacity>
      
      {/* Detected Constellation Display */}
      {detectedConstellation && (
        <View style={styles.constellationDisplay}>
          <Text style={styles.constellationName}>{detectedConstellation}</Text>
          <Text style={styles.constellationConfidence}>
            Confidence: {Math.round(constellationConfidence * 100)}%
          </Text>
        </View>
      )}
      
      {/* Cultural Info Overlay */}
      <CulturalInfoOverlay
        visible={showCulturalInfo}
        constellationName={detectedConstellation}
        onClose={handleCloseCulturalInfo}
        selectedCulture={selectedCulture}
        onCultureChange={handleCultureChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Ensure container is black
  },
  cameraBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0, // Behind AR stars
  },
  blackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000', // Pure black, not theme color
    zIndex: 0,
  },
  cameraToggleButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: theme.colors.overlayDark,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1001,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.medium,
  },
  cameraToggleText: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: '600' as const,
    marginLeft: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily,
  },
  captureButton: {
    position: 'absolute',
    bottom: 180, // Move higher to avoid constellation info button
    right: 20, // Position on the right side over scanner area
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(74, 92, 71, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
    zIndex: 1002, // Higher than constellation info button
    ...theme.shadows.large,
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
  },
  constellationInfoButton: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.overlayDark,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.medium,
  },
  constellationInfoText: {
    color: theme.colors.primary,
    fontSize: theme.typography.body,
    fontWeight: '600' as const,
    marginLeft: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily,
  },
  constellationDisplay: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.overlayDark,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    zIndex: 1001,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.medium,
  },
  constellationName: {
    color: theme.colors.primary,
    fontSize: theme.typography.h3,
    fontWeight: 'bold' as const,
    fontFamily: theme.typography.fontFamily,
  },
  constellationConfidence: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    marginTop: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily,
  },
});
