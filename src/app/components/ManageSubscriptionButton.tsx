'use client';

import { useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { useToast } from './ToastProvider';

interface ManageSubscriptionButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export default function ManageSubscriptionButton({ 
  children, 
  variant = 'outline',
  size = 'md',
  className = '',
  disabled = false
}: ManageSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const session = useSession();

  const handleManageSubscription = async () => {
    if (loading || disabled) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/create-customer-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      if (data.url) {
        showToast({
          type: 'success',
          title: 'Opening Portal',
          message: 'Redirecting to Stripe Customer Portal...'
        });
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'No portal URL received');
      }
          } catch (err: unknown) {
              // Manage subscription error
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to open Stripe Customer Portal'
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
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      Opening Portal...
    </div>
  ) : (
    children
  );

  return (
    <button 
      onClick={handleManageSubscription}
      disabled={disabled || loading}
      className={classes}
    >
      {buttonContent}
    </button>
  );
} 