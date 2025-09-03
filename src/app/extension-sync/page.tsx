'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

function ExtensionSyncContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const syncWithExtension = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error('No session found:', sessionError);
          return;
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
            <div style="color: #27AE60; font-weight: bold;">
              ✅ Authentication synced successfully!
            </div>
            <div style="margin-top: 10px; color: #666;">
              You can now close this tab and return to the Chrome extension.
            </div>
          `;
        }

        // Auto-close after 3 seconds
        setTimeout(() => {
          window.close();
        }, 3000);

      } catch (error) {
        console.error('Sync error:', error);
        const messageDiv = document.getElementById('message');
        if (messageDiv) {
          messageDiv.innerHTML = `
            <div style="color: #E74C3C; font-weight: bold;">
              ❌ Sync failed
            </div>
            <div style="margin-top: 10px; color: #666;">
              Please try again or sign in first.
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
