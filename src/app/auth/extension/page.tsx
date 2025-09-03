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

        // First, verify the token with our API
        const response = await fetch('/api/auth/status', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Invalid authentication token');
        }

        const authData = await response.json();
        
        if (!authData.isAuthenticated || !authData.user) {
          throw new Error('Authentication failed');
        }

        console.log('Token verified, user:', authData.user.email);

        // Now try to get or create a proper Supabase session
        // First check if user exists in Supabase
        const { data: existingUser, error: userError } = await supabase.auth.getUser();
        
        if (userError || !existingUser.user) {
          // User not signed in to Supabase, we need to sign them in
          // For now, let's store the auth data in localStorage and redirect
          localStorage.setItem('bmv-finder-auth', JSON.stringify({
            user: authData.user,
            token: authToken,
            timestamp: Date.now()
          }));

          // Show success message
          const messageDiv = document.getElementById('message');
          if (messageDiv) {
            messageDiv.innerHTML = `
              <div style="color: #10b981; font-weight: bold; font-size: 16px;">
                ✅ Successfully synced!
              </div>
              <div style="margin-top: 12px; color: #6b7280; font-size: 14px;">
                Welcome back, ${authData.user.name}!<br>
                Your authentication has been synced to the website.
              </div>
            `;
          }

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            window.location.href = '/watchlist';
          }, 2000);
        } else {
          // User is already signed in to Supabase
          console.log('User already signed in to Supabase');
          
          // Show success message
          const messageDiv = document.getElementById('message');
          if (messageDiv) {
            messageDiv.innerHTML = `
              <div style="color: #10b981; font-weight: bold; font-size: 16px;">
                ✅ Already signed in!
              </div>
              <div style="margin-top: 12px; color: #6b7280; font-size: 14px;">
                You are already signed in on the website.
              </div>
            `;
          }

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            window.location.href = '/watchlist';
          }, 2000);
        }

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
