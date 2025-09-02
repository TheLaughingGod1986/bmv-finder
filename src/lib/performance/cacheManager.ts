'use client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private defaultTTL: number;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    hitRate: 0,
  };

  constructor(maxSize: number = 100, defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  // Set cache entry with optional TTL
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.defaultTTL;

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: entryTTL,
      hits: 0,
    });

    this.updateStats();
  }

  // Get cache entry
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    // Update hit count and stats
    entry.hits++;
    this.stats.hits++;
    this.updateStats();
    
    return entry.data as T;
  }

  // Get or set pattern - common caching pattern
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Delete specific key
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.updateStats();
    return deleted;
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.updateStats();
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Evict oldest entries (LRU-like behavior)
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Update statistics
  private updateStats(): void {
    this.stats.size = this.cache.size;
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  // Get cache keys (for debugging)
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Warm up cache with multiple entries
  async warmUp<T>(entries: Array<{ key: string; fetcher: () => Promise<T>; ttl?: number }>): Promise<void> {
    const promises = entries.map(async ({ key, fetcher, ttl }) => {
      if (!this.has(key)) {
        try {
          const data = await fetcher();
          this.set(key, data, ttl);
        } catch (error) {
          console.warn(`Failed to warm up cache for key: ${key}`, error);
        }
      }
    });

    await Promise.all(promises);
  }

  // Batch operations
  async batchGet<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    for (const key of keys) {
      results.set(key, this.get<T>(key));
    }
    
    return results;
  }

  async batchSet<T>(entries: Array<{ key: string; data: T; ttl?: number }>): Promise<void> {
    for (const { key, data, ttl } of entries) {
      this.set(key, data, ttl);
    }
  }
}

// Global cache instances for different data types
export const propertyCache = new CacheManager(50, 10 * 60 * 1000); // 10 minutes
export const searchCache = new CacheManager(100, 5 * 60 * 1000); // 5 minutes
export const analyticsCache = new CacheManager(30, 15 * 60 * 1000); // 15 minutes
export const userCache = new CacheManager(20, 30 * 60 * 1000); // 30 minutes

// Cache key generators
export const cacheKeys = {
  property: (id: string) => `property:${id}`,
  search: (query: string, filters?: any) => `search:${JSON.stringify({ query, filters })}`,
  analytics: (type: string, params?: any) => `analytics:${type}:${JSON.stringify(params || {})}`,
  user: (id: string) => `user:${id}`,
  portfolio: (id: string) => `portfolio:${id}`,
  watchlist: (userId: string) => `watchlist:${userId}`,
  hpi: (postcode: string) => `hpi:${postcode}`,
  valuation: (address: string) => `valuation:${address}`,
};

// Cache utilities
export const cacheUtils = {
  // Generate cache key with hash for long strings
  hashKey: (key: string): string => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  },

  // Compress data for storage
  compress: (data: any): string => {
    return JSON.stringify(data);
  },

  // Decompress data from storage
  decompress: <T>(compressed: string): T => {
    return JSON.parse(compressed);
  },

  // Check if data is stale
  isStale: (timestamp: number, maxAge: number): boolean => {
    return Date.now() - timestamp > maxAge;
  },
};
