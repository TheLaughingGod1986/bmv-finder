import { createClient } from '@supabase/supabase-js';

function getSupabase() {
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
}

export async function getUserProfile(userId: string) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client not available on server side');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
} 