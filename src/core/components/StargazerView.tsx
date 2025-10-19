// Main AR Stargazing View Component
// Refactored to use react-three-fiber for proper 3D rendering

import React, { useMemo, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, Platform } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { useAnimatedSensor, SensorType } from 'react-native-reanimated';

import { ObserverData } from '../utils/observer';
import { calculateSkyOrientation, SkyOrientation } from '../utils/skyOrientation';
import { RENDERING_CONFIG, SENSOR_CONFIG } from '../config/constants';
import { Scene } from './Scene';
import { TapDebouncer, StarNameDisplay } from '../utils/starInteraction';
import { CulturalInfoOverlay } from './CulturalInfoOverlay';
import { ConstellationSelector } from './ConstellationSelector';
import { debugLog, log } from '../../config/debug';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface StargazerViewProps {
  onError?: (error: string) => void;
  observerData: ObserverData;
  blackBackgroundEnabled?: boolean;
  onBlackBackgroundToggle?: () => void;
}

export const StargazerView: React.FC<StargazerViewProps> = ({ 
  onError, 
  observerData, 
  blackBackgroundEnabled = false,
  onBlackBackgroundToggle 
}) => {
  // Calculate sky orientation once at startup
  const skyOrientation = useMemo(() => {
    const orientation = calculateSkyOrientation(observerData);
    debugLog('CONSTELLATION_DATA', 'Sky orientation calculated:', {
      lst: observerData.lst,
      latitude: observerData.location.latitude,
      longitude: observerData.location.longitude,
      worldRotationQuaternion: orientation.worldRotationQuaternion
    });
    return orientation;
  }, [observerData]);

  // Tap debouncer for star interaction
  const tapDebouncer = useRef<TapDebouncer>(new TapDebouncer(300));

  // Initialize sensor hook outside of R3F Canvas to avoid context conflicts
  const rotationSensor = useAnimatedSensor(SensorType.GYROSCOPE, {
    interval: 1000 / SENSOR_CONFIG.UPDATE_FREQUENCY,
  });

  // State for sensor data and UI
  const [sensorData, setSensorData] = useState({ pitch: 0, roll: 0, yaw: 0 });
  const [debugInfo, setDebugInfo] = useState({
    lst: observerData.lst,
    latitude: observerData.location.latitude,
    longitude: observerData.location.longitude,
    utcTime: observerData.utcTime.toISOString(),
  });

  // Handle sensor data updates from Scene component
  const handleSensorDataUpdate = React.useCallback((data: { pitch: number; roll: number; yaw: number }) => {
    setSensorData(data);
  }, []);

  // Star interaction state
  const [starNameDisplay, setStarNameDisplay] = useState<StarNameDisplay | null>(null);
  
  // Cultural info state
  const [showCulturalInfo, setShowCulturalInfo] = useState(false);
  const [selectedConstellation, setSelectedConstellation] = useState<string>('');
  const [selectedCulture, setSelectedCulture] = useState<string>('');
  const [showConstellationSelector, setShowConstellationSelector] = useState(false);

  // Debug sensor data updates
  React.useEffect(() => {
    debugLog('SENSOR_DATA', 'Sensor data updated:', sensorData);
  }, [sensorData]);

  // Handle tap on screen for star interaction
  const handleTap = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    
    // For now, we'll implement a simple tap handler
    // In the future, we can add raycasting to find stars under the tap point
    debugLog('USER_INTERACTIONS', 'Tap at:', locationX, locationY);
  };

  // Handle cultural info interactions
  const handleShowCulturalInfo = (constellationName: string) => {
    setSelectedConstellation(constellationName);
    setShowCulturalInfo(true);
  };

  const handleCloseCulturalInfo = () => {
    setShowCulturalInfo(false);
    setSelectedConstellation('');
    setSelectedCulture('');
  };

  const handleCultureChange = (culture: string) => {
    setSelectedCulture(culture);
  };

  const handleShowConstellationSelector = () => {
    setShowConstellationSelector(true);
  };

  const handleCloseConstellationSelector = () => {
    setShowConstellationSelector(false);
  };

  const handleSelectConstellation = (constellationName: string) => {
    handleShowCulturalInfo(constellationName);
  };

  // Format LST for display
  const formatLST = (lst: number): string => {
    const hours = Math.floor(lst);
    const minutes = Math.floor((lst - hours) * 60);
    const seconds = Math.floor(((lst - hours) * 60 - minutes) * 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* 3D Scene with react-three-fiber (native Canvas) */}
      <Canvas
        style={styles.glView}
        onCreated={() => {
          log('--- R3F CANVAS CREATED ---');
        }}
        gl={{ antialias: true }}
      >
        <Scene 
          skyOrientation={skyOrientation}
          rotationSensor={rotationSensor}
          onSensorDataUpdate={handleSensorDataUpdate}
        />
      </Canvas>

      {/* UI Overlays */}
      <View style={styles.overlay}>

        {/* Reticle */}
        <View style={styles.reticleContainer}>
          <View style={styles.reticle} />
        </View>

        {/* Star Name Display */}
        {starNameDisplay && (
          <View style={styles.starNameContainer}>
            <Text style={styles.starNameText}>
              {starNameDisplay.starName || 'Unknown Star'}
            </Text>
          </View>
        )}

        {/* Camera Toggle Button - Removed, now handled in ARCoreView */}

        {/* Cultural Info Button */}
        <TouchableOpacity
          style={styles.culturalInfoButton}
          onPress={handleShowConstellationSelector}
        >
          <Text style={styles.culturalInfoText}>Learn Cultural Stories</Text>
        </TouchableOpacity>
      </View>

      {/* Tap Handler - Temporarily disabled to test sensor */}
      {/* <TouchableOpacity
        style={styles.tapArea}
        onPress={handleTap}
        activeOpacity={1}
      /> */}

      {/* Cultural Info Overlay */}
      <CulturalInfoOverlay
        visible={showCulturalInfo}
        constellationName={selectedConstellation}
        onClose={handleCloseCulturalInfo}
        selectedCulture={selectedCulture}
        onCultureChange={handleCultureChange}
      />

      {/* Constellation Selector */}
      <ConstellationSelector
        visible={showConstellationSelector}
        onClose={handleCloseConstellationSelector}
        onSelectConstellation={handleSelectConstellation}
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  glView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  culturalInfoButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(74, 92, 71, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    pointerEvents: 'auto',
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  culturalInfoText: {
    color: '#f5e6d3',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 90 : 70,
    backgroundColor: 'transparent',
    zIndex: 500,
  },
  reticleContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -4 }, { translateY: -4 }],
    pointerEvents: 'none',
    zIndex: 1000,
  },
  reticle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(245, 230, 211, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(245, 230, 211, 0.5)',
  },
  starNameContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(26, 21, 18, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    pointerEvents: 'none',
  },
  starNameText: {
    color: '#f5e6d3',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});