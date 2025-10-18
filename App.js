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
import { OrientationTest } from './src/components/OrientationTest';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Import the real constellation data with astronomical coordinates
import { AstronomyCalculator } from './src/utils/astronomy';

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
  const [testMode, setTestMode] = useState(false);

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

      {/* Orientation Test Mode */}
      {testMode && currentScreen === 'starMap' && (
        <OrientationTest location={location} />
      )}

      {/* AR Star Overlay - Conditionally rendered to prevent issues */}
      {!testMode && currentScreen === 'starMap' && (
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

          {/* Show a message that AR mode has better constellation viewing */}
          <View style={styles.starMapMessage}>
            <Text style={styles.starMapMessageText}>
              Switch to AR mode for interactive constellations
            </Text>
          </View>
        </View>
      )}

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setTestMode(!testMode)}
        >
          <Text style={styles.controlButtonIcon}>{testMode ? '🧪' : '🧪'}</Text>
          <Text style={styles.controlButtonText}>{testMode ? 'Test' : 'Test'}</Text>
        </TouchableOpacity>

        {!testMode && (
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
        )}

        {!testMode && arMode && (
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
  starMapMessage: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starMapMessageText: {
    color: '#FFD700',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  },
});
