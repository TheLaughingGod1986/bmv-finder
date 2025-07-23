'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

interface ResponsiveHeaderProps {
  className?: string;
}

export default function ResponsiveHeader({ className = '' }: ResponsiveHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navItems = [
    { href: '#features', label: 'Features' },
    { href: '#plans', label: 'Plans' },
    { href: '#testimonials', label: 'Testimonials' },
    { href: '#footer', label: 'Contact' }
  ];

  return (
    <header className={`bg-neutral-100 ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
        {/* Logo */}
        <span className="flex items-center gap-2">
          <Image src="/icon.svg" alt="UK Property Insights Logo" className="w-7 h-7" width={28} height={28} />
          <span className="text-2xl font-extrabold text-primary-700 tracking-tight">UK Property Insights</span>
        </span>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 text-primary-700 font-medium">
          {navItems.map((item) => (
            <a 
              key={item.href}
              href={item.href} 
              className="hover:text-primary-green transition focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 rounded"
            >
              {item.label}
            </a>
          ))}
        </nav>
        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMenuOpen ? (
            <X className="w-6 h-6 text-primary-700" />
          ) : (
            <Menu className="w-6 h-6 text-primary-700" />
          )}
        </button>
      </div>
      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}
        aria-hidden={!isMenuOpen}
      >
        <div className="bg-neutral-100 border-t border-neutral-200 px-4 py-2 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-primary-700 font-medium hover:bg-neutral-200 transition focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
              onClick={closeMenu}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
      {/* Backdrop for mobile menu */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </header>
  );
} 