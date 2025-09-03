'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import UserProfileManager from '@/app/components/UserProfileManager';
import { withAuth } from '@/contexts/AuthContext';

function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <UserProfileManager />
      </div>
    </div>
  );
}

export default withAuth(ProfilePage);
