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
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
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
      console.error('Stripe checkout error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to start checkout. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('STRIPE_SECRET_KEY')) {
          errorMessage = 'Payment system configuration error. Please contact support.';
        } else if (error.message.includes('Invalid priceId')) {
          errorMessage = 'Invalid subscription plan. Please refresh the page and try again.';
        } else if (error.message.includes('Missing userId')) {
          errorMessage = 'Authentication required. Please sign in and try again.';
        } else if (error.message.includes('HTTP 500')) {
          errorMessage = 'Payment system temporarily unavailable. Please try again in a few minutes.';
        } else {
          errorMessage = error.message;
        }
      }
      
      showToast({
        type: 'error',
        title: 'Checkout Error',
        message: errorMessage
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