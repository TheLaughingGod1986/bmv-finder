'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

function GoogleAuthContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleGoogleAuth = async () => {
      try {
        const returnTo = searchParams.get('returnTo');
        
        // Check if user is already authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          return;
        }

        if (session?.user) {
          // User is authenticated, redirect back to extension
          if (returnTo) {
            // Create user data for extension
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const userData = {
              isAuthenticated: true,
              name: profile?.name || session.user.user_metadata?.name || session.user.email,
              email: session.user.email,
              membership: profile?.subscription || 'Free Plan',
              captureLimit: profile?.capture_limit || 5,
              capturedCount: profile?.captured_count || 0
            };

            const encodedUserData = encodeURIComponent(JSON.stringify(userData));
            const redirectUrl = `${returnTo}?userData=${encodedUserData}&token=${encodeURIComponent(session.access_token)}`;
            
            window.location.href = redirectUrl;
          } else {
            // No return URL, redirect to main app
            window.location.href = '/watchlist';
          }
        } else {
          // Not authenticated, initiate Google OAuth
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: returnTo ? `${window.location.origin}/auth/google?returnTo=${encodeURIComponent(returnTo)}` : `${window.location.origin}/watchlist`
            }
          });

          if (error) {
            console.error('Google OAuth error:', error);
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.error('Google auth error:', error);
        window.location.href = '/login';
      }
    };

    handleGoogleAuth();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Processing Authentication
          </h1>
          <p className="text-gray-600">
            Please wait while we complete your sign-in...
          </p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
}

export default function GoogleAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    }>
      <GoogleAuthContent />
    </Suspense>
  );
}
