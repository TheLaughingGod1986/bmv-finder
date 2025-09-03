'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { userManager, UserProfile, UserRole, UserPreferences } from '../lib/auth/userManager';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  hasPermission: (permissionId: string) => boolean;
  hasResourcePermission: (resource: string, action: string) => boolean;
  refreshUser: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          userManager.setCurrentUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const initializeAuth = async () => {
    try {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setError('Failed to initialize authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      let profile = await userManager.getUserProfile(userId);
      
      if (!profile) {
        // Create profile for new user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          profile = await userManager.createUserProfile({
            id: userId,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            tier: 'free',
            role: userManager['SYSTEM_ROLES'].find(r => r.id === 'free')!
          });
        }
      }

      if (profile) {
        setUser(profile);
        userManager.setCurrentUser(profile);
        await userManager.updateLastLogin(userId);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError('Failed to load user profile');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);

      if (!supabase) {
        throw new Error('Authentication not configured');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      setIsLoading(true);

      if (!supabase) {
        throw new Error('Authentication not configured');
      }

      const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || 
        (typeof window !== 'undefined' && window.location.origin) ||
        'https://bmv-finder-atlqannv2-bens-projects-11c93b15.vercel.app';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectUrl}/auth/callback`
        }
      });

      if (error) throw error;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      
      if (!supabase) {
        setUser(null);
        userManager.setCurrentUser(null);
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      userManager.setCurrentUser(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setError(errorMessage);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');

    try {
      setError(null);
      const updatedProfile = await userManager.updateUserProfile(user.id, updates);
      setUser(updatedProfile);
      userManager.setCurrentUser(updatedProfile);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setError(errorMessage);
      throw error;
    }
  };

  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!user) throw new Error('No user logged in');

    try {
      setError(null);
      await userManager.updateUserPreferences(user.id, preferences);
      await refreshUser();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Preferences update failed';
      setError(errorMessage);
      throw error;
    }
  };

  const hasPermission = (permissionId: string): boolean => {
    if (!user) return false;
    return user.role.permissions.some(p => p.id === permissionId);
  };

  const hasResourcePermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    return user.role.permissions.some(p => p.resource === resource && p.action === action);
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      const refreshedProfile = await userManager.getUserProfile(user.id);
      if (refreshedProfile) {
        setUser(refreshedProfile);
        userManager.setCurrentUser(refreshedProfile);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    loginWithGoogle,
    logout,
    updateProfile,
    updatePreferences,
    hasPermission,
    hasResourcePermission,
    refreshUser,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions?: string[]
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, hasPermission, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please log in to access this page.</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }

    if (requiredPermissions && !requiredPermissions.every(permission => hasPermission(permission))) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">You don't have permission to access this page.</p>
            <button
              onClick={() => window.history.back()}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Hook for checking permissions
export function usePermissions() {
  const { hasPermission, hasResourcePermission, user } = useAuth();

  return {
    hasPermission,
    hasResourcePermission,
    canAccess: (resource: string, action: string) => hasResourcePermission(resource, action),
    isAdmin: () => hasPermission('system:admin'),
    isElite: () => user?.tier === 'elite',
    isMidTier: () => user?.tier === 'mid',
    isFree: () => user?.tier === 'free',
    userRole: user?.role,
    userTier: user?.tier
  };
}
