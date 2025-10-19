import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PhotoService } from '../services/PhotoService';
import { useAuth } from '../contexts/AuthContext';
import theme from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

export const CollectionTab = () => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoUrls, setPhotoUrls] = useState({});

  useEffect(() => {
    if (user) {
      loadPhotos();
    }
  }, [user]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const { data, error } = await PhotoService.getUserPhotos();
      if (error) {
        Alert.alert('Error', 'Failed to load photos: ' + error.message);
      } else {
        setPhotos(data || []);
        // Use image_url directly from database
        if (data && data.length > 0) {
          const urls = {};
          for (const photo of data) {
            if (photo.image_url) {
              urls[photo.id] = photo.image_url;
            }
          }
          setPhotoUrls(urls);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const renderPhotoItem = ({ item }) => {
    const photoUrl = photoUrls[item.id];

    return (
      <TouchableOpacity
        style={styles.photoItem}
        onPress={() => setSelectedPhoto(item)}
        activeOpacity={0.8}
      >
        <View style={styles.photoContainer}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photoImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="image-outline" size={40} color={theme.colors.textMuted} />
            </View>
          )}
          
          {/* Constellation overlay */}
          {item.constellation_name && (
            <View style={styles.constellationOverlay}>
              <Text style={styles.constellationOverlayText}>
                {item.constellation_name}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.photoInfo}>
          <Text style={styles.photoDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <Text style={styles.photoTime}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={theme.gradients.card}
        style={styles.emptyStateGradient}
      >
        <Ionicons name="images-outline" size={80} color={theme.colors.textMuted} />
        <Text style={styles.emptyStateTitle}>No Photos Yet</Text>
        <Text style={styles.emptyStateSubtitle}>
          Capture your first constellation photo using the Scanner tab to begin your celestial collection
        </Text>
        <TouchableOpacity style={styles.emptyStateButton}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondaryBlue]}
            style={styles.emptyStateButtonGradient}
          >
            <Ionicons name="camera" size={20} color={theme.colors.black} />
            <Text style={styles.emptyStateButtonText}>Go to Scanner</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingText}>Loading your celestial collection...</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Collection</Text>
          <Text style={styles.subtitle}>Your captured constellation photos</Text>
        </View>
        {renderLoadingState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Collection</Text>
        <Text style={styles.subtitle}>
          {photos.length} photo{photos.length !== 1 ? 's' : ''} captured
        </Text>
      </View>

      {photos.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={photos}
          renderItem={renderPhotoItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.photoGrid}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Full Screen Photo Modal */}
      <Modal visible={!!selectedPhoto} transparent animationType="fade">
        <View style={styles.fullScreenModal}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setSelectedPhoto(null)}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              {photoUrls[selectedPhoto?.id] && (
                <Image
                  source={{ uri: photoUrls[selectedPhoto.id] }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedPhoto(null)}
              >
                <Ionicons name="close" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
              <View style={styles.photoDetails}>
                <Text style={styles.photoDetailsText}>
                  {selectedPhoto?.constellation_name && `${selectedPhoto.constellation_name} • `}
                  {selectedPhoto && new Date(selectedPhoto.created_at).toLocaleDateString()}
                </Text>
                <Text style={styles.photoDetailsTime}>
                  {selectedPhoto && new Date(selectedPhoto.created_at).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
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
    fontSize: theme.typography.body,
    color: theme.colors.textPrimary,
    opacity: 0.8,
    fontFamily: theme.typography.fontFamily,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
  },
  photoGrid: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  photoItem: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.medium,
  },
  photoContainer: {
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: 180,
    backgroundColor: theme.colors.cardBackgroundSolid,
  },
  photoPlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  constellationOverlay: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    backgroundColor: theme.colors.overlayDark,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  constellationOverlayText: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontWeight: theme.typography.bold,
    fontFamily: theme.typography.fontFamily,
  },
  photoInfo: {
    padding: theme.spacing.lg,
  },
  photoDate: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    fontWeight: theme.typography.bold,
    fontFamily: theme.typography.fontFamily,
  },
  photoTime: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.small,
    marginTop: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyStateGradient: {
    padding: theme.spacing.xxxl,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  emptyStateTitle: {
    fontSize: theme.typography.h3,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily,
  },
  emptyStateSubtitle: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xxxl,
    fontFamily: theme.typography.fontFamily,
  },
  emptyStateButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  emptyStateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  emptyStateButtonText: {
    color: theme.colors.black,
    fontSize: theme.typography.body,
    fontWeight: theme.typography.bold,
    marginLeft: theme.spacing.md,
    fontFamily: theme.typography.fontFamily,
  },
  fullScreenModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.overlayDark,
    zIndex: 1000,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: theme.colors.cardBackgroundSolid,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.large,
  },
  fullScreenImage: {
    flex: 1,
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.xl,
    right: theme.spacing.xl,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  photoDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.overlayDark,
    padding: theme.spacing.xl,
  },
  photoDetailsText: {
    color: theme.colors.primary,
    fontSize: theme.typography.caption,
    textAlign: 'center',
    fontWeight: theme.typography.bold,
    fontFamily: theme.typography.fontFamily,
  },
  photoDetailsTime: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.small,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily,
  },
});
