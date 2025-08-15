'use client';


import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  fullWidth?: boolean;
  mobileOptimized?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  loading = false,
  fullWidth = false,
  mobileOptimized = true,
  disabled,
  ...props
}) => {
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-target',
    {
      // Size variants
      'px-3 py-2 text-sm': size === 'sm',
      'px-4 py-2.5 text-sm': size === 'md',
      'px-6 py-3 text-base': size === 'lg',
      'px-8 py-4 text-lg': size === 'xl',
      
      // Width variants
      'w-full': fullWidth,
      
      // Mobile optimization
      'min-h-[44px] min-w-[44px]': mobileOptimized,
      'sm:min-h-auto sm:min-w-auto': mobileOptimized,
      
      // Variant styles
      'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-soft': variant === 'primary',
      'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500 shadow-soft': variant === 'secondary',
      'border border-gray-300 bg-white text-text-primary hover:bg-gray-50 focus:ring-primary-500': variant === 'outline',
      'bg-transparent text-text-primary hover:bg-gray-100 focus:ring-primary-500': variant === 'ghost',
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-soft': variant === 'danger',
    },
    className
  );

  return (
    <button
      className={baseClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button; 