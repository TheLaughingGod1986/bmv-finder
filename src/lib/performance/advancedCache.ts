import { performanceOptimizer } from './performanceOptimizer';

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items
  strategy: 'lru' | 'lfu' | 'fifo' | 'ttl';
  compression: boolean;
  serialization: 'json' | 'binary' | 'none';
}

export interface CacheItem<T = any> {
  key: string;
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  ttl: number;
  size: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  missRate: number;
  totalRequests: number;
  totalSize: number;
  itemCount: number;
  evictions: number;
  averageResponseTime: number;
  memoryUsage: number;
}

export interface CacheLayer {
  name: string;
  type: 'memory' | 'redis' | 'database' | 'file';
  config: CacheConfig;
  stats: CacheStats;
  isAvailable: boolean;
}

export class AdvancedCache {
  private static instance: AdvancedCache;
  private memoryCache: Map<string, CacheItem> = new Map();
  private layers: CacheLayer[] = [];
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    missRate: 0,
    totalRequests: 0,
    totalSize: 0,
    itemCount: 0,
    evictions: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
  };

  // Default configurations
  private readonly DEFAULT_CONFIGS: Record<string, CacheConfig> = {
    api: {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
      strategy: 'lru',
      compression: false,
      serialization: 'json',
    },
    database: {
      ttl: 15 * 60 * 1000, // 15 minutes
      maxSize: 500,
      strategy: 'lru',
      compression: true,
      serialization: 'json',
    },
    elasticsearch: {
      ttl: 10 * 60 * 1000, // 10 minutes
      maxSize: 2000,
      strategy: 'lru',
      compression: true,
      serialization: 'json',
    },
    user: {
      ttl: 30 * 60 * 1000, // 30 minutes
      maxSize: 100,
      strategy: 'lru',
      compression: false,
      serialization: 'json',
    },
    session: {
      ttl: 60 * 60 * 1000, // 1 hour
      maxSize: 500,
      strategy: 'ttl',
      compression: false,
      serialization: 'json',
    },
  };

  public static getInstance(): AdvancedCache {
    if (!AdvancedCache.instance) {
      AdvancedCache.instance = new AdvancedCache();
    }
    return AdvancedCache.instance;
  }

  constructor() {
    this.initializeLayers();
    this.startCleanupInterval();
  }

  // Initialize cache layers
  private initializeLayers(): void {
    this.layers = [
      {
        name: 'memory',
        type: 'memory',
        config: this.DEFAULT_CONFIGS.api,
        stats: { ...this.stats },
        isAvailable: true,
      },
      {
        name: 'redis',
        type: 'redis',
        config: this.DEFAULT_CONFIGS.database,
        stats: { ...this.stats },
        isAvailable: false, // Would be true if Redis is available
      },
    ];
  }

  // Get value from cache
  public async get<T>(key: string, layer?: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // Try memory cache first
      const memoryResult = this.getFromMemory<T>(key);
      if (memoryResult !== null) {
        this.recordHit('memory');
        this.updateResponseTime(Date.now() - startTime);
        return memoryResult;
      }

      // Try Redis if available
      if (layer !== 'memory' && this.layers.find(l => l.name === 'redis')?.isAvailable) {
        const redisResult = await this.getFromRedis<T>(key);
        if (redisResult !== null) {
          // Store in memory cache for faster access
          await this.set(key, redisResult, 'memory');
          this.recordHit('redis');
          this.updateResponseTime(Date.now() - startTime);
          return redisResult;
        }
      }

      this.recordMiss();
      this.updateResponseTime(Date.now() - startTime);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.recordMiss();
      this.updateResponseTime(Date.now() - startTime);
      return null;
    }
  }

  // Set value in cache
  public async set<T>(key: string, value: T, layer?: string, ttl?: number): Promise<boolean> {
    try {
      const config = this.getConfig(layer || 'memory');
      const item: CacheItem<T> = {
        key,
        value,
        timestamp: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now(),
        ttl: ttl || config.ttl,
        size: this.calculateSize(value),
      };

      // Store in memory cache
      if (layer === 'memory' || !layer) {
        await this.setInMemory(key, item);
      }

      // Store in Redis if available
      if (layer !== 'memory' && this.layers.find(l => l.name === 'redis')?.isAvailable) {
        await this.setInRedis(key, item);
      }

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Delete value from cache
  public async delete(key: string, layer?: string): Promise<boolean> {
    try {
      if (layer === 'memory' || !layer) {
        this.memoryCache.delete(key);
      }

      if (layer !== 'memory' && this.layers.find(l => l.name === 'redis')?.isAvailable) {
        await this.deleteFromRedis(key);
      }

      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Clear all cache
  public async clear(layer?: string): Promise<boolean> {
    try {
      if (layer === 'memory' || !layer) {
        this.memoryCache.clear();
        this.stats.itemCount = 0;
        this.stats.totalSize = 0;
      }

      if (layer !== 'memory' && this.layers.find(l => l.name === 'redis')?.isAvailable) {
        await this.clearRedis();
      }

      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  // Get cache statistics
  public async getStats(): Promise<CacheStats> {
    return { ...this.stats };
  }

  // Get layer statistics
  public async getLayerStats(): Promise<CacheLayer[]> {
    return this.layers.map(layer => ({
      ...layer,
      stats: { ...layer.stats },
    }));
  }

  // Warm up cache with frequently accessed data
  public async warmUp(keys: string[], fetcher: (key: string) => Promise<any>): Promise<void> {
    const promises = keys.map(async (key) => {
      try {
        const value = await fetcher(key);
        await this.set(key, value);
      } catch (error) {
        console.error(`Cache warm-up failed for key ${key}:`, error);
      }
    });

    await Promise.all(promises);
  }

  // Batch operations
  public async getBatch<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    const promises = keys.map(async (key) => {
      const value = await this.get<T>(key);
      results.set(key, value);
    });

    await Promise.all(promises);
    return results;
  }

  public async setBatch<T>(items: Map<string, T>): Promise<boolean> {
    try {
      const promises = Array.from(items.entries()).map(([key, value]) => 
        this.set(key, value)
      );

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Cache batch set error:', error);
      return false;
    }
  }

  // Memory cache operations
  private getFromMemory<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    // Check TTL
    if (Date.now() - item.timestamp > item.ttl) {
      this.memoryCache.delete(key);
      this.stats.evictions++;
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = Date.now();
    this.memoryCache.set(key, item);

    return item.value;
  }

  private async setInMemory<T>(key: string, item: CacheItem<T>): Promise<void> {
    const config = this.getConfig('memory');
    
    // Check if we need to evict items
    if (this.memoryCache.size >= config.maxSize) {
      await this.evictItems(config.strategy, config.maxSize);
    }

    this.memoryCache.set(key, item);
    this.stats.itemCount = this.memoryCache.size;
    this.stats.totalSize += item.size;
  }

  // Eviction strategies
  private async evictItems(strategy: string, maxSize: number): Promise<void> {
    const itemsToEvict = this.memoryCache.size - maxSize + 1;
    
    switch (strategy) {
      case 'lru':
        this.evictLRU(itemsToEvict);
        break;
      case 'lfu':
        this.evictLFU(itemsToEvict);
        break;
      case 'fifo':
        this.evictFIFO(itemsToEvict);
        break;
      case 'ttl':
        this.evictTTL();
        break;
    }
  }

  private evictLRU(count: number): void {
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
      .slice(0, count);

    for (const [key] of entries) {
      this.memoryCache.delete(key);
      this.stats.evictions++;
    }
  }

  private evictLFU(count: number): void {
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.accessCount - b.accessCount)
      .slice(0, count);

    for (const [key] of entries) {
      this.memoryCache.delete(key);
      this.stats.evictions++;
    }
  }

  private evictFIFO(count: number): void {
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, count);

    for (const [key] of entries) {
      this.memoryCache.delete(key);
      this.stats.evictions++;
    }
  }

  private evictTTL(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp > item.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.memoryCache.delete(key);
      this.stats.evictions++;
    }
  }

  // Redis operations (simulated)
  private async getFromRedis<T>(key: string): Promise<T | null> {
    // In a real implementation, this would use Redis client
    // For now, return null to simulate Redis not being available
    return null;
  }

  private async setInRedis<T>(key: string, item: CacheItem<T>): Promise<void> {
    // In a real implementation, this would use Redis client
    // For now, do nothing
  }

  private async deleteFromRedis(key: string): Promise<void> {
    // In a real implementation, this would use Redis client
    // For now, do nothing
  }

  private async clearRedis(): Promise<void> {
    // In a real implementation, this would use Redis client
    // For now, do nothing
  }

  // Statistics tracking
  private recordHit(layer: string): void {
    this.stats.hits++;
    this.stats.totalRequests++;
    this.updateHitRate();
    
    const layerObj = this.layers.find(l => l.name === layer);
    if (layerObj) {
      layerObj.stats.hits++;
      layerObj.stats.totalRequests++;
      this.updateLayerHitRate(layerObj);
    }
  }

  private recordMiss(): void {
    this.stats.misses++;
    this.stats.totalRequests++;
    this.updateHitRate();
  }

  private updateHitRate(): void {
    if (this.stats.totalRequests > 0) {
      this.stats.hitRate = this.stats.hits / this.stats.totalRequests;
      this.stats.missRate = this.stats.misses / this.stats.totalRequests;
    }
  }

  private updateLayerHitRate(layer: CacheLayer): void {
    if (layer.stats.totalRequests > 0) {
      layer.stats.hitRate = layer.stats.hits / layer.stats.totalRequests;
      layer.stats.missRate = layer.stats.misses / layer.stats.totalRequests;
    }
  }

  private updateResponseTime(responseTime: number): void {
    // Update average response time using exponential moving average
    const alpha = 0.1; // Smoothing factor
    this.stats.averageResponseTime = 
      this.stats.averageResponseTime * (1 - alpha) + responseTime * alpha;
  }

  // Utility methods
  private getConfig(layer: string): CacheConfig {
    return this.DEFAULT_CONFIGS[layer] || this.DEFAULT_CONFIGS.api;
  }

  private calculateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate in bytes
    } catch {
      return 100; // Default size
    }
  }

  // Cleanup interval
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // Run every minute
  }

  private cleanup(): void {
    // Remove expired items
    this.evictTTL();
    
    // Update memory usage
    this.stats.memoryUsage = this.memoryCache.size * 1000; // Rough estimate
    
    // Record performance metrics
    performanceOptimizer.recordMetric({
      type: 'cache',
      name: 'hit_rate',
      value: this.stats.hitRate,
      unit: 'ratio',
    });

    performanceOptimizer.recordMetric({
      type: 'cache',
      name: 'response_time',
      value: this.stats.averageResponseTime,
      unit: 'ms',
    });
  }

  // Cache invalidation patterns
  public async invalidatePattern(pattern: string): Promise<number> {
    let invalidated = 0;
    
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
        invalidated++;
      }
    }
    
    return invalidated;
  }

  public async invalidateTags(tags: string[]): Promise<number> {
    // In a real implementation, this would use cache tags
    // For now, return 0
    return 0;
  }

  // Cache warming strategies
  public async warmUpByPattern(pattern: string, fetcher: (key: string) => Promise<any>): Promise<void> {
    // In a real implementation, this would find keys matching the pattern
    // For now, do nothing
  }

  public async warmUpByTags(tags: string[], fetcher: (key: string) => Promise<any>): Promise<void> {
    // In a real implementation, this would find keys with matching tags
    // For now, do nothing
  }
}

// Export singleton instance
export const advancedCache = AdvancedCache.getInstance();
