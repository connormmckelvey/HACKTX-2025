import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useCompass } from '../hooks/useCompass';

export const OrientationTest = ({ location }) => {
  const { 
    heading, 
    isSupported, 
    pitch, 
    roll, 
    isPointingSkyward, 
    orientationPermission,
    requestOrientationPermission 
  } = useCompass(location);
  
  const [showRawData, setShowRawData] = useState(false);
  const [testMode, setTestMode] = useState('basic'); // basic, detailed, stability

  const handleRequestPermission = async () => {
    const granted = await requestOrientationPermission();
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'This app needs access to device orientation to work properly.',
        [{ text: 'OK' }]
      );
    }
  };

  const getPitchStatus = () => {
    if (pitch < 8) return { text: '☁️ SKY', color: '#87CEEB' };
    if (pitch >= 8 && pitch < 90) return { text: '📱 HORIZONTAL', color: '#FFD700' };
    return { text: '🌍 GROUND', color: '#8B4513' };
  };

  const pitchStatus = getPitchStatus();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Orientation Test</Text>
      
      {/* Permission Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Permission Status</Text>
        <Text style={styles.statusText}>
          {orientationPermission === 'granted' ? '✅ Granted' : 
           orientationPermission === 'denied' ? '❌ Denied' : 
           '⏳ Pending'}
        </Text>
        {orientationPermission !== 'granted' && (
          <TouchableOpacity style={styles.button} onPress={handleRequestPermission}>
            <Text style={styles.buttonText}>Request Permission</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Basic Test */}
      {testMode === 'basic' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Orientation Test</Text>
          <Text style={[styles.pitchText, { color: pitchStatus.color }]}>
            Pitch: {Math.round(pitch)}° - {pitchStatus.text}
          </Text>
          <Text style={styles.statusText}>
            {isPointingSkyward ? '✨ Stars should be visible' : '📱 Point upward to see stars'}
          </Text>
        </View>
      )}

      {/* Detailed Test */}
      {testMode === 'detailed' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Orientation</Text>
          <Text style={styles.dataText}>Heading: {Math.round(heading)}°</Text>
          <Text style={styles.dataText}>Pitch: {Math.round(pitch)}°</Text>
          <Text style={styles.dataText}>Roll: {Math.round(roll)}°</Text>
          <Text style={styles.dataText}>Supported: {isSupported ? 'Yes' : 'No'}</Text>
          <Text style={styles.dataText}>Accuracy: {Math.round(accuracy * 100)}%</Text>
        </View>
      )}

      {/* Stability Test */}
      {testMode === 'stability' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stability Test</Text>
          <Text style={styles.instructionText}>
            Place your device on a flat surface and watch the pitch reading.
            It should stay around 0° and not jump around.
          </Text>
          <Text style={[styles.pitchText, { 
            color: Math.abs(pitch) < 5 ? '#00FF00' : '#FF0000' 
          }]}>
            Pitch: {pitch.toFixed(1)}°
          </Text>
          <Text style={styles.statusText}>
            {Math.abs(pitch) < 5 ? '✅ Stable' : '❌ Unstable'}
          </Text>
        </View>
      )}

      {/* Test Mode Selector */}
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={[styles.modeButton, testMode === 'basic' && styles.activeButton]}
          onPress={() => setTestMode('basic')}
        >
          <Text style={styles.modeButtonText}>Basic</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.modeButton, testMode === 'detailed' && styles.activeButton]}
          onPress={() => setTestMode('detailed')}
        >
          <Text style={styles.modeButtonText}>Detailed</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.modeButton, testMode === 'stability' && styles.activeButton]}
          onPress={() => setTestMode('stability')}
        >
          <Text style={styles.modeButtonText}>Stability</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          📱 Place device flat on table → Pitch should be ~0°
        </Text>
        <Text style={styles.instructionText}>
          ☁️ Point device at sky → Pitch should be {'<'}8°
        </Text>
        <Text style={styles.instructionText}>
          🌍 Point device at ground → Pitch should be {'>'}90°
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c1445',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  pitchText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 5,
  },
  dataText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginVertical: 2,
  },
  instructionText: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginVertical: 3,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#0c1445',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  modeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: '#FFD700',
  },
  modeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructions: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
});
