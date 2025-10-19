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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PhotoService } from '../services/PhotoService';
import { useAuth } from '../contexts/AuthContext';

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
        // Pre-load photo URLs
        if (data && data.length > 0) {
          const urls = {};
          for (const photo of data) {
            const { data: url } = await PhotoService.getPhotoUrl(photo.storage_path);
            if (url) {
              urls[photo.id] = url;
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
      >
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photoImage} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="image-outline" size={40} color="#666" />
          </View>
        )}
        <View style={styles.photoInfo}>
          <Text style={styles.photoDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          {item.constellation_name && (
            <Text style={styles.photoConstellation}>
              {item.constellation_name}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="images-outline" size={80} color="#666" />
      <Text style={styles.emptyStateTitle}>No Photos Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Capture your first constellation photo using the Scanner tab
      </Text>
      <TouchableOpacity style={styles.emptyStateButton}>
        <Text style={styles.emptyStateButtonText}>Go to Scanner</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Collection</Text>
          <Text style={styles.subtitle}>Your captured constellation photos</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading photos...</Text>
        </View>
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
      {selectedPhoto && (
        <View style={styles.fullScreenModal}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setSelectedPhoto(null)}
          >
            <View style={styles.modalContent}>
              {photoUrls[selectedPhoto.id] && (
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
                <Ionicons name="close" size={30} color="#FFD700" />
              </TouchableOpacity>
              <View style={styles.photoDetails}>
                <Text style={styles.photoDetailsText}>
                  {selectedPhoto.constellation_name && `${selectedPhoto.constellation_name} • `}
                  {new Date(selectedPhoto.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}
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
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  photoGrid: {
    padding: 10,
  },
  photoItem: {
    flex: 1,
    margin: 5,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  photoImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#1a1f4a',
  },
  photoPlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoInfo: {
    padding: 10,
  },
  photoDate: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  photoConstellation: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
    marginBottom: 30,
  },
  emptyStateButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  emptyStateButtonText: {
    color: '#0c1445',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fullScreenModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
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
    backgroundColor: '#1a1f4a',
    borderRadius: 20,
    overflow: 'hidden',
  },
  fullScreenImage: {
    flex: 1,
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
  },
  photoDetailsText: {
    color: '#FFD700',
    fontSize: 14,
    textAlign: 'center',
  },
});
