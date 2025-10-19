import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import Svg, { Line, Circle, Text as SvgText, G, Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AstronomyCalculator } from '../utils/astronomy';
import theme from '../styles/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const SkyMapTab = ({ location }) => {
  const [starPositions, setStarPositions] = useState([]);
  const [selectedConstellation, setSelectedConstellation] = useState(null);
  const [scale] = useState(new Animated.Value(1));
  const [translateX] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(0));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLabels, setShowLabels] = useState(true);
  const [showDirections, setShowDirections] = useState(true);

  // Pan responder for map interaction
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        translateX.setValue(gestureState.dx / scale._value);
        translateY.setValue(gestureState.dy / scale._value);
      },
      onPanResponderRelease: () => {
        // Keep the translation values for persistent panning
      },
    })
  );

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (location) {
      const positions = AstronomyCalculator.calculateStarPositions(location, currentTime);
      // Convert horizontal coordinates to screen coordinates for 2D sky map
      const screenPositions = positions.map(constellation => {
        const screenStars = constellation.stars.map(star => {
          // Convert horizontal coordinates to screen coordinates
          const screenX = (star.horizontalPosition.azimuth / 360) * screenWidth;
          const screenY = ((90 - star.horizontalPosition.altitude) / 90) * (screenHeight * 0.7);
          
          return {
            ...star,
            x: screenX,
            y: screenY,
            visible: star.horizontalPosition.altitude > 0 // Only show stars above horizon
          };
        });

        // Calculate constellation center for label positioning
        const visibleStars = screenStars.filter(star => star.visible);
        const centerX = visibleStars.length > 0 
          ? visibleStars.reduce((sum, star) => sum + star.x, 0) / visibleStars.length
          : screenWidth / 2;
        const centerY = visibleStars.length > 0
          ? visibleStars.reduce((sum, star) => sum + star.y, 0) / visibleStars.length
          : screenHeight * 0.35;

        return {
          ...constellation,
          stars: screenStars,
          centerX,
          centerY,
          visible: visibleStars.length > 0
        };
      });

      setStarPositions(screenPositions);
    }
  }, [location, currentTime]);

  const handlePinchGesture = (event) => {
    if (event.nativeEvent.touches.length === 2) {
      const touch1 = event.nativeEvent.touches[0];
      const touch2 = event.nativeEvent.touches[1];

      const distance = Math.sqrt(
        Math.pow(touch2.pageX - touch1.pageX, 2) +
        Math.pow(touch2.pageY - touch1.pageY, 2)
      );

      // Simple zoom implementation - scale based on touch distance
      const newScale = Math.min(Math.max(distance / 100, 0.5), 3);
      scale.setValue(newScale);
    }
  };

  const centerMap = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  };

  const zoomIn = () => {
    const newScale = Math.min(scale._value * 1.2, 3);
    Animated.spring(scale, {
      toValue: newScale,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const zoomOut = () => {
    const newScale = Math.max(scale._value / 1.2, 0.5);
    Animated.spring(scale, {
      toValue: newScale,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const toggleLabels = () => {
    setShowLabels(!showLabels);
  };

  const toggleDirections = () => {
    setShowDirections(!showDirections);
  };

  const handleConstellationPress = (constellation) => {
    setSelectedConstellation(constellation);
  };

  const renderStarMap = () => {
    if (!starPositions || starPositions.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Ionicons name="planet-outline" size={60} color={theme.colors.textMuted} />
          <Text style={styles.centerText}>Loading star map...</Text>
        </View>
      );
    }

    return (
      <View style={styles.mapContainer} {...panResponder.current.panHandlers}>
        <Animated.View
          style={[
            styles.svgContainer,
            {
              transform: [
                { scale: scale },
                { translateX: translateX },
                { translateY: translateY },
              ],
            },
          ]}
        >
          <Svg
            width={screenWidth}
            height={screenHeight * 0.7}
            style={styles.svg}
            onTouchStart={handlePinchGesture}
          >
            {/* Sky gradient background */}
            <Defs>
              <SvgLinearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#1a1512" stopOpacity="1" />
                <Stop offset="70%" stopColor="#2a221b" stopOpacity="1" />
                <Stop offset="100%" stopColor="#1a1512" stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>
            <Rect width={screenWidth} height={screenHeight * 0.7} fill="url(#skyGradient)" />
            
            {/* Horizon line */}
            <Line
              x1="0"
              y1={screenHeight * 0.7}
              x2={screenWidth}
              y2={screenHeight * 0.7}
              stroke={theme.colors.textMuted}
              strokeWidth="2"
              opacity="0.6"
            />
            
            {/* Cardinal Directions */}
            {showDirections && renderCardinalDirections()}
            
            {/* Grid lines for reference */}
            {renderGridLines()}

            {/* Constellation lines and stars */}
            {starPositions.map((constellation, index) => {
              if (!constellation.visible) return null;

              return (
                <G key={index}>
                  {/* Constellation lines */}
                  {constellation.lines &&
                    constellation.lines.map((line, lineIndex) => {
                      const star1 = constellation.stars[line[0]];
                      const star2 = constellation.stars[line[1]];

                      if (!star1 || !star2) return null;

                      return (
                        <Line
                          key={lineIndex}
                          x1={star1.x}
                          y1={star1.y}
                          x2={star2.x}
                          y2={star2.y}
                          stroke={theme.colors.primary}
                          strokeWidth="1.5"
                          strokeOpacity="0.8"
                        />
                      );
                    })}

                  {/* Constellation stars */}
                  {constellation.stars &&
                    constellation.stars.map((star, starIndex) => {
                      if (!star.visible) return null;

                      // Calculate star size based on magnitude (brighter = larger)
                      const baseSize = 2;
                      const magnitudeSize = star.magnitude ? Math.max(1, baseSize + (4 - star.magnitude) * 0.5) : baseSize;

                      return (
                        <Circle
                          key={starIndex}
                          cx={star.x}
                          cy={star.y}
                          r={magnitudeSize}
                          fill={theme.colors.primary}
                          opacity="0.9"
                        />
                      );
                    })}

                  {/* Constellation Labels */}
                  {showLabels && constellation.name && (
                    <SvgText
                      x={constellation.centerX || screenWidth / 2}
                      y={constellation.centerY || screenHeight * 0.35}
                      fontSize="12"
                      fill={theme.colors.primary}
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {constellation.name}
                    </SvgText>
                  )}
                </G>
              );
            })}
          </Svg>
        </Animated.View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Current View</Text>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
            <Text style={styles.legendText}>Visible Stars</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: theme.colors.primary }]} />
            <Text style={styles.legendText}>Constellation Lines</Text>
          </View>
          {showLabels && (
            <View style={styles.legendItem}>
              <Ionicons name="text" size={12} color={theme.colors.primary} />
              <Text style={styles.legendText}>Constellation Names</Text>
            </View>
          )}
        </View>

        {/* Location and Time Info */}
        <View style={styles.infoPanel}>
          <Text style={styles.infoText}>
            {location ? `${location.coords.latitude.toFixed(2)}°N, ${location.coords.longitude.toFixed(2)}°W` : 'Location unavailable'}
          </Text>
          <Text style={styles.infoText}>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const renderCardinalDirections = () => {
    const centerX = screenWidth / 2;
    const centerY = screenHeight * 0.35;
    const radius = 30;

    return (
      <G>
        {/* North */}
        <SvgText
          x={centerX}
          y={centerY - radius}
          fontSize="14"
          fill={theme.colors.primary}
          textAnchor="middle"
          fontWeight="bold"
        >
          N
        </SvgText>
        {/* South */}
        <SvgText
          x={centerX}
          y={centerY + radius + 15}
          fontSize="14"
          fill={theme.colors.primary}
          textAnchor="middle"
          fontWeight="bold"
        >
          S
        </SvgText>
        {/* East */}
        <SvgText
          x={centerX + radius}
          y={centerY + 5}
          fontSize="14"
          fill={theme.colors.primary}
          textAnchor="middle"
          fontWeight="bold"
        >
          E
        </SvgText>
        {/* West */}
        <SvgText
          x={centerX - radius}
          y={centerY + 5}
          fontSize="14"
          fill={theme.colors.primary}
          textAnchor="middle"
          fontWeight="bold"
        >
          W
        </SvgText>
      </G>
    );
  };

  const renderGridLines = () => {
    const lines = [];

    // Horizontal lines
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * (screenHeight * 0.7);
      lines.push(
        <Line
          key={`h-${i}`}
          x1="0"
          y1={y}
          x2={screenWidth}
          y2={y}
          stroke={theme.colors.textMuted}
          strokeWidth="0.5"
          opacity="0.2"
        />
      );
    }

    // Vertical lines
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * screenWidth;
      lines.push(
        <Line
          key={`v-${i}`}
          x1={x}
          y1="0"
          x2={x}
          y2={screenHeight * 0.7}
          stroke={theme.colors.textMuted}
          strokeWidth="0.5"
          opacity="0.2"
        />
      );
    }

    return lines;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sky Map</Text>
        <Text style={styles.subtitle}>
          Interactive star map • Pan and zoom to explore
        </Text>
      </View>

      {renderStarMap()}

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={centerMap}>
          <Ionicons name="locate" size={20} color={theme.colors.primary} />
          <Text style={styles.controlText}>Center</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={zoomIn}>
          <Ionicons name="add" size={20} color={theme.colors.primary} />
          <Text style={styles.controlText}>Zoom In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={zoomOut}>
          <Ionicons name="remove" size={20} color={theme.colors.primary} />
          <Text style={styles.controlText}>Zoom Out</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, showLabels && styles.activeControlButton]} 
          onPress={toggleLabels}
        >
          <Ionicons name="text" size={20} color={showLabels ? theme.colors.black : theme.colors.primary} />
          <Text style={[styles.controlText, showLabels && styles.activeControlText]}>Labels</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, showDirections && styles.activeControlButton]} 
          onPress={toggleDirections}
        >
          <Ionicons name="compass" size={20} color={showDirections ? theme.colors.black : theme.colors.primary} />
          <Text style={[styles.controlText, showDirections && styles.activeControlText]}>Directions</Text>
        </TouchableOpacity>
      </View>

      {/* Constellation Details Modal */}
      {selectedConstellation && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedConstellation(null)}
            >
              <Ionicons name="close" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>{selectedConstellation.name}</Text>
            <Text style={styles.modalStory}>{selectedConstellation.story}</Text>
            
            <View style={styles.starList}>
              <Text style={styles.starListTitle}>Brightest Stars:</Text>
              {selectedConstellation.stars.slice(0, 5).map((star, index) => (
                <Text key={index} style={styles.starItem}>
                  • {star.name} (Magnitude: {star.magnitude?.toFixed(2)})
                </Text>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  header: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.h2,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily,
  },
  subtitle: {
    fontSize: theme.typography.caption,
    color: theme.colors.textPrimary,
    opacity: 0.8,
    fontFamily: theme.typography.fontFamily,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  svgContainer: {
    flex: 1,
  },
  svg: {
    backgroundColor: 'transparent',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    marginTop: theme.spacing.md,
    fontFamily: theme.typography.fontFamily,
  },
  legend: {
    position: 'absolute',
    top: theme.spacing.xl,
    left: theme.spacing.xl,
    backgroundColor: theme.colors.overlayDark,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.medium,
  },
  legendTitle: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: theme.typography.bold,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.fontFamily,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  legendLine: {
    width: 12,
    height: 2,
    marginRight: theme.spacing.sm,
  },
  legendText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
  infoPanel: {
    position: 'absolute',
    top: theme.spacing.xl,
    right: theme.spacing.xl,
    backgroundColor: theme.colors.overlayDark,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'flex-end',
    ...theme.shadows.medium,
  },
  infoText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.xs,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.overlay,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
  },
  controlButton: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    minWidth: 60,
  },
  activeControlButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  controlText: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    marginTop: theme.spacing.xs,
    fontWeight: theme.typography.medium,
    fontFamily: theme.typography.fontFamily,
  },
  activeControlText: {
    color: theme.colors.black,
    fontWeight: theme.typography.bold,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 21, 18, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    margin: theme.spacing.xl,
    maxHeight: screenHeight * 0.7,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.large,
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    padding: theme.spacing.sm,
  },
  modalTitle: {
    fontSize: theme.typography.h3,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.fontFamily,
  },
  modalStory: {
    fontSize: theme.typography.body,
    color: theme.colors.textPrimary,
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.fontFamily,
  },
  starList: {
    marginTop: theme.spacing.md,
  },
  starListTitle: {
    fontSize: theme.typography.caption,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily,
  },
  starItem: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily,
  },
});
