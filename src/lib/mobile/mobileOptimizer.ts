import { auditLogger } from '../audit/auditLogger';

export interface MobileDeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  screenSize: {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
  };
  capabilities: {
    touch: boolean;
    geolocation: boolean;
    camera: boolean;
    accelerometer: boolean;
    gyroscope: boolean;
    vibration: boolean;
  };
  browser: {
    name: string;
    version: string;
    isWebView: boolean;
  };
  connection: {
    type: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'ethernet' | 'unknown';
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
}

export interface MobileOptimizationConfig {
  enableImageOptimization: boolean;
  enableLazyLoading: boolean;
  enableTouchGestures: boolean;
  enableHapticFeedback: boolean;
  enableGeolocation: boolean;
  enableOfflineMode: boolean;
  enablePushNotifications: boolean;
  imageQuality: 'low' | 'medium' | 'high';
  maxImageSize: number;
  lazyLoadThreshold: number;
  touchSensitivity: number;
  hapticIntensity: 'light' | 'medium' | 'strong';
}

export interface TouchGesture {
  type: 'swipe' | 'pinch' | 'pan' | 'tap' | 'longpress' | 'doubletap';
  direction?: 'up' | 'down' | 'left' | 'right';
  threshold: number;
  callback: (event: TouchEvent, data: any) => void;
}

export interface MobilePerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
  memoryUsage: number;
  batteryLevel?: number;
  networkLatency: number;
  cacheHitRate: number;
}

export class MobileOptimizer {
  private static instance: MobileOptimizer;
  private deviceInfo: MobileDeviceInfo | null = null;
  private config: MobileOptimizationConfig;
  private touchGestures: Map<string, TouchGesture> = new Map();
  private performanceMetrics: MobilePerformanceMetrics | null = null;
  private imageObserver: IntersectionObserver | null = null;
  private connectionMonitor: any = null;

  private constructor() {
    this.config = {
      enableImageOptimization: true,
      enableLazyLoading: true,
      enableTouchGestures: true,
      enableHapticFeedback: true,
      enableGeolocation: true,
      enableOfflineMode: true,
      enablePushNotifications: true,
      imageQuality: 'medium',
      maxImageSize: 1920,
      lazyLoadThreshold: 100,
      touchSensitivity: 50,
      hapticIntensity: 'medium'
    };

    this.initializeDeviceDetection();
    this.initializePerformanceMonitoring();
    this.initializeTouchGestures();
    this.initializeImageOptimization();
    this.initializeConnectionMonitoring();
  }

  public static getInstance(): MobileOptimizer {
    if (!MobileOptimizer.instance) {
      MobileOptimizer.instance = new MobileOptimizer();
    }
    return MobileOptimizer.instance;
  }

  // Initialize device detection
  private initializeDeviceDetection(): void {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent;
    const screen = window.screen;
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    this.deviceInfo = {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isTablet: /iPad|Android(?=.*Tablet)|Kindle|Silk/i.test(userAgent),
      isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      deviceType: this.determineDeviceType(userAgent),
      screenSize: {
        width: screen.width,
        height: screen.height,
        orientation: screen.width > screen.height ? 'landscape' : 'portrait'
      },
      capabilities: {
        touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        geolocation: 'geolocation' in navigator,
        camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        accelerometer: 'DeviceMotionEvent' in window,
        gyroscope: 'DeviceOrientationEvent' in window,
        vibration: 'vibrate' in navigator
      },
      browser: {
        name: this.getBrowserName(userAgent),
        version: this.getBrowserVersion(userAgent),
        isWebView: /wv|WebView/i.test(userAgent)
      },
      connection: {
        type: connection?.effectiveType || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0
      }
    };

    // Apply device-specific optimizations
    this.applyDeviceOptimizations();
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
    
    // Monitor battery level (if available)
    this.monitorBatteryLevel();
    
    // Monitor network performance
    this.monitorNetworkPerformance();
  }

  // Initialize touch gestures
  private initializeTouchGestures(): void {
    if (typeof window === 'undefined' || !this.config.enableTouchGestures) return;

    // Add default touch gestures
    this.addTouchGesture({
      type: 'swipe',
      direction: 'left',
      threshold: this.config.touchSensitivity,
      callback: this.handleSwipeLeft.bind(this)
    });

    this.addTouchGesture({
      type: 'swipe',
      direction: 'right',
      threshold: this.config.touchSensitivity,
      callback: this.handleSwipeRight.bind(this)
    });

    this.addTouchGesture({
      type: 'swipe',
      direction: 'up',
      threshold: this.config.touchSensitivity,
      callback: this.handleSwipeUp.bind(this)
    });

    this.addTouchGesture({
      type: 'swipe',
      direction: 'down',
      threshold: this.config.touchSensitivity,
      callback: this.handleSwipeDown.bind(this)
    });

    this.addTouchGesture({
      type: 'longpress',
      threshold: 500,
      callback: this.handleLongPress.bind(this)
    });

    this.addTouchGesture({
      type: 'doubletap',
      threshold: 300,
      callback: this.handleDoubleTap.bind(this)
    });
  }

