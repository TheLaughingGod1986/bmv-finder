'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface GoogleOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
  responseType: string;
  accessType: string;
}

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
  given_name: string;
  family_name: string;
  locale: string;
}

interface GoogleOAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

class GoogleOAuthManager {
  private config: GoogleOAuthConfig;
  private supabase: any;
  private isInitialized: boolean = false;

  constructor() {
    this.config = {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/google/callback` : '',
      scope: 'openid email profile',
      responseType: 'code',
      accessType: 'offline',
    };

    this.initializeSupabase();
  }

  private initializeSupabase(): void {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      this.supabase = createClient(supabaseUrl, supabaseAnonKey);
      this.isInitialized = true;
    }
  }

  // Generate Google OAuth URL
  generateAuthUrl(state?: string): string {
    if (!this.config.redirectUri) {
      throw new Error('Redirect URI not configured');
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: this.config.responseType,
      scope: this.config.scope,
      access_type: this.config.accessType,
      ...(state && { state }),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Initiate Google OAuth flow
  async initiateAuth(state?: string): Promise<void> {
    if (!this.config.clientId) {
      throw new Error('Google OAuth client ID not configured');
    }

    if (typeof window === 'undefined') {
      throw new Error('OAuth flow can only be initiated in browser environment');
    }

    const authUrl = this.generateAuthUrl(state);
    window.location.href = authUrl;
  }

  // Handle OAuth callback
  async handleCallback(code: string, state?: string): Promise<{
    user: any;
    session: any;
    error: any;
  }> {
    if (!this.isInitialized) {
      throw new Error('Supabase not initialized');
    }

    try {
      // Exchange code for session using Supabase
      const { data, error } = await this.supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('OAuth callback error:', error);
        return { user: null, session: null, error };
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
      };
    } catch (error) {
      console.error('OAuth callback error:', error);
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  // Get user profile from Google
  async getUserProfile(accessToken: string): Promise<GoogleUser | null> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const userData = await response.json();
      return userData as GoogleUser;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Sign in with Google using Supabase
  async signInWithGoogle(): Promise<{
    user: any;
    session: any;
    error: any;
  }> {
    if (!this.isInitialized) {
      throw new Error('Supabase not initialized');
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/google/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      return {
        user: data.user,
        session: data.session,
        error,
      };
    } catch (error) {
      console.error('Google sign-in error:', error);
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  // Sign out
  async signOut(): Promise<{ error: any }> {
    if (!this.isInitialized) {
      throw new Error('Supabase not initialized');
    }

    try {
      const { error } = await this.supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  // Get current user
  async getCurrentUser(): Promise<any> {
    if (!this.isInitialized) {
      return null;
    }

    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get current session
  async getCurrentSession(): Promise<any> {
    if (!this.isInitialized) {
      return null;
    }

    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  // Listen for auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void): () => void {
    if (!this.isInitialized) {
      return () => {};
    }

    const { data: { subscription } } = this.supabase.auth.onAuthStateChange(callback);
    return () => subscription.unsubscribe();
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }

  // Get user metadata
  async getUserMetadata(): Promise<any> {
    const user = await this.getCurrentUser();
    return user?.user_metadata || null;
  }

  // Update user profile
  async updateUserProfile(updates: any): Promise<{ error: any }> {
    if (!this.isInitialized) {
      throw new Error('Supabase not initialized');
    }

    try {
      const { error } = await this.supabase.auth.updateUser(updates);
      return { error };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return {
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  // Refresh session
  async refreshSession(): Promise<{ session: any; error: any }> {
    if (!this.isInitialized) {
      throw new Error('Supabase not initialized');
    }

    try {
      const { data, error } = await this.supabase.auth.refreshSession();
      return {
        session: data.session,
        error,
      };
    } catch (error) {
      console.error('Error refreshing session:', error);
      return {
        session: null,
        error: error instanceof Error ? error : new Error('Unknown error'),
      };
    }
  }

  // Get configuration
  getConfig(): GoogleOAuthConfig {
    return { ...this.config };
  }

  // Check if OAuth is configured
  isConfigured(): boolean {
    return !!this.config.clientId && this.isInitialized;
  }
}

// Global Google OAuth manager instance
export const googleOAuthManager = new GoogleOAuthManager();

// React hook for Google OAuth
export function useGoogleOAuth() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!googleOAuthManager.isConfigured()) {
      setLoading(false);
      return;
    }

    // Get initial user and session
    const initializeAuth = async () => {
      try {
        const [currentUser, currentSession] = await Promise.all([
          googleOAuthManager.getCurrentUser(),
          googleOAuthManager.getCurrentSession(),
        ]);

        setUser(currentUser);
        setSession(currentSession);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const unsubscribe = googleOAuthManager.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await googleOAuthManager.signInWithGoogle();
      
      if (result.error) {
        setError(result.error);
      } else {
        setUser(result.user);
        setSession(result.session);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await googleOAuthManager.signOut();
      
      if (result.error) {
        setError(result.error);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: any) => {
    setLoading(true);
    setError(null);

    try {
      const result = await googleOAuthManager.updateUserProfile(updates);
      
      if (result.error) {
        setError(result.error);
      } else {
        // Refresh user data
        const updatedUser = await googleOAuthManager.getCurrentUser();
        setUser(updatedUser);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await googleOAuthManager.refreshSession();
      
      if (result.error) {
        setError(result.error);
      } else {
        setSession(result.session);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    loading,
    error,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshSession,
    isAuthenticated: !!user,
    isConfigured: googleOAuthManager.isConfigured(),
  };
}

// Utility functions
export const googleOAuthUtils = {
  // Generate state parameter for CSRF protection
  generateState: (): string => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  },

  // Validate state parameter
  validateState: (receivedState: string, expectedState: string): boolean => {
    return receivedState === expectedState;
  },

  // Extract error from URL parameters
  extractErrorFromUrl: (): string | null => {
    if (typeof window === 'undefined') return null;
    
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('error_description') || urlParams.get('error') || null;
  },

  // Extract code from URL parameters
  extractCodeFromUrl: (): string | null => {
    if (typeof window === 'undefined') return null;
    
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('code');
  },

  // Extract state from URL parameters
  extractStateFromUrl: (): string | null => {
    if (typeof window === 'undefined') return null;
    
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('state');
  },

  // Clear URL parameters
  clearUrlParameters: (): void => {
    if (typeof window === 'undefined') return;
    
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, document.title, url.toString());
  },

  // Check if user has required permissions
  hasRequiredPermissions: (user: any, requiredPermissions: string[]): boolean => {
    if (!user || !user.app_metadata) return false;
    
    const userPermissions = user.app_metadata.permissions || [];
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
  },

  // Format user display name
  formatDisplayName: (user: any): string => {
    if (!user) return 'Unknown User';
    
    const metadata = user.user_metadata || {};
    const fullName = metadata.full_name || metadata.name;
    
    if (fullName) return fullName;
    
    const firstName = metadata.given_name || metadata.first_name;
    const lastName = metadata.family_name || metadata.last_name;
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    return user.email || 'Unknown User';
  },

  // Get user avatar URL
  getAvatarUrl: (user: any, size: number = 40): string => {
    if (!user) return '';
    
    const metadata = user.user_metadata || {};
    const avatarUrl = metadata.avatar_url || metadata.picture;
    
    if (avatarUrl) {
      // If it's a Google avatar, we can add size parameter
      if (avatarUrl.includes('googleusercontent.com')) {
        return `${avatarUrl}?sz=${size}`;
      }
      return avatarUrl;
    }
    
    return '';
  },
};
