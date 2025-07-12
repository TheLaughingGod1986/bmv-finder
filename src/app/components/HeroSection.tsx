'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import SearchInput from './SearchInput';

interface HeroSectionProps {
  className?: string;
  onSearch?: (query: string) => void;
}

export default function HeroSection({ className = '', onSearch }: HeroSectionProps) {
  const router = useRouter();

  const handleSearch = (query: string) => {
    if (onSearch) {
      onSearch(query);
    } else {
      // Default behavior - navigate to main page with search
      router.push(`/?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <section className={`bg-gradient-to-b from-[#F5F5DC] to-[#E5E5E5] py-20 px-4 text-center ${className}`}>
      <h1 className="text-4xl md:text-5xl font-extrabold text-[#2C6E91] mb-4">
        Discover the True Value of UK Homes
      </h1>
      <p className="text-lg md:text-xl text-[#3B755D] mb-8 max-w-2xl mx-auto">
        Instantly see recent sales, market trends, and get smart tools to help you decide what&apos;s a fair price—whether you&apos;re buying, selling, or investing.
      </p>

      {/* Sticky Search Bar */}
      <div className="sticky top-[64px] z-30 bg-[#F5F5DC] py-4 shadow-md border-b border-[#E5E5E5]">
        <SearchInput 
          onSearch={handleSearch}
          className="max-w-lg mx-auto justify-center"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-6 mt-10 text-[#2C6E91]">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold">2.5M+</span>
          <span className="text-sm">Properties</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold">BMV Score</span>
          <span className="text-sm">Investment Rating</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold">⚡</span>
          <span className="text-sm">Live Data</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold">🔒</span>
          <span className="text-sm">Trusted & Secure</span>
        </div>
      </div>
    </section>
  );
} 