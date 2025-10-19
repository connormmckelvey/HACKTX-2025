import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AstronomyCalculator } from '../utils/astronomy';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Import constellation data from astronomy utils
const CONSTELLATIONS = [
  {
    id: 1,
    name: "Pegasus - The Winged Horse",
    story: "Pegasus, the great winged horse, soars across the fall sky. In indigenous traditions, horses were sacred animals that carried messages between the spirit world and earth. The Great Square of Pegasus forms a distinctive pattern that guides travelers and reminds us of the freedom to explore new horizons. This constellation teaches us about courage, adventure, and the power of imagination to carry us beyond our earthly limitations.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 30 L40 30 L40 50 L20 50 Z" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="20" cy="30" r="3" fill="#FFD700"/>
      <circle cx="40" cy="30" r="3" fill="#FFD700"/>
      <circle cx="40" cy="50" r="3" fill="#FFD700"/>
      <circle cx="20" cy="50" r="3" fill="#FFD700"/>
      <path d="M40 40 L60 35 L70 45" stroke="#FFD700" stroke-width="1.5"/>
    </svg>`,
    seasons: ['fall', 'winter']
  },
  {
    id: 2,
    name: "Andromeda - The Princess",
    story: "Andromeda represents the princess who was saved from the sea monster by Perseus. In indigenous stories, she symbolizes the strength and wisdom of women who guide their communities through difficult times. The Andromeda Galaxy, visible to the naked eye, reminds us of the vastness of the universe and our connection to the cosmos. This constellation teaches us about courage, sacrifice, and the power of love to overcome darkness.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 50 L40 45 L60 50 L80 45" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="20" cy="50" r="3" fill="#FFD700"/>
      <circle cx="40" cy="45" r="3" fill="#FFD700"/>
      <circle cx="60" cy="50" r="3" fill="#FFD700"/>
      <circle cx="80" cy="45" r="3" fill="#FFD700"/>
    </svg>`,
    seasons: ['fall', 'winter']
  },
  {
    id: 3,
    name: "Cassiopeia - The Queen",
    story: "Cassiopeia sits high in the fall sky, her distinctive W-shape marking her throne. In indigenous traditions, she represents the wisdom keeper who holds the knowledge of the stars and seasons. Her position near the North Star makes her a reliable guide for navigation and timekeeping. This constellation teaches us about leadership, wisdom, and the responsibility of those who hold knowledge to share it wisely with others.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 60 L40 40 L60 60 L80 40 L100 60" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="20" cy="60" r="3" fill="#FFD700"/>
      <circle cx="40" cy="40" r="3" fill="#FFD700"/>
      <circle cx="60" cy="60" r="3" fill="#FFD700"/>
      <circle cx="80" cy="40" r="3" fill="#FFD700"/>
      <circle cx="100" cy="60" r="3" fill="#FFD700"/>
    </svg>`,
    seasons: ['fall', 'winter']
  },
  {
    id: 4,
    name: "Perseus - The Hero",
    story: "Perseus represents the great hero who saved Andromeda from the sea monster. In indigenous stories, he symbolizes the protector who defends the community from danger and brings light to dark places. The variable star Algol, known as the 'Demon Star,' reminds us that even heroes face challenges and that courage is not the absence of fear, but the willingness to act despite it.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 50 Q30 45 40 50 Q50 55 60 50 Q70 45 80 50" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="30" cy="50" r="2" fill="#FFD700"/>
      <circle cx="50" cy="52" r="2" fill="#FFD700"/>
      <circle cx="70" cy="48" r="2" fill="#FFD700"/>
      <path d="M25 45 L35 55 M45 47 L55 57 M65 43 L75 53" stroke="#FFD700" stroke-width="1"/>
    </svg>`,
    seasons: ['fall', 'winter']
  },
  {
    id: 5,
    name: "Orion - The Hunter",
    story: "The mighty hunter Orion rises in the fall evening sky, his belt of three bright stars marking his waist. In indigenous stories, Orion represents the great hunter who provided for his people, his bow drawn and ready. The red star Betelgeuse marks his shoulder, while the blue-white Rigel shines at his foot. This constellation teaches us about strength, courage, and the responsibility of providing for others.",
    artwork: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 20 L30 40 L35 45 L45 35 L55 35 L65 45 L70 40 Z" stroke="#FFD700" stroke-width="2" fill="none"/>
      <circle cx="30" cy="40" r="3" fill="#FFD700"/>
      <circle cx="45" cy="35" r="3" fill="#FFD700"/>
      <circle cx="55" cy="35" r="3" fill="#FFD700"/>
      <circle cx="70" cy="40" r="3" fill="#FFD700"/>
      <path d="M40 25 Q50 15 60 25" stroke="#FFD700" stroke-width="1.5"/>
    </svg>`,
    seasons: ['fall', 'winter']
  }
];

export const CultureTab = ({ location }) => {
  const [selectedConstellation, setSelectedConstellation] = useState(null);
  const [visibleConstellations, setVisibleConstellations] = useState([]);
  const [modalY] = useState(new Animated.Value(screenHeight));

  useEffect(() => {
    if (location) {
      // Get current season for filtering constellations
      const currentSeason = AstronomyCalculator.getCurrentSeason();
      const filtered = CONSTELLATIONS.filter(constellation =>
        constellation.seasons && constellation.seasons.includes(currentSeason)
      );
      setVisibleConstellations(filtered);
    }
  }, [location]);

  const showConstellationDetails = (constellation) => {
    setSelectedConstellation(constellation);
    Animated.spring(modalY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const hideModal = () => {
    Animated.spring(modalY, {
      toValue: screenHeight,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setSelectedConstellation(null);
    });
  };

  const renderConstellationCard = (constellation) => (
    <TouchableOpacity
      key={constellation.id}
      style={styles.constellationCard}
      onPress={() => showConstellationDetails(constellation)}
    >
      <View style={styles.cardContent}>
        <Text style={styles.constellationName}>{constellation.name}</Text>
        <Text style={styles.constellationPreview} numberOfLines={2}>
          {constellation.story.substring(0, 100)}...
        </Text>
        <View style={styles.cardFooter}>
          <Ionicons name="chevron-forward" size={20} color="#FFD700" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Cultural Stories</Text>
          <Text style={styles.subtitle}>
            Discover the ancestral stories behind the constellations
          </Text>
        </View>

        <View style={styles.constellationsList}>
          {visibleConstellations.map(renderConstellationCard)}
        </View>
      </ScrollView>

      {/* Constellation Details Modal */}
      <Modal visible={!!selectedConstellation} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: modalY }],
              },
            ]}
          >
            <View style={styles.modalHandle} />
            <TouchableOpacity style={styles.closeButton} onPress={hideModal}>
              <Ionicons name="close" size={24} color="#FFD700" />
            </TouchableOpacity>

            {selectedConstellation && (
              <ScrollView style={styles.modalScroll}>
                <View style={styles.artworkContainer}>
                  <Text style={styles.modalTitle}>{selectedConstellation.name}</Text>
                </View>

                <View style={styles.storyContainer}>
                  <Text style={styles.constellationStory}>
                    {selectedConstellation.story}
                  </Text>
                </View>
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
  constellationsList: {
    paddingBottom: 20,
  },
  constellationCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
  },
  constellationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  constellationPreview: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    opacity: 0.9,
  },
  cardFooter: {
    alignItems: 'flex-end',
    marginTop: 10,
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
  modalScroll: {
    padding: 20,
    paddingTop: 60,
  },
  artworkContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
  },
  storyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
  },
  constellationStory: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 26,
    textAlign: 'left',
  },
});
