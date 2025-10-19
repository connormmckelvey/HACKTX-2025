import React, { useState } from 'react';
import { Button, Image, View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base-64';
import { supabase } from '../supabaseClient'; // Adjust path if needed

export default function ImagePickerComponent() {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const takePicture = async () => {
    try {
      console.log('=== STARTING TAKE PICTURE ===');

      // 1. Check and request MEDIA LIBRARY permissions only if needed
      console.log('Checking media library permissions...');
      const libraryPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
      console.log('Media library permission status:', libraryPermission.status);

      if (libraryPermission.status !== 'granted') {
        console.log('Requesting media library permissions...');
        const libraryRequest = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('Media library request result:', libraryRequest.status);
        if (libraryRequest.status !== 'granted') {
          Alert.alert('Permission Denied', 'We need permission to access your photo library to save photos.');
          return;
        }
      }

      // 2. Check and request CAMERA permissions only if needed
      console.log('Checking camera permissions...');
      const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
      console.log('Camera permission status:', cameraPermission.status);

      if (cameraPermission.status !== 'granted') {
        console.log('Requesting camera permissions...');
        const cameraRequest = await ImagePicker.requestCameraPermissionsAsync();
        console.log('Camera request result:', cameraRequest.status);
        if (cameraRequest.status !== 'granted') {
          Alert.alert('Permission Denied', 'We need camera permissions to take a picture.');
          return;
        }
      }

      // 3. Launch the camera
      console.log('Launching camera...');
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7, // 0.7 is a good balance
      });

      console.log('Camera result:', result);

      if (result.canceled) {
        console.log('User canceled camera');
        return;
      }

      // Set local image for display
      const localUri = result.assets[0].uri;
      console.log('Image URI:', localUri);
      setImage(localUri);

      // 4. Start the upload process
      console.log('Starting upload process...');
      await uploadImage(localUri);

      console.log('=== TAKE PICTURE COMPLETED ===');
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'There was an error accessing the camera.');
    }
  };

  const uploadImage = async (uri) => {
    console.log('=== STARTING UPLOAD ===');
    console.log('Upload URI:', uri);

    setUploading(true);
    try {
      // Read the file from its local URI
      console.log('Reading file as base64...');
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('Base64 length:', base64.length);

      // Create a unique file path for Supabase
      // Assumes you have a 'profiles' bucket. CHANGE 'profiles' if yours is different.
      // Assumes you want to store images in a 'public' folder.
      const userId = 'user_123'; // TODO: Get the actual logged-in user ID
      const filePath = `public/${userId}/${Date.now()}.jpg`;
      console.log('Upload file path:', filePath);

      // Upload the file
      console.log('Uploading to Supabase...');
      const { data, error } = await supabase.storage
        .from('profiles') // **TODO: Change 'profiles' to your bucket name**
        .upload(filePath, decode(base64), {
          contentType: 'image/jpeg',
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }

      console.log('Upload successful, getting public URL...');
      // Get the public URL of the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('profiles') // **TODO: Change 'profiles' to your bucket name**
        .getPublicUrl(filePath);

      if (!publicUrlData) {
        console.error('Could not get public URL data');
        throw new Error('Could not get public URL');
      }

      const publicUrl = publicUrlData.publicUrl;
      console.log('Public URL:', publicUrl);

      // 5. TODO: Update the user's profile in the database
      // Now, save this `publicUrl` to your 'profiles' table
      /*
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;
      */

      Alert.alert('Success', 'Photo uploaded and profile updated!');
      console.log('Upload completed successfully');

    } catch (e) {
      console.error('Upload error:', e);
      Alert.alert('Upload Failed', 'There was an error uploading your photo.');
    } finally {
      setUploading(false);
      console.log('=== UPLOAD FINISHED ===');
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Take a Picture" onPress={takePicture} disabled={uploading} />
      {image && <Image source={{ uri: image }} style={styles.image} />}
      {uploading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  image: {
    width: 200,
    height: 200,
    marginTop: 20,
    borderRadius: 8,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
