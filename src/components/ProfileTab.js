import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const { height: screenHeight } = Dimensions.get('window');

export const ProfileTab = () => {
  const { user, profile, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const renderProfileInfo = () => (
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={60} color="#FFD700" />
        </View>
        <Text style={styles.userName}>
          {profile?.username || user?.email?.split('@')[0] || 'User'}
        </Text>
        <Text style={styles.userEmail}>
          {user?.email}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Constellations</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Stories Read</Text>
        </View>
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>Settings</Text>

      <TouchableOpacity style={styles.settingItem}>
        <Ionicons name="notifications-outline" size={24} color="#FFD700" />
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>Notifications</Text>
          <Text style={styles.settingDescription}>Manage notification preferences</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <Ionicons name="location-outline" size={24} color="#FFD700" />
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>Location Services</Text>
          <Text style={styles.settingDescription}>Manage location permissions</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <Ionicons name="camera-outline" size={24} color="#FFD700" />
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>Camera Settings</Text>
          <Text style={styles.settingDescription}>Configure camera preferences</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <Ionicons name="information-circle-outline" size={24} color="#FFD700" />
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>About</Text>
          <Text style={styles.settingDescription}>App version and information</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const renderAccountActions = () => (
    <View style={styles.actionsSection}>
      <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
        <Text style={[styles.actionButtonText, { color: '#FF6B6B' }]}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderProfileInfo()}
        {renderSettings()}
        {renderAccountActions()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  settingsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  settingContent: {
    flex: 1,
    marginLeft: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  actionsSection: {
    padding: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});
