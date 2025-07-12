'use client';

import React from 'react';
import Link from 'next/link';

interface PricingCardProps {
  title: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  ctaText: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
  isPopular?: boolean;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  href?: string;
  buttonClassName?: string;
  buttonText?: string;
  onClick?: () => void;
  savings?: string | null;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export default function PricingCard({ 
  title, 
  price, 
  period = '/mo', 
  description,
  features, 
  ctaText, 
  ctaHref, 
  ctaOnClick,
  isPopular = false, 
  className = '',
  disabled = false,
  loading = false,
  href,
  buttonClassName,
  buttonText,
  onClick,
  savings,
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
      className={`rounded-xl border-2 ${isPopular ? 'border-[#D4AF37] bg-[#FFFBEA] shadow-md' : 'border-[#E5E5E5] bg-white shadow-sm'} p-4 md:p-8 flex flex-col justify-between items-center relative transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg ${className} min-h-[500px] md:min-h-[600px]`}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
    >
      {isPopular && (
        <span className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 px-3 md:px-4 py-1 rounded-full bg-[#D4AF37] text-white text-xs font-semibold shadow" role="status">
          Most Popular
        </span>
      )}
      <div className="w-full flex flex-col items-center text-center">
        <h3 className="text-lg md:text-xl font-bold mb-2 text-[#2C6E91]">{title}</h3>
        <div className="mb-4">
          <span className="text-3xl md:text-4xl font-bold text-[#2C6E91]">£{price}</span>
          <span className="text-[#3B755D] ml-1">/{period}</span>
        </div>
        <p className="text-sm md:text-base text-[#3B755D] mb-6">{description}</p>
        
        <ul className="space-y-2 md:space-y-3 mb-6 w-full">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm md:text-base text-[#3B755D]">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-[#5DA271] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Container - Always at bottom */}
      <div className="flex-1 flex flex-col justify-end w-full mt-6">
        {isPopular && (
          <div className="text-center mb-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#D4AF37] text-white text-xs font-semibold rounded-full">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Recommended for you
            </span>
          </div>
        )}
        
        {href ? (
          <Link
            href={href}
            className={`w-full py-3 md:py-4 px-4 md:px-6 rounded-lg font-semibold text-sm md:text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#3A7CA5] focus:ring-offset-2 ${buttonClassName || 'bg-[#3A7CA5] hover:bg-[#2C6E91] text-white shadow-md hover:shadow-lg'}`}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedby}
          >
            {buttonText}
          </Link>
        ) : (
          <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full py-3 md:py-4 px-4 md:px-6 rounded-lg font-semibold text-sm md:text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#3A7CA5] focus:ring-offset-2 ${buttonClassName || 'bg-[#3A7CA5] hover:bg-[#2C6E91] text-white shadow-md hover:shadow-lg'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedby}
          >
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
} 