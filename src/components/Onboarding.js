import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const AVAILABLE_CULTURES = [
  'Tonkawa',
  'Comanche',
  'Lipan-Apache',
  'Coahuiltecan',
  'Other'
];

export const Onboarding = ({ onComplete }) => {
  const { signUp, signIn } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedCultures, setSelectedCultures] = useState([]);
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleCulture = (culture) => {
    setSelectedCultures(prev => {
      if (prev.includes(culture)) return prev.filter(c => c !== culture);
      return [...prev, culture];
    });
  };

  const handleAuth = async () => {
    // Clear any previous errors
    setError('');
    
    if (!firstName || !lastName || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await signUp(email, password, {
          firstName,
          lastName,
          cultures: selectedCultures,
        });

        if (error) {
          setError(`Sign Up Error: ${error.message}`);
        } else {
          // Success - user will be logged in automatically
          setError('');
          // Show success message briefly
          setTimeout(() => {
            setError('Account created and logging you in...');
          }, 100);
        }
      } else {
        const { data, error } = await signIn(email, password);

        if (error) {
          setError(`Sign In Error: ${error.message}`);
        } else {
          // Success - user will be redirected automatically by auth state change
          setError('');
        }
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Tell us a bit about you so we can personalize the sky.</Text>

      {/* Auth Mode Toggle */}
      <View style={styles.authToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, !isSignUp && styles.toggleButtonActive]}
          onPress={() => {
            setIsSignUp(false);
            setError('');
          }}
        >
          <Text style={[styles.toggleText, !isSignUp && styles.toggleTextActive]}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, isSignUp && styles.toggleButtonActive]}
          onPress={() => {
            setIsSignUp(true);
            setError('');
          }}
        >
          <Text style={[styles.toggleText, isSignUp && styles.toggleTextActive]}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* Error/Success Display */}
      {error ? (
        <View style={[styles.errorContainer, error.includes('successfully') && styles.successContainer]}>
          <Text style={[styles.errorText, error.includes('successfully') && styles.successText]}>{error}</Text>
        </View>
      ) : null}

      <Text style={styles.label}>First Name</Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Your first name" />

      <Text style={styles.label}>Last Name</Text>
      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Your last name" />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />

      <Text style={styles.label}>Password</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password (min 6 characters)" secureTextEntry />

      {isSignUp && (
        <>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm password" secureTextEntry />
        </>
      )}

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

      <TouchableOpacity style={[styles.saveButton, loading && styles.disabled]} onPress={handleAuth} disabled={loading}>
        <Text style={styles.saveButtonText}>{loading ? 'Processing...' : (isSignUp ? 'Sign Up & Continue' : 'Sign In & Continue')}</Text>
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
  },
  authToggle: {
    flexDirection: 'row',
    backgroundColor: '#ffffff10',
    borderRadius: 8,
    marginBottom: 20,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFD700',
  },
  toggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#0c1445',
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderColor: '#ff4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderColor: '#44ff44',
  },
  successText: {
    color: '#44ff44',
  },
});
