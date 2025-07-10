'use client';

import React from 'react';

interface TestimonialCardProps {
  rating: number;
  text: string;
  author: string;
  className?: string;
}

export default function TestimonialCard({ rating, text, author, className = '' }: TestimonialCardProps) {
  const stars = '⭐️'.repeat(rating);
  
  return (
    <div className={`bg-white rounded-xl shadow p-6 border border-[#E5E5E5] flex flex-col items-center text-center ${className}`}>
      <span className="text-4xl mb-2">{stars}</span>
      <p className="text-[#3B755D] mb-2">"{text}"</p>
      <span className="text-[#2C6E91] font-semibold">{author}</span>
    </div>
  );
} 