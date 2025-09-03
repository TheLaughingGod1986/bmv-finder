import { auditLogger } from '../audit/auditLogger';

export interface CacheStrategy {
  name: string;
  ttl: number;
  maxSize: number;
  compression: boolean;
  serialization: 'json' | 'msgpack' | 'binary';
  evictionPolicy: 'lru' | 'lfu' | 'ttl' | 'random';
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  compressions: number;
  totalSize: number;
  itemCount: number;
  hitRate: number;
  averageAccessTime: number;
  memoryUsage: number;
}

export interface CacheLayer {
  name: string;
  priority: number;
  maxSize: number;
  ttl: number;
  strategy: CacheStrategy;
  cache: Map<string, CacheItem>;
}

export interface CacheItem {
  value: any;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  compressed: boolean;
  metadata?: Record<string, any>;
}

export class EnhancedCache {
  private static instance: EnhancedCache;
  private layers: CacheLayer[] = [];
  private metrics: CacheMetrics;
  private strategies: Map<string, CacheStrategy> = new Map();
  private compressionWorker: Worker | null = null;
  private isRedisAvailable = false;
  private redisClient: any = null;

  private constructor() {
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      compressions: 0,
      totalSize: 0,
      itemCount: 0,
      hitRate: 0,
      averageAccessTime: 0,
      memoryUsage: 0
    };

