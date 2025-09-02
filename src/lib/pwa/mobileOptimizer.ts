'use client';

import { useState, useEffect } from 'react';

interface MobileOptimizationConfig {
  enableTouchGestures: boolean;
  enableHapticFeedback: boolean;
  enableSwipeNavigation: boolean;
  enablePullToRefresh: boolean;
  enableOfflineMode: boolean;
  enableBackgroundSync: boolean;
  enablePushNotifications: boolean;
  enableAppShortcuts: boolean;
}

interface TouchGesture {
  type: 'swipe' | 'pinch' | 'tap' | 'longpress';
  direction?: 'left' | 'right' | 'up' | 'down';
  threshold: number;
  callback: () => void;
}

class MobileOptimizer {
  private config: MobileOptimizationConfig;
  private gestures: TouchGesture[] = [];
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private isOnline: boolean = true;
  private deferredActions: (() => void)[] = [];

  constructor(config: Partial<MobileOptimizationConfig> = {}) {
    this.config = {
      enableTouchGestures: true,
      enableHapticFeedback: true,
      enableSwipeNavigation: true,
      enablePullToRefresh: true,
      enableOfflineMode: true,
      enableBackgroundSync: true,
      enablePushNotifications: true,
      enableAppShortcuts: true,
      ...config,
    };

    this.initializeMobileFeatures();
  }

  private initializeMobileFeatures(): void {
    if (typeof window === 'undefined') return;

    // Initialize touch gestures
    if (this.config.enableTouchGestures) {
      this.setupTouchGestures();
    }

    // Initialize online/offline detection
    if (this.config.enableOfflineMode) {
      this.setupOfflineDetection();
    }

    // Initialize pull-to-refresh
    if (this.config.enablePullToRefresh) {
      this.setupPullToRefresh();
    }

    // Initialize app shortcuts
    if (this.config.enableAppShortcuts) {
      this.setupAppShortcuts();
    }

    // Initialize viewport optimization
    this.optimizeViewport();
  }

  // Touch gesture handling
  private setupTouchGestures(): void {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    document.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const deltaTime = Date.now() - touchStartTime;

      // Detect swipe gestures
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50 && deltaTime < 300) {
        const direction = deltaX > 0 ? 'right' : 'left';
        this.handleSwipe(direction);
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50 && deltaTime < 300) {
        const direction = deltaY > 0 ? 'down' : 'up';
        this.handleSwipe(direction);
      }

