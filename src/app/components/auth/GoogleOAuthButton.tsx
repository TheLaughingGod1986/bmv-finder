'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Chrome } from 'lucide-react';
import { useGoogleOAuth, googleOAuthUtils } from '@/lib/auth/googleOAuth';

interface GoogleOAuthButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  redirectTo?: string;
  onSuccess?: (user: any) => void;
  onError?: (error: any) => void;
  children?: React.ReactNode;
}

export function GoogleOAuthButton({
  className = '',
  variant = 'default',
  size = 'md',
  fullWidth = false,
  redirectTo,
  onSuccess,
  onError,
  children,
}: GoogleOAuthButtonProps) {
  const router = useRouter();
  const { signInWithGoogle, loading, error, isConfigured } = useGoogleOAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!isConfigured) {
      const error = new Error('Google OAuth is not configured');
      onError?.(error);
      return;
    }

    setIsLoading(true);

    try {
      // Store redirect URL if provided
      if (redirectTo) {
        localStorage.setItem('oauth_redirect_to', redirectTo);
      }

      // Initiate Google OAuth flow
      await signInWithGoogle();

      // Note: The actual success/error handling will be done in the callback page
      // or through the auth state change listener
    } catch (err) {
      console.error('Google OAuth error:', err);
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800';
      case 'ghost':
        return 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800';
      default:
        return 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-6 py-4 text-lg';
      default:
        return 'px-4 py-3 text-base';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-5 h-5';
    }
  };

  if (!isConfigured) {
    return (
      <button
        disabled
        className={`${className} ${getVariantClasses()} ${getSizeClasses()} ${
          fullWidth ? 'w-full' : ''
        } opacity-50 cursor-not-allowed flex items-center justify-center space-x-2 rounded-lg font-medium transition-colors`}
        title="Google OAuth is not configured"
      >
        <Chrome className={getIconSize()} />
        <span>Google Sign In (Not Available)</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={loading || isLoading}
      className={`${className} ${getVariantClasses()} ${getSizeClasses()} ${
        fullWidth ? 'w-full' : ''
      } flex items-center justify-center space-x-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading || isLoading ? (
        <Loader2 className={`${getIconSize()} animate-spin`} />
      ) : (
        <Chrome className={getIconSize()} />
      )}
      <span>
        {children || (loading || isLoading ? 'Signing in...' : 'Continue with Google')}
      </span>
    </button>
  );
}

// Specialized Google OAuth buttons for different use cases
export function GoogleSignInButton(props: Omit<GoogleOAuthButtonProps, 'children'>) {
  return (
    <GoogleOAuthButton {...props}>
      Sign in with Google
    </GoogleOAuthButton>
  );
}

export function GoogleSignUpButton(props: Omit<GoogleOAuthButtonProps, 'children'>) {
  return (
    <GoogleOAuthButton {...props}>
      Sign up with Google
    </GoogleOAuthButton>
  );
}

export function GoogleContinueButton(props: Omit<GoogleOAuthButtonProps, 'children'>) {
  return (
    <GoogleOAuthButton {...props}>
      Continue with Google
    </GoogleOAuthButton>
  );
}

// Compact version for mobile
export function GoogleOAuthButtonCompact(props: Omit<GoogleOAuthButtonProps, 'size' | 'children'>) {
  return (
    <GoogleOAuthButton {...props} size="sm">
      Google
    </GoogleOAuthButton>
  );
}

// Large version for prominent placement
export function GoogleOAuthButtonLarge(props: Omit<GoogleOAuthButtonProps, 'size' | 'children'>) {
  return (
    <GoogleOAuthButton {...props} size="lg">
      Continue with Google
    </GoogleOAuthButton>
  );
}

// Default export
export default GoogleOAuthButton;