    this.initializeStrategies();
    this.initializeLayers();
    this.initializeRedis();
    this.startMetricsCollection();
  }

  public static getInstance(): EnhancedCache {
    if (!EnhancedCache.instance) {
      EnhancedCache.instance = new EnhancedCache();
    }
    return EnhancedCache.instance;
  }

  // Initialize cache strategies
  private initializeStrategies(): void {
    this.strategies.set('session', {
      name: 'session',
      ttl: 30 * 60 * 1000, // 30 minutes
      maxSize: 10000,
      compression: false,
      serialization: 'json',
      evictionPolicy: 'ttl'
    });

    this.strategies.set('user_data', {
      name: 'user_data',
      ttl: 60 * 60 * 1000, // 1 hour
      maxSize: 50000,
      compression: true,
      serialization: 'msgpack',
      evictionPolicy: 'lru'
    });

    this.strategies.set('market_data', {
      name: 'market_data',
      ttl: 15 * 60 * 1000, // 15 minutes
      maxSize: 100000,
      compression: true,
      serialization: 'msgpack',
      evictionPolicy: 'lfu'
    });

    this.strategies.set('search_results', {
      name: 'search_results',
      ttl: 10 * 60 * 1000, // 10 minutes
      maxSize: 200000,
      compression: true,
      serialization: 'json',
      evictionPolicy: 'lru'
    });

    this.strategies.set('api_responses', {
      name: 'api_responses',
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 100000,
      compression: true,
      serialization: 'json',
      evictionPolicy: 'lru'
    });

    this.strategies.set('static_data', {
      name: 'static_data',
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 50000,
      compression: true,
      serialization: 'msgpack',
      evictionPolicy: 'lfu'
    });
  }

  // Initialize cache layers
  private initializeLayers(): void {
    this.layers = [
      {
        name: 'l1_memory',
        priority: 1,
        maxSize: 10000,
        ttl: 5 * 60 * 1000, // 5 minutes
        strategy: this.strategies.get('api_responses')!,
        cache: new Map()
      },
      {
        name: 'l2_memory',
        priority: 2,
        maxSize: 50000,
        ttl: 30 * 60 * 1000, // 30 minutes
        strategy: this.strategies.get('user_data')!,
        cache: new Map()
      },
      {
        name: 'l3_redis',
        priority: 3,
        maxSize: 1000000,
        ttl: 60 * 60 * 1000, // 1 hour
        strategy: this.strategies.get('market_data')!,
        cache: new Map() // Will be replaced with Redis operations
      }
    ];
  }

  // Initialize Redis connection
  private async initializeRedis(): Promise<void> {
    try {
      // Check if Redis is available
      if (typeof window === 'undefined' && process.env.REDIS_URL) {
        // Server-side Redis connection
        const Redis = require('redis');
        this.redisClient = Redis.createClient({
          url: process.env.REDIS_URL,
          retry_strategy: (options: any) => {
            if (options.error && options.error.code === 'ECONNREFUSED') {
              return new Error('Redis server connection refused');
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
              return new Error('Retry time exhausted');
            }
            if (options.attempt > 10) {
              return undefined;
            }
            return Math.min(options.attempt * 100, 3000);
          }
        });

        this.redisClient.on('error', (err: Error) => {
          console.warn('Redis connection error:', err);
          this.isRedisAvailable = false;
        });

        this.redisClient.on('connect', () => {
          console.log('✅ Redis connected successfully');
          this.isRedisAvailable = true;
        });

        await this.redisClient.connect();
      }
    } catch (error) {
      console.warn('Redis initialization failed, using memory-only cache:', error);
      this.isRedisAvailable = false;
    }
  }

  // Get value from cache
  async get<T>(key: string, strategy: string = 'api_responses'): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // Try each layer in priority order
      for (const layer of this.layers.sort((a, b) => a.priority - b.priority)) {
        const value = await this.getFromLayer<T>(key, layer);
        if (value !== null) {
          this.metrics.hits++;
          this.updateAccessMetrics(key, layer, Date.now() - startTime);
          return value;
        }
      }

      this.metrics.misses++;
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.metrics.misses++;
      return null;
    } finally {
      this.updateHitRate();
    }
  }

  // Set value in cache
  async set<T>(
    key: string, 
    value: T, 
    strategy: string = 'api_responses',
    ttl?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const cacheStrategy = this.strategies.get(strategy);
      if (!cacheStrategy) {
        throw new Error(`Unknown cache strategy: ${strategy}`);
      }

      const effectiveTTL = ttl || cacheStrategy.ttl;
      const serializedValue = this.serialize(value, cacheStrategy.serialization);
      const compressedValue = cacheStrategy.compression ? 
        await this.compress(serializedValue) : serializedValue;

      const item: CacheItem = {
        value: compressedValue,
        timestamp: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now(),
        size: this.calculateSize(compressedValue),
        compressed: cacheStrategy.compression,
        metadata
      };

      // Store in appropriate layer
      const targetLayer = this.selectLayer(strategy);
      await this.setInLayer(key, item, targetLayer, effectiveTTL);

      this.metrics.itemCount++;
      this.metrics.totalSize += item.size;

      if (cacheStrategy.compression) {
        this.metrics.compressions++;
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Delete value from cache
  async delete(key: string): Promise<boolean> {
    let deleted = false;

    for (const layer of this.layers) {
      if (await this.deleteFromLayer(key, layer)) {
        deleted = true;
      }
    }

    return deleted;
  }

  // Clear all cache layers
  async clear(): Promise<void> {
    for (const layer of this.layers) {
      await this.clearLayer(layer);
    }

    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      compressions: 0,
      totalSize: 0,
      itemCount: 0,
      hitRate: 0,
      averageAccessTime: 0,
      memoryUsage: 0
    };
  }

  // Get cache metrics
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  // Warm up cache with frequently accessed data
  async warmup(data: Array<{ key: string; value: any; strategy: string }>): Promise<void> {
    const promises = data.map(item => 
      this.set(item.key, item.value, item.strategy)
    );

    await Promise.all(promises);
  }

  // Private helper methods
  private async getFromLayer<T>(key: string, layer: CacheLayer): Promise<T | null> {
    if (layer.name.startsWith('l3_redis') && this.isRedisAvailable) {
      return await this.getFromRedis<T>(key);
    }

    const item = layer.cache.get(key);
    if (!item) return null;

    // Check TTL
    if (Date.now() - item.timestamp > layer.ttl) {
      layer.cache.delete(key);
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = Date.now();

    // Deserialize and decompress
    let value = item.value;
    if (item.compressed) {
      value = await this.decompress(value);
    }

    return this.deserialize<T>(value, layer.strategy.serialization);
  }

  private async setInLayer(
    key: string, 
    item: CacheItem, 
    layer: CacheLayer, 
    ttl: number
  ): Promise<void> {
    if (layer.name.startsWith('l3_redis') && this.isRedisAvailable) {
      await this.setInRedis(key, item, ttl);
      return;
    }

    // Check if layer is full
    if (layer.cache.size >= layer.maxSize) {
      await this.evictFromLayer(layer);
    }

    layer.cache.set(key, item);
  }

  private async deleteFromLayer(key: string, layer: CacheLayer): Promise<boolean> {
    if (layer.name.startsWith('l3_redis') && this.isRedisAvailable) {
      return await this.deleteFromRedis(key);
    }

    return layer.cache.delete(key);
  }

  private async clearLayer(layer: CacheLayer): Promise<void> {
    if (layer.name.startsWith('l3_redis') && this.isRedisAvailable) {
      await this.clearRedis();
    } else {
      layer.cache.clear();
    }
  }

  private async evictFromLayer(layer: CacheLayer): Promise<void> {
    const strategy = layer.strategy.evictionPolicy;
    const items = Array.from(layer.cache.entries());

    let itemsToEvict: string[] = [];

    switch (strategy) {
      case 'lru':
        itemsToEvict = items
          .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
          .slice(0, Math.floor(layer.maxSize * 0.1))
          .map(([key]) => key);
        break;

      case 'lfu':
        itemsToEvict = items
          .sort((a, b) => a[1].accessCount - b[1].accessCount)
          .slice(0, Math.floor(layer.maxSize * 0.1))
          .map(([key]) => key);
        break;

      case 'ttl':
        const now = Date.now();
        itemsToEvict = items
          .filter(([_, item]) => now - item.timestamp > layer.ttl)
          .map(([key]) => key);
        break;

      case 'random':
        itemsToEvict = items
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.floor(layer.maxSize * 0.1))
          .map(([key]) => key);
        break;
    }

    for (const key of itemsToEvict) {
      layer.cache.delete(key);
      this.metrics.evictions++;
    }
  }

  private selectLayer(strategy: string): CacheLayer {
    const strategyConfig = this.strategies.get(strategy);
    if (!strategyConfig) {
      return this.layers[0]; // Default to L1
    }

    // Select layer based on TTL and size requirements
    if (strategyConfig.ttl <= 5 * 60 * 1000) {
      return this.layers[0]; // L1 for short-lived data
    } else if (strategyConfig.ttl <= 30 * 60 * 1000) {
      return this.layers[1]; // L2 for medium-lived data
    } else {
      return this.layers[2]; // L3 for long-lived data
    }
  }

  private serialize(value: any, method: string): any {
    switch (method) {
      case 'json':
        return JSON.stringify(value);
      case 'msgpack':
        // In a real implementation, you'd use msgpack-lite
        return JSON.stringify(value);
      case 'binary':
        return Buffer.from(JSON.stringify(value));
      default:
        return value;
    }
  }

  private deserialize<T>(value: any, method: string): T {
    switch (method) {
      case 'json':
        return JSON.parse(value);
      case 'msgpack':
        // In a real implementation, you'd use msgpack-lite
        return JSON.parse(value);
      case 'binary':
        return JSON.parse(value.toString());
      default:
        return value;
    }
  }

  private async compress(data: string): Promise<string> {
    // In a real implementation, you'd use compression libraries
    // For now, we'll just return the data as-is
    return data;
  }

  private async decompress(data: string): Promise<string> {
    // In a real implementation, you'd use decompression libraries
    return data;
  }

  private calculateSize(value: any): number {
    return JSON.stringify(value).length * 2; // Rough estimate
  }

  private updateAccessMetrics(key: string, layer: CacheLayer, accessTime: number): void {
    this.metrics.averageAccessTime = 
      (this.metrics.averageAccessTime + accessTime) / 2;
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
  }

  // Redis-specific methods
  private async getFromRedis<T>(key: string): Promise<T | null> {
    if (!this.redisClient) return null;

    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  private async setInRedis(key: string, item: CacheItem, ttl: number): Promise<void> {
    if (!this.redisClient) return;

    try {
      await this.redisClient.setEx(key, Math.floor(ttl / 1000), JSON.stringify(item));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  private async deleteFromRedis(key: string): Promise<boolean> {
    if (!this.redisClient) return false;

    try {
      const result = await this.redisClient.del(key);
      return result > 0;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  private async clearRedis(): Promise<void> {
    if (!this.redisClient) return;

    try {
      await this.redisClient.flushDb();
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  private startMetricsCollection(): void {
    // Update metrics every minute
    setInterval(() => {
      this.updateMemoryUsage();
      this.cleanupExpiredItems();
    }, 60 * 1000);

    // Log metrics every 5 minutes
    setInterval(() => {
      if (this.metrics.hitRate < 50) {
        console.warn(`Low cache hit rate: ${this.metrics.hitRate.toFixed(2)}%`);
      }
    }, 5 * 60 * 1000);
  }

  private updateMemoryUsage(): void {
    let totalMemory = 0;
    for (const layer of this.layers) {
      for (const [_, item] of layer.cache) {
        totalMemory += item.size;
      }
    }
    this.metrics.memoryUsage = totalMemory;
  }

  private cleanupExpiredItems(): void {
    const now = Date.now();
    
    for (const layer of this.layers) {
      if (layer.name.startsWith('l3_redis')) continue; // Redis handles TTL automatically

      for (const [key, item] of layer.cache) {
        if (now - item.timestamp > layer.ttl) {
          layer.cache.delete(key);
          this.metrics.evictions++;
        }
      }
    }
  }
}

// Export singleton instance
export const enhancedCache = EnhancedCache.getInstance();
