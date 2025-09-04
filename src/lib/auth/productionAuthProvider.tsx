'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { productionAuth, AuthResult } from './productionAuth';
import { UserProfile } from './userManager';

interface ProductionAuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, name: string, metadata?: any) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<AuthResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  complete2FA: (tempToken: string, twoFactorCode: string) => Promise<AuthResult>;
}

const ProductionAuthContext = createContext<ProductionAuthContextType | undefined>(undefined);

interface ProductionAuthProviderProps {
  children: ReactNode;
}

export function ProductionAuthProvider({ children }: ProductionAuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const result = await productionAuth.refreshToken(token);
          if (result.success && result.user) {
            setUser(result.user);
            localStorage.setItem('auth_token', result.token!);
          } else {
            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await productionAuth.loginUser(email, password);
      if (result.success && result.user && result.token) {
        setUser(result.user);
        localStorage.setItem('auth_token', result.token);
      }
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  };

  const register = async (email: string, password: string, name: string, metadata?: any): Promise<AuthResult> => {
    try {
      const result = await productionAuth.registerUser({ email, password, name, metadata });
      if (result.success && result.user && result.token) {
        setUser(result.user);
        localStorage.setItem('auth_token', result.token);
      }
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (user) {
        await productionAuth.logoutUser(user.id);
      }
      setUser(null);
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if logout fails
      setUser(null);
      localStorage.removeItem('auth_token');
    }
  };

  const refreshToken = async (): Promise<AuthResult> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return {
          success: false,
          error: 'No token found'
        };
      }

      const result = await productionAuth.refreshToken(token);
      if (result.success && result.user && result.token) {
        setUser(result.user);
        localStorage.setItem('auth_token', result.token);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('auth_token');
        setUser(null);
      }
      return result;
    } catch (error) {
      console.error('Token refresh error:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
      return {
        success: false,
        error: 'Token refresh failed'
      };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
    try {
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      const result = await productionAuth.changePassword(user.id, currentPassword, newPassword);
      return result;
    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        error: 'Password change failed. Please try again.'
      };
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      const result = await productionAuth.resetPassword(email);
      return result;
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: 'Password reset failed. Please try again.'
      };
    }
  };

  const complete2FA = async (tempToken: string, twoFactorCode: string): Promise<AuthResult> => {
    try {
      const result = await productionAuth.complete2FAVerification(tempToken, twoFactorCode);
      if (result.success && result.user && result.token) {
        setUser(result.user);
        localStorage.setItem('auth_token', result.token);
      }
      return result;
    } catch (error) {
      console.error('2FA completion error:', error);
      return {
        success: false,
        error: '2FA verification failed. Please try again.'
      };
    }
  };

  const value: ProductionAuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshToken,
    changePassword,
    resetPassword,
    complete2FA
  };

  return (
    <ProductionAuthContext.Provider value={value}>
      {children}
    </ProductionAuthContext.Provider>
  );
}

export function useProductionAuth(): ProductionAuthContextType {
  const context = useContext(ProductionAuthContext);
  if (context === undefined) {
    throw new Error('useProductionAuth must be used within a ProductionAuthProvider');
  }
  return context;
}

// Hook for getting auth token
export function useAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

// Hook for making authenticated API calls
export function useAuthenticatedFetch() {
  const { user, refreshToken } = useProductionAuth();

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If token is expired, try to refresh
    if (response.status === 401 && user) {
      const refreshResult = await refreshToken();
      if (refreshResult.success && refreshResult.token) {
        // Retry the request with new token
        headers['Authorization'] = `Bearer ${refreshResult.token}`;
        return fetch(url, {
          ...options,
          headers,
        });
      }
    }

    return response;
  };

  return authenticatedFetch;
}
