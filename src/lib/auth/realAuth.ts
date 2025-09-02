'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../supabaseClient';

export interface RealUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  subscription?: 'free' | 'premium' | 'enterprise';
  created_at: string;
  updated_at: string;
  last_sign_in?: string;
  metadata?: {
    provider?: string;
    [key: string]: any;
  };
}

interface AuthContextType {
  user: RealUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<RealUser>) => Promise<{ success: boolean; error?: string }>;
  isSupabaseAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useRealAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useRealAuth must be used within a RealAuthProvider');
  }
  return context;
}

interface RealAuthProviderProps {
  children: ReactNode;
}

export function RealAuthProvider({ children }: RealAuthProviderProps) {
  const [user, setUser] = useState<RealUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSupabaseAvailable, setIsSupabaseAvailable] = useState(false);

  useEffect(() => {
    // Check if Supabase is available
    const available = supabase !== null;
    setIsSupabaseAvailable(available);

    if (!available) {
      console.log('🔧 Supabase not configured, using fallback authentication');
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          await loadUserProfile(session.user);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (authUser: any) => {
    try {
      // Get user profile from Supabase
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading profile:', error);
      }

      const userData: RealUser = {
        id: authUser.id,
        email: authUser.email,
        name: profile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0],
        avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url,
        subscription: profile?.subscription || 'free',
        created_at: authUser.created_at,
        updated_at: authUser.updated_at || new Date().toISOString(),
        last_sign_in: new Date().toISOString(),
        metadata: {
          provider: authUser.app_metadata?.provider,
          ...authUser.user_metadata,
        },
      };

      setUser(userData);

      // Update last sign in
      await supabase
        .from('profiles')
        .upsert({
          id: authUser.id,
          email: authUser.email,
          name: userData.name,
          avatar_url: userData.avatar_url,
          subscription: userData.subscription,
          last_sign_in: userData.last_sign_in,
          updated_at: new Date().toISOString(),
        });

    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseAvailable) {
      return { success: false, error: 'Authentication service not available' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    if (!isSupabaseAvailable) {
      return { success: false, error: 'Authentication service not available' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Create profile
      if (data.user) {
        await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: name || email.split('@')[0],
            subscription: 'free',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    if (!isSupabaseAvailable) {
      setUser(null);
      return;
    }

    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseAvailable) {
      return { success: false, error: 'Authentication service not available' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseAvailable) {
      return { success: false, error: 'Authentication service not available' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const updateProfile = async (updates: Partial<RealUser>) => {
    if (!isSupabaseAvailable || !user) {
      return { success: false, error: 'Authentication service not available' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Update local user state
      setUser(prev => prev ? { ...prev, ...updates } : null);

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updateProfile,
    isSupabaseAvailable,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
