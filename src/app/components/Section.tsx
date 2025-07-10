'use client';

import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  background?: 'white' | 'light' | 'dark';
}

export default function Section({ children, id, className = '', background = 'white' }: SectionProps) {
  const backgroundClasses = {
    white: 'bg-white',
    light: 'bg-[#E5E5E5]',
    dark: 'bg-[#2C6E91] text-white'
  };

  return (
    <section 
      id={id} 
      className={`py-16 px-4 ${backgroundClasses[background]} ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </section>
  );
} 