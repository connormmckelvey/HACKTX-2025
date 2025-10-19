import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { PhotoService } from '../services/PhotoService';
import { useAuth } from '../contexts/AuthContext';

const { height: screenHeight } = Dimensions.get('window');

export const PhotoCapture = ({ visible, onClose, constellation, location }) => {
  const { user } = useAuth();
  const [cameraRef, setCameraRef] = useState(null);
  const isMountedRef = useRef(true);
  const [capturing, setCapturing] = useState(false);
  const [brightnessRating, setBrightnessRating] = useState(3);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [photoFrozen, setPhotoFrozen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  // Animation values
  const dropdownAnim = useRef(new Animated.Value(-screenHeight * 0.75)).current;

  // Use the useCameraPermissions hook for proper permission handling
  const [permission, requestPermission] = useCameraPermissions();

  React.useEffect(() => {
    if (visible && permission === null) {
      // Permission check will happen automatically via the hook
      console.log('Permission hook initialized');
    }
  }, [visible, permission]);

  // Cleanup effect to reset state when modal closes
  React.useEffect(() => {
    console.log('🔄 PhotoCapture modal visibility changed:', visible);
    if (!visible) {
      console.log('🔄 Modal closed, resetting states');
      // Reset all states when modal is closed
      setCapturing(false);
      setCapturedPhotoUri(null);
      setShowDropdown(false);
      setPhotoFrozen(false);
      setCameraRef(null);
      setCameraReady(false);
    } else {
      console.log('🔄 Modal opened, initializing camera');
    }
  }, [visible]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const takePicture = async () => {
    console.log('📸 CAPTURE BUTTON PRESSED!', {
      cameraRef: !!cameraRef,
      visible: visible,
      cameraReady: cameraReady,
      capturing: capturing,
      photoFrozen: photoFrozen,
      isMounted: isMountedRef.current
    });
    
    if (!cameraRef || !visible || !cameraReady) {
      console.log('❌ Camera not ready - ref:', !!cameraRef, 'visible:', visible, 'ready:', cameraReady);
      return;
    }

    if (!isMountedRef.current) {
      console.log('❌ Component unmounted, cannot take picture');
      return;
    }

    try {
      console.log('=== TAKING PICTURE ===');
      console.log('Camera ref exists:', !!cameraRef);
      console.log('Modal visible:', visible);
      setCapturing(true);

      // Add a small delay to ensure camera is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if camera ref is still valid
      if (!cameraRef || !visible || !isMountedRef.current) {
        console.error('Camera ref became null, modal closed, or component unmounted during preparation');
        return;
      }

      const photo = await cameraRef.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      // Check if modal is still visible and component is mounted after photo capture
      if (!visible || !isMountedRef.current) {
        console.log('Modal closed or component unmounted during photo capture, discarding photo');
        return;
      }

      console.log('Photo taken successfully:', photo.uri);
      setCapturedPhotoUri(photo.uri);
      setPhotoFrozen(true);

      // Show dropdown with animation
      setShowDropdown(true);
      Animated.spring(dropdownAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      console.log('=== PICTURE TAKEN SUCCESSFULLY ===');
    } catch (error) {
      // Check if it's the unmounted error specifically first
      if (error.message && error.message.includes('unmounted')) {
        console.log('Camera was unmounted during photo capture - this is expected if modal was closed');
        return; // Don't show error alert for this case
      }
      
      // Only log as error if it's not an expected unmounted error
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  const savePhoto = async () => {
    if (!capturedPhotoUri || !location) return;

    try {
      const photoData = {
        uri: capturedPhotoUri,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        constellation: constellation ? [constellation.name] : [], // Array of constellation names
        brightnessRating: brightnessRating,
        timestamp: new Date().toISOString(),
      };

      const { data, error } = await PhotoService.uploadPhoto(photoData);

      if (error) {
        Alert.alert('Error', 'Failed to save photo: ' + error.message);
      } else {
        Alert.alert('Success', 'Photo saved successfully!');
        hideDropdown();
        onClose();
      }
    } catch (error) {
      console.error('Error saving photo:', error);
      Alert.alert('Error', 'Failed to save photo');
    } finally {
      setCapturedPhotoUri(null);
      setShowRatingModal(false);
    }
  };

  const hideDropdown = () => {
    Animated.spring(dropdownAnim, {
      toValue: -screenHeight * 0.75,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setShowDropdown(false);
      setPhotoFrozen(false);
    });
  };

  const cancelCapture = () => {
    setCapturedPhotoUri(null);
    setShowRatingModal(false);
    hideDropdown();
  };

  if (!visible) return null;

  // Handle permission states
  if (!permission) {
    return (
      <Modal visible={visible} transparent>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </Modal>
    );
  }

  if (permission.granted === false) {
    return (
      <Modal visible={visible} transparent animationType="none">
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera permission is required to take photos</Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: 'red' }]}
            onPressIn={() => console.log('TOUCH START - Grant Permission')}
            onPressOut={() => console.log('TOUCH END - Grant Permission')}
            onPress={async () => {
              console.log('Grant Permission button pressed');
              try {
                await requestPermission();
                console.log('Permission request completed');
              } catch (error) {
                console.error('Permission request failed:', error);
              }
            }}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            activeOpacity={0.5}
          >
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { marginTop: 10, backgroundColor: 'blue' }]}
            onPressIn={() => console.log('TOUCH START - Close')}
            onPressOut={() => console.log('TOUCH END - Close')}
            onPress={onClose}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            activeOpacity={0.5}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        {/* Camera View - Frozen when photo is taken */}
        {photoFrozen ? (
          <Image source={{ uri: capturedPhotoUri }} style={styles.camera} />
        ) : (
          <CameraView
            style={styles.camera}
            facing="back"
            ref={(ref) => setCameraRef(ref)}
            onCameraReady={() => {
              console.log('Camera is ready');
              setCameraReady(true);
            }}
          />
        )}

        {/* Camera Overlay */}
        <View style={styles.cameraOverlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              Capture Constellation Photo
            </Text>
          </View>

          {/* Capture Button - Only show when not frozen */}
          {!photoFrozen && (
            <View style={styles.captureContainer}>
              <TouchableOpacity
                style={[styles.captureButton, (capturing || !cameraReady) && styles.captureButtonDisabled]}
                onPress={takePicture}
                disabled={capturing || !cameraReady}
              >
                {capturing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              {photoFrozen ? 'Photo captured! Review below.' : 'Point your camera at the sky and tap to capture'}
            </Text>
          </View>
        </View>

        {/* Dropdown Overlay */}
        {showDropdown && (
          <Animated.View 
            style={[
              styles.dropdownOverlay,
              {
                transform: [{ translateY: dropdownAnim }],
              },
            ]}
          >
            {/* Handle bar */}
            <View style={styles.dropdownHandle} />

            {/* Close button */}
            <TouchableOpacity style={styles.dropdownCloseButton} onPress={hideDropdown}>
              <Text style={styles.dropdownCloseButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Photo Display */}
            <View style={styles.photoDisplayContainer}>
              <Image source={{ uri: capturedPhotoUri }} style={styles.capturedPhoto} />
            </View>

            {/* Rating Section */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingTitle}>Rate Sky Brightness</Text>
              <Text style={styles.ratingSubtitle}>
                How bright is the sky? (1 = Very dark, 5 = Very bright)
              </Text>

              <View style={styles.ratingButtons}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingButton,
                      brightnessRating === rating && styles.ratingButtonSelected,
                    ]}
                    onPress={() => setBrightnessRating(rating)}
                  >
                    <Text
                      style={[
                        styles.ratingButtonText,
                        brightnessRating === rating && styles.ratingButtonTextSelected,
                      ]}
                    >
                      {rating}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.ratingActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={cancelCapture}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={savePhoto}>
                  <Text style={styles.saveButtonText}>Save Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 100, // Ensure overlay is above camera but below buttons
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Compensate for close button
  },
  captureContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000, // Ensure it's above other elements
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // More opaque for better visibility
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4, // Thicker border
    borderColor: '#FFD700', // Gold color for better visibility
    zIndex: 1001, // Even higher than container
    elevation: 10, // For Android
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFD700', // Gold color to match border
  },
  infoContainer: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#0c1445',
    fontWeight: 'bold',
  },
  ratingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingContainer: {
    backgroundColor: '#1a1f4a',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
  },
  ratingTitle: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ratingSubtitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  ratingButtons: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  ratingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  ratingButtonSelected: {
    backgroundColor: '#FFD700',
  },
  ratingButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  ratingButtonTextSelected: {
    color: '#0c1445',
  },
  ratingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#0c1445',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  // Dropdown overlay styles
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: screenHeight * 0.75,
    backgroundColor: '#1a1f4a',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 500, // Lower than capture button but above camera
  },
  dropdownHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#FFD700',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  dropdownCloseButton: {
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
  dropdownCloseButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoDisplayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  capturedPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    resizeMode: 'cover',
  },
  ratingSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});
