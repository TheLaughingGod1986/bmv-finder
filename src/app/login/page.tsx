'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import AuthModal from '../components/AuthModal';
import { useHybridAuth } from '../../lib/auth/hybridAuth';
import { useSearchParams } from 'next/navigation';

function LoginPageContent() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(true);
  const router = useRouter();
  const { user, isLoading } = useHybridAuth();
  const searchParams = useSearchParams();

  // Redirect to watchlist or returnTo URL if user is already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      const returnTo = searchParams.get('returnTo');
      if (returnTo) {
        window.location.href = returnTo;
      } else {
        router.push('/watchlist');
      }
    }
  }, [user, isLoading, router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to BMV Finder</h1>
          <p className="text-gray-600">Please sign in to access your account</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">
              You need to be signed in to access your watchlist and other features.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode="login"
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
