'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ComprehensiveValuationPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the consolidated advanced deal analysis page
    router.replace('/advanced-deal-analysis');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Comprehensive Property Analysis...</p>
      </div>
    </div>
  );
} 