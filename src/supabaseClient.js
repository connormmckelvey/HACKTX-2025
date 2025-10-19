import 'react-native-url-polyfill/auto'; // Polyfill for Supabase
import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase project settings
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
