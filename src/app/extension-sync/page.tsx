'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

function ExtensionSyncContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const syncWithExtension = async () => {
      try {
        // Check if we have OAuth tokens in the URL hash (from Google redirect)
        const hash = window.location.hash;
        const urlParams = new URLSearchParams(hash.substring(1));
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        let session = null;
        
        if (accessToken) {
          console.log('OAuth tokens found in URL hash, processing...');
          
          // Set the session with the tokens from the URL
          const { data: { session: newSession }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });
          
          if (sessionError) {
            console.error('Error setting session:', sessionError);
            throw new Error('Failed to process authentication');
          }
          
          session = newSession;
        } else {
          // Get the current session
          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !currentSession) {
            console.error('No session found:', sessionError);
            throw new Error('No active session found');
          }
          
          session = currentSession;
        }

        if (!session?.user) {
          throw new Error('No user found in session');
        }

        console.log('Found session, syncing with extension...');

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const userData = {
          id: session.user.id,
          email: session.user.email,
          name: profile?.name || session.user.user_metadata?.name || session.user.email,
          membership: profile?.subscription || 'Free Plan',
          captureLimit: profile?.capture_limit || 5,
          capturedCount: profile?.captured_count || 0,
          avatar: profile?.avatar_url || session.user.user_metadata?.avatar_url
        };

        // Create a simple sync URL that the extension can use
        const syncData = {
          user: userData,
          token: session.access_token
        };

        // Store sync data in localStorage for the extension to pick up
        localStorage.setItem('bmv-finder-sync', JSON.stringify(syncData));
        
        console.log('Sync data stored:', userData.name);

        // Show success message
        const messageDiv = document.getElementById('message');
        if (messageDiv) {
          messageDiv.innerHTML = `
            <div style="color: #10b981; font-weight: bold; font-size: 16px;">
              ✅ Authentication synced successfully!
            </div>
            <div style="margin-top: 12px; color: #6b7280; font-size: 14px;">
              Welcome back, ${userData.name}!<br>
              You can now close this tab and return to the Chrome extension.
            </div>
          `;
        }

        // Auto-close after 4 seconds
        setTimeout(() => {
          window.close();
        }, 4000);

      } catch (error) {
        console.error('Sync error:', error);
        const messageDiv = document.getElementById('message');
        if (messageDiv) {
          messageDiv.innerHTML = `
            <div style="color: #ef4444; font-weight: bold; font-size: 16px;">
              ❌ Authentication failed
            </div>
            <div style="margin-top: 12px; color: #6b7280; font-size: 14px;">
              ${(error as Error).message || 'Please try signing in again.'}
            </div>
            <div style="margin-top: 16px;">
              <button onclick="window.location.href='/login'" style="
                background: #667eea; 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 8px; 
                font-weight: 600; 
                cursor: pointer;
              ">
                Sign In
              </button>
            </div>
          `;
        }
      }
    };

    syncWithExtension();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="text-4xl mb-4">🔄</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Syncing Authentication
          </h1>
          <p className="text-gray-600">
            Please wait while we sync your authentication with the Chrome extension...
          </p>
        </div>
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <div id="message" className="text-sm">
          Processing...
        </div>
      </div>
    </div>
  );
}

export default function ExtensionSyncPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ExtensionSyncContent />
    </Suspense>
  );
}
