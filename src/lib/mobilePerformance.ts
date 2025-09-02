// Mobile performance optimization utilities

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkRequests: number;
  cacheHitRate: number;
}

interface LazyLoadOptions {
  rootMargin?: string;
  threshold?: number;
  placeholder?: string;
}

class MobilePerformanceOptimizer {
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkRequests: 0,
    cacheHitRate: 0
  };

  private observers: Map<string, IntersectionObserver> = new Map();
  private imageCache: Map<string, string> = new Map();

  constructor() {
    this.initializePerformanceMonitoring();
    this.optimizeForMobile();
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor page load performance
    window.addEventListener('load', () => {
      this.measurePageLoadTime();
      this.measureMemoryUsage();
    });

    // Monitor network performance
    this.monitorNetworkPerformance();

    // Monitor scroll performance
    this.optimizeScrollPerformance();
  }

  // Optimize for mobile devices
  private optimizeForMobile() {
    if (typeof window === 'undefined') return;

    // Detect mobile device
    const isMobile = this.isMobileDevice();
    
    if (isMobile) {
      // Optimize viewport
      this.optimizeViewport();
      
      // Optimize touch interactions
      this.optimizeTouchInteractions();
      
      // Optimize images
      this.optimizeImages();
      
      // Optimize fonts
      this.optimizeFonts();
    }
  }

  // Lazy loading for images
  lazyLoadImages(options: LazyLoadOptions = {}): void {
    if (typeof window === 'undefined') return;

    const {
      rootMargin = '50px',
      threshold = 0.1,
      placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+'
    } = options;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            observer.unobserve(img);
          }
        });
      },
      { rootMargin, threshold }
    );

    // Observe all images with data-src attribute
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach((img) => observer.observe(img));

    this.observers.set('images', observer);
  }

  // Lazy loading for components
  lazyLoadComponents(selector: string, options: LazyLoadOptions = {}): void {
    if (typeof window === 'undefined') return;

    const {
      rootMargin = '100px',
      threshold = 0.1
    } = options;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            this.loadComponent(element);
            observer.unobserve(element);
          }
        });
      },
      { rootMargin, threshold }
    );

    const lazyComponents = document.querySelectorAll(selector);
    lazyComponents.forEach((component) => observer.observe(component));

    this.observers.set('components', observer);
  }

  // Optimize scroll performance
  private optimizeScrollPerformance(): void {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Throttled scroll handling
          this.handleScrollOptimized();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  // Optimize touch interactions
  private optimizeTouchInteractions(): void {
    // Add touch-action CSS for better touch performance
    const style = document.createElement('style');
    style.textContent = `
      * {
        touch-action: manipulation;
      }
      
      .touch-optimized {
        -webkit-tap-highlight-color: transparent;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
      
      .smooth-scroll {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }
    `;
    document.head.appendChild(style);
  }

  // Optimize images for mobile
  private optimizeImages(): void {
    // Add responsive image loading
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      // Add error handling
      img.addEventListener('error', () => {
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+';
      });
    });
  }

  // Optimize fonts
  private optimizeFonts(): void {
    // Preload critical fonts
    const criticalFonts = [
      '/fonts/inter-var.woff2',
      '/fonts/inter-regular.woff2'
    ];

    criticalFonts.forEach((font) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  // Optimize viewport
  private optimizeViewport(): void {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
      );
    }
  }

  // Monitor network performance
  private monitorNetworkPerformance(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      connection.addEventListener('change', () => {
        this.handleConnectionChange(connection);
      });
    }
  }

  // Handle connection changes
  private handleConnectionChange(connection: any): void {
    const { effectiveType, downlink, rtt } = connection;
    
    // Adjust performance based on connection
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      this.enableLowBandwidthMode();
    } else if (effectiveType === '3g') {
      this.enableMediumBandwidthMode();
    } else {
      this.enableHighBandwidthMode();
    }
  }

  // Enable low bandwidth mode
  private enableLowBandwidthMode(): void {
    // Disable animations
    document.documentElement.style.setProperty('--animation-duration', '0ms');
    
    // Reduce image quality
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      if (img.src.includes('?')) {
        img.src = img.src.split('?')[0] + '?quality=50&format=webp';
      }
    });
  }

  // Enable medium bandwidth mode
  private enableMediumBandwidthMode(): void {
    // Reduce animation duration
    document.documentElement.style.setProperty('--animation-duration', '200ms');
  }

  // Enable high bandwidth mode
  private enableHighBandwidthMode(): void {
    // Full animations
    document.documentElement.style.setProperty('--animation-duration', '300ms');
  }

  // Measure page load time
  private measurePageLoadTime(): void {
    if ('performance' in window) {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.metrics.loadTime = perfData.loadEventEnd - perfData.loadEventStart;
    }
  }

  // Measure memory usage
  private measureMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    }
  }

  // Load image with caching
  private loadImage(img: HTMLImageElement): void {
    const src = img.getAttribute('data-src');
    if (!src) return;

    // Check cache first
    if (this.imageCache.has(src)) {
      img.src = this.imageCache.get(src)!;
      return;
    }

    // Load image
    const imageLoader = new Image();
    imageLoader.onload = () => {
      img.src = src;
      this.imageCache.set(src, src);
    };
    imageLoader.onerror = () => {
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+';
    };
    imageLoader.src = src;
  }

  // Load component
  private loadComponent(element: HTMLElement): void {
    const componentName = element.getAttribute('data-component');
    if (componentName) {
      // Dynamic component loading would go here
      element.classList.add('loaded');
    }
  }

  // Handle optimized scroll
  private handleScrollOptimized(): void {
    // Implement scroll optimizations
    const scrollY = window.scrollY;
    
    // Update scroll-dependent elements
    const elements = document.querySelectorAll('[data-scroll]');
    elements.forEach((element) => {
      const threshold = element.getAttribute('data-scroll-threshold') || '0';
      if (scrollY > parseInt(threshold)) {
        element.classList.add('scrolled');
      } else {
        element.classList.remove('scrolled');
      }
    });
  }

  // Detect mobile device
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  // Get performance metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Cleanup observers
  cleanup(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

// Singleton instance
export const mobilePerformanceOptimizer = new MobilePerformanceOptimizer();

// Export types
export type { PerformanceMetrics, LazyLoadOptions };
