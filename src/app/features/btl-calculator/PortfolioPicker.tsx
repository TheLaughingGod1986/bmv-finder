"use client";

import { useEffect, useState } from 'react';

type PortfolioItem = {
  id: string;
  address?: string;
  postcode?: string;
  bedrooms?: number;
  property_type?: string;
  last_valuation?: number;
};

export default function PortfolioPicker({ onSelect }: { onSelect: (p: PortfolioItem) => void }) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        // Try to get auth token from Supabase
        let token = null;
        if (typeof window !== 'undefined') {
          // Check for Supabase session
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          const { data: { session } } = await supabase.auth.getSession();
          token = session?.access_token;
        }
        
        if (!token) {
          setError('Please sign in to view your portfolio');
          return;
        }

        const res = await fetch('/api/portfolio', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            setError('Please sign in to view your portfolio');
          } else {
            setError('Failed to load portfolio');
          }
          return;
        }
        
        const json = await res.json();
        setItems(Array.isArray(json) ? json : []);
      } catch (e: any) {
        console.error('Portfolio load error:', e);
        setError('Unable to load portfolio');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="mt-2 text-xs text-gray-500">Loading portfolio…</div>;
  if (error) return <div className="mt-2 text-xs text-red-600">{error}</div>;
  if (!items.length) return <div className="mt-2 text-xs text-gray-500">No properties in portfolio.</div>;

  return (
    <div className="mt-2 max-h-48 overflow-auto rounded-md border border-gray-200 bg-white text-sm">
      {items.map((p) => (
        <button
          key={p.id}
          type="button"
          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-50"
          onClick={() => onSelect(p)}
        >
          <span className="truncate">{p.address}</span>
          <span className="shrink-0 text-xs text-gray-500">{p.postcode}</span>
        </button>
      ))}
    </div>
  );
}


