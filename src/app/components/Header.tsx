'use client';

import React from 'react';
import Link from 'next/link';

interface HeaderProps {
  className?: string;
}

export default function Header({ className = '' }: HeaderProps) {
  return (
    <header className={`sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[#E5E5E5] ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <span className="text-2xl font-extrabold text-[#3A7CA5] tracking-tight">🏡 UK Property Insights</span>
        </Link>
        <nav className="hidden md:flex gap-6 text-[#2C6E91] font-medium">
          <a href="#features" className="hover:text-[#5DA271] transition">Features</a>
          <a href="#plans" className="hover:text-[#5DA271] transition">Plans</a>
          <a href="#testimonials" className="hover:text-[#5DA271] transition">Testimonials</a>
          <a href="#footer" className="hover:text-[#5DA271] transition">Contact</a>
        </nav>
        <Link 
          href="/account" 
          className="ml-4 px-5 py-2 rounded-lg bg-[#3A7CA5] text-white font-semibold shadow hover:bg-[#2C6E91] transition"
        >
          Login / Register
        </Link>
      </div>
    </header>
  );
} 