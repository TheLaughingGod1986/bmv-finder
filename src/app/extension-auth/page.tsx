'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

function ExtensionAuthContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Authenticating...');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get the extension callback URL from query params
        const extensionCallback = searchParams.get('extension_callback');
        
        if (!supabase) {
          setStatus('error');
          setMessage('Authentication service not configured');
          return;
        }

        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          setStatus('error');
          setMessage('No active session found. Please sign in first.');
          return;
        }

        // If we have a session and extension callback, redirect with token
        if (extensionCallback) {
          const token = session.access_token;
          const redirectUrl = `${extensionCallback}?token=${encodeURIComponent(token)}`;
          
          setStatus('success');
          setMessage('Authentication successful! Redirecting to extension...');
          
          // Redirect to extension with token
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 2000);
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

    handleAuth();
  }, [searchParams]);

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
            <button
              onClick={() => window.location.href = '/auth'}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => window.close()}
              className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
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
    </div>
  );
}

export default function ExtensionAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="text-4xl mb-4">🏠</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              BMV Finder Extension
            </h1>
            <p className="text-gray-600">Loading...</p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    }>
      <ExtensionAuthContent />
    </Suspense>
  );
} 