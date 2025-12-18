import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { authService, AuthUser } from '../services/authService';
import type { Profile, UserSettings } from '../types/database.types';

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  settings: UserSettings | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile and settings - simplified without complex timeouts
  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profileData) {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    }

    try {
      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        // PGRST116 = no rows found - that's OK for settings
        console.error('Error fetching settings:', settingsError);
      } else if (settingsData) {
        setSettings(settingsData);
      }
    } catch (error) {
      console.error('Settings fetch error:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const initAuth = async () => {
      console.log('[Auth] Starting initialization...');
      
      try {
        // Check for old session key and remove it
        const oldKey = 'sb-rncjcsguvqykmpkcwmlj-auth-token';
        if (localStorage.getItem(oldKey)) {
          console.log('[Auth] Removing old session key');
          localStorage.removeItem(oldKey);
        }

        console.log('[Auth] Calling getSession...');
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('[Auth] getSession returned:', { hasSession: !!session, error });
        
        if (error) {
          console.error('[Auth] Session error:', error);
          await supabase.auth.signOut();
          if (isMounted) setLoading(false);
          return;
        }
        
        if (session?.user && isMounted) {
          console.log('[Auth] User found:', session.user.email);
          setUser({
            id: session.user.id,
            email: session.user.email!
          });
          await fetchUserData(session.user.id);
        } else {
          console.log('[Auth] No session found');
        }
      } catch (error) {
        console.error('[Auth] Init error:', error);
        try {
          await supabase.auth.signOut();
        } catch {}
      } finally {
        if (isMounted) {
          console.log('[Auth] Setting loading to false');
          setLoading(false);
        }
      }
    };

    // Fallback timeout - if auth takes more than 5 seconds, force stop loading
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('[Auth] Timeout - forcing loading to stop');
        setLoading(false);
      }
    }, 5000);

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!
          });
          await fetchUserData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setSettings(null);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const authUser = await authService.signIn(email, password);
    setUser(authUser);
    if (authUser.profile) setProfile(authUser.profile);
    await fetchUserData(authUser.id);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const authUser = await authService.signUp(email, password, name);
    setUser(authUser);
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
    setSettings(null);
  };

  const signInWithGoogle = async () => {
    await authService.signInWithOAuth('google');
  };

  const refreshProfile = async () => {
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) setProfile(data);
    }
  };

  const refreshSettings = async () => {
    if (user) {
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (data) setSettings(data);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        settings,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        refreshProfile,
        refreshSettings
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
