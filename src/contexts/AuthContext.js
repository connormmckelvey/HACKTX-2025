import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, TABLES } from '../config/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        
        // If profile doesn't exist, try to create it from user metadata
        if (error.code === 'PGRST116') { // No rows returned
          console.log('Profile not found, attempting to create from user metadata');
          await createProfileFromUserMetadata(userId);
        } else {
          setProfile(null);
        }
      } else {
        console.log('Profile loaded successfully:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const createProfileFromUserMetadata = async (userId) => {
    try {
      // Get the current session to access user metadata
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session data:', sessionError);
        return;
      }

      if (!session?.user) {
        console.log('No session available, skipping profile creation');
        return;
      }

      const user = session.user;
      
      // Check if profile already exists before creating
      const { data: existingProfile } = await supabase
        .from(TABLES.PROFILES)
        .select('id')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        console.log('Profile already exists, skipping creation');
        return;
      }

      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .insert({
          id: userId,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          email: user.email || '',
          cultures: user.user_metadata?.cultures ? user.user_metadata.cultures.split(',') : [],
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile from metadata:', error);
        setProfile(null);
      } else {
        console.log('Profile created from metadata:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Error creating profile from metadata:', error);
      setProfile(null);
    }
  };


  const signUp = async (email, password, userData) => {
    try {
      setLoading(true);
      
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            cultures: userData.cultures ? userData.cultures.join(',') : '', // Convert array to comma-separated string
          },
        },
      });

      if (error) throw error;

      // If signup was successful and we have a user, automatically sign them in
      if (data.user && !data.user.email_confirmed_at) {
        console.log('Account created, attempting automatic login...');
        
        // Wait a moment for the user to be fully created
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Attempt to sign in with the same credentials
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.log('Automatic login failed, user will need to sign in manually:', signInError.message);
          // Return a more user-friendly error message
          return { 
            data, 
            error: {
              message: 'Account created! Please check your email and click the confirmation link, then sign in manually.',
              code: 'EMAIL_NOT_CONFIRMED'
            }
          };
        } else {
          console.log('Automatic login successful!');
          return { data: signInData, error: null };
        }
      }

      // Let the auth state change handler create the profile
      // This avoids session timing issues
      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
