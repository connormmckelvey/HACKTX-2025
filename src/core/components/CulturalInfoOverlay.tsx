// Cultural Info Overlay Component
// Displays indigenous cultural stories and meanings for constellations

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { indigenousService, IndigenousStory, CulturalGroup } from '../services/indigenousCulturalService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CulturalInfoOverlayProps {
  visible: boolean;
  constellationName: string;
  onClose: () => void;
  selectedCulture?: string;
  onCultureChange?: (culture: string) => void;
}

export const CulturalInfoOverlay: React.FC<CulturalInfoOverlayProps> = ({
  visible,
  constellationName,
  onClose,
  selectedCulture,
  onCultureChange,
}) => {
  const [culturalGroups, setCulturalGroups] = useState<CulturalGroup[]>([]);
  const [allCultures, setAllCultures] = useState<string[]>([]);
  const [slideAnim] = useState(new Animated.Value(screenHeight));

  useEffect(() => {
    if (visible && constellationName) {
      const groups = indigenousService.getCulturalGroupsForConstellation(constellationName);
      const cultures = indigenousService.getAllCultures();
      setCulturalGroups(groups);
      setAllCultures(cultures);
      
      // Animate slide up
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Animate slide down
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, constellationName, slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const renderStoryCard = (story: IndigenousStory) => (
    <View key={`${story.culture}-${story.indigenous_name}`} style={styles.storyCard}>
      <View style={styles.storyHeader}>
        <Text style={styles.indigenousName}>{story.indigenous_name}</Text>
        <Text style={styles.cultureName}>{story.culture}</Text>
      </View>
      <Text style={styles.storyText}>{story.story_or_meaning}</Text>
      <View style={styles.storyFooter}>
        <Text style={styles.objectType}>{story.object_type}</Text>
        {story.constellation_type === 'Dark' && (
          <View style={styles.darkConstellationBadge}>
            <Text style={styles.darkConstellationText}>Dark Constellation</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderCulturalGroup = (group: CulturalGroup) => {
    if (selectedCulture && group.culture !== selectedCulture) {
      return null;
    }

    return (
      <View key={group.culture} style={styles.culturalGroup}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupTitle}>{group.culture}</Text>
          <Text style={styles.storyCount}>{group.stories.length} story{group.stories.length !== 1 ? 'ies' : ''}</Text>
        </View>
        {group.stories.map(renderStoryCard)}
      </View>
    );
  };

  const filteredGroups = selectedCulture 
    ? culturalGroups.filter(group => group.culture === selectedCulture)
    : culturalGroups;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        
        <Animated.View 
          style={[
            styles.container,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Cultural Stories</Text>
              <Text style={styles.subtitle}>{constellationName}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Culture Filter */}
          {allCultures.length > 0 && (
            <ScrollView 
              horizontal 
              style={styles.cultureFilter}
              showsHorizontalScrollIndicator={false}
            >
              <TouchableOpacity
                style={[
                  styles.cultureButton,
                  !selectedCulture && styles.cultureButtonActive
                ]}
                onPress={() => onCultureChange?.('')}
              >
                <Text style={[
                  styles.cultureButtonText,
                  !selectedCulture && styles.cultureButtonTextActive
                ]}>
                  All Cultures
                </Text>
              </TouchableOpacity>
              {allCultures.map(culture => (
                <TouchableOpacity
                  key={culture}
                  style={[
                    styles.cultureButton,
                    selectedCulture === culture && styles.cultureButtonActive
                  ]}
                  onPress={() => onCultureChange?.(culture)}
                >
                  <Text style={[
                    styles.cultureButtonText,
                    selectedCulture === culture && styles.cultureButtonTextActive
                  ]}>
                    {culture}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {filteredGroups.length > 0 ? (
              filteredGroups.map(renderCulturalGroup)
            ) : (
              <View style={styles.noStoriesContainer}>
                <Ionicons name="book-outline" size={48} color="#666" />
                <Text style={styles.noStoriesTitle}>No Cultural Stories Found</Text>
                <Text style={styles.noStoriesText}>
                  We don't have indigenous stories for "{constellationName}" yet.
                </Text>
                <Text style={styles.noStoriesSubtext}>
                  Try looking at other constellations like Ursa Major, Orion, or Pleiades.
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 21, 18, 0.7)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: '#1a1512',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.95,
    minHeight: screenHeight * 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 115, 85, 0.2)',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f5e6d3',
  },
  subtitle: {
    fontSize: 14,
    color: '#b5a792',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  cultureFilter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 115, 85, 0.2)',
  },
  cultureButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#2a221b',
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.2)',
  },
  cultureButtonActive: {
    backgroundColor: '#4a5c47',
    borderColor: '#4a5c47',
  },
  cultureButtonText: {
    color: '#b5a792',
    fontSize: 12,
    fontWeight: '500',
  },
  cultureButtonTextActive: {
    color: '#f5e6d3',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  culturalGroup: {
    marginVertical: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#b5a792',
  },
  storyCount: {
    fontSize: 12,
    color: '#b5a792',
    opacity: 0.7,
  },
  storyCard: {
    backgroundColor: '#2a221b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4a5c47',
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.1)',
  },
  storyHeader: {
    marginBottom: 8,
  },
  indigenousName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f5e6d3',
  },
  cultureName: {
    fontSize: 12,
    color: '#b5a792',
    marginTop: 2,
  },
  storyText: {
    fontSize: 14,
    color: '#b5a792',
    lineHeight: 20,
    marginBottom: 12,
    opacity: 0.9,
  },
  storyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  objectType: {
    fontSize: 11,
    color: '#b5a792',
    fontStyle: 'italic',
    opacity: 0.7,
  },
  darkConstellationBadge: {
    backgroundColor: '#4a5c47',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  darkConstellationText: {
    fontSize: 10,
    color: '#f5e6d3',
    fontWeight: 'bold',
  },
  noStoriesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noStoriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f5e6d3',
    marginTop: 16,
    marginBottom: 8,
  },
  noStoriesText: {
    fontSize: 14,
    color: '#b5a792',
    textAlign: 'center',
    marginBottom: 8,
  },
  noStoriesSubtext: {
    fontSize: 12,
    color: '#b5a792',
    textAlign: 'center',
    opacity: 0.7,
  },
});
