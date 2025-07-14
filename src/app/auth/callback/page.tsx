'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
          setLoading(false);
          return;
        }

        if (data.session) {
          console.log('Auth callback successful, user signed in:', data.session.user.email);
          // Redirect to account page or dashboard
          router.push('/account');
        } else {
          console.log('No session found in callback');
          setError('Authentication failed. Please try again.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5DC]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3A7CA5] mx-auto mb-4"></div>
          <p className="text-gray-600">Completing sign in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5DC]">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Sign In Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/account')}
            className="bg-[#3A7CA5] text-white px-4 py-2 rounded-md hover:bg-[#2C6E91] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
} 