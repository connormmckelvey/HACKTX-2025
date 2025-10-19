// Constellation Selector Component
// Allows users to select constellations to learn about their cultural stories

import React, { useState } from 'react';
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
import { indigenousService } from '../services/indigenousCulturalService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ConstellationSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectConstellation: (constellationName: string) => void;
}

interface ConstellationOption {
  name: string;
  displayName: string;
  storyCount: number;
  cultures: string[];
}

export const ConstellationSelector: React.FC<ConstellationSelectorProps> = ({
  visible,
  onClose,
  onSelectConstellation,
}) => {
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  const [constellations, setConstellations] = useState<ConstellationOption[]>([]);

  React.useEffect(() => {
    if (visible) {
      // Generate constellation options from available data
      const constellationMap = new Map<string, ConstellationOption>();
      
      // Get all unique western names and their cultural data
      indigenousService.getAllCultures().forEach(culture => {
        const stories = indigenousService.getStoriesByCulture(culture);
        stories.forEach(story => {
          const key = story.western_name.split(' / ')[0]; // Use main constellation name
          if (!constellationMap.has(key)) {
            constellationMap.set(key, {
              name: key,
              displayName: key,
              storyCount: 0,
              cultures: [],
            });
          }
          const option = constellationMap.get(key)!;
          option.storyCount++;
          if (!option.cultures.includes(story.culture)) {
            option.cultures.push(story.culture);
          }
        });
      });

      // Convert to array and sort by story count
      const constellationArray = Array.from(constellationMap.values())
        .sort((a, b) => b.storyCount - a.storyCount);

      setConstellations(constellationArray);

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
  }, [visible, slideAnim]);

  const handleSelect = (constellation: ConstellationOption) => {
    onSelectConstellation(constellation.name);
    onClose();
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const renderConstellationOption = (constellation: ConstellationOption) => (
    <TouchableOpacity
      key={constellation.name}
      style={styles.constellationOption}
      onPress={() => handleSelect(constellation)}
    >
      <View style={styles.constellationHeader}>
        <Text style={styles.constellationName}>{constellation.displayName}</Text>
        <View style={styles.storyCountBadge}>
          <Text style={styles.storyCountText}>{constellation.storyCount}</Text>
        </View>
      </View>
      <Text style={styles.cultureList}>
        {constellation.cultures.slice(0, 3).join(', ')}
        {constellation.cultures.length > 3 && ` +${constellation.cultures.length - 3} more`}
      </Text>
      <Ionicons name="chevron-forward" size={16} color="#888" style={styles.chevron} />
    </TouchableOpacity>
  );

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
              <Text style={styles.title}>Choose a Constellation</Text>
              <Text style={styles.subtitle}>Learn about indigenous cultural stories</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {constellations.length > 0 ? (
              constellations.map(renderConstellationOption)
            ) : (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading constellations...</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Tap any constellation to explore its cultural stories from indigenous traditions around the world.
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.7,
    minHeight: screenHeight * 0.4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  constellationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  constellationHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  constellationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  storyCountBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  storyCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  cultureList: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
    flex: 1,
  },
  chevron: {
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#ccc',
    fontSize: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#16213e',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 16,
  },
});
