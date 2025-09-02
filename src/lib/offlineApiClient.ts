import { offlineStorage } from './offlineStorage';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  offline?: boolean;
  cached?: boolean;
}

interface RequestOptions {
  cache?: boolean;
  cacheKey?: string;
  maxAge?: number;
  fallbackToCache?: boolean;
}

class OfflineApiClient {
  private baseUrl: string;
  private defaultCacheTime: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  // Generic request method with offline support
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      cache = true,
      cacheKey,
      maxAge = this.defaultCacheTime,
      fallbackToCache = true
    } = options;

    const fullUrl = `${this.baseUrl}${endpoint}`;
    const key = cacheKey || this.generateCacheKey(endpoint);

    // Try to get from cache first
    if (cache) {
      const cachedData = this.getCachedData<T>(key, maxAge);
      if (cachedData && !this.isDataStale(cachedData.timestamp, maxAge)) {
        return {
          success: true,
          data: cachedData.data,
          cached: true
        };
      }
    }

    // Try network request
    if (navigator.onLine) {
      try {
        const response = await fetch(fullUrl, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          // Cache successful response
          if (cache) {
            this.setCachedData(key, data);
          }

          return {
            success: true,
            data
          };
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Network request failed:', error);
        
        // Fallback to cache if available
        if (fallbackToCache && cache) {
          const cachedData = this.getCachedData<T>(key);
          if (cachedData) {
            return {
              success: true,
              data: cachedData.data,
              cached: true,
              offline: true
            };
          }
        }

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Network error',
          offline: true
        };
      }
    } else {
      // Offline - try cache
      if (fallbackToCache && cache) {
        const cachedData = this.getCachedData<T>(key);
        if (cachedData) {
          return {
            success: true,
            data: cachedData.data,
            cached: true,
            offline: true
          };
        }
      }

      return {
        success: false,
        error: 'No internet connection',
        offline: true
      };
    }
  }

  // Property search with offline support
  async searchProperties(
    postcode: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse> {
    const endpoint = `/api/property-search?postcode=${encodeURIComponent(postcode)}&limit=20`;
    const cacheKey = `search_${postcode.toLowerCase().replace(/\s/g, '')}`;

    const response = await this.request(endpoint, {
      ...options,
      cacheKey,
      maxAge: 2 * 60 * 60 * 1000 // 2 hours for search results
    });

    // Save search to offline storage
    if (response.success && response.data) {
      offlineStorage.saveSearch(postcode, postcode, response.data);
    }

    return response;
  }

  // Recent sales with offline support
  async getRecentSales(
    postcode: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse> {
    const endpoint = `/api/recent-sales?postcode=${encodeURIComponent(postcode)}&limit=20`;
    const cacheKey = `recent_sales_${postcode.toLowerCase().replace(/\s/g, '')}`;

    const response = await this.request(endpoint, {
      ...options,
      cacheKey,
      maxAge: 4 * 60 * 60 * 1000 // 4 hours for recent sales
    });

    return response;
  }

  // HPI data with offline support
  async getHPIData(
    postcode: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse> {
    const endpoint = `/api/hpi?postcode=${encodeURIComponent(postcode)}`;
    const cacheKey = `hpi_${postcode.toLowerCase().replace(/\s/g, '')}`;

    const response = await this.request(endpoint, {
      ...options,
      cacheKey,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours for HPI data
    });

    return response;
  }

  // Portfolio data with offline support
  async getPortfolio(options: RequestOptions = {}): Promise<ApiResponse> {
    const endpoint = '/api/portfolio';
    const cacheKey = 'portfolio_data';

    const response = await this.request(endpoint, {
      ...options,
      cacheKey,
      maxAge: 30 * 60 * 1000 // 30 minutes for portfolio
    });

    // Save to offline storage
    if (response.success && response.data) {
      offlineStorage.savePortfolio(response.data);
    }

    return response;
  }

  // System health with offline support
  async getSystemHealth(options: RequestOptions = {}): Promise<ApiResponse> {
    const endpoint = '/api/system-health';
    const cacheKey = 'system_health';

    return this.request(endpoint, {
      ...options,
      cacheKey,
      maxAge: 5 * 60 * 1000 // 5 minutes for system health
    });
  }

  // Cache management
  private getCachedData<T>(key: string, maxAge?: number): { data: T; timestamp: number } | null {
    try {
      const stored = localStorage.getItem(`api_cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!maxAge || !this.isDataStale(parsed.timestamp, maxAge)) {
          return parsed;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  private setCachedData<T>(key: string, data: T): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`api_cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  private generateCacheKey(endpoint: string): string {
    return endpoint.replace(/[^a-zA-Z0-9]/g, '_');
  }

  private isDataStale(timestamp: number, maxAge: number): boolean {
    return Date.now() - timestamp > maxAge;
  }

  // Clear cache
  clearCache(pattern?: string): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => 
        key.startsWith('api_cache_') && 
        (!pattern || key.includes(pattern))
      );

      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log(`Cleared ${cacheKeys.length} cache entries`);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // Get cache statistics
  getCacheStats(): { entries: number; size: number } {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith('api_cache_'));
      
      let totalSize = 0;
      cacheKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      });

      return {
        entries: cacheKeys.length,
        size: totalSize
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { entries: 0, size: 0 };
    }
  }

  // Preload critical data
  async preloadCriticalData(): Promise<void> {
    if (!navigator.onLine) return;

    try {
      console.log('Preloading critical data...');
      
      // Preload system health
      await this.getSystemHealth({ cache: true });
      
      // Preload common postcodes if available
      const commonPostcodes = ['SW1A1AA', 'M1 1AA', 'B1 1AA'];
      for (const postcode of commonPostcodes) {
        await this.searchProperties(postcode, { cache: true });
      }

      console.log('Critical data preloaded');
    } catch (error) {
      console.error('Failed to preload critical data:', error);
    }
  }
}

// Singleton instance
export const offlineApiClient = new OfflineApiClient();

// Export types
export type { ApiResponse, RequestOptions };