  // Initialize image optimization
  private initializeImageOptimization(): void {
    if (typeof window === 'undefined' || !this.config.enableImageOptimization) return;

    // Create intersection observer for lazy loading
    this.imageObserver = new IntersectionObserver(
      this.handleImageIntersection.bind(this),
      {
        rootMargin: `${this.config.lazyLoadThreshold}px`,
        threshold: 0.1
      }
    );

    // Observe all images
    this.observeImages();
  }

  // Initialize connection monitoring
  private initializeConnectionMonitoring(): void {
    if (typeof window === 'undefined') return;

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', this.handleConnectionChange.bind(this));
    }
  }

  // Public methods
  public getDeviceInfo(): MobileDeviceInfo | null {
    return this.deviceInfo;
  }

  public getPerformanceMetrics(): MobilePerformanceMetrics | null {
    return this.performanceMetrics;
  }

  public updateConfig(newConfig: Partial<MobileOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.applyDeviceOptimizations();
  }

  public addTouchGesture(gesture: TouchGesture): void {
    const key = `${gesture.type}_${gesture.direction || 'any'}`;
    this.touchGestures.set(key, gesture);
  }

  public removeTouchGesture(type: string, direction?: string): void {
    const key = `${type}_${direction || 'any'}`;
    this.touchGestures.delete(key);
  }

  public triggerHapticFeedback(intensity: 'light' | 'medium' | 'strong' = 'medium'): void {
    if (!this.config.enableHapticFeedback || !this.deviceInfo?.capabilities.vibration) return;

    const patterns = {
      light: [10],
      medium: [20],
      strong: [50]
    };

    navigator.vibrate(patterns[intensity]);
  }

  public optimizeImage(src: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  } = {}): string {
    if (!this.config.enableImageOptimization) return src;

    const { width, height, quality, format } = options;
    const deviceInfo = this.getDeviceInfo();
    
    // Determine optimal image parameters based on device
    const optimalWidth = width || this.getOptimalImageWidth();
    const optimalHeight = height || this.getOptimalImageHeight();
    const optimalQuality = quality || this.getOptimalImageQuality();
    const optimalFormat = format || this.getOptimalImageFormat();

    // Generate optimized image URL (this would integrate with your image service)
    return this.generateOptimizedImageUrl(src, {
      width: optimalWidth,
      height: optimalHeight,
      quality: optimalQuality,
      format: optimalFormat
    });
  }

  public enableOfflineMode(): void {
    if (!this.config.enableOfflineMode) return;

    // Register service worker for offline functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered for offline mode');
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }

  public requestGeolocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!this.config.enableGeolocation || !this.deviceInfo?.capabilities.geolocation) {
        reject(new Error('Geolocation not available'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          this.triggerHapticFeedback('light');
          resolve(position);
        },
        error => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }

  public requestPushNotificationPermission(): Promise<NotificationPermission> {
    return new Promise((resolve, reject) => {
      if (!this.config.enablePushNotifications || !('Notification' in window)) {
        reject(new Error('Push notifications not supported'));
        return;
      }

      if (Notification.permission === 'granted') {
        resolve('granted');
        return;
      }

      if (Notification.permission === 'denied') {
        reject(new Error('Push notifications denied'));
        return;
      }

      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.triggerHapticFeedback('medium');
        }
        resolve(permission);
      });
    });
  }

  // Private helper methods
  private determineDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
    if (/iPad|Android(?=.*Tablet)|Kindle|Silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getBrowserName(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  private getBrowserVersion(userAgent: string): string {
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+\.\d+)/);
    return match ? match[2] : 'Unknown';
  }

  private applyDeviceOptimizations(): void {
    if (!this.deviceInfo) return;

    // Apply device-specific CSS classes
    document.documentElement.classList.add(`device-${this.deviceInfo.deviceType}`);
    document.documentElement.classList.add(`orientation-${this.deviceInfo.screenSize.orientation}`);
    
    if (this.deviceInfo.capabilities.touch) {
      document.documentElement.classList.add('touch-device');
    }

    // Adjust image quality based on connection
    if (this.deviceInfo.connection.effectiveType === 'slow-2g' || this.deviceInfo.connection.effectiveType === '2g') {
      this.config.imageQuality = 'low';
    } else if (this.deviceInfo.connection.effectiveType === '3g') {
      this.config.imageQuality = 'medium';
    } else {
      this.config.imageQuality = 'high';
    }

    // Adjust touch sensitivity based on device
    if (this.deviceInfo.deviceType === 'mobile') {
      this.config.touchSensitivity = 30;
    } else if (this.deviceInfo.deviceType === 'tablet') {
      this.config.touchSensitivity = 50;
    }
  }

  private observeWebVitals(): void {
    // Observe Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (this.performanceMetrics) {
          this.performanceMetrics.largestContentfulPaint = lastEntry.startTime;
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Observe First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (this.performanceMetrics) {
            this.performanceMetrics.firstInputDelay = entry.processingStart - entry.startTime;
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Observe Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        if (this.performanceMetrics) {
          this.performanceMetrics.cumulativeLayoutShift = clsValue;
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (this.performanceMetrics) {
        this.performanceMetrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      }
    }
  }

  private monitorBatteryLevel(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        if (this.performanceMetrics) {
          this.performanceMetrics.batteryLevel = battery.level * 100;
        }
      });
    }
  }

  private monitorNetworkPerformance(): void {
    if ('PerformanceObserver' in window) {
      const networkObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.entryType === 'navigation') {
            if (this.performanceMetrics) {
              this.performanceMetrics.loadTime = entry.loadEventEnd - entry.loadEventStart;
              this.performanceMetrics.firstContentfulPaint = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
              this.performanceMetrics.timeToInteractive = entry.domInteractive - entry.navigationStart;
            }
          }
        });
      });
      networkObserver.observe({ entryTypes: ['navigation'] });
    }
  }

  private handleImageIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        this.loadOptimizedImage(img);
        this.imageObserver?.unobserve(img);
      }
    });
  }

  private observeImages(): void {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      this.imageObserver?.observe(img);
    });
  }

  private loadOptimizedImage(img: HTMLImageElement): void {
    const src = img.getAttribute('data-src');
    if (src) {
      const optimizedSrc = this.optimizeImage(src);
      img.src = optimizedSrc;
      img.removeAttribute('data-src');
    }
  }

  private handleConnectionChange(): void {
    const connection = (navigator as any).connection;
    if (connection && this.deviceInfo) {
      this.deviceInfo.connection = {
        type: connection.effectiveType,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      };
      this.applyDeviceOptimizations();
    }
  }

  private getOptimalImageWidth(): number {
    if (!this.deviceInfo) return 800;
    
    const screenWidth = this.deviceInfo.screenSize.width;
    const pixelRatio = window.devicePixelRatio || 1;
    
    return Math.min(screenWidth * pixelRatio, this.config.maxImageSize);
  }

  private getOptimalImageHeight(): number {
    if (!this.deviceInfo) return 600;
    
    const screenHeight = this.deviceInfo.screenSize.height;
    const pixelRatio = window.devicePixelRatio || 1;
    
    return Math.min(screenHeight * pixelRatio, this.config.maxImageSize);
  }

  private getOptimalImageQuality(): number {
    const qualityMap = {
      low: 60,
      medium: 80,
      high: 95
    };
    
    return qualityMap[this.config.imageQuality];
  }

  private getOptimalImageFormat(): 'webp' | 'jpeg' | 'png' {
    // Check if browser supports WebP
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0 ? 'webp' : 'jpeg';
  }

  private generateOptimizedImageUrl(src: string, options: any): string {
    // This would integrate with your image optimization service
    // For now, return the original src
    return src;
  }

  // Touch gesture handlers
  private handleSwipeLeft(event: TouchEvent, data: any): void {
    this.triggerHapticFeedback('light');
    // Implement swipe left logic
  }

  private handleSwipeRight(event: TouchEvent, data: any): void {
    this.triggerHapticFeedback('light');
    // Implement swipe right logic
  }

  private handleSwipeUp(event: TouchEvent, data: any): void {
    this.triggerHapticFeedback('light');
    // Implement swipe up logic
  }

  private handleSwipeDown(event: TouchEvent, data: any): void {
    this.triggerHapticFeedback('light');
    // Implement swipe down logic
  }

  private handleLongPress(event: TouchEvent, data: any): void {
    this.triggerHapticFeedback('medium');
    // Implement long press logic
  }

  private handleDoubleTap(event: TouchEvent, data: any): void {
    this.triggerHapticFeedback('light');
    // Implement double tap logic
  }
}

// Export singleton instance
export const mobileOptimizer = MobileOptimizer.getInstance();
