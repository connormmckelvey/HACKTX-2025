import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { useCompass } from '../hooks/useCompass';
import { AstronomyCalculator } from '../utils/astronomy';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ARStarOverlay = ({ location, cameraMode = true, showDaytimeOverlay = true }) => {
  const { heading, isSupported, isCalibrating, calibrateCompass } = useCompass();

  // Debug logging to troubleshoot the calibrateCompass issue
  useEffect(() => {
    console.log('useCompass hook result:', {
      heading,
      isSupported,
      isCalibrating,
      calibrateCompass: typeof calibrateCompass
    });
  }, [heading, isSupported, isCalibrating, calibrateCompass]);
  const [starPositions, setStarPositions] = useState([]);
  const [visibleStars, setVisibleStars] = useState([]);
  const [hasPermission, setHasPermission] = useState(null);
  const [isDayTime, setIsDayTime] = useState(false);

  useEffect(() => {
    if (cameraMode) {
      requestCameraPermission();
    }
  }, [cameraMode]);

  useEffect(() => {
    if (location) {
      const positions = AstronomyCalculator.calculateStarPositions(location);
      setStarPositions(positions);

      // Check if it's daytime (simple check based on current time)
      const now = new Date();
      const hour = now.getHours();
      const isCurrentlyDay = hour > 6 && hour < 18; // Rough daytime check
      setIsDayTime(isCurrentlyDay);
    }
  }, [location]);

  useEffect(() => {
    if (starPositions.length > 0) {
      // Use compass heading if available, otherwise use 0 (North)
      const currentHeading = isSupported ? heading : 0;
      const visible = AstronomyCalculator.getVisibleStars(starPositions, currentHeading, 90); // Wider FOV for better experience
      setVisibleStars(visible);
    }
  }, [heading, starPositions, isSupported]);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasPermission(false);
    }
  };

  const handleCalibrateCompass = () => {
    if (typeof calibrateCompass === 'function') {
      Alert.alert(
        "Compass Calibration",
        "Point your device towards true north and keep it steady for 10 seconds.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Calibrate", onPress: calibrateCompass }
        ]
      );
    } else {
      Alert.alert(
        "Calibration Unavailable",
        "Compass calibration is not available on this device.",
        [{ text: "OK" }]
      );
    }
  };

  // Convert azimuth/altitude to screen coordinates
  const getScreenPosition = (azimuth, altitude) => {
    // Use compass heading if available, otherwise use 0 (North)
    const currentHeading = isSupported ? heading : 0;

    // Convert azimuth to screen X (accounting for heading)
    const relativeAzimuth = (azimuth - currentHeading + 360) % 360;
    const x = (relativeAzimuth / 360) * screenWidth;

    // Convert altitude to screen Y (90° = top, 0° = bottom)
    const y = ((90 - altitude) / 90) * screenHeight;

    return { x, y };
  };

  // Get opacity based on time of day and star visibility
  const getStarOpacity = (star) => {
    if (!isDayTime || !showDaytimeOverlay) return 0.9;

    // During daytime, make stars more visible but slightly transparent
    // You could also base this on the star's actual altitude
    return 0.7;
  };

  const getLineOpacity = (star1, star2) => {
    if (!isDayTime || !showDaytimeOverlay) return 0.8;

    // Lines are slightly more transparent during day
    return 0.6;
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
      {cameraMode && hasPermission ? (
        <CameraView style={styles.camera} facing="back">
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

                    return (
                      <Circle
                        key={index}
                        cx={pos.x}
                        cy={pos.y}
                        r="8"
                        fill="#FFD700"
                        opacity={getStarOpacity(star)}
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
        </CameraView>
      ) : (
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

                  return (
                    <Circle
                      key={index}
                      cx={pos.x}
                      cy={pos.y}
                      r="8"
                      fill="#FFD700"
                      opacity={getStarOpacity(star)}
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
      )}

      {/* Calibration button */}
      {isSupported && typeof calibrateCompass === 'function' && (
        <TouchableOpacity
          style={[styles.calibrationButton, isCalibrating && styles.calibratingButton]}
          onPress={handleCalibrateCompass}
          disabled={isCalibrating}
        >
          <Text style={styles.calibrationButtonText}>
            {isCalibrating ? 'Calibrating...' : 'Calibrate Compass'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Debug info */}
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>
          Heading: {isSupported ? `${Math.round(heading)}°` : 'Web Mode (0°)'}
        </Text>
        <Text style={styles.debugText}>
          Compass: {isSupported ? '✅ Supported' : '❌ Web Only'}
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
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: 'transparent',
  },
  camera: {
    flex: 1,
  },
  svg: {
    position: 'absolute',
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
  calibrationButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 10,
  },
  calibratingButton: {
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
  },
  calibrationButtonText: {
    color: '#0c1445',
    fontSize: 14,
    fontWeight: 'bold',
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
