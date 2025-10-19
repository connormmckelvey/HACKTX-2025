import React, { useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Text } from 'react-native';
import { CameraView } from 'expo-camera';
import { StargazerView } from '../core/components/StargazerView';
import { getObserverData, ObserverData } from '../core/utils/observer';
import { debugLog } from '../config/debug';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ARCoreViewProps {
  onPhotoCapture?: (uri: string) => void;
}

export default function ARCoreView({ onPhotoCapture }: ARCoreViewProps) {
  const [observer, setObserver] = useState<ObserverData | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  
  console.log('🔄 ARCoreView initialized with onPhotoCapture:', typeof onPhotoCapture, !!onPhotoCapture);
  
  useEffect(() => { 
    getObserverData().then(setObserver); 
  }, []);
  
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
});
