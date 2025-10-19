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
import ARCoreView from './ARCoreView';
import { OrientationTest } from './OrientationTest';
import { PhotoCapture } from './PhotoCapture';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ScannerTab = ({ location, onPhotoCapture }) => {
  const [arMode, setArMode] = useState(true);
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
    console.log('📸 ScannerTab handlePhotoCapture called with:', constellation);
    console.log('📸 Current showPhotoCapture state:', showPhotoCapture);
    setSelectedConstellationForPhoto(constellation);
    setShowPhotoCapture(true);
    console.log('📸 PhotoCapture modal should now be visible');
  };

  return (
    <View style={styles.container}>
      {/* AR Core View - Full Screen Stars with Camera Toggle */}
      {!testMode && arMode && location && (
        <>
          {console.log('🔄 Rendering ARCoreView with conditions:', { testMode, arMode, location: !!location })}
          <ARCoreView onPhotoCapture={handlePhotoCapture} />
        </>
      )}

      {/* Orientation Test Mode */}
      {testMode && location && (
        <OrientationTest location={location} />
      )}

      {/* Mode Toggle Buttons */}
      <View style={styles.modeToggleContainer}>
        <TouchableOpacity
          style={[styles.modeButton, arMode && styles.activeModeButton]}
          onPress={() => {
            setArMode(true);
            setTestMode(false);
          }}
        >
          <Ionicons name="camera" size={20} color={arMode ? theme.colors.primary : theme.colors.textPrimary} />
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
          <Ionicons name="compass" size={20} color={testMode ? theme.colors.primary : theme.colors.textPrimary} />
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
    backgroundColor: theme.colors.black,
  },
  modeToggleContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    backgroundColor: theme.colors.overlayDark,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.medium,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  activeModeButton: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  modeButtonText: {
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.caption,
    fontWeight: theme.typography.semibold,
    fontFamily: theme.typography.fontFamily,
  },
  activeModeButtonText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.bold,
  },
});
