interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  memoryUsage: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  enableLRU: boolean;
  enableStats: boolean;
  compressionThreshold: number;
}

class Cache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize: number;
  private defaultTTL: number;
  private enableLRU: boolean;
  private enableStats: boolean;
  private compressionThreshold: number;
  private cleanupInterval: NodeJS.Timeout;
  private stats: { hits: number; misses: number } = { hits: 0, misses: 0 };

  constructor(config: Partial<CacheConfig> = {}) {
    this.maxSize = config.maxSize || 1000;
    this.defaultTTL = config.defaultTTL || 300000; // 5 minutes
    this.enableLRU = config.enableLRU ?? true;
    this.enableStats = config.enableStats ?? true;
    this.compressionThreshold = config.compressionThreshold || 1024; // 1KB
    
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Remove oldest entries if cache is full (LRU strategy)
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    // Compress data if it's large enough
    const processedData = this.processData(data);

    this.cache.set(key, {
      data: processedData,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      if (this.enableStats) this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      if (this.enableStats) this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    if (this.enableStats) this.stats.hits++;

    return this.unprocessData(entry.data) as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.cleanup(); // Clean up before returning size
    return this.cache.size;
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      size: this.cache.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // Advanced cache operations
  mget<T>(keys: string[]): Map<string, T | null> {
    const results = new Map<string, T | null>();
    for (const key of keys) {
      results.set(key, this.get<T>(key));
    }
    return results;
  }

  mset<T>(entries: Array<{ key: string; data: T; ttl?: number }>): void {
    for (const { key, data, ttl } of entries) {
      this.set(key, data, ttl);
    }
  }

  // Cache warming and prefetching
  async warmCache<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached) return cached;

    try {
      const data = await fetchFn();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error(`Cache warming failed for key: ${key}`, error);
      throw error;
    }
  }

  // Batch operations for performance
  async batchGet<T>(keys: string[], fetchFn: (missingKeys: string[]) => Promise<Map<string, T>>): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    const missingKeys: string[] = [];

    // Check cache first
    for (const key of keys) {
      const cached = this.get<T>(key);
      if (cached !== null) {
        results.set(key, cached);
      } else {
        missingKeys.push(key);
      }
    }

    // Fetch missing data in batch
    if (missingKeys.length > 0) {
      try {
        const fetchedData = await fetchFn(missingKeys);
        for (const [key, data] of fetchedData.entries()) {
          this.set(key, data);
          results.set(key, data);
        }
      } catch (error) {
        console.error('Batch fetch failed:', error);
        throw error;
      }
    }

    return results;
  }

  private evictLRU(): void {
    if (!this.enableLRU) return;

    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private processData<T>(data: T): unknown {
    // Simple compression for large objects
    if (typeof data === 'object' && data !== null) {
      const dataSize = JSON.stringify(data).length;
      if (dataSize > this.compressionThreshold) {
        // For now, just return the data as-is
        // In production, you could implement actual compression here
        return data;
      }
    }
    return data;
  }

  private unprocessData<T>(data: unknown): T {
    // Decompress if needed
    return data as T;
  }

  private estimateMemoryUsage(): number {
    let totalSize = 0;
    for (const [key, entry] of this.cache.entries()) {
      totalSize += key.length;
      totalSize += JSON.stringify(entry.data).length;
      totalSize += 64; // Approximate overhead for entry metadata
    }
    return totalSize;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Enhanced cache instances with optimized configurations
export const hpiCache = new Cache({ 
  maxSize: 1000, 
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  enableLRU: true,
  enableStats: true
});

export const postcodeCache = new Cache({ 
  maxSize: 2000, 
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
  enableLRU: true,
  enableStats: true
});

export const propertyCache = new Cache({ 
  maxSize: 5000, 
  defaultTTL: 15 * 60 * 1000, // 15 minutes
  enableLRU: true,
  enableStats: true
});

export const searchCache = new Cache({ 
  maxSize: 3000, 
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  enableLRU: true,
  enableStats: true
});

export const portfolioCache = new Cache({ 
  maxSize: 2000, 
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  enableLRU: true,
  enableStats: true
});

// Cache key generators with versioning for cache invalidation
export const cacheKeys = {
  hpi: {
    postcode: (postcode: string) => `hpi:v2:postcode:${postcode.toUpperCase()}`,
    region: (region: string) => `hpi:v2:region:${region}`,
    dateRange: (region: string, start: string, end: string) => `hpi:v2:daterange:${region}:${start}:${end}`,
  },
  postcode: {
    region: (postcode: string) => `postcode:v2:region:${postcode.toUpperCase()}`,
    suggestions: (query: string) => `postcode:v2:suggestions:${query.toLowerCase()}`,
  },
  property: {
    search: (query: string, filters: string) => `property:v2:search:${query}:${filters}`,
    trends: (postcode: string) => `property:v2:trends:${postcode.toUpperCase()}`,
    valuation: (postcode: string, propertyType: string) => `property:v2:valuation:${postcode}:${propertyType}`,
  },
  portfolio: {
    performance: (userId: string, portfolioId: string) => `portfolio:v2:performance:${userId}:${portfolioId}`,
    properties: (userId: string) => `portfolio:v2:properties:${userId}`,
  }
};

// Enhanced cache TTL constants with different strategies
export const CACHE_TTL = {
  HPI_DATA: 30 * 60 * 1000, // 30 minutes
  POSTCODE_MAPPING: 24 * 60 * 60 * 1000, // 24 hours
  PROPERTY_SEARCH: 15 * 60 * 1000, // 15 minutes
  PROPERTY_VALUATION: 60 * 60 * 1000, // 1 hour
  SUGGESTIONS: 5 * 60 * 1000, // 5 minutes
  PORTFOLIO_DATA: 10 * 60 * 1000, // 10 minutes
  MARKET_TRENDS: 20 * 60 * 1000, // 20 minutes
} as const;

// Cache invalidation utilities
export const cacheInvalidation = {
  invalidateHPI: (postcode?: string) => {
    if (postcode) {
      hpiCache.delete(cacheKeys.hpi.postcode(postcode));
    } else {
      hpiCache.clear();
    }
  },
  invalidatePropertySearch: (query?: string) => {
    if (query) {
      propertyCache.delete(cacheKeys.property.search(query, ''));
    } else {
      propertyCache.clear();
    }
  },
  invalidatePortfolio: (userId: string) => {
    portfolioCache.delete(cacheKeys.portfolio.properties(userId));
  }
};

export default Cache; 