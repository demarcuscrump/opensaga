import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import type { Database } from './database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGithub: () => Promise<void>;
  signInWithDiscord: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Mock profile for offline/demo mode
const MOCK_PROFILE: Profile = {
  id: 'demo-user',
  username: 'wanderer',
  display_name: 'Wanderer',
  avatar_url: null,
  banner_url: null,
  bio: 'Exploring the multiverse.',
  role: 'CITIZEN',
  reputation: 0,
  created_at: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch or create profile for authenticated user
  const fetchOrCreateProfile = async (userId: string, email?: string) => {
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existing) {
      setProfile(existing);
      return;
    }

    // First login — create profile
    const username = email?.split('@')[0] || `user_${userId.slice(0, 8)}`;
    const newProfile: Database['public']['Tables']['profiles']['Insert'] = {
      id: userId,
      username,
      display_name: username,
      bio: '',
      role: 'CITIZEN',
      reputation: 0,
    };

    const { data: created } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();

    if (created) {
      setProfile(created);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Offline mode — no auth, use mock profile
      setProfile(MOCK_PROFILE);
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchOrCreateProfile(s.user.id, s.user.email);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await fetchOrCreateProfile(s.user.id, s.user.email);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGithub = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'github' });
  };

  const signInWithDiscord = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'discord' });
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: Boolean(user) || !isSupabaseConfigured,
    signInWithGithub,
    signInWithDiscord,
    signInWithGoogle,
    signOut,
  }), [user, profile, session, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
