import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import { ARStarOverlay } from './ARStarOverlay';
import { OrientationTest } from './OrientationTest';
import { PhotoCapture } from './PhotoCapture';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ScannerTab = ({ location, onPhotoCapture }) => {
  const [arMode, setArMode] = useState(true);
  const [cameraMode, setCameraMode] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [selectedConstellationForPhoto, setSelectedConstellationForPhoto] = useState(null);

  // Animation refs
  const starAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulsing star animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(starAnim, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(starAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, []);

  const handlePhotoCapture = (constellation) => {
    setSelectedConstellationForPhoto(constellation);
    setShowPhotoCapture(true);
  };

  return (
    <View style={styles.container}>
      {/* AR Star Overlay */}
      {!testMode && arMode && cameraMode && location && (
        <ARStarOverlay
          location={location}
          cameraMode={cameraMode}
          showDaytimeOverlay={true}
        />
      )}

      {/* Orientation Test Mode */}
      {testMode && location && (
        <OrientationTest location={location} />
      )}

      {/* Snapchat-style Capture Button */}
      <TouchableOpacity
        style={styles.snapchatCaptureButton}
        onPress={() => {
          // For now, just show the photo capture modal
          // In a real implementation, this would detect the constellation being viewed
          setSelectedConstellationForPhoto(null);
          setShowPhotoCapture(true);
        }}
      >
        <View style={styles.captureButtonOuter}>
          <View style={styles.captureButtonInner} />
        </View>
      </TouchableOpacity>

      {/* Mode Toggle Buttons */}
      <View style={styles.modeToggleContainer}>
        <TouchableOpacity
          style={[styles.modeButton, arMode && styles.activeModeButton]}
          onPress={() => {
            setArMode(true);
            setTestMode(false);
          }}
        >
          <Ionicons name="camera" size={20} color={arMode ? "#FFD700" : "#FFFFFF"} />
          <Text style={[styles.modeButtonText, arMode && styles.activeModeButtonText]}>
            AR
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, testMode && styles.activeModeButton]}
          onPress={() => {
            setTestMode(true);
            setArMode(false);
          }}
        >
          <Ionicons name="compass" size={20} color={testMode ? "#FFD700" : "#FFFFFF"} />
          <Text style={[styles.modeButtonText, testMode && styles.activeModeButtonText]}>
            Test
          </Text>
        </TouchableOpacity>
      </View>

      {/* Photo Capture Modal */}
      <PhotoCapture
        visible={showPhotoCapture}
        onClose={() => setShowPhotoCapture(false)}
        constellation={selectedConstellationForPhoto}
        location={location}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  snapchatCaptureButton: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    marginLeft: -35,
    zIndex: 10,
  },
  captureButtonOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
  },
  modeToggleContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 5,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  activeModeButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  modeButtonText: {
    color: '#FFFFFF',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '600',
  },
  activeModeButtonText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
});
