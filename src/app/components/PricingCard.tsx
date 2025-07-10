'use client';

import React from 'react';
import Link from 'next/link';

interface PricingCardProps {
  title: string;
  price: string;
  period?: string;
  features: string[];
  ctaText: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
  isPopular?: boolean;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export default function PricingCard({ 
  title, 
  price, 
  period = '/mo', 
  features, 
  ctaText, 
  ctaHref, 
  ctaOnClick,
  isPopular = false, 
  className = '',
  disabled = false,
  loading = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby
}: PricingCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    if (ctaOnClick) {
      ctaOnClick();
    }
  };

  const buttonClasses = `inline-block px-6 py-2 rounded-lg text-white font-semibold transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 ${
    disabled || loading
      ? 'bg-gray-400 cursor-not-allowed'
      : isPopular 
        ? 'bg-[#3A7CA5] hover:bg-[#2C6E91] hover:shadow-lg' 
        : 'bg-[#5DA271] hover:bg-[#3B755D] hover:shadow-lg'
  }`;

  const buttonContent = loading ? (
    <div className="flex items-center gap-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      Loading...
    </div>
  ) : (
    ctaText
  );

  return (
    <div 
      className={`rounded-xl border-2 ${isPopular ? 'border-[#D4AF37] bg-[#FFFBEA] shadow-md' : 'border-[#E5E5E5] bg-white shadow-sm'} p-8 flex flex-col justify-between items-center relative transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg ${className}`}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
    >
      {isPopular && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#D4AF37] text-white text-xs font-semibold shadow" role="status">
          Most Popular
        </span>
      )}
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-3xl font-extrabold text-[#3A7CA5] mb-4">
        {price}
        {period && <span className="text-base font-normal">{period}</span>}
      </p>
      <ul className="mb-6 text-left text-[#3B755D] text-sm" role="list">
        {features.map((feature, index) => (
          <li key={index} role="listitem">{feature}</li>
        ))}
      </ul>
      <div className="w-full flex-1 flex flex-col justify-end">
        {ctaHref ? (
          <Link 
            href={ctaHref} 
            className={`${buttonClasses} mt-auto w-full text-center`}
            onClick={handleClick}
          >
            {buttonContent}
          </Link>
        ) : (
          <button 
            className={`${buttonClasses} mt-auto w-full`}
            onClick={handleClick}
            disabled={disabled || loading}
          >
            {buttonContent}
          </button>
        )}
      </div>
    </div>
  );
} 