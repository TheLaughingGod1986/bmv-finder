import { EventEmitter } from 'events';

// PWA installation prompt event interface
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// PWA manager class
export class PWAManager extends EventEmitter {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private isOnline = true;
  private updateAvailable = false;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    super();
    this.initialize();
  }

  // Initialize PWA features
  private initialize(): void {
    // Check if app is already installed
    this.checkInstallationStatus();

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt.bind(this));

    // Listen for appinstalled event
    window.addEventListener('appinstalled', this.handleAppInstalled.bind(this));

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Register service worker
    this.registerServiceWorker();

    // Check for updates
    this.checkForUpdates();
  }

  // Check if app is installed
  private checkInstallationStatus(): void {
    // Check if running in standalone mode (installed)
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone ||
                      document.referrer.includes('android-app://');

    if (this.isInstalled) {
      this.emit('installed');
    }
  }

  // Handle beforeinstallprompt event
  private handleBeforeInstallPrompt(event: BeforeInstallPromptEvent): void {
    console.log('PWA: Install prompt available');
    event.preventDefault();
    this.deferredPrompt = event;
    this.emit('install-prompt-available');
  }

  // Handle appinstalled event
  private handleAppInstalled(): void {
    console.log('PWA: App installed successfully');
    this.isInstalled = true;
    this.deferredPrompt = null;
    this.emit('installed');
  }

  // Handle online event
  private handleOnline(): void {
    console.log('PWA: App is online');
    this.isOnline = true;
    this.emit('online');
  }

  // Handle offline event
  private handleOffline(): void {
    console.log('PWA: App is offline');
    this.isOnline = false;
    this.emit('offline');
  }

  // Register service worker
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        this.serviceWorkerRegistration = registration;
        console.log('PWA: Service worker registered successfully');

        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('PWA: New service worker available');
                this.updateAvailable = true;
                this.emit('update-available');
              }
            });
          }
        });

        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

        this.emit('service-worker-registered');
      } catch (error) {
        console.error('PWA: Service worker registration failed:', error);
        this.emit('service-worker-error', error);
      }
    } else {
      console.log('PWA: Service worker not supported');
    }
  }

  // Handle service worker messages
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, payload } = event.data;
    
    switch (type) {
      case 'CACHE_UPDATED':
        this.emit('cache-updated', payload);
        break;
      case 'OFFLINE_ACTION_QUEUED':
        this.emit('offline-action-queued', payload);
        break;
      case 'SYNC_COMPLETED':
        this.emit('sync-completed', payload);
        break;
    }
  }

  // Check for app updates
  private async checkForUpdates(): Promise<void> {
    if (this.serviceWorkerRegistration) {
      try {
        await this.serviceWorkerRegistration.update();
      } catch (error) {
        console.error('PWA: Update check failed:', error);
      }
    }
  }

  // Show install prompt
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('PWA: Install prompt not available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted install prompt');
        this.emit('install-accepted');
        return true;
      } else {
        console.log('PWA: User dismissed install prompt');
        this.emit('install-dismissed');
        return false;
      }
    } catch (error) {
      console.error('PWA: Install prompt failed:', error);
      return false;
    } finally {
      this.deferredPrompt = null;
    }
  }

  // Update service worker
  async updateServiceWorker(): Promise<void> {
    if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.waiting) {
      // Tell the waiting service worker to skip waiting and become active
      this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to use the new service worker
      window.location.reload();
    }
  }

  // Clear all caches
  async clearCaches(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('PWA: All caches cleared');
      this.emit('caches-cleared');
    }
  }

  // Get cache storage info
  async getCacheInfo(): Promise<{
    totalSize: number;
    cacheNames: string[];
    entries: Array<{ name: string; size: number; entries: number }>;
  }> {
    if (!('caches' in window)) {
      return { totalSize: 0, cacheNames: [], entries: [] };
    }

    const cacheNames = await caches.keys();
    const entries = [];
    let totalSize = 0;

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      const size = await this.calculateCacheSize(cache);
      
      entries.push({
        name: cacheName,
        size,
        entries: keys.length
      });
      
      totalSize += size;
    }

    return {
      totalSize,
      cacheNames,
      entries
    };
  }

  // Calculate cache size
  private async calculateCacheSize(cache: Cache): Promise<number> {
    const keys = await cache.keys();
    let totalSize = 0;

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }

    return totalSize;
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('PWA: Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    this.emit('notification-permission-changed', permission);
    return permission;
  }

  // Show notification
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (Notification.permission !== 'granted') {
      console.log('PWA: Notification permission not granted');
      return;
    }

    const notification = new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    this.emit('notification-shown', notification);
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('PWA: Push notifications not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        )
      });

      console.log('PWA: Push subscription created');
      this.emit('push-subscribed', subscription);
      return subscription;
    } catch (error) {
      console.error('PWA: Push subscription failed:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        console.log('PWA: Push subscription removed');
        this.emit('push-unsubscribed');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('PWA: Push unsubscription failed:', error);
      return false;
    }
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get PWA status
  getStatus(): {
    isInstalled: boolean;
    isOnline: boolean;
    updateAvailable: boolean;
    canInstall: boolean;
    notificationPermission: NotificationPermission;
    serviceWorkerSupported: boolean;
  } {
    return {
      isInstalled: this.isInstalled,
      isOnline: this.isOnline,
      updateAvailable: this.updateAvailable,
      canInstall: !!this.deferredPrompt,
      notificationPermission: 'Notification' in window ? Notification.permission : 'denied',
      serviceWorkerSupported: 'serviceWorker' in navigator
    };
  }

  // Get device info
  getDeviceInfo(): {
    userAgent: string;
    platform: string;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    touchSupport: boolean;
  } {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    return {
      userAgent,
      platform,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isTablet: /iPad|Android(?=.*\bMobile\b)/i.test(userAgent),
      isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0
    };
  }
}

// Singleton PWA manager instance
let pwaManager: PWAManager | null = null;

export function getPWAManager(): PWAManager {
  if (!pwaManager) {
    pwaManager = new PWAManager();
  }
  return pwaManager;
}

// Export types
export type { BeforeInstallPromptEvent };
