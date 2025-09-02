'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import AuthModal from '../components/AuthModal';
import { useHybridAuth } from '../../lib/auth/hybridAuth';

function ExtensionAuthContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Checking authentication...');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { user, loading, isSupabaseAvailable } = useHybridAuth();

  const handleAuth = async () => {
    try {
      // Get the extension callback URL from query params
      const extensionCallback = searchParams.get('extension_callback');
      const messageParam = searchParams.get('message');
      
      if (!supabase) {
        setStatus('error');
        setMessage('Authentication service not configured. Please contact support.');
        return;
      }

      // Check for hybrid authentication
      if (user) {
        // User is authenticated via hybrid auth
        
        // Create user data for extension
        const userData = {
          isAuthenticated: true,
          name: user.name,
          email: user.email,
          membership: 'Free Plan',
          captureLimit: 5,
          capturedCount: 0
        };
        
        // If we have extension callback, redirect with mock data
        if (extensionCallback) {
          const encodedUserData = encodeURIComponent(JSON.stringify(userData));
          const redirectUrl = `${extensionCallback}?userData=${encodedUserData}&mockAuth=${!isSupabaseAvailable}`;
          
          setStatus('success');
          setMessage('Authentication successful! Redirecting to extension...');
          
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1500);
        } else {
          setStatus('success');
          setMessage('You are signed in! Return to the extension to capture properties.');
        }
        return;
      }
      
      // If no user is authenticated via hybrid auth, show error
      if (!user) {
        setStatus('error');
        setMessage('You need to sign in to your BMV Finder account first. Click "Sign In to BMV Finder" below to create an account or sign in.');
        return;
      }

      // If we have extension callback, redirect with user data
      if (extensionCallback) {
        // Create user data for extension
        const userData = {
          isAuthenticated: true,
          name: user.name,
          email: user.email,
          membership: 'Free Plan',
          captureLimit: 5,
          capturedCount: 0
        };
        
        // Encode the data for the extension
        const encodedUserData = encodeURIComponent(JSON.stringify(userData));
        const redirectUrl = `${extensionCallback}?userData=${encodedUserData}&mockAuth=${!isSupabaseAvailable}`;
        
        setStatus('success');
        setMessage('Authentication successful! Redirecting to extension...');
        
        // Redirect to extension with user data
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1500);
      } else {
        // No extension callback - this is likely a direct visit
        setStatus('success');
        setMessage('You are signed in! Return to the extension to capture properties.');
      }
      
    } catch (error) {
      console.error('Extension auth error:', error);
      setStatus('error');
      setMessage('Authentication failed. Please try again.');
    }
  };

  useEffect(() => {
    if (!loading) {
      // If no user is authenticated, immediately show error state
      if (!user) {
        setStatus('error');
        setMessage('You need to sign in to your BMV Finder account first. Click "Sign In to BMV Finder" below to create an account or sign in.');
        return;
      }
      handleAuth();
    }
  }, [searchParams, user, loading]);

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    // Re-check authentication status after successful login
    handleAuth();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="text-4xl mb-4">🏠</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            BMV Finder Extension
          </h1>
          <p className="text-gray-600">
            {status === 'loading' && 'Checking authentication...'}
            {status === 'success' && 'Successfully authenticated!'}
            {status === 'error' && 'Authentication failed'}
          </p>
        </div>

        <div className="mb-6">
          {status === 'loading' && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-green-600 text-lg">
              ✅ {message}
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-red-600 text-lg">
              ❌ {message}
            </div>
          )}
        </div>

        {status === 'error' && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <strong>How it works:</strong> First sign in to your BMV Finder account, then return to the extension to capture properties.
            </div>
            <button
              onClick={() => {
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In to BMV Finder
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                setIsAuthModalOpen(true);
              }}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Create BMV Finder Account
            </button>
            <button
              onClick={() => {
                // Quick demo login - redirect to main app login
                window.location.href = '/login?returnTo=' + encodeURIComponent(window.location.href);
              }}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Quick Demo Login
            </button>
            <button
              onClick={() => window.close()}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
              <strong>Success!</strong> You are now signed in to BMV Finder. Return to the extension to start capturing properties.
            </div>
            <button
              onClick={() => window.close()}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Return to Extension
            </button>
          </div>
        )}


      </div>
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleAuthSuccess}
        defaultMode={authMode}
      />
    </div>
  );
}

export default function ExtensionAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ExtensionAuthContent />
    </Suspense>
  );
} 