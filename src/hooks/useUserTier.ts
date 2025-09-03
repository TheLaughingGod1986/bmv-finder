import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useUserTier(userId: string | null | undefined) {
  const [tier, setTier] = useState<'free' | 'pro' | 'elite' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserTier() {
      if (!userId || !supabase) {
        setTier('free');
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
        
        if (error) {
          // Only log critical errors, not expected "no rows" errors or connection issues
          if (error.code !== 'PGRST116' && !error.message?.includes('placeholder')) {
            console.warn('Error fetching user tier:', error);
          }
          setTier('free');
        } else {
          setTier(data?.tier ?? 'free');
        }
      } catch (error) {
        // Silently handle connection errors for placeholder Supabase
        if (!(error as any)?.message?.includes('placeholder')) {
          console.warn('Error fetching user tier:', error);
        }
        setTier('free');
      } finally {
        setLoading(false);
      }
    }

    fetchUserTier();
  }, [userId]);

  return { tier, loading };
} 