      // Detect tap gestures
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
        this.handleTap();
      }

      // Detect long press
      if (deltaTime > 500) {
        this.handleLongPress();
      }
    }, { passive: true });
  }

  private handleSwipe(direction: 'left' | 'right' | 'up' | 'down'): void {
    const gesture = this.gestures.find(g => g.type === 'swipe' && g.direction === direction);
    if (gesture) {
      this.triggerHapticFeedback('light');
      gesture.callback();
    }
  }

  private handleTap(): void {
    const gesture = this.gestures.find(g => g.type === 'tap');
    if (gesture) {
      this.triggerHapticFeedback('light');
      gesture.callback();
    }
  }

  private handleLongPress(): void {
    const gesture = this.gestures.find(g => g.type === 'longpress');
    if (gesture) {
      this.triggerHapticFeedback('medium');
      gesture.callback();
    }
  }

  // Add custom gesture
  addGesture(gesture: TouchGesture): void {
    this.gestures.push(gesture);
  }

  // Haptic feedback
  private triggerHapticFeedback(intensity: 'light' | 'medium' | 'heavy' = 'light'): void {
    if (!this.config.enableHapticFeedback) return;

    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
      };
      navigator.vibrate(patterns[intensity]);
    }
  }

  // Online/offline detection
  private setupOfflineDetection(): void {
    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnlineStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOnlineStatusChange(false);
    });
  }

  private handleOnlineStatusChange(isOnline: boolean): void {
    if (isOnline) {
      // Process deferred actions
      this.deferredActions.forEach(action => action());
      this.deferredActions = [];
      
      // Show online notification
      this.showNotification('You are back online', 'success');
    } else {
      // Show offline notification
      this.showNotification('You are offline. Some features may be limited.', 'warning');
    }
  }

  // Defer action until online
  deferUntilOnline(action: () => void): void {
    if (this.isOnline) {
      action();
    } else {
      this.deferredActions.push(action);
    }
  }

  // Pull-to-refresh
  private setupPullToRefresh(): void {
    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    let pullElement: HTMLElement | null = null;

    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!isPulling) return;

      currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;

      if (pullDistance > 0) {
        e.preventDefault();
        
        if (pullDistance > 100) {
          this.triggerHapticFeedback('medium');
          this.showPullToRefreshIndicator(pullDistance);
        }
      }
    }, { passive: false });

    document.addEventListener('touchend', () => {
      if (isPulling && currentY - startY > 100) {
        this.triggerPullToRefresh();
      }
      
      isPulling = false;
      this.hidePullToRefreshIndicator();
    }, { passive: true });
  }

  private showPullToRefreshIndicator(distance: number): void {
    // Create or update pull-to-refresh indicator
    let indicator = document.getElementById('pull-to-refresh-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'pull-to-refresh-indicator';
      indicator.className = 'fixed top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 z-50 transform -translate-y-full transition-transform duration-200';
      indicator.innerHTML = 'Pull to refresh';
      document.body.appendChild(indicator);
    }

    const progress = Math.min(distance / 100, 1);
    indicator.style.transform = `translateY(${(progress - 1) * 100}%)`;
  }

  private hidePullToRefreshIndicator(): void {
    const indicator = document.getElementById('pull-to-refresh-indicator');
    if (indicator) {
      indicator.style.transform = 'translateY(-100%)';
      setTimeout(() => indicator.remove(), 200);
    }
  }

  private triggerPullToRefresh(): void {
    this.triggerHapticFeedback('heavy');
    window.location.reload();
  }

  // App shortcuts
  private setupAppShortcuts(): void {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // Register service worker for app shortcuts
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered for app shortcuts');
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }

  // Viewport optimization
  private optimizeViewport(): void {
    // Set viewport meta tag for optimal mobile experience
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }
    
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');

    // Handle safe area insets for devices with notches
    this.handleSafeAreaInsets();
  }

  private handleSafeAreaInsets(): void {
    // Add CSS custom properties for safe area insets
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --safe-area-inset-top: env(safe-area-inset-top);
        --safe-area-inset-right: env(safe-area-inset-right);
        --safe-area-inset-bottom: env(safe-area-inset-bottom);
        --safe-area-inset-left: env(safe-area-inset-left);
      }
      
      .safe-area-top {
        padding-top: var(--safe-area-inset-top);
      }
      
      .safe-area-bottom {
        padding-bottom: var(--safe-area-inset-bottom);
      }
      
      .safe-area-left {
        padding-left: var(--safe-area-inset-left);
      }
      
      .safe-area-right {
        padding-right: var(--safe-area-inset-right);
      }
    `;
    document.head.appendChild(style);
  }

  // Notification system
  private showNotification(message: string, type: 'success' | 'warning' | 'error' = 'success'): void {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-black' :
      'bg-red-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Mobile-specific utilities
  isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  isIOS(): boolean {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  isAndroid(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android/.test(navigator.userAgent);
  }

  getDevicePixelRatio(): number {
    if (typeof window === 'undefined') return 1;
    return window.devicePixelRatio || 1;
  }

  // Performance optimizations for mobile
  optimizeForMobile(): void {
    // Reduce animations on low-end devices
    if (this.getDevicePixelRatio() < 2) {
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
    }

    // Optimize touch targets
    this.optimizeTouchTargets();

    // Enable passive event listeners
    this.enablePassiveEventListeners();
  }

  private optimizeTouchTargets(): void {
    // Ensure all interactive elements have minimum touch target size
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        element.style.minWidth = '44px';
        element.style.minHeight = '44px';
      }
    });
  }

  private enablePassiveEventListeners(): void {
    // Enable passive event listeners for better scroll performance
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (typeof options === 'boolean') {
        options = { capture: options };
      }
      if (options && !options.passive && (type === 'touchstart' || type === 'touchmove')) {
        options.passive = true;
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
  }

  // PWA installation
  async installPWA(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('PWA installed successfully');
        return true;
      } catch (error) {
        console.error('PWA installation failed:', error);
        return false;
      }
    }
    return false;
  }

  // Background sync
  async enableBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('background-sync');
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<MobileOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initializeMobileFeatures();
  }

  // Get current configuration
  getConfig(): MobileOptimizationConfig {
    return { ...this.config };
  }
}

// Global mobile optimizer instance
export const mobileOptimizer = new MobileOptimizer();

// React hook for mobile optimization
export function useMobileOptimization() {
  const [isMobile, setIsMobile] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsMobile(mobileOptimizer.isMobile());
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isMobile,
    isOnline,
    isIOS: mobileOptimizer.isIOS(),
    isAndroid: mobileOptimizer.isAndroid(),
    devicePixelRatio: mobileOptimizer.getDevicePixelRatio(),
    addGesture: (gesture: TouchGesture) => mobileOptimizer.addGesture(gesture),
    triggerHapticFeedback: (intensity?: 'light' | 'medium' | 'heavy') => 
      mobileOptimizer['triggerHapticFeedback'](intensity),
    deferUntilOnline: (action: () => void) => mobileOptimizer.deferUntilOnline(action),
  };
}
