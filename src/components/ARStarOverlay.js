import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { useCompass } from '../hooks/useCompass';
import { AstronomyCalculator } from '../utils/astronomy';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ARStarOverlay = ({ location, cameraMode = true, showDaytimeOverlay = true }) => {
  const { 
    heading, 
    isSupported, 
    pitch, 
    roll, 
    isPointingSkyward, 
    deviceOrientation, 
    orientationPermission,
    requestOrientationPermission 
  } = useCompass(location);
  const [starPositions, setStarPositions] = useState([]);
  const [visibleStars, setVisibleStars] = useState([]);
  const [hasPermission, setHasPermission] = useState(null);
  const [isDayTime, setIsDayTime] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  useEffect(() => {
    if (cameraMode) {
      requestCameraPermission();
    }
  }, [cameraMode]);

  useEffect(() => {
    if (location) {
      const positions = AstronomyCalculator.calculateStarPositions(location);
      setStarPositions(positions);

      // Check if it's daytime using accurate astronomical calculation
      const isCurrentlyDay = AstronomyCalculator.isDayTime(
        location.coords.latitude, 
        location.coords.longitude
      );
      setIsDayTime(isCurrentlyDay);
      
      // Get current season
      const currentSeason = AstronomyCalculator.getCurrentSeason();
      console.log('Current season:', currentSeason);
    }
  }, [location]);

  useEffect(() => {
    // Check if we need to request orientation permission
    if (orientationPermission === null && isSupported === false) {
      setShowPermissionPrompt(true);
    } else if (orientationPermission === 'granted') {
      setShowPermissionPrompt(false);
    }
  }, [orientationPermission, isSupported]);

  const handleRequestOrientationPermission = async () => {
    const granted = await requestOrientationPermission();
    if (granted) {
      setShowPermissionPrompt(false);
    } else {
      Alert.alert(
        'Permission Required',
        'This app needs access to device orientation to show stars accurately. Please enable it in your browser settings.',
        [{ text: 'OK' }]
      );
    }
  };

  useEffect(() => {
    if (starPositions.length > 0) {
      // Use compass heading if available, otherwise use 0 (North)
      const currentHeading = isSupported ? heading : 0;
      // Use enhanced visibility calculation with pitch and roll
      const visible = AstronomyCalculator.getVisibleStars(starPositions, currentHeading, pitch, roll, 25);
      setVisibleStars(visible);
    }
  }, [heading, starPositions, isSupported, pitch, roll]);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
    }
  };

  // Convert azimuth/altitude to screen coordinates using roll-based positioning
  const getScreenPosition = (azimuth, altitude) => {
    // Use compass heading if available, otherwise use 0 (North)
    const currentHeading = isSupported ? heading : 0;

    // Use the new astronomy calculator method with roll compensation
    return AstronomyCalculator.horizontalToScreen(
      azimuth, 
      altitude, 
      currentHeading, 
      pitch, 
      roll, 
      screenWidth, 
      screenHeight
    );
  };

  // Get star size and opacity based on magnitude and time of day
  const getStarProperties = (star) => {
    // Convert magnitude to size (brighter stars = larger)
    // Magnitude scale: -1.46 (Sirius) to 5+ (faint stars)
    const baseSize = 8;
    const magnitude = star.magnitude || 3.0; // Default magnitude if not specified
    const size = Math.max(3, baseSize - magnitude * 1.5); // Larger for brighter stars
    
    // Opacity based on time of day and magnitude
    let opacity = 0.9;
    if (isDayTime && showDaytimeOverlay) {
      // During daytime, brighter stars are more visible
      opacity = Math.max(0.3, 0.9 - (magnitude - 1) * 0.1);
    }
    
    return { size, opacity };
  };

  const getLineOpacity = (star1, star2) => {
    if (!isDayTime || !showDaytimeOverlay) return 0.8;

    // Lines are slightly more transparent during day
    return 0.6;
  };

  const renderStarsAndLabels = () => {
    // Show permission prompt if needed
    if (showPermissionPrompt) {
      return (
        <View style={styles.centerContainer}>
          <SvgText
            x={screenWidth / 2}
            y={screenHeight / 2 - 80}
            textAnchor="middle"
            fill="#FFD700"
            fontSize="18"
            fontWeight="bold"
          >
            🔒 Permission Required
          </SvgText>
          <SvgText
            x={screenWidth / 2}
            y={screenHeight / 2 - 50}
            textAnchor="middle"
            fill="#FFD700"
            fontSize="14"
          >
            Enable device orientation
          </SvgText>
          <SvgText
            x={screenWidth / 2}
            y={screenHeight / 2 - 20}
            textAnchor="middle"
            fill="#FFD700"
            fontSize="14"
          >
            to see accurate star positions
          </SvgText>
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={handleRequestOrientationPermission}
          >
            <Text style={styles.permissionButtonText}>Enable Orientation</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Only show stars if device is pointing skyward
    if (!isPointingSkyward) {
      return (
        <View style={styles.centerContainer}>
          <SvgText
            x={screenWidth / 2}
            y={screenHeight / 2 - 50}
            textAnchor="middle"
            fill="#FFD700"
            fontSize="18"
            fontWeight="bold"
          >
            📱 Point towards the sky
          </SvgText>
          <SvgText
            x={screenWidth / 2}
            y={screenHeight / 2 - 20}
            textAnchor="middle"
            fill="#FFD700"
            fontSize="14"
          >
            to see the stars
          </SvgText>
          <SvgText
            x={screenWidth / 2}
            y={screenHeight / 2 + 20}
            textAnchor="middle"
            fill="#888"
            fontSize="12"
          >
            Pitch: {Math.round(pitch)}° {isPointingSkyward ? '(Skyward)' : '(Ground)'}
          </SvgText>
          <SvgText
            x={screenWidth / 2}
            y={screenHeight / 2 + 40}
            textAnchor="middle"
            fill="#888"
            fontSize="10"
          >
            Threshold: {'<'}8° for sky
          </SvgText>
          <SvgText
            x={screenWidth / 2}
            y={screenHeight / 2 + 55}
            textAnchor="middle"
            fill="#888"
            fontSize="12"
          >
            Roll: {Math.round(roll)}°
          </SvgText>
        </View>
      );
    }

    return (
      <Svg width={screenWidth} height={screenHeight} style={styles.svg}>
        {/* Compass direction indicator */}
        <SvgText
          x={screenWidth / 2}
          y={50}
          textAnchor="middle"
          fill="#FFD700"
          fontSize="16"
          fontWeight="bold"
        >
          {isSupported ? `${Math.round(heading)}°` : 'Web Mode'}
        </SvgText>

        {/* Day/Night indicator */}
        <SvgText
          x={screenWidth / 2}
          y={75}
          textAnchor="middle"
          fill={isDayTime ? "#FFA500" : "#FFD700"}
          fontSize="14"
          fontWeight="bold"
        >
          {isDayTime ? '☀️ Day Mode' : '🌙 Night Mode'}
        </SvgText>

        {/* Star positions and connections */}
        {visibleStars.map((constellation) => (
          <View key={constellation.id}>
            {/* Draw constellation lines */}
            {constellation.lines.map((line, index) => {
              const startStar = constellation.stars[line[0]];
              const endStar = constellation.stars[line[1]];

              if (startStar && endStar && startStar.visible && endStar.visible) {
                const startPos = getScreenPosition(
                  startStar.horizontalPosition.azimuth,
                  startStar.horizontalPosition.altitude
                );
                const endPos = getScreenPosition(
                  endStar.horizontalPosition.azimuth,
                  endStar.horizontalPosition.altitude
                );

                return (
                  <Line
                    key={index}
                    x1={startPos.x}
                    y1={startPos.y}
                    x2={endPos.x}
                    y2={endPos.y}
                    stroke="#FFD700"
                    strokeWidth="2"
                    opacity={getLineOpacity(startStar, endStar)}
                  />
                );
              }
              return null;
            })}

            {/* Draw constellation stars */}
            {constellation.stars
              .filter(star => star.visible)
              .map((star, index) => {
                const pos = getScreenPosition(
                  star.horizontalPosition.azimuth,
                  star.horizontalPosition.altitude
                );
                const { size, opacity } = getStarProperties(star);

                return (
                  <Circle
                    key={index}
                    cx={pos.x}
                    cy={pos.y}
                    r={size}
                    fill="#FFD700"
                    opacity={opacity}
                  />
                );
              })}
          </View>
        ))}

        {/* Constellation labels */}
        {visibleStars.map((constellation) => {
          // Use the position of the first visible star for the label
          const visibleStarsInConstellation = constellation.stars.filter(star => star.visible);
          if (visibleStarsInConstellation.length > 0) {
            const referenceStar = visibleStarsInConstellation[0];
            const pos = getScreenPosition(
              referenceStar.horizontalPosition.azimuth,
              referenceStar.horizontalPosition.altitude
            );

            return (
              <SvgText
                key={`label-${constellation.id}`}
                x={pos.x}
                y={pos.y - 20}
                textAnchor="middle"
                fill="#FFD700"
                fontSize="12"
                fontWeight="bold"
                opacity={isDayTime ? 0.8 : 1}
              >
                {constellation.name}
              </SvgText>
            );
          }
          return null;
        })}
      </Svg>
    );
  };

  if (cameraMode && hasPermission === null) {
    return (
      <View style={styles.overlay}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (cameraMode && hasPermission === false) {
    return (
      <View style={styles.overlay}>
        <Text style={styles.permissionText}>Camera access denied</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      {/* Camera View */}
      {cameraMode && hasPermission && (
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
      )}

      {/* Static Background or Star Overlay */}
      <View style={cameraMode ? styles.arContainer : styles.staticBackground}>
        {renderStarsAndLabels()}
      </View>

      {/* Debug info */}
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>
          Heading: {isSupported ? `${Math.round(heading)}°` : 'Web Mode (0°)'}
        </Text>
        <Text style={styles.debugText}>
          Pitch: {Math.round(pitch)}° {isPointingSkyward ? '☁️ Skyward' : '🌍 Ground'}
        </Text>
        <Text style={styles.debugText}>
          Roll: {Math.round(roll)}°
        </Text>
        <Text style={styles.debugText}>
          Orientation: {orientationPermission === 'granted' ? '✅ Granted' : orientationPermission === 'denied' ? '❌ Denied' : '⏳ Pending'}
        </Text>
        <Text style={styles.debugText}>
          Compass: {isSupported ? '✅ True North' : '❌ Inaccurate'}
        </Text>
        <Text style={styles.debugText}>
          Visible Stars: {visibleStars.length}
        </Text>
        <Text style={styles.debugText}>
          Location: {location ? `${location.coords.latitude.toFixed(2)}, ${location.coords.longitude.toFixed(2)}` : 'Unknown'}
        </Text>
        <Text style={styles.debugText}>
          Mode: {cameraMode ? '📷 Camera' : '🌟 Map Only'}
        </Text>
        {isDayTime && (
          <Text style={[styles.debugText, { color: '#FFA500' }]}>
            Daytime viewing enabled
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  arContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  camera: {
    flex: 1,
  },
  staticBackground: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  svg: {
    position: 'absolute',
  },
  centerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugInfo: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    color: '#FFD700',
    fontSize: 12,
    marginBottom: 2,
  },
  permissionText: {
    color: '#FFD700',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  permissionButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 20,
    alignSelf: 'center',
  },
  permissionButtonText: {
    color: '#0c1445',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
