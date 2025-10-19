import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project URL and anon key
// You can find these in your Supabase project settings > API
// Example:
// const supabaseUrl = 'https://your-project-id.supabase.co';
// const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const supabaseUrl = 'https://ldwfbxlhovfjzklkylfg.supabase.co'; // Replace with your actual URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxkd2ZieGxob3ZmanprbGt5bGZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MTA2NDAsImV4cCI6MjA3NjM4NjY0MH0.vPj2qJYpz8IplrPWLbrXcZljIcsAk6e1eUBjcwQgLgI'; // Replace with your actual anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic session refresh
    autoRefreshToken: true,
    // Persist session in AsyncStorage
    persistSession: true,
    // Detect session from URL (needed for email confirmation links)
    detectSessionInUrl: true,
  },
});

// Database table names
export const TABLES = {
  PROFILES: 'profiles',
  PHOTOS: 'photos',
};

// Storage bucket names
export const STORAGE_BUCKETS = {
  USER_PHOTOS: 'user_photos',
};
