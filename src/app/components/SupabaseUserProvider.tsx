"use client";
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '../../lib/supabaseClient';

export default function SupabaseUserProvider({ children }: { children: React.ReactNode }) {
  // Remove useMemo and direct createClient usage
  return <SessionContextProvider supabaseClient={supabase}>{children}</SessionContextProvider>;
} 