import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  Animated,
} from 'react-native';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { AstronomyCalculator } from '../utils/astronomy';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const SkyMapTab = ({ location }) => {
  const [starPositions, setStarPositions] = useState([]);
  const [selectedConstellation, setSelectedConstellation] = useState(null);
  const [scale] = useState(new Animated.Value(1));
  const [translateX] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(0));

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

  useEffect(() => {
    if (location) {
      const positions = AstronomyCalculator.calculateStarPositions(location);
      setStarPositions(positions);
    }
  }, [location]);

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

  const renderStarMap = () => {
    if (!starPositions || starPositions.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Ionicons name="planet-outline" size={60} color="#666" />
          <Text style={styles.centerText}>Loading star map...</Text>
        </View>
      );
    }

    return (
      <View style={styles.mapContainer} {...panResponder.current.panHandlers}>
        <Svg
          width={screenWidth}
          height={screenHeight * 0.7}
          style={styles.svg}
          onTouchStart={handlePinchGesture}
        >
          {/* Grid lines for reference */}
          {renderGridLines()}

          {/* Constellation lines and stars */}
          {starPositions.map((constellation, index) => {
            if (!constellation.visible) return null;

            return (
              <View key={index}>
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
                        stroke="#FFD700"
                        strokeWidth="1.5"
                        strokeOpacity="0.8"
                      />
                    );
                  })}

                {/* Constellation stars */}
                {constellation.stars &&
                  constellation.stars.map((star, starIndex) => {
                    if (!star.visible) return null;

                    return (
                      <Circle
                        key={starIndex}
                        cx={star.x}
                        cy={star.y}
                        r={star.magnitude ? Math.max(1, 4 - star.magnitude) : 2}
                        fill="#FFD700"
                        opacity="0.9"
                      />
                    );
                  })}
              </View>
            );
          })}
        </Svg>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Current View</Text>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFD700' }]} />
            <Text style={styles.legendText}>Visible Stars</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: '#FFD700' }]} />
            <Text style={styles.legendText}>Constellation Lines</Text>
          </View>
        </View>
      </View>
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
          stroke="#333"
          strokeWidth="0.5"
          opacity="0.3"
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
          stroke="#333"
          strokeWidth="0.5"
          opacity="0.3"
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
        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="locate" size={20} color="#FFD700" />
          <Text style={styles.controlText}>Center</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="add" size={20} color="#FFD700" />
          <Text style={styles.controlText}>Zoom In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton}>
          <Ionicons name="remove" size={20} color="#FFD700" />
          <Text style={styles.controlText}>Zoom Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
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
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  },
  legend: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  legendTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendLine: {
    width: 12,
    height: 2,
    marginRight: 8,
  },
  legendText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlButton: {
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  controlText: {
    color: '#FFD700',
    fontSize: 12,
    marginTop: 5,
  },
});
