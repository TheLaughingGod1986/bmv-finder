import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useUserTier(userId: string | null | undefined) {
  const [tier, setTier] = useState<'free' | 'pro' | 'elite' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserTier() {
      if (!userId || !supabase) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
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