'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastIcon = ({ type }: { type: ToastType }) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
  };
  return icons[type];
};

const ToastItem = ({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) => {
  const colors = {
    success: {
      bg: 'bg-white',
      border: 'border-green-300',
      icon: 'text-green-600',
      title: 'text-green-800',
      message: 'text-green-700',
    },
    error: {
      bg: 'bg-white',
      border: 'border-red-300',
      icon: 'text-red-600',
      title: 'text-red-800',
      message: 'text-red-700',
    },
    info: {
      bg: 'bg-white',
      border: 'border-blue-300',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      message: 'text-blue-700',
    },
    warning: {
      bg: 'bg-white',
      border: 'border-yellow-300',
      icon: 'text-yellow-600',
      title: 'text-yellow-800',
      message: 'text-yellow-700',
    },
  };

  const colorScheme = colors[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        'relative p-4 rounded-lg border-2 shadow-xl max-w-sm w-full bg-white',
        colorScheme.border
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex-shrink-0', colorScheme.icon)}>
          <ToastIcon type={toast.type} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={cn('font-semibold text-sm', colorScheme.title)}>
            {toast.title}
          </h4>
          {toast.message && (
            <p className={cn('text-sm mt-1', colorScheme.message)}>
              {toast.message}
            </p>
          )}
        </div>
        
        <button
          onClick={() => onClose(toast.id)}
          className={cn(
            'flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors',
            colorScheme.icon
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      hideToast(id);
    }, duration);
  }, [hideToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-popover space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onClose={hideToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}; 