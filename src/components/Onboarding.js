import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AVAILABLE_CULTURES = [
  'Tonkawa',
  'Comanche',
  'Lipan-Apache',
  'Coahuiltecan',
  'Other'
];

export const Onboarding = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCultures, setSelectedCultures] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggleCulture = (culture) => {
    setSelectedCultures(prev => {
      if (prev.includes(culture)) return prev.filter(c => c !== culture);
      return [...prev, culture];
    });
  };

  const saveProfile = async () => {
    if (!name || !email) return;
    setSaving(true);
    const profile = { name, email, cultures: selectedCultures };
    try {
      await AsyncStorage.setItem('@ancestral_skies_profile', JSON.stringify(profile));
      onComplete && onComplete(profile);
    } catch (e) {
      console.error('Failed to save profile', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Tell us a bit about you so we can personalize the sky.</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />

      <Text style={styles.label}>Cultures of interest</Text>
      <View style={styles.cultureList}>
        {AVAILABLE_CULTURES.map(culture => (
          <TouchableOpacity
            key={culture}
            style={[styles.cultureItem, selectedCultures.includes(culture) && styles.cultureSelected]}
            onPress={() => toggleCulture(culture)}
          >
            <Text style={[styles.cultureText, selectedCultures.includes(culture) && styles.cultureTextSelected]}>{culture}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={saveProfile} disabled={saving || !name || !email}>
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save & Continue'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0c1445',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    color: '#FFD700',
    fontSize: 14,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#ffffff10',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  cultureList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  cultureItem: {
    backgroundColor: '#ffffff10',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  cultureSelected: {
    backgroundColor: '#FFD700',
  },
  cultureText: {
    color: '#fff',
  },
  cultureTextSelected: {
    color: '#0c1445',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#FFD700',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#0c1445',
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.6,
  }
});
