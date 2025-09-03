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
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-target transform hover:scale-[1.02] active:scale-[0.98]',
    {
      // Size variants with better spacing
      'px-4 py-2.5 text-sm gap-2': size === 'sm',
      'px-6 py-3 text-sm gap-2': size === 'md',
      'px-8 py-4 text-base gap-3': size === 'lg',
      'px-10 py-5 text-lg gap-3': size === 'xl',
      
      // Width variants
      'w-full': fullWidth,
      
      // Mobile optimization
      'min-h-[48px] min-w-[48px]': mobileOptimized,
      'sm:min-h-auto sm:min-w-auto': mobileOptimized,
      
      // Enhanced variant styles with better shadows and gradients
      'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-300 shadow-lg hover:shadow-xl': variant === 'primary',
      'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 focus:ring-emerald-300 shadow-lg hover:shadow-xl': variant === 'secondary',
      'border-2 border-gray-300 bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-400 focus:ring-blue-300 shadow-md hover:shadow-lg': variant === 'outline',
      'bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:ring-blue-300': variant === 'ghost',
      'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-300 shadow-lg hover:shadow-xl': variant === 'danger',
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