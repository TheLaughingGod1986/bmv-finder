'use client';

import { useState, useEffect, useRef, ReactNode, ComponentType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LazyLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  delay?: number;
  className?: string;
}

// Intersection Observer based lazy loading
export function LazyLoader({ 
  children, 
  fallback = <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-32" />,
  threshold = 0.1,
  rootMargin = '50px',
  delay = 0,
  className = ''
}: LazyLoaderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
            setHasLoaded(true);
          }, delay);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, delay]);

  return (
    <div ref={elementRef} className={className}>
      <AnimatePresence mode="wait">
        {!hasLoaded ? (
          <motion.div
            key="fallback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {fallback}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Higher-order component for lazy loading components
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) {
  return function LazyLoadedComponent(props: P) {
    return (
      <LazyLoader fallback={fallback}>
        <Component {...props} />
      </LazyLoader>
    );
  };
}

// Image lazy loading component
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({ 
  src, 
  alt, 
  className = '', 
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+',
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
      onLoad?.();
    };
    img.onerror = () => {
      setHasError(true);
      onError?.();
    };
    img.src = src;
  }, [src, onLoad, onError]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={currentSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${hasError ? 'opacity-50' : ''}`}
        style={{ 
          position: isLoaded ? 'static' : 'absolute',
          top: isLoaded ? 'auto' : 0,
          left: isLoaded ? 'auto' : 0,
        }}
      />
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 dark:text-gray-500 text-sm">Loading...</div>
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-gray-400 dark:text-gray-500 text-sm">Failed to load</div>
        </div>
      )}
    </div>
  );
}

// Virtual scrolling for large lists
interface VirtualScrollProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => ReactNode;
  className?: string;
}

export function VirtualScroll({ 
  items, 
  itemHeight, 
  containerHeight, 
  renderItem, 
  className = '' 
}: VirtualScrollProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => 
            renderItem(item, visibleStart + index)
          )}
        </div>
      </div>
    </div>
  );
}

// Progressive loading for data
interface ProgressiveLoaderProps {
  data: any[];
  batchSize?: number;
  delay?: number;
  children: (items: any[], isLoading: boolean, hasMore: boolean) => ReactNode;
}

export function ProgressiveLoader({ 
  data, 
  batchSize = 10, 
  delay = 100,
  children 
}: ProgressiveLoaderProps) {
  const [loadedItems, setLoadedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= data.length) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      const nextBatch = data.slice(currentIndex, currentIndex + batchSize);
      setLoadedItems(prev => [...prev, ...nextBatch]);
      setCurrentIndex(prev => prev + batchSize);
    }, delay);

    return () => clearTimeout(timer);
  }, [currentIndex, data, batchSize, delay]);

  const hasMore = currentIndex < data.length;

  return (
    <>
      {children(loadedItems, isLoading, hasMore)}
    </>
  );
}

// Debounced search component
interface DebouncedSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}

export function DebouncedSearch({ 
  onSearch, 
  placeholder = 'Search...', 
  delay = 300,
  className = '' 
}: DebouncedSearchProps) {
  const [query, setQuery] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onSearch(query);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, onSearch, delay]);

  return (
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder={placeholder}
      className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${className}`}
    />
  );
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderStart = useRef<number>();
  const renderCount = useRef(0);

  useEffect(() => {
    renderStart.current = performance.now();
    renderCount.current++;

    return () => {
      if (renderStart.current) {
        const renderTime = performance.now() - renderStart.current;
        if (renderTime > 16) { // More than one frame (16ms)
          console.warn(`Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }
      }
    };
  });

  return {
    renderCount: renderCount.current,
  };
}
