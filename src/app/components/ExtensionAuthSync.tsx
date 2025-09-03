'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExtensionAuthSync() {
  const router = useRouter();

  useEffect(() => {
    // Check for extension auth data in localStorage
    const checkExtensionAuth = () => {
      try {
        const authData = localStorage.getItem('bmv-finder-auth');
        
        if (authData) {
          const parsed = JSON.parse(authData);
          
          // Check if the data is recent (within 5 minutes)
          const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
          
          if (parsed.timestamp && parsed.timestamp > fiveMinutesAgo) {
            console.log('Extension auth data found:', parsed.user.name);
            
            // Store in a more accessible location for the UI
            localStorage.setItem('bmv-finder-user', JSON.stringify(parsed.user));
            
            // Clear the temporary auth data
            localStorage.removeItem('bmv-finder-auth');
            
            // Force a page refresh to update the UI
            window.location.reload();
          } else {
            // Data is stale, remove it
            localStorage.removeItem('bmv-finder-auth');
          }
        }
      } catch (error) {
        console.error('Error checking extension auth:', error);
        localStorage.removeItem('bmv-finder-auth');
      }
    };

    checkExtensionAuth();
  }, [router]);

  return null; // This component doesn't render anything
}
