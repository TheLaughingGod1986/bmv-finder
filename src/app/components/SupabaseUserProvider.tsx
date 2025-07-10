"use client";
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createClient } from '@supabase/supabase-js';
import { useMemo } from 'react';

export default function SupabaseUserProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => {
    // Only create client on the client side
    if (typeof window === 'undefined') {
      return null;
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Supabase environment variables are not set');
    }
    
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }, []);

  // Don't render the provider if we're on the server side
  if (!supabase) {
    return <>{children}</>;
  }

  return <SessionContextProvider supabaseClient={supabase}>{children}</SessionContextProvider>;
} 