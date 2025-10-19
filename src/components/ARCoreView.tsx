import React, { useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Text, Modal, Alert } from 'react-native';
import { CameraView } from 'expo-camera';
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
  
  // Constellation detection state
  const [detectedConstellation, setDetectedConstellation] = useState<string>('');
  const [constellationConfidence, setConstellationConfidence] = useState(0);
  const [showCulturalInfo, setShowCulturalInfo] = useState(false);
  const [selectedCulture, setSelectedCulture] = useState<string>('');
  
  console.log('🔄 ARCoreView initialized with onPhotoCapture:', typeof onPhotoCapture, !!onPhotoCapture);
  
  useEffect(() => { 
    getObserverData().then(setObserver); 
  }, []);
  
  // Constellation detection function
  const detectCurrentConstellation = () => {
    if (!observer) return;
    
    // For now, we'll use a simple approach - detect based on time and location
    // In a real implementation, you'd use the device's gyroscope/accelerometer data
    const currentHour = new Date().getHours();
    const currentMonth = new Date().getMonth();
    
    // Simple constellation detection based on time of year and hour
    let constellationName = '';
    let confidence = 0.7; // Base confidence
    
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
    
    console.log('🔍 Constellation detected:', constellationName, 'confidence:', confidence);
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
      {/* Camera Background - Only when camera is enabled */}
      {cameraEnabled && (
        <CameraView
          ref={cameraRef}
          style={styles.cameraBackground}
          facing="back"
          onCameraReady={() => debugLog('CAMERA_EVENTS', 'Camera ready')}
        />
      )}
      
      {/* Black Background - When camera is disabled */}
      {!cameraEnabled && (
        <View style={styles.blackBackground} />
      )}
      
      {/* AR Stargazer View - Always on top */}
      <StargazerView 
        observerData={observer} 
        blackBackgroundEnabled={!cameraEnabled}
        onBlackBackgroundToggle={() => setCameraEnabled(!cameraEnabled)}
      />
      
      {/* Camera Toggle Button - Top Right Corner */}
      <TouchableOpacity 
        style={styles.cameraToggleButton}
        onPress={() => setCameraEnabled(!cameraEnabled)}
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
  },
  cameraBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  blackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.black,
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
    bottom: 100,
    left: '50%',
    marginLeft: -35,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(74, 92, 71, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
    zIndex: 1000,
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
    bottom: 50,
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
