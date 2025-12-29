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
  const [initialized, setInitialized] = useState(false);

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

  // Initialize auth state - ONCE only
  useEffect(() => {
    // Prevent double initialization (React StrictMode)
    if (initialized) return;
    setInitialized(true);

    let isMounted = true;
    
    console.log('[Auth] Starting initialization...');
    
    // STEP 1: Check localStorage immediately (synchronous, no network)
    const storageKey = 'boekhouder-auth';
    let hasStoredSession = false;
    
    try {
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        if (parsed?.user?.id && parsed?.user?.email) {
          console.log('[Auth] Found stored session for:', parsed.user.email);
          setUser({
            id: parsed.user.id,
            email: parsed.user.email
          });
          hasStoredSession = true;
          // Fetch profile in background
          fetchUserData(parsed.user.id).catch(console.error);
        }
      }
    } catch (e) {
      console.warn('[Auth] Could not read localStorage:', e);
    }
    
    // STEP 2: Stop loading immediately - don't wait for network
    console.log('[Auth] Initialization complete (sync)');
    setLoading(false);
    
    // STEP 3: Verify session in background (won't block UI)
    const verifySession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('[Auth] Session verification error:', error);
          // Session invalid - clear it
          setUser(null);
          setProfile(null);
          localStorage.removeItem(storageKey);
          return;
        }
        
        if (session?.user) {
          console.log('[Auth] Session verified:', session.user.email);
          // Update user if different
          setUser({
            id: session.user.id,
            email: session.user.email!
          });
          if (!hasStoredSession) {
            fetchUserData(session.user.id).catch(console.error);
          }
        } else if (hasStoredSession) {
          // Had stored session but it's no longer valid
          console.log('[Auth] Stored session expired');
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('[Auth] Verification error:', error);
      }
    };
    
    // Run verification in background after a small delay
    const verifyTimeout = setTimeout(verifySession, 100);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State change:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!
          });
          fetchUserData(session.user.id).catch(console.error);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setSettings(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          // Token refreshed - keep user logged in
          console.log('[Auth] Token refreshed');
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(verifyTimeout);
      subscription.unsubscribe();
    };
  }, [initialized]);

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
