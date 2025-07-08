import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useUserTier(userId: string | null) {
  const [tier, setTier] = useState<'free' | 'pro' | 'elite' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from('profiles')
      .select('tier')
      .eq('id', userId)
      .single()
      .then(({ data }) => setTier(data?.tier ?? 'free'))
      .finally(() => setLoading(false));
  }, [userId]);

  return { tier, loading };
} 