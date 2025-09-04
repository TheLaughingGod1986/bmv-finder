export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  browser: 'chrome' | 'safari' | 'firefox' | 'edge' | 'unknown';
  screenSize: {
    width: number;
    height: number;
    density: number;
  };
  capabilities: {
    touch: boolean;
    pwa: boolean;
    pushNotifications: boolean;
    serviceWorker: boolean;
  };
}

export interface CoreWebVitals {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  score: number;
}

export class MobileOptimizer {
  private static instance: MobileOptimizer;
  private deviceInfo: DeviceInfo | null = null;
  private coreWebVitals: CoreWebVitals | null = null;

  public static getInstance(): MobileOptimizer {
    if (!MobileOptimizer.instance) {
      MobileOptimizer.instance = new MobileOptimizer();
    }
    return MobileOptimizer.instance;
  }

  constructor() {
    this.initializeDeviceDetection();
  }

  private initializeDeviceDetection(): void {
    if (typeof window === 'undefined') return;

    const userAgent = navigator.userAgent;
    const screen = window.screen;

    this.deviceInfo = {
      type: this.detectDeviceType(screen.width, screen.height),
      os: this.detectOS(userAgent),
      browser: this.detectBrowser(userAgent),
      screenSize: {
        width: screen.width,
        height: screen.height,
        density: window.devicePixelRatio || 1,
      },
      capabilities: {
        touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        pwa: 'serviceWorker' in navigator,
        pushNotifications: 'PushManager' in window,
        serviceWorker: 'serviceWorker' in navigator,
      },
    };
  }

  private detectDeviceType(width: number, height: number): 'mobile' | 'tablet' | 'desktop' {
    const minDimension = Math.min(width, height);
    if (minDimension < 768) return 'mobile';
    if (minDimension < 1024) return 'tablet';
    return 'desktop';
  }

  private detectOS(userAgent: string): DeviceInfo['os'] {
    if (/iPhone|iPad|iPod/.test(userAgent)) return 'ios';
    if (/Android/.test(userAgent)) return 'android';
    if (/Windows/.test(userAgent)) return 'windows';
    if (/Mac OS X/.test(userAgent)) return 'macos';
    if (/Linux/.test(userAgent)) return 'linux';
    return 'unknown';
  }

  private detectBrowser(userAgent: string): DeviceInfo['browser'] {
    if (/Chrome/.test(userAgent) && !/Edge/.test(userAgent)) return 'chrome';
    if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) return 'safari';
    if (/Firefox/.test(userAgent)) return 'firefox';
    if (/Edge/.test(userAgent)) return 'edge';
    return 'unknown';
  }

  public getDeviceInfo(): DeviceInfo | null {
    return this.deviceInfo;
  }

  public getCoreWebVitals(): CoreWebVitals | null {
    return this.coreWebVitals;
  }
}

export const mobileOptimizer = MobileOptimizer.getInstance();