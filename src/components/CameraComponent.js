import React from 'react';
import { Button, StyleSheet, Text, View, Alert } from 'react-native';
import { Camera, useCameraPermissions, PermissionStatus } from 'expo-camera';
import * as Linking from 'expo-linking';

export default function CameraComponent() {
  // This hook handles all permission logic
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet

    const openSettings = () => {
      Linking.openSettings();
    };

    const handleRequestPermission = async () => {
      const { status } = await requestPermission();
      if (status === PermissionStatus.DENIED && !permission.canAskAgain) {
        // This happens on iOS when user denies permanently
        Alert.alert(
          "Permission Required",
          "You have permanently denied camera access. Please go to your device settings to enable it.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: openSettings }
          ]
        );
      }
    };

    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 10 }}>
          We need your permission to show the camera
        </Text>
        <Button onPress={handleRequestPermission} title="Grant Permission" />
      </View>
    );
  }

  // Permission IS granted
  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type="back" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
});
