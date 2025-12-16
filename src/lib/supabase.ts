import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Supabase configuration - loaded from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rncjcsguvqykmpkcwmlj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuY2pjc2d1dnF5a21wa2N3bWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzIzMjEsImV4cCI6MjA4MTQwODMyMX0.JekHbUb1hV7PrT1O-iLtL6cDdrlovRls-JN50BThUKs';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not set, using fallback values.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper to get session
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};
