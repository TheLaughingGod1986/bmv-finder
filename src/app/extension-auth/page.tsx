'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import AuthModal from '../components/AuthModal';

function ExtensionAuthContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Authenticating...');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

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

      // Get the current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        setStatus('error');
        setMessage('You need to sign in to your BMV Finder account first. Click "Sign In to BMV Finder" below to create an account or sign in.');
        return;
      }

      // If we have a session and extension callback, redirect with token
      if (extensionCallback) {
        const token = session.access_token;
        const user = session.user;
        
        // Create a more complete user data object
        const userData = {
          isAuthenticated: true,
          name: user.user_metadata?.full_name || user.email || 'User',
          email: user.email,
          membership: 'Free Plan', // Will be updated by the extension
          captureLimit: 5,
          capturedCount: 0
        };
        
        // Encode the data for the extension
        const encodedToken = encodeURIComponent(token);
        const encodedUserData = encodeURIComponent(JSON.stringify(userData));
        
        const redirectUrl = `${extensionCallback}?token=${encodedToken}&userData=${encodedUserData}`;
        
        setStatus('success');
        setMessage('Authentication successful! Redirecting to extension...');
        
        // Redirect to extension with token and user data
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1500);
      } else {
        setStatus('error');
        setMessage('No extension callback URL provided');
      }
      
    } catch (error) {
      console.error('Extension auth error:', error);
      setStatus('error');
      setMessage('Authentication failed. Please try again.');
    }
  };

  useEffect(() => {
    handleAuth();
  }, [searchParams]);

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
            {status === 'loading' && 'Connecting to your account...'}
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
              Create Account
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
          <div className="text-sm text-gray-500">
            This window will close automatically...
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