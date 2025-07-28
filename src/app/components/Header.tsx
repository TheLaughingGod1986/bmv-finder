'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface HeaderProps {
  className?: string;
}

interface UpdateStats {
  lastUpdate: string;
  propertiesCount: number;
  recentSalesCount: number;
  hpiCount: number;
}

export default function Header({ className = '' }: HeaderProps) {
  const [stats, setStats] = useState<UpdateStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we already have cached data and it's less than 5 minutes old
    if (typeof window === 'undefined') return; // SSR safety check
    
    const cachedData = sessionStorage.getItem('last-update-data');
    const cachedTime = sessionStorage.getItem('last-update-time');
    
    if (cachedData && cachedTime) {
      const timeDiff = Date.now() - parseInt(cachedTime);
      if (timeDiff < 5 * 60 * 1000) { // 5 minutes
        try {
          setStats(JSON.parse(cachedData));
          return;
        } catch (e) {
          // If parsing fails, continue with fresh fetch
        }
      }
    }

    // Only fetch if we don't have recent cached data
    fetch('/api/last-update')
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error);
        else {
          setStats(data);
          // Cache the data for 5 minutes
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('last-update-data', JSON.stringify(data));
            sessionStorage.setItem('last-update-time', Date.now().toString());
          }
        }
      })
      .catch(err => setError(err.message));
  }, []);

  return (
    <>
      <header className={`sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-neutral-200 ${className}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="text-2xl font-extrabold text-primary-blue tracking-tight">🏡 UK Property Insights</span>
          </Link>
          <nav className="hidden md:flex gap-6 text-primary-blue-dark font-medium">
            <a href="#features" className="hover:text-primary-green transition">Features</a>
            <a href="#plans" className="hover:text-primary-green transition">Plans</a>
            <a href="#testimonials" className="hover:text-primary-green transition">Testimonials</a>
            <a href="#footer" className="hover:text-primary-green transition">Contact</a>
          </nav>
          <Link 
            href="/account" 
            className="ml-4 px-5 py-2 rounded-lg bg-primary-blue text-white font-semibold shadow hover:bg-primary-blue-dark transition"
          >
            Login / Register
          </Link>
        </div>
      </header>
      <div className="w-full bg-neutral-200 text-primary-blue-dark text-sm py-2 px-4 flex flex-col md:flex-row md:items-center md:justify-center gap-2 border-b border-neutral-200">
        {error && <span>Data update status unavailable</span>}
        {stats && (
          <>
            <span>Last data update: <b>{new Date(stats.lastUpdate).toLocaleString()}</b></span>
            <span className="mx-2">|</span>
            <span>Properties: <b>{stats.propertiesCount.toLocaleString()}</b></span>
            <span className="mx-2">|</span>
            <span>Recent Sales: <b>{stats.recentSalesCount.toLocaleString()}</b></span>
            <span className="mx-2">|</span>
            <span>HPI Records: <b>{stats.hpiCount.toLocaleString()}</b></span>
          </>
        )}
      </div>
    </>
  );
} 