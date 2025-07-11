'use client';

import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  href, 
  onClick, 
  type = 'button',
  disabled = false,
  className = '',
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  'aria-expanded': ariaExpanded,
  'aria-pressed': ariaPressed
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-[#3A7CA5] text-white hover:bg-[#2C6E91] focus:ring-[#3A7CA5]',
    secondary: 'bg-[#5DA271] text-white hover:bg-[#3B755D] focus:ring-[#5DA271]',
    success: 'bg-[#5DA271] text-white hover:bg-[#3B755D] focus:ring-[#5DA271]',
    outline: 'border-2 border-[#3A7CA5] text-[#3A7CA5] hover:bg-[#3A7CA5] hover:text-white focus:ring-[#3A7CA5]'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Add hover and focus animations
  const animationClasses = 'transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 focus:scale-105';
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${animationClasses} ${className}`;
  
  if (href) {
    return (
      <Link 
        href={href} 
        className={classes}
        id={id}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        aria-expanded={ariaExpanded}
        aria-pressed={ariaPressed}
      >
        {children}
      </Link>
    );
  }
  
  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      id={id}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      aria-expanded={ariaExpanded}
      aria-pressed={ariaPressed}
    >
      {children}
    </button>
  );
} 