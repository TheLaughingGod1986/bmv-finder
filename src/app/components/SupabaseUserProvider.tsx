"use client";
// import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '../../lib/supabaseClient';

export default function SupabaseUserProvider({ children }: { children: React.ReactNode }) {
  // If Supabase is not configured, render children without the provider
  if (!supabase) {
    return <>{children}</>;
  }

  // return <SessionContextProvider supabaseClient={supabase}>{children}</SessionContextProvider>;
  return <>{children}</>;
} 