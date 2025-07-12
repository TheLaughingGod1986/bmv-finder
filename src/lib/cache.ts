interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, ttl: number = 300000): void { // Default 5 minutes
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
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

// Create cache instances for different types of data
export const hpiCache = new Cache(500); // HPI data cache
export const postcodeCache = new Cache(1000); // Postcode mapping cache
export const propertyCache = new Cache(2000); // Property search cache

// Cache key generators
export const cacheKeys = {
  hpi: {
    postcode: (postcode: string) => `hpi:postcode:${postcode.toUpperCase()}`,
    region: (region: string) => `hpi:region:${region}`,
    dateRange: (region: string, start: string, end: string) => `hpi:daterange:${region}:${start}:${end}`,
  },
  postcode: {
    region: (postcode: string) => `postcode:region:${postcode.toUpperCase()}`,
    suggestions: (query: string) => `postcode:suggestions:${query.toLowerCase()}`,
  },
  property: {
    search: (query: string, filters: string) => `property:search:${query}:${filters}`,
    trends: (postcode: string) => `property:trends:${postcode.toUpperCase()}`,
  }
};

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  HPI_DATA: 30 * 60 * 1000, // 30 minutes
  POSTCODE_MAPPING: 24 * 60 * 60 * 1000, // 24 hours
  PROPERTY_SEARCH: 15 * 60 * 1000, // 15 minutes
  SUGGESTIONS: 5 * 60 * 1000, // 5 minutes
} as const;

export default Cache; 