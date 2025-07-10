import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

export function useUserTier(userId: string | null | undefined) {
  const [tier, setTier] = useState<'free' | 'pro' | 'elite' | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    async function fetchUserTier() {
      if (!userId || !supabase) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('tier')
          .eq('id', userId)
          .single();
        
        setTier(data?.tier ?? 'free');
      } catch (error) {
        console.error('Error fetching user tier:', error);
        setTier('free');
      } finally {
        setLoading(false);
      }
    }

    fetchUserTier();
  }, [userId, supabase]);

  return { tier, loading };
} 