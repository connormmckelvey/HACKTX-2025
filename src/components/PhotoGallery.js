import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { PhotoService } from '../services/PhotoService';
import { useAuth } from '../contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

export const PhotoGallery = ({ visible, onClose }) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoUrls, setPhotoUrls] = useState({});

  useEffect(() => {
    if (visible && user) {
      loadPhotos();
    }
  }, [visible, user]);

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
      console.error('Error loading photos:', error);
      Alert.alert('Error', 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = async (photoId) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await PhotoService.deletePhoto(photoId);
              if (error) {
                Alert.alert('Error', 'Failed to delete photo: ' + error.message);
              } else {
                setPhotos(photos.filter(p => p.id !== photoId));
                setSelectedPhoto(null);
                Alert.alert('Success', 'Photo deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert('Error', 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  const renderPhotoItem = ({ item }) => {
    const photoUrl = photoUrls[item.id];
    
    return (
      <TouchableOpacity
        style={styles.photoItem}
        onPress={() => setSelectedPhoto(item)}
      >
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photoThumbnail} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <ActivityIndicator color="#FFD700" />
          </View>
        )}
        <View style={styles.photoInfo}>
          <Text style={styles.constellationName}>
            {Array.isArray(item.constellation) && item.constellation.length > 0 
              ? item.constellation.join(', ') 
              : 'No constellations detected'}
          </Text>
          <Text style={styles.photoDate}>
            {new Date(item.taken_at).toLocaleDateString()}
          </Text>
          <Text style={styles.brightnessRating}>
            Brightness Rating: {item.brightness_rating}/5
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPhotoDetail = () => {
    if (!selectedPhoto) return null;

    const photoUrl = photoUrls[selectedPhoto.id];

    return (
      <Modal visible={!!selectedPhoto} transparent animationType="fade">
        <View style={styles.detailOverlay}>
          <View style={styles.detailContainer}>
            <TouchableOpacity
              style={styles.detailCloseButton}
              onPress={() => setSelectedPhoto(null)}
            >
              <Text style={styles.detailCloseText}>✕</Text>
            </TouchableOpacity>

            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.detailPhoto} />
            ) : (
              <View style={styles.detailPlaceholder}>
                <ActivityIndicator size="large" color="#FFD700" />
              </View>
            )}

            <View style={styles.detailInfo}>
              <Text style={styles.detailTitle}>
                {Array.isArray(selectedPhoto.constellation) && selectedPhoto.constellation.length > 0 
                  ? selectedPhoto.constellation.join(', ') 
                  : 'No constellations detected'}
              </Text>
              <Text style={styles.detailText}>
                Taken: {new Date(selectedPhoto.taken_at).toLocaleString()}
              </Text>
              <Text style={styles.detailText}>
                Location: {selectedPhoto.latitude.toFixed(4)}, {selectedPhoto.longitude.toFixed(4)}
              </Text>
              <Text style={styles.detailText}>
                Brightness Rating: {selectedPhoto.brightness_rating}/5
              </Text>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deletePhoto(selectedPhoto.id)}
            >
              <Text style={styles.deleteButtonText}>Delete Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Constellation Photos</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Loading photos...</Text>
          </View>
        ) : photos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No photos yet</Text>
            <Text style={styles.emptySubtext}>
              Capture photos to see them here (constellations will be detected automatically)
            </Text>
          </View>
        ) : (
          <FlatList
            data={photos}
            renderItem={renderPhotoItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.photoList}
            numColumns={2}
          />
        )}

        {renderPhotoDetail()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1445',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFD700',
    fontSize: 16,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptySubtext: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  photoList: {
    padding: 10,
  },
  photoItem: {
    flex: 1,
    margin: 5,
    backgroundColor: '#1a1f4a',
    borderRadius: 10,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  photoInfo: {
    padding: 10,
  },
  constellationName: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  photoDate: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 2,
  },
  lightRating: {
    color: '#fff',
    fontSize: 12,
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContainer: {
    backgroundColor: '#1a1f4a',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    alignItems: 'center',
    maxWidth: screenWidth - 40,
  },
  detailCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  detailCloseText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailPhoto: {
    width: screenWidth - 80,
    height: 300,
    borderRadius: 10,
    resizeMode: 'cover',
    marginBottom: 20,
  },
  detailPlaceholder: {
    width: screenWidth - 80,
    height: 300,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  detailTitle: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detailText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
