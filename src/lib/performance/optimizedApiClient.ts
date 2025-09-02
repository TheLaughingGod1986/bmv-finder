'use client';

import { useState, useCallback } from 'react';
import { searchCache, propertyCache, analyticsCache, cacheKeys } from './cacheManager';
import { performanceMonitor, performanceUtils } from './performanceMonitor';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  cache?: boolean;
  cacheTTL?: number;
  timeout?: number;
  retries?: number;
}

interface ApiResponse<T> {
  data: T;
  fromCache: boolean;
  timestamp: number;
  status: number;
}

class OptimizedApiClient {
  private baseURL: string;
  private defaultTimeout: number = 10000;
  private defaultRetries: number = 3;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  // Generic request method with caching and performance monitoring
  async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      cache = true,
      cacheTTL,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = this.generateCacheKey(method, url, body);

    // Check cache for GET requests
    if (method === 'GET' && cache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return {
          ...cached,
          fromCache: true,
        };
      }
    }

    // Make request with retry logic
    const response = await this.makeRequestWithRetry<T>(
      url,
      { method, headers, body, timeout },
      retries
    );

    // Cache successful GET responses
    if (method === 'GET' && cache && response.status === 200) {
      this.setCache(cacheKey, response.data, cacheTTL);
    }

    return {
      ...response,
      fromCache: false,
    };
  }

  // Property search with caching
  async searchProperties(query: string, filters?: any): Promise<ApiResponse<any>> {
    return performanceMonitor.timeFunction('api_search_properties', async () => {
      const cacheKey = cacheKeys.search(query, filters);
      const cached = searchCache.get(cacheKey);
      
      if (cached) {
        return {
          data: cached,
          fromCache: true,
          timestamp: Date.now(),
          status: 200,
        };
      }

      const response = await this.request('/api/property-search', {
        method: 'POST',
        body: { query, filters },
        cache: false, // We handle caching manually
      });

      if (response.status === 200) {
        searchCache.set(cacheKey, response.data, 5 * 60 * 1000); // 5 minutes
      }

      return response;
    });
  }

  // Property details with caching
  async getPropertyDetails(propertyId: string): Promise<ApiResponse<any>> {
    return performanceMonitor.timeFunction('api_property_details', async () => {
      const cacheKey = cacheKeys.property(propertyId);
      const cached = propertyCache.get(cacheKey);
      
      if (cached) {
        return {
          data: cached,
          fromCache: true,
          timestamp: Date.now(),
          status: 200,
        };
      }

      const response = await this.request(`/api/properties/${propertyId}`);
      
      if (response.status === 200) {
        propertyCache.set(cacheKey, response.data, 10 * 60 * 1000); // 10 minutes
      }

      return response;
    });
  }

  // Portfolio analytics with caching
  async getPortfolioAnalytics(portfolioId: string, type?: string): Promise<ApiResponse<any>> {
    return performanceMonitor.timeFunction('api_portfolio_analytics', async () => {
      const cacheKey = cacheKeys.analytics('portfolio', { portfolioId, type });
      const cached = analyticsCache.get(cacheKey);
      
      if (cached) {
        return {
          data: cached,
          fromCache: true,
          timestamp: Date.now(),
          status: 200,
        };
      }

      const response = await this.request(`/api/portfolio/analytics?portfolioId=${portfolioId}&type=${type || 'full'}`);
      
      if (response.status === 200) {
        analyticsCache.set(cacheKey, response.data, 15 * 60 * 1000); // 15 minutes
      }

      return response;
    });
  }

  // Batch requests for multiple properties
  async batchGetProperties(propertyIds: string[]): Promise<ApiResponse<any[]>> {
    return performanceMonitor.timeFunction('api_batch_properties', async () => {
      const results = await Promise.allSettled(
        propertyIds.map(id => this.getPropertyDetails(id))
      );

      const successful = results
        .filter((result): result is PromiseFulfilledResult<ApiResponse<any>> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value.data);

      return {
        data: successful,
        fromCache: false,
        timestamp: Date.now(),
        status: 200,
      };
    });
  }

  // Preload critical data
  async preloadCriticalData(): Promise<void> {
    const preloadTasks = [
      // Preload user's portfolio if authenticated
      this.preloadUserPortfolio(),
      // Preload recent searches
      this.preloadRecentSearches(),
      // Preload market data
      this.preloadMarketData(),
    ];

    await Promise.allSettled(preloadTasks);
  }

  private async preloadUserPortfolio(): Promise<void> {
    try {
      // This would check if user is authenticated and preload their portfolio
      // For now, we'll skip this in the demo
    } catch (error) {
      console.warn('Failed to preload user portfolio:', error);
    }
  }

  private async preloadRecentSearches(): Promise<void> {
    try {
      // Preload common search terms or user's recent searches
      const commonSearches = ['London', 'Manchester', 'Birmingham'];
      await Promise.allSettled(
        commonSearches.map(term => this.searchProperties(term))
      );
    } catch (error) {
      console.warn('Failed to preload recent searches:', error);
    }
  }

  private async preloadMarketData(): Promise<void> {
    try {
      // Preload market analysis data
      await this.request('/api/market-trends');
    } catch (error) {
      console.warn('Failed to preload market data:', error);
    }
  }

  // Cache management
  private getFromCache<T>(key: string): T | null {
    // Try different cache stores based on key prefix
    if (key.startsWith('search:')) {
      return searchCache.get<T>(key);
    } else if (key.startsWith('property:')) {
      return propertyCache.get<T>(key);
    } else if (key.startsWith('analytics:')) {
      return analyticsCache.get<T>(key);
    }
    return null;
  }

  private setCache<T>(key: string, data: T, ttl?: number): void {
    if (key.startsWith('search:')) {
      searchCache.set(key, data, ttl);
    } else if (key.startsWith('property:')) {
      propertyCache.set(key, data, ttl);
    } else if (key.startsWith('analytics:')) {
      analyticsCache.set(key, data, ttl);
    }
  }

  private generateCacheKey(method: string, url: string, body?: any): string {
    const bodyHash = body ? JSON.stringify(body) : '';
    return `${method.toLowerCase()}:${url}:${bodyHash}`;
  }

  // Request with retry logic
  private async makeRequestWithRetry<T>(
    url: string,
    options: RequestInit & { timeout?: number },
    retries: number
  ): Promise<{ data: T; status: number; timestamp: number }> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        return {
          data,
          status: response.status,
          timestamp: Date.now(),
        };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  // Clear all caches
  clearAllCaches(): void {
    searchCache.clear();
    propertyCache.clear();
    analyticsCache.clear();
  }

  // Get cache statistics
  getCacheStats(): {
    search: any;
    property: any;
    analytics: any;
  } {
    return {
      search: searchCache.getStats(),
      property: propertyCache.getStats(),
      analytics: analyticsCache.getStats(),
    };
  }
}

// Global API client instance
export const apiClient = new OptimizedApiClient();

// React hook for API calls with loading states
export function useApiCall<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = async (apiCall: () => Promise<ApiResponse<T>>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      setData(response.data);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    data,
    execute,
  };
}

// Performance-optimized search hook
export function useOptimizedSearch() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    performanceUtils.debounce(async (query: string, filters?: any) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.searchProperties(query, filters);
        setResults(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  return {
    results,
    loading,
    error,
    search,
  };
}
