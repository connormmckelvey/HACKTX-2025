import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  PanResponder,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { Svg, Line, Circle, Path } from 'react-native-svg';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { ARStarOverlay } from './src/components/ARStarOverlay';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Culturally respectful constellation data for Central Texas Indigenous peoples
const CONSTELLATIONS = [
  {
    id: 1,
    name: "The Great Coyote",
    story: "In the time before time, when the world was still forming, Great Coyote wandered the vast plains of Central Texas. He was the clever trickster who brought fire to the people and taught them to hunt wisely. The stars mark his path across the night sky as he chases the moon, forever reminding us of his cunning nature and the delicate balance between mischief and wisdom. The Tonkawa people tell how Coyote's howls can still be heard in the wind, guiding hunters and warning of danger.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 30 Q30 25 40 30 Q50 35 60 30 Q70 25 80 30" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="20" cy="30" r="3" fill="#FFD700"/>
      <circle cx="40" cy="30" r="3" fill="#FFD700"/>
      <circle cx="60" cy="30" r="3" fill="#FFD700"/>
      <circle cx="80" cy="30" r="3" fill="#FFD700"/>
      <path d="M30 35 L35 45 M50 35 L55 45" stroke="#FFD700" stroke-width="1.5"/>
    </svg>`,
    stars: [
      { x: 20, y: 30 }, { x: 40, y: 30 }, { x: 60, y: 30 }, { x: 80, y: 30 },
      { x: 30, y: 35 }, { x: 35, y: 45 }, { x: 50, y: 35 }, { x: 55, y: 45 }
    ],
    lines: [[0, 1], [1, 2], [2, 3], [4, 5], [6, 7]]
  },
  {
    id: 2,
    name: "The Buffalo Spirit",
    story: "The mighty buffalo once roamed freely across the Texas plains, providing sustenance and spiritual guidance to the Comanche people. This constellation shows Tatanka, the Buffalo Spirit, charging across the celestial plains. The Comanche believe that when buffalo appear in the night sky, it is a sign of abundance and that the herds will be plentiful. The constellation's path mirrors the ancient buffalo trails that crisscrossed the land, reminding us of the sacred connection between the people and these majestic creatures who gave their lives so that others might live.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 40 Q25 35 35 40 Q45 45 55 40 Q65 35 75 40 L80 45 L75 55 L20 55 Z" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="25" cy="45" r="2" fill="#FFD700"/>
      <circle cx="45" cy="50" r="2" fill="#FFD700"/>
      <circle cx="65" cy="45" r="2" fill="#FFD700"/>
      <path d="M70 35 L75 25 M75 35 L80 25" stroke="#FFD700" stroke-width="1.5"/>
    </svg>`,
    stars: [
      { x: 15, y: 40 }, { x: 25, y: 35 }, { x: 35, y: 40 }, { x: 45, y: 45 },
      { x: 55, y: 40 }, { x: 65, y: 35 }, { x: 75, y: 40 }, { x: 80, y: 45 },
      { x: 75, y: 55 }, { x: 20, y: 55 }, { x: 70, y: 35 }, { x: 75, y: 25 },
      { x: 80, y: 25 }
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [10, 11], [11, 12]]
  },
  {
    id: 3,
    name: "The Eagle's Flight",
    story: "Soaring high above the Edwards Plateau, the eagle was revered by both Tonkawa and Comanche peoples as a messenger between the earth and the spirit world. This constellation traces the eagle's powerful wings as it circles in the night sky, watching over the land and its people. The eagle teaches us about vision, courage, and the importance of seeing the bigger picture. When eagles appear in dreams or in the stars, they bring messages from ancestors and remind us to honor the sacred connection between all living things.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 20 L30 40 L35 45 L45 35 L55 35 L65 45 L70 40 Z" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="30" cy="40" r="3" fill="#FFD700"/>
      <circle cx="45" cy="35" r="3" fill="#FFD700"/>
      <circle cx="55" cy="35" r="3" fill="#FFD700"/>
      <circle cx="70" cy="40" r="3" fill="#FFD700"/>
      <path d="M40 25 Q50 15 60 25" stroke="#FFD700" stroke-width="1.5"/>
    </svg>`,
    stars: [
      { x: 50, y: 20 }, { x: 30, y: 40 }, { x: 35, y: 45 }, { x: 45, y: 35 },
      { x: 55, y: 35 }, { x: 65, y: 45 }, { x: 70, y: 40 }, { x: 40, y: 25 },
      { x: 50, y: 15 }, { x: 60, y: 25 }
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [7, 8], [8, 9]]
  },
  {
    id: 4,
    name: "The Deer Star",
    story: "The white-tailed deer has always been a vital part of life in Central Texas, providing food, clothing, and tools for the indigenous peoples. This constellation shows the Deer Spirit leaping gracefully through the night sky, her path marking the changing seasons. The Tonkawa and Comanche peoples honored the deer for her gentleness and keen awareness, teaching lessons about living in harmony with nature. When this constellation is visible, it reminds hunters to approach their sacred duty with respect and gratitude for the life that will be given.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 60 Q35 55 45 60 L50 50 L55 60 Q65 55 75 60 L80 65 L75 75 L25 75 Z" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="35" cy="60" r="2" fill="#FFD700"/>
      <circle cx="50" cy="50" r="2" fill="#FFD700"/>
      <circle cx="65" cy="60" r="2" fill="#FFD700"/>
      <path d="M40 45 L50 35 L60 45" stroke="#FFD700" stroke-width="1.5"/>
    </svg>`,
    stars: [
      { x: 25, y: 60 }, { x: 35, y: 55 }, { x: 45, y: 60 }, { x: 50, y: 50 },
      { x: 55, y: 60 }, { x: 65, y: 55 }, { x: 75, y: 60 }, { x: 80, y: 65 },
      { x: 75, y: 75 }, { x: 25, y: 75 }, { x: 40, y: 45 }, { x: 50, y: 35 },
      { x: 60, y: 45 }
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [10, 11], [11, 12]]
  },
  {
    id: 5,
    name: "The Moon's Path",
    story: "The moon holds special significance in the spiritual life of the Tonkawa and Comanche peoples, marking time and guiding ceremonies. This constellation traces the Moon Spirit's journey across the night sky, weaving together stories of creation, renewal, and the cyclical nature of life. The moon teaches about patience, reflection, and the importance of honoring the feminine wisdom that guides all living things. When the full moon rises, it illuminates the ancestral paths and reminds us that we are all connected in the great circle of existence.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 25 Q30 35 25 50 Q30 65 50 75 Q70 65 75 50 Q70 35 50 25" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="25" cy="50" r="3" fill="#FFD700"/>
      <circle cx="50" cy="25" r="3" fill="#FFD700"/>
      <circle cx="75" cy="50" r="3" fill="#FFD700"/>
      <circle cx="50" cy="75" r="3" fill="#FFD700"/>
      <path d="M35 40 Q50 30 65 40" stroke="#FFD700" stroke-width="1"/>
    </svg>`,
    stars: [
      { x: 50, y: 25 }, { x: 30, y: 35 }, { x: 25, y: 50 }, { x: 30, y: 65 },
      { x: 50, y: 75 }, { x: 70, y: 65 }, { x: 75, y: 50 }, { x: 70, y: 35 },
      { x: 35, y: 40 }, { x: 50, y: 30 }, { x: 65, y: 40 }
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [8, 9], [9, 10]]
  }
];

// Animation for twinkling stars
const TwinklingStar = ({ style }) => {
  const twinkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = Math.random() * 3000 + 2000;
    const delay = Math.random() * 5000;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkleAnim, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
          delay,
        }),
        Animated.timing(twinkleAnim, {
          toValue: 0,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = twinkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return <Animated.View style={[style, { opacity }]} />;
};


export default function App() {
  const [location, setLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [selectedConstellation, setSelectedConstellation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [arMode, setArMode] = useState(true);
  const [cameraMode, setCameraMode] = useState(true);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const modalY = useRef(new Animated.Value(screenHeight)).current;
  const starAnim = useRef(new Animated.Value(1)).current;

  // Pan responder for star map
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Handle panning logic here if needed
      },
    })
  );

  useEffect(() => {
    checkLocationPermission();
  }, []);

  useEffect(() => {
    if (locationPermission === 'granted') {
      setCurrentScreen('welcome');
      // Show welcome screen for 3-4 seconds
      setTimeout(() => {
        setCurrentScreen('starMap');
      }, 3500);
    }
  }, [locationPermission]);

  // Debug logging for iPhone troubleshooting
  useEffect(() => {
    console.log('🚀 Ancestral Skies App Started');
    console.log('📍 Location permission:', locationPermission);
    console.log('📱 Platform:', Platform.OS);
    console.log('🔧 Current screen:', currentScreen);
    console.log('🌍 Location data:', location ? `${location.coords.latitude.toFixed(2)}, ${location.coords.longitude.toFixed(2)}` : 'Not available');
  }, [locationPermission, currentScreen, location]);

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

  const checkLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      }
    } catch (error) {
      console.error('Error getting location permission:', error);
      setLocationPermission('denied');
    }
  };

  const showConstellationDetails = (constellation) => {
    setSelectedConstellation(constellation);
    setShowModal(true);

    // Animate modal in
    Animated.spring(modalY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const hideModal = () => {
    // Animate modal out
    Animated.spring(modalY, {
      toValue: screenHeight,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setShowModal(false);
      setSelectedConstellation(null);
    });
  };

  // Generate random background stars
  const generateBackgroundStars = () => {
    const stars = [];
    for (let i = 0; i < 150; i++) { // Increased star count
      stars.push({
        id: i,
        x: Math.random() * screenWidth,
        y: Math.random() * screenHeight,
        size: Math.random() * 2 + 1,
      });
    }
    return stars;
  };

  const backgroundStars = generateBackgroundStars();

  // Simple SVG renderer for constellation artwork
  const renderConstellationArtwork = (artworkSvg) => {
    // For this prototype, we'll use a simplified approach
    // In a production app, you'd want a proper SVG parser
    return (
      <Svg width="100%" height="200" viewBox="0 0 100 100">
        <Path
          d="M20 30 Q30 25 40 30 Q50 35 60 30 Q70 25 80 30"
          stroke="#FFD700"
          strokeWidth="2"
          fill="none"
        />
        <Circle cx="20" cy="30" r="3" fill="#FFD700"/>
        <Circle cx="40" cy="30" r="3" fill="#FFD700"/>
        <Circle cx="60" cy="30" r="3" fill="#FFD700"/>
        <Circle cx="80" cy="30" r="3" fill="#FFD700"/>
      </Svg>
    );
  };

  if (currentScreen === 'loading') {
    return (
      <LinearGradient colors={['#0c1445', '#1a2a6c', '#b22c81']} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0c1445" />
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.starIcon,
              {
                transform: [{ scale: starAnim }],
                opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
              },
            ]}
          >
            <Text style={styles.starSymbol}>✨</Text>
          </Animated.View>
          <Text style={styles.loadingText}>Discovering the cosmos...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (currentScreen === 'welcome') {
    return (
      <LinearGradient colors={['#0c1445', '#1a2a6c', '#b22c81']} style={styles.container}>
      <Animated.View
        style={[
          styles.welcomeContainer,
          {
            opacity: fadeAnim,
          },
        ]}
        onLayout={() => {
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }).start();
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#0c1445" />
        <Text style={styles.welcomeText}>
          You are on the ancestral land of the Tonkawa, Lipan-Apache, Comanche, and Coahuiltecan people.
          {'\n\n'}Welcome to their sky.
        </Text>
      </Animated.View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0c1445', '#1a2a6c', '#b22c81']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0c1445" />

      {/* AR Star Overlay - Conditionally rendered to prevent issues */}
      {currentScreen === 'starMap' && (
        <ARStarOverlay location={location} cameraMode={arMode && cameraMode} showDaytimeOverlay={true} />
      )}


      {/* Star Map Screen - only shown when not in camera ar mode */}
      {(!arMode || !cameraMode) && (
        <View style={styles.starMapContainer} {...panResponder.current.panHandlers}>
          {/* Background stars */}
          {backgroundStars.map((star) => (
            <TwinklingStar
              key={star.id}
              style={[
                styles.backgroundStar,
                {
                  left: star.x,
                  top: star.y,
                  width: star.size,
                  height: star.size,
                },
              ]}
            />
          ))}

          {/* Constellation stars and lines */}
          {CONSTELLATIONS.map((constellation) => (
            <View key={constellation.id}>
              {/* Constellation lines */}
              <Svg style={styles.constellationSvg}>
                {constellation.lines.map((line, index) => {
                  const startStar = constellation.stars[line[0]];
                  const endStar = constellation.stars[line[1]];
                  return (
                    <Line
                      key={index}
                      x1={startStar.x * 3}
                      y1={startStar.y * 3}
                      x2={endStar.x * 3}
                      y2={endStar.y * 3}
                      stroke="#FFD700"
                      strokeWidth="2"
                      opacity={0.8}
                    />
                  );
                })}
              </Svg>

              {/* Constellation stars */}
              {constellation.stars.map((star, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.constellationStar,
                    {
                      left: star.x * 3 - 8,
                      top: star.y * 3 - 8,
                    },
                  ]}
                  onPress={() => showConstellationDetails(constellation)}
                >
                  <Animated.View
                    style={[
                      styles.starGlow,
                      {
                        transform: [{ scale: starAnim }],
                      },
                    ]}
                  >
                    <Text style={styles.starSymbol}>⭐</Text>
                  </Animated.View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            setArMode(!arMode);
            // When switching to AR mode, ensure camera is on by default
            if (!arMode) {
              setCameraMode(true);
            }
          }}
        >
          <Text style={styles.controlButtonIcon}>{arMode ? '🗺️' : '✨'}</Text>
          <Text style={styles.controlButtonText}>{arMode ? 'Map' : 'AR'}</Text>
        </TouchableOpacity>

        {arMode && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setCameraMode(!cameraMode)}
          >
            <Text style={styles.controlButtonIcon}>{cameraMode ? '📷' : '🌌'}</Text>
            <Text style={styles.controlButtonText}>{cameraMode ? 'Camera' : 'Sky'}</Text>
          </TouchableOpacity>
        )}
      </View>


      {/* Constellation Details Modal */}
      <Modal visible={showModal} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: modalY }],
              },
            ]}
          >
            {/* Handle bar */}
            <View style={styles.modalHandle} />

            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={hideModal}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {selectedConstellation && (
              <ScrollView style={styles.modalScroll}>
                {/* Artwork */}
                <View style={styles.artworkContainer}>
                  {renderConstellationArtwork(selectedConstellation.artwork)}
                </View>

                {/* Name */}
                <Text style={styles.constellationName}>
                  {selectedConstellation.name}
                </Text>

                {/* Story */}
                <Text style={styles.constellationStory}>
                  {selectedConstellation.story}
                </Text>
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1445',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFD700',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  },
  starIcon: {
    marginBottom: 20,
  },
  starSymbol: {
    fontSize: 60,
    color: '#FFD700',
  },
  loader: {
    marginTop: 20,
  },
  welcomeContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  welcomeText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  },
  starMapContainer: {
    flex: 1,
    position: 'relative',
  },
  backgroundStar: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  constellationSvg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  constellationStar: {
    position: 'absolute',
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starGlow: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1f4a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: screenHeight * 0.6,
    maxHeight: screenHeight * 0.8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#FFD700',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalScroll: {
    padding: 20,
    paddingTop: 60,
  },
  artworkContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  artworkSvg: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 10,
    padding: 20,
  },
  constellationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  },
  constellationStory: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    textAlign: 'left',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  },
  controlPanel: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 30,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  controlButton: {
    alignItems: 'center',
  },
  controlButtonIcon: {
    fontSize: 28,
  },
  controlButtonText: {
    color: '#FFD700',
    fontSize: 12,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  },
});
