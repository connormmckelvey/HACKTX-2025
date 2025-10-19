import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Linking,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { PhotoService } from '../services/PhotoService';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import theme from '../styles/theme';

const { height: screenHeight } = Dimensions.get('window');

export const ProfileTab = () => {
  const { user, profile, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({
    photos: 0,
    constellations: 0,
    storiesRead: 0,
  });
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    notifications: true,
    locationServices: true,
    cameraEnabled: true,
  });

  useEffect(() => {
    loadUserStats();
  }, [user]);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      
      // Load photo count
      const { data: photos } = await PhotoService.getUserPhotos();
      const photoCount = photos ? photos.length : 0;
      
      // Count unique constellations from photos
      const constellationCount = photos ? 
        new Set(photos.flatMap(photo => photo.constellation || []).filter(Boolean)).size : 0;
      
      // For now, we'll estimate stories read based on photos taken
      // In a real app, you'd track this separately
      const storiesRead = Math.floor(photoCount * 1.5); // Estimate
      
      setStats({
        photos: photoCount,
        constellations: constellationCount,
        storiesRead: storiesRead,
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleNotificationsPress = async () => {
    try {
      // Check if Notifications is available
      if (!Notifications) {
        Alert.alert('Notifications', 'Notification service is not available on this device.');
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus === 'granted') {
          Alert.alert('Success', 'Notification permissions granted!');
          setSettings(prev => ({ ...prev, notifications: true }));
        } else {
          Alert.alert('Permission Denied', 'Notification permissions are required for app features.');
        }
      } else {
        Alert.alert('Notifications', 'Notification permissions are already granted.');
      }
    } catch (error) {
      console.error('Error handling notifications:', error);
      Alert.alert('Error', 'Failed to check notification permissions.');
    }
  };

  const handleLocationPress = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus === 'granted') {
          Alert.alert('Success', 'Location permissions granted!');
          setSettings(prev => ({ ...prev, locationServices: true }));
        } else {
          Alert.alert('Permission Denied', 'Location permissions are required for constellation tracking.');
        }
      } else {
        Alert.alert('Location Services', 'Location permissions are already granted.');
      }
    } catch (error) {
      console.error('Error handling location:', error);
      Alert.alert('Error', 'Failed to check location permissions.');
    }
  };

  const handleCameraSettingsPress = () => {
    Alert.alert(
      'Camera Settings',
      'Camera settings are managed through your device settings. Would you like to open device settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  };

  const handlePrivacyPolicyPress = () => {
    Alert.alert(
      'Privacy Policy',
      'Our privacy policy explains how we collect, use, and protect your data. For the full policy, please visit our website.',
      [
        { text: 'OK', style: 'default' },
        { text: 'Visit Website', onPress: () => Linking.openURL('https://skylore.com/privacy') },
      ]
    );
  };

  const handleTermsPress = () => {
    Alert.alert(
      'Terms of Service',
      'Our terms of service outline the rules and guidelines for using Skylore. For the full terms, please visit our website.',
      [
        { text: 'OK', style: 'default' },
        { text: 'Visit Website', onPress: () => Linking.openURL('https://skylore.com/terms') },
      ]
    );
  };

  const renderProfileInfo = () => (
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        <LinearGradient
          colors={theme.gradients.card}
          style={styles.avatar}
        >
          <Ionicons name="person" size={60} color={theme.colors.primary} />
        </LinearGradient>
        <Text style={styles.userName}>
          {profile?.username || user?.email?.split('@')[0] || 'Stargazer'}
        </Text>
        <Text style={styles.userEmail}>
          {user?.email}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.photos}</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.constellations}</Text>
          <Text style={styles.statLabel}>Constellations</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.storiesRead}</Text>
          <Text style={styles.statLabel}>Stories Read</Text>
        </View>
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>Settings</Text>

      <View style={styles.settingsGroup}>
        <Text style={styles.groupTitle}>App Preferences</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleNotificationsPress}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Notifications</Text>
            <Text style={styles.settingDescription}>Manage notification preferences</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleLocationPress}>
          <Ionicons name="location-outline" size={24} color={theme.colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Location Services</Text>
            <Text style={styles.settingDescription}>Manage location permissions</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleCameraSettingsPress}>
          <Ionicons name="camera-outline" size={24} color={theme.colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Camera Settings</Text>
            <Text style={styles.settingDescription}>Configure camera preferences</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.settingsGroup}>
        <Text style={styles.groupTitle}>About</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>App Version</Text>
            <Text style={styles.settingDescription}>Skylore v1.0.0</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicyPress}>
          <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Privacy Policy</Text>
            <Text style={styles.settingDescription}>View our privacy policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleTermsPress}>
          <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Terms of Service</Text>
            <Text style={styles.settingDescription}>View terms and conditions</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAccountActions = () => (
    <View style={styles.actionsSection}>
      <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
        <LinearGradient
          colors={['rgba(255, 107, 107, 0.1)', 'rgba(255, 107, 107, 0.05)']}
          style={styles.actionButtonGradient}
        >
          <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
          <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>Sign Out</Text>
        </LinearGradient>
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
    backgroundColor: theme.colors.black,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  userName: {
    fontSize: theme.typography.h3,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily,
  },
  userEmail: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    opacity: 0.8,
    fontFamily: theme.typography.fontFamily,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.medium,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.typography.h3,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily,
  },
  statLabel: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    opacity: 0.8,
    fontFamily: theme.typography.fontFamily,
  },
  settingsSection: {
    padding: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.h4,
    fontWeight: theme.typography.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xl,
    fontFamily: theme.typography.fontFamily,
  },
  settingsGroup: {
    marginBottom: theme.spacing.xxxl,
  },
  groupTitle: {
    fontSize: theme.typography.caption,
    fontWeight: theme.typography.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    marginLeft: theme.spacing.sm,
    fontFamily: theme.typography.fontFamily,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.small,
  },
  settingContent: {
    flex: 1,
    marginLeft: theme.spacing.lg,
  },
  settingTitle: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily,
  },
  settingDescription: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    opacity: 0.7,
    fontFamily: theme.typography.fontFamily,
  },
  actionsSection: {
    padding: theme.spacing.xl,
  },
  actionButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  actionButtonText: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.semibold,
    marginLeft: theme.spacing.md,
    fontFamily: theme.typography.fontFamily,
  },
});
