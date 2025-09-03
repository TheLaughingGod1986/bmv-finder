'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

function ExtensionAuthContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleExtensionAuth = async () => {
      try {
        const authToken = searchParams.get('auth_token');
        
        if (!authToken) {
          console.error('No auth token provided');
          window.location.href = '/';
          return;
        }

        console.log('Processing extension auth token...');

        // Set the session with the token from the extension
        const { data: { session }, error: sessionError } = await supabase.auth.setSession({
          access_token: authToken,
          refresh_token: '' // We don't have refresh token from extension
        });
        
        if (sessionError) {
          console.error('Error setting session:', sessionError);
          throw new Error('Failed to authenticate with token');
        }
        
        if (!session?.user) {
          throw new Error('No user found in session');
        }

        console.log('Successfully authenticated user:', session.user.email);

        // Show success message
        const messageDiv = document.getElementById('message');
        if (messageDiv) {
          messageDiv.innerHTML = `
            <div style="color: #10b981; font-weight: bold; font-size: 16px;">
              ✅ Successfully signed in!
            </div>
            <div style="margin-top: 12px; color: #6b7280; font-size: 14px;">
              Welcome back, ${session.user.user_metadata?.name || session.user.email}!<br>
              You are now signed in on the website.
            </div>
          `;
        }

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          window.location.href = '/watchlist';
        }, 2000);

      } catch (error) {
        console.error('Extension auth error:', error);
        const messageDiv = document.getElementById('message');
        if (messageDiv) {
          messageDiv.innerHTML = `
            <div style="color: #ef4444; font-weight: bold; font-size: 16px;">
              ❌ Authentication failed
            </div>
            <div style="margin-top: 12px; color: #6b7280; font-size: 14px;">
              ${error.message || 'Please try again.'}
            </div>
            <div style="margin-top: 16px;">
              <button onclick="window.location.href='/'" style="
                background: #667eea; 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 8px; 
                font-weight: 600; 
                cursor: pointer;
              ">
                Go to Home
              </button>
            </div>
          `;
        }
      }
    };

    handleExtensionAuth();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="text-4xl mb-4">🔄</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Syncing Authentication
          </h1>
          <p className="text-gray-600">
            Please wait while we sync your authentication from the Chrome extension...
          </p>
        </div>
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <div id="message" className="text-sm">
          Processing authentication...
        </div>
      </div>
    </div>
  );
}

export default function ExtensionAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    }>
      <ExtensionAuthContent />
    </Suspense>
  );
}
