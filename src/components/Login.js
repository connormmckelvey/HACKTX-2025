import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const Login = () => {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Animation refs for starfield
  const starAnimations = useRef([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Initialize star animations
  useEffect(() => {
    const numStars = 40;
    starAnimations.current = [];

    for (let i = 0; i < numStars; i++) {
      const anim = new Animated.Value(0);
      starAnimations.current.push(anim);

      // Create twinkling animation for each star
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: Math.random() * 2000 + 1000,
            useNativeDriver: true,
            delay: Math.random() * 3000,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: Math.random() * 2000 + 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    return () => {
      starAnimations.current.forEach(anim => anim.stopAnimation());
    };
  }, []);

  const handleAuth = async () => {
    setError('');

    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (isSignUp) {
      if (!firstName || !lastName) {
        setError('Please fill in all required fields');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, {
          firstName,
          lastName,
          cultures: [], // Default empty cultures for login screen
        });

        if (error) {
          console.log('🚀 Login signup error:', error);
          // Handle specific error cases with better messaging
          if (error.code === 'EMAIL_NOT_CONFIRMED') {
            console.log('🚀 Setting email confirmation message');
            setError('✅ Account created! Please check your email and click the confirmation link, then sign in below.');
            // Switch to sign in mode after showing the message
            setTimeout(() => {
              console.log('🚀 Auto-switching to sign in mode');
              setIsSignUp(false);
              setError('');
            }, 3000);
          } else {
            setError(error.message);
          }
        } else {
          console.log('🚀 Login signup success');
          setError('✅ Account created successfully!');
          setTimeout(() => {
            setIsSignUp(false);
            setError('');
          }, 2000);
        }
      } else {
        const { error } = await signIn(email, password);

        if (error) {
          setError(error.message);
        }
        // Success - user will be redirected automatically by auth state change
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Generate random positions for stars
  const generateStars = () => {
    const stars = [];
    for (let i = 0; i < 40; i++) {
      stars.push({
        id: i,
        x: Math.random() * screenWidth,
        y: Math.random() * screenHeight,
        delay: Math.random() * 3,
      });
    }
    return stars;
  };

  const stars = generateStars();

  return (
    <View style={styles.container}>
      {/* Animated starfield background */}
      <View style={styles.starsContainer}>
        {stars.map((star) => (
          <Animated.View
            key={star.id}
            style={[
              styles.star,
              {
                left: star.x,
                top: star.y,
                opacity: starAnimations.current[star.id] || 0,
              },
            ]}
          />
        ))}
      </View>

      {/* Main content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <View style={styles.constellationContainer}>
              {/* Central spiral */}
              <View style={styles.constellationSpiral}>
                <View style={[styles.constellationLine, { transform: [{ rotate: '0deg' }] }]} />
                <View style={[styles.constellationLine, { transform: [{ rotate: '90deg' }] }]} />
                <View style={[styles.constellationLine, { transform: [{ rotate: '180deg' }] }]} />
                <View style={[styles.constellationLine, { transform: [{ rotate: '270deg' }] }]} />
              </View>

              {/* Constellation stars */}
              <View style={[styles.constellationStar, { top: 8, left: 12 }]} />
              <View style={[styles.constellationStar, { top: 10, right: 12 }]} />
              <View style={[styles.constellationStar, { bottom: 12, left: 8 }]} />
              <View style={[styles.constellationStar, { bottom: 10, right: 8 }]} />
              <View style={[styles.constellationStar, { bottom: 4, left: 16 }]} />
              <View style={[styles.constellationStar, { bottom: 6, right: 16 }]} />
            </View>
          </View>
          <Text style={styles.logoText}>SKYLORE</Text>
        </View>

        {/* Auth Form */}
        <View style={styles.formContainer}>
          {/* Auth Toggle */}
          <View style={styles.authToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, !isSignUp && styles.toggleButtonActive]}
              onPress={() => {
                setIsSignUp(false);
                setError('');
              }}
            >
              <Text style={[styles.toggleText, !isSignUp && styles.toggleTextActive]}>Log In</Text>
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
            <View style={[
              styles.errorContainer, 
              error.includes('successfully') && styles.successContainer,
              error.includes('check your email') && styles.infoContainer
            ]}>
              <Text style={[
                styles.errorText, 
                error.includes('successfully') && styles.successText,
                error.includes('check your email') && styles.infoText
              ]}>
                {error}
              </Text>
              {error.includes('check your email') && (
                <>
                  <Text style={styles.infoSubtext}>
                    After confirming your email, you can sign in below.
                  </Text>
                  <TouchableOpacity 
                    style={styles.switchToLoginButton}
                    onPress={() => {
                      setIsSignUp(false);
                      setError('');
                    }}
                  >
                    <Text style={styles.switchToLoginText}>Switch to Sign In</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : null}

          {isSignUp && (
            <>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor="#b5a792"
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor="#b5a792"
                value={lastName}
                onChangeText={setLastName}
              />
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#b5a792"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#b5a792"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {isSignUp && (
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#b5a792"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          )}

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
            </Text>
          </TouchableOpacity>

          {!isSignUp && (
            <View style={styles.secondaryLinks}>
              <TouchableOpacity style={styles.linkButton}>
                <Text style={styles.secondaryLink}>Forgot Password</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1512',
    position: 'relative',
  },
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
  },
  star: {
    position: 'absolute',
    width: 1,
    height: 1,
    backgroundColor: '#f5e6d3',
    borderRadius: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logoIcon: {
    width: 64,
    height: 64,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  constellationContainer: {
    width: 64,
    height: 64,
    position: 'relative',
  },
  constellationSpiral: {
    width: 64,
    height: 64,
    position: 'relative',
  },
  constellationLine: {
    position: 'absolute',
    width: 32,
    height: 2,
    backgroundColor: '#f5e6d3',
    top: 31,
    left: 16,
    borderRadius: 1,
  },
  constellationStar: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#f5e6d3',
    borderRadius: 1,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 2,
    color: '#f5e6d3',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  formContainer: {
    width: '100%',
    maxWidth: 320,
  },
  authToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(139, 115, 85, 0.1)',
    borderRadius: 8,
    marginBottom: 24,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#4a5c47',
  },
  toggleText: {
    color: '#b5a792',
    fontSize: 14,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#f5e6d3',
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
  successContainer: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderColor: '#44ff44',
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: '#FFD700',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
  },
  successText: {
    color: '#44ff44',
  },
  infoText: {
    color: '#FFD700',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  infoSubtext: {
    color: '#FFD700',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
  },
  switchToLoginButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
    alignSelf: 'center',
  },
  switchToLoginText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#2a221b',
    borderWidth: 1,
    borderColor: 'rgba(139, 115, 85, 0.2)',
    borderRadius: 8,
    color: '#f5e6d3',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  loginButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#4a5c47',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  loginButtonText: {
    color: '#f5e6d3',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  disabled: {
    opacity: 0.6,
  },
  secondaryLinks: {
    alignItems: 'center',
  },
  linkButton: {
    paddingVertical: 8,
  },
  secondaryLink: {
    color: '#b5a792',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});
