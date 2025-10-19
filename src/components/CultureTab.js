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
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { indigenousService } from '../core/services/indigenousCulturalService';
import theme from '../styles/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Common constellations to showcase indigenous stories
const FEATURED_CONSTELLATIONS = [
  'Ursa Major',
  'Pleiades', 
  'Orion',
  'Polaris',
  'Milky Way',
  'Cassiopeia',
  'Corona Borealis',
  'Scorpius',
  'Gemini',
  'Taurus'
];

export const CultureTab = ({ location }) => {
  const [selectedStory, setSelectedStory] = useState(null);
  const [constellationStories, setConstellationStories] = useState([]);
  const [selectedCulture, setSelectedCulture] = useState('All Cultures');
  const [availableCultures, setAvailableCultures] = useState([]);
  const [modalY] = useState(new Animated.Value(screenHeight));

  useEffect(() => {
    loadIndigenousStories();
  }, []);

  const loadIndigenousStories = () => {
    const stories = [];
    const cultures = new Set();
    
    FEATURED_CONSTELLATIONS.forEach(constellationName => {
      const constellationStories = indigenousService.findStoriesWithMappings(constellationName);
      if (constellationStories.length > 0) {
        stories.push({
          constellation: constellationName,
          stories: constellationStories
        });
        constellationStories.forEach(story => cultures.add(story.culture));
      }
    });
    
    setConstellationStories(stories);
    setAvailableCultures(['All Cultures', ...Array.from(cultures).sort()]);
  };

  const getFilteredStories = () => {
    if (selectedCulture === 'All Cultures') {
      return constellationStories;
    }
    
    return constellationStories.map(item => ({
      ...item,
      stories: item.stories.filter(story => story.culture === selectedCulture)
    })).filter(item => item.stories.length > 0);
  };

  const showStoryDetails = (story) => {
    setSelectedStory(story);
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
      setSelectedStory(null);
    });
  };

  const renderCultureFilter = () => (
    <View style={styles.cultureFilter}>
      <Text style={styles.filterLabel}>Cultural Perspective:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cultureScroll}>
        {availableCultures.map((culture) => (
          <TouchableOpacity
            key={culture}
            style={[
              styles.cultureButton,
              selectedCulture === culture && styles.activeCultureButton
            ]}
            onPress={() => setSelectedCulture(culture)}
          >
            <Text style={[
              styles.cultureButtonText,
              selectedCulture === culture && styles.activeCultureButtonText
            ]}>
              {culture}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderConstellationCard = (constellationData) => {
    const { constellation, stories } = constellationData;
    
    return (
      <View key={constellation} style={styles.constellationSection}>
        <Text style={styles.constellationTitle}>{constellation}</Text>
        <View style={styles.storiesContainer}>
          {stories.map((story, index) => (
            <TouchableOpacity
              key={`${story.culture}-${index}`}
              style={styles.storyCard}
              onPress={() => showStoryDetails(story)}
            >
              <LinearGradient
                colors={theme.gradients.card}
                style={styles.cardGradient}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cultureName}>{story.culture}</Text>
                  <Text style={styles.objectType}>{story.object_type}</Text>
                </View>
                <Text style={styles.indigenousName}>{story.indigenous_name}</Text>
                <Text style={styles.storyPreview} numberOfLines={3}>
                  {story.story_or_meaning}
                </Text>
                <View style={styles.cardFooter}>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                  <Text style={styles.title}>Sky Stories</Text>
                  <Text style={styles.subtitle}>
                    Discover the rich cultural traditions behind the constellations
                  </Text>
                  <Text style={styles.missionText}>
                    Explore how Indigenous peoples around the world have mapped the stars, 
                    each culture bringing unique wisdom and meaning to the celestial realm.
                  </Text>
                  
                  {/* Educational Call-to-Action */}
                  <View style={styles.educationBanner}>
                    <LinearGradient
                      colors={theme.gradients.card}
                      style={styles.educationBannerGradient}
                    >
                      <Ionicons name="school-outline" size={24} color={theme.colors.primary} />
                      <View style={styles.educationBannerContent}>
                        <Text style={styles.educationBannerTitle}>Educational Mission</Text>
                        <Text style={styles.educationBannerText}>
                          Learn about the diverse ways humanity has understood the night sky
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                </View>

        {renderCultureFilter()}

        <View style={styles.constellationsList}>
          {getFilteredStories().map(renderConstellationCard)}
        </View>
      </ScrollView>

      {/* Story Details Modal */}
      <Modal visible={!!selectedStory} transparent animationType="none">
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
              <Ionicons name="close" size={24} color={theme.colors.primary} />
            </TouchableOpacity>

            {selectedStory && (
              <ScrollView style={styles.modalScroll}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedStory.indigenous_name}</Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedStory.culture} • {selectedStory.object_type}
                  </Text>
                  <Text style={styles.westernName}>
                    Western Name: {selectedStory.western_name}
                  </Text>
                </View>

                <View style={styles.storyContainer}>
                  <Text style={styles.storyText}>
                    {selectedStory.story_or_meaning}
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
    backgroundColor: theme.colors.black,
  },
  scrollView: {
    flex: 1,
    padding: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.xxxl,
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.h2,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily,
  },
  subtitle: {
    fontSize: theme.typography.body,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
    opacity: 0.9,
    fontFamily: theme.typography.fontFamily,
  },
  missionText: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
    fontFamily: theme.typography.fontFamily,
  },
  educationBanner: {
    marginTop: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.medium,
  },
  educationBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  educationBannerContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  educationBannerTitle: {
    fontSize: theme.typography.h4,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily,
  },
  educationBannerText: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    fontFamily: theme.typography.fontFamily,
  },
  cultureFilter: {
    marginBottom: theme.spacing.xl,
  },
  filterLabel: {
    fontSize: theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: theme.typography.semibold,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.fontFamily,
  },
  cultureScroll: {
    flexDirection: 'row',
  },
  cultureButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  activeCultureButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  cultureButtonText: {
    fontSize: theme.typography.caption,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.medium,
    fontFamily: theme.typography.fontFamily,
  },
  activeCultureButtonText: {
    color: theme.colors.black,
    fontWeight: theme.typography.bold,
  },
  constellationsList: {
    paddingBottom: theme.spacing.xl,
  },
  constellationSection: {
    marginBottom: theme.spacing.xxxl,
  },
  constellationTitle: {
    fontSize: theme.typography.h4,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.fontFamily,
  },
  storiesContainer: {
    gap: theme.spacing.lg,
  },
  storyCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.medium,
  },
  cardGradient: {
    padding: theme.spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cultureName: {
    fontSize: theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: theme.typography.bold,
    fontFamily: theme.typography.fontFamily,
  },
  objectType: {
    fontSize: theme.typography.small,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    fontFamily: theme.typography.fontFamily,
  },
  indigenousName: {
    fontSize: theme.typography.h4,
    fontWeight: theme.typography.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    fontFamily: theme.typography.fontFamily,
  },
  storyPreview: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.typography.fontFamily,
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlayLight,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.cardBackgroundSolid,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    minHeight: screenHeight * 0.6,
    maxHeight: screenHeight * 0.8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.xl,
    right: theme.spacing.xl,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalScroll: {
    padding: theme.spacing.xl,
    paddingTop: 60,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  modalTitle: {
    fontSize: theme.typography.h3,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily,
  },
  modalSubtitle: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily,
  },
  westernName: {
    fontSize: theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: theme.typography.fontFamily,
  },
  storyContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  storyText: {
    fontSize: theme.typography.body,
    color: theme.colors.textPrimary,
    lineHeight: 26,
    textAlign: 'left',
    fontFamily: theme.typography.fontFamily,
  },
});
