'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useRealAuth } from './realAuth';
import { useMockAuth } from '../../app/components/MockAuthProvider';

export interface HybridUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  subscription: 'free' | 'premium' | 'enterprise';
  created_at: string;
  updated_at: string;
  last_sign_in?: string;
  metadata?: {
    provider?: string;
    isRealAuth?: boolean;
    [key: string]: any;
  };
}

interface HybridAuthContextType {
  user: HybridUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<HybridUser>) => Promise<{ success: boolean; error?: string }>;
  isRealAuth: boolean;
  isSupabaseAvailable: boolean;
}

const HybridAuthContext = createContext<HybridAuthContextType | undefined>(undefined);

export function useHybridAuth() {
  const context = useContext(HybridAuthContext);
  if (context === undefined) {
    throw new Error('useHybridAuth must be used within a HybridAuthProvider');
  }
  return context;
}

interface HybridAuthProviderProps {
  children: ReactNode;
}

export function HybridAuthProvider({ children }: HybridAuthProviderProps) {
  const realAuth = useRealAuth();
  const mockAuth = useMockAuth();

  // Determine which auth system to use
  const isRealAuth = realAuth.isSupabaseAvailable && realAuth.user !== null;
  const isMockAuth = !realAuth.isSupabaseAvailable || realAuth.user === null;

  // Convert real auth user to hybrid format
  const convertRealUser = (realUser: any): HybridUser => ({
    id: realUser.id,
    email: realUser.email,
    name: realUser.name || realUser.email.split('@')[0],
    avatar_url: realUser.avatar_url,
    subscription: realUser.subscription || 'free',
    created_at: realUser.created_at,
    updated_at: realUser.updated_at,
    last_sign_in: realUser.last_sign_in,
    metadata: {
      ...realUser.metadata,
      isRealAuth: true,
    },
  });

  // Convert mock auth user to hybrid format
  const convertMockUser = (mockUser: any): HybridUser => ({
    id: mockUser.id,
    email: mockUser.email,
    name: mockUser.name,
    subscription: 'free',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {
      isRealAuth: false,
    },
  });

  // Get current user
  const user = isRealAuth 
    ? convertRealUser(realAuth.user)
    : mockAuth.user 
      ? convertMockUser(mockAuth.user)
      : null;

  // Get loading state
  const loading = realAuth.loading || mockAuth.isLoading;

  // Sign in function
  const signIn = async (email: string, password: string) => {
    if (realAuth.isSupabaseAvailable) {
      return await realAuth.signIn(email, password);
    } else {
      // Fallback to mock auth
      const result = mockAuth.login(email, password);
      return { success: result, error: result ? undefined : 'Invalid credentials' };
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, name?: string) => {
    if (realAuth.isSupabaseAvailable) {
      return await realAuth.signUp(email, password, name);
    } else {
      // Fallback to mock auth
      const result = mockAuth.register(email, password, name);
      return { success: result, error: result ? undefined : 'Registration failed' };
    }
  };

  // Sign out function
  const signOut = async () => {
    if (isRealAuth) {
      await realAuth.signOut();
    } else {
      mockAuth.logout();
    }
  };

  // Google sign in
  const signInWithGoogle = async () => {
    if (realAuth.isSupabaseAvailable) {
      return await realAuth.signInWithGoogle();
    } else {
      return { success: false, error: 'Google authentication not available in demo mode' };
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    if (realAuth.isSupabaseAvailable) {
      return await realAuth.resetPassword(email);
    } else {
      return { success: false, error: 'Password reset not available in demo mode' };
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<HybridUser>) => {
    if (isRealAuth) {
      return await realAuth.updateProfile(updates);
    } else {
      // Mock profile update
      if (mockAuth.user) {
        mockAuth.updateUser({ ...mockAuth.user, ...updates });
        return { success: true };
      }
      return { success: false, error: 'No user logged in' };
    }
  };

  const value: HybridAuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updateProfile,
    isRealAuth,
    isSupabaseAvailable: realAuth.isSupabaseAvailable,
  };

  return (
    <HybridAuthContext.Provider value={value}>
      {children}
    </HybridAuthContext.Provider>
  );
}
