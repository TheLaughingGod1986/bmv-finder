'use client';

import { useState } from 'react';
import { useToast } from './ToastProvider';

interface StripeCheckoutButtonProps {
  userId: string;
  priceId: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export default function StripeCheckoutButton({ 
  userId, 
  priceId, 
  children, 
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false
}: StripeCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleCheckout = async () => {
    if (!userId || !priceId || loading || disabled) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, priceId }),
      });
      
      const data = await res.json();
      
      if (data.url) {
        showToast({
          type: 'success',
          title: 'Redirecting to Checkout',
          message: 'You will be redirected to complete your purchase.'
        });
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to start checkout.");
      }
          } catch (error: unknown) {
              // Checkout error
      showToast({
        type: 'error',
        title: 'Checkout Error',
        message: error.message || 'Failed to start checkout. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-blue text-white hover:bg-primary-blue-dark focus:ring-primary-blue',
    secondary: 'bg-primary-green text-white hover:bg-primary-green-dark focus:ring-primary-green',
    success: 'bg-primary-green text-white hover:bg-primary-green-dark focus:ring-primary-green',
    outline: 'border-2 border-primary-blue text-primary-blue hover:bg-primary-blue hover:text-white focus:ring-primary-blue'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`;

  const buttonContent = loading ? (
    <div className="flex items-center gap-2">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      Processing...
    </div>
  ) : (
    children
  );

  return (
    <button 
      onClick={handleCheckout}
      disabled={disabled || loading}
      className={classes}
    >
      {buttonContent}
    </button>
  );
} 