// Advanced multi-layer caching system with intelligent eviction and compression

interface CacheConfig {
  maxSize: number; // Maximum number of items
  maxMemoryMB: number; // Maximum memory usage in MB
  defaultTTL: number; // Default time-to-live in seconds
  compressionThreshold: number; // Compress items larger than this (bytes)
  enableCompression: boolean;
  enableMetrics: boolean;
  evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'ttl';
  cleanupInterval: number; // Cleanup interval in milliseconds
}

interface CacheItem<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  compressed: boolean;
  metadata?: Record<string, any>;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  compressions: number;
  totalSize: number;
  itemCount: number;
  hitRate: number;
  averageAccessTime: number;
}

interface CacheLayer {
  name: string;
  priority: number;
  maxSize: number;
  ttl: number;
  cache: Map<string, CacheItem>;
}

class AdvancedCache {
  private config: CacheConfig;
  private layers: CacheLayer[] = [];
  private metrics: CacheMetrics;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private compressionWorker: Worker | null = null;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxSize: 10000,
      maxMemoryMB: 100,
      defaultTTL: 300, // 5 minutes
      compressionThreshold: 1024, // 1KB
      enableCompression: true,
      enableMetrics: true,
      evictionPolicy: 'lru',
      cleanupInterval: 60000, // 1 minute
      ...config
    };

    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      compressions: 0,
      totalSize: 0,
      itemCount: 0,
      hitRate: 0,
      averageAccessTime: 0
    };

    this.initializeLayers();
    this.startCleanupTimer();
  }

  // Initialize cache layers
  private initializeLayers(): void {
    this.layers = [
      {
        name: 'hot',
        priority: 1,
        maxSize: Math.floor(this.config.maxSize * 0.1), // 10% for hot data
        ttl: this.config.defaultTTL * 2, // Longer TTL for hot data
        cache: new Map()
      },
      {
        name: 'warm',
        priority: 2,
        maxSize: Math.floor(this.config.maxSize * 0.3), // 30% for warm data
        ttl: this.config.defaultTTL,
        cache: new Map()
      },
      {
        name: 'cold',
        priority: 3,
        maxSize: Math.floor(this.config.maxSize * 0.6), // 60% for cold data
        ttl: Math.floor(this.config.defaultTTL * 0.5), // Shorter TTL for cold data
        cache: new Map()
      }
    ];
  }

  // Set cache item
  async set<T>(key: string, value: T, ttl?: number, metadata?: Record<string, any>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const itemTTL = ttl || this.config.defaultTTL;
      const serializedValue = JSON.stringify(value);
      const size = Buffer.byteLength(serializedValue, 'utf8');
      
      let processedValue: T | string = value;
      let compressed = false;

      // Compress large items
      if (this.config.enableCompression && size > this.config.compressionThreshold) {
        processedValue = await this.compress(serializedValue);
        compressed = true;
        this.metrics.compressions++;
      }

      const cacheItem: CacheItem<T> = {
        key,
        value: processedValue,
        timestamp: Date.now(),
        ttl: itemTTL * 1000, // Convert to milliseconds
        accessCount: 0,
        lastAccessed: Date.now(),
        size,
        compressed,
        metadata
      };

      // Determine appropriate layer based on access patterns
      const layer = this.selectLayer(key, metadata);
      
      // Check if key already exists and remove from all layers
      this.removeFromAllLayers(key);
      
      // Add to selected layer
      layer.cache.set(key, cacheItem);
      
      // Evict if necessary
      await this.evictIfNecessary(layer);
      
      // Update metrics
      this.updateMetrics();
      
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  }

  // Get cache item
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // Search through layers in priority order
      for (const layer of this.layers) {
        const item = layer.cache.get(key) as CacheItem<T>;
        
        if (item) {
          // Check if item has expired
          if (Date.now() - item.timestamp > item.ttl) {
            layer.cache.delete(key);
            this.metrics.misses++;
            continue;
          }

          // Update access statistics
          item.accessCount++;
          item.lastAccessed = Date.now();
          
          // Move to higher priority layer if frequently accessed
          this.promoteItem(key, item, layer);
          
          // Decompress if necessary
          let value = item.value;
          if (item.compressed) {
            value = await this.decompress(item.value as string) as T;
          }
          
          this.metrics.hits++;
          this.updateMetrics();
          
          return value;
        }
      }
      
      this.metrics.misses++;
      this.updateMetrics();
      return null;
      
    } catch (error) {
      console.error('Cache get error:', error);
      this.metrics.misses++;
      return null;
    }
  }

  // Delete cache item
  delete(key: string): boolean {
    return this.removeFromAllLayers(key);
  }

  // Check if key exists
  has(key: string): boolean {
    for (const layer of this.layers) {
      const item = layer.cache.get(key);
      if (item && Date.now() - item.timestamp <= item.ttl) {
        return true;
      }
    }
    return false;
  }

  // Clear all cache layers
  clear(): void {
    for (const layer of this.layers) {
      layer.cache.clear();
    }
    this.updateMetrics();
  }

  // Get cache statistics
  getStats(): CacheMetrics & { layers: Array<{ name: string; size: number; hitRate: number }> } {
    const layerStats = this.layers.map(layer => ({
      name: layer.name,
      size: layer.cache.size,
      hitRate: this.calculateLayerHitRate(layer)
    }));

    return {
      ...this.metrics,
      layers: layerStats
    };
  }

  // Batch operations
  async mget<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    
    const promises = keys.map(async (key) => {
      const value = await this.get<T>(key);
      results.set(key, value);
    });
    
    await Promise.all(promises);
    return results;
  }

  async mset<T>(items: Array<{ key: string; value: T; ttl?: number; metadata?: Record<string, any> }>): Promise<void> {
    const promises = items.map(({ key, value, ttl, metadata }) => 
      this.set(key, value, ttl, metadata)
    );
    
    await Promise.all(promises);
  }

  // Cache warming
  async warmCache<T>(keyValuePairs: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    console.log(`Warming cache with ${keyValuePairs.length} items...`);
    
    const promises = keyValuePairs.map(({ key, value, ttl }) => 
      this.set(key, value, ttl, { warmed: true })
    );
    
    await Promise.all(promises);
    console.log('Cache warming completed');
  }

  // Pattern-based operations
  async getByPattern(pattern: string): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    for (const layer of this.layers) {
      for (const [key, item] of layer.cache.entries()) {
        if (regex.test(key) && Date.now() - item.timestamp <= item.ttl) {
          let value = item.value;
          if (item.compressed) {
            value = await this.decompress(item.value as string);
          }
          results.set(key, value);
        }
      }
    }
    
    return results;
  }

  async deleteByPattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let deletedCount = 0;
    
    for (const layer of this.layers) {
      const keysToDelete: string[] = [];
      
      for (const key of layer.cache.keys()) {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => {
        layer.cache.delete(key);
        deletedCount++;
      });
    }
    
    this.updateMetrics();
    return deletedCount;
  }

  // Layer selection logic
  private selectLayer(key: string, metadata?: Record<string, any>): CacheLayer {
    // Use metadata to determine layer
    if (metadata?.priority === 'high' || metadata?.hot) {
      return this.layers[0]; // Hot layer
    }
    
    if (metadata?.priority === 'medium' || metadata?.warm) {
      return this.layers[1]; // Warm layer
    }
    
    // Default to cold layer
    return this.layers[2]; // Cold layer
  }

  // Item promotion logic
  private promoteItem(key: string, item: CacheItem, currentLayer: CacheLayer): void {
    // Promote to higher priority layer if frequently accessed
    if (item.accessCount > 5 && currentLayer.priority > 1) {
      const targetLayer = this.layers[currentLayer.priority - 2];
      
      if (targetLayer.cache.size < targetLayer.maxSize) {
        currentLayer.cache.delete(key);
        targetLayer.cache.set(key, item);
      }
    }
  }

  // Eviction logic
  private async evictIfNecessary(layer: CacheLayer): Promise<void> {
    if (layer.cache.size <= layer.maxSize) {
      return;
    }

    const itemsToEvict = layer.cache.size - layer.maxSize;
    const evictedKeys = this.selectEvictionCandidates(layer, itemsToEvict);
    
    evictedKeys.forEach(key => {
      layer.cache.delete(key);
      this.metrics.evictions++;
    });
  }

  // Select eviction candidates based on policy
  private selectEvictionCandidates(layer: CacheLayer, count: number): string[] {
    const items = Array.from(layer.cache.entries());
    
    switch (this.config.evictionPolicy) {
      case 'lru':
        return items
          .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
          .slice(0, count)
          .map(([key]) => key);
          
      case 'lfu':
        return items
          .sort((a, b) => a[1].accessCount - b[1].accessCount)
          .slice(0, count)
          .map(([key]) => key);
          
      case 'ttl':
        return items
          .sort((a, b) => (a[1].timestamp + a[1].ttl) - (b[1].timestamp + b[1].ttl))
          .slice(0, count)
          .map(([key]) => key);
          
      case 'fifo':
      default:
        return items
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .slice(0, count)
          .map(([key]) => key);
    }
  }

  // Remove item from all layers
  private removeFromAllLayers(key: string): boolean {
    let removed = false;
    
    for (const layer of this.layers) {
      if (layer.cache.delete(key)) {
        removed = true;
      }
    }
    
    return removed;
  }

  // Compression methods
  private async compress(data: string): Promise<string> {
    // Simple compression using built-in compression
    // In a real implementation, you would use a proper compression library
    try {
      const compressed = Buffer.from(data).toString('base64');
      return compressed;
    } catch (error) {
      console.error('Compression error:', error);
      return data;
    }
  }

  private async decompress(compressedData: string): Promise<any> {
    try {
      const decompressed = Buffer.from(compressedData, 'base64').toString('utf8');
      return JSON.parse(decompressed);
    } catch (error) {
      console.error('Decompression error:', error);
      return null;
    }
  }

  // Metrics calculation
  private updateMetrics(): void {
    let totalSize = 0;
    let totalItems = 0;
    
    for (const layer of this.layers) {
      totalItems += layer.cache.size;
      for (const item of layer.cache.values()) {
        totalSize += item.size;
      }
    }
    
    this.metrics.totalSize = totalSize;
    this.metrics.itemCount = totalItems;
    this.metrics.hitRate = this.metrics.hits + this.metrics.misses > 0 
      ? (this.metrics.hits / (this.metrics.hits + this.metrics.misses)) * 100 
      : 0;
  }

  private calculateLayerHitRate(layer: CacheLayer): number {
    // This would require more sophisticated tracking in a real implementation
    return 0;
  }

  // Cleanup timer
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const layer of this.layers) {
      const expiredKeys: string[] = [];
      
      for (const [key, item] of layer.cache.entries()) {
        if (now - item.timestamp > item.ttl) {
          expiredKeys.push(key);
        }
      }
      
      expiredKeys.forEach(key => {
        layer.cache.delete(key);
        cleanedCount++;
      });
    }
    
    if (cleanedCount > 0) {
      console.log(`Cache cleanup: removed ${cleanedCount} expired items`);
      this.updateMetrics();
    }
  }

  // Memory management
  private checkMemoryUsage(): boolean {
    const totalSizeMB = this.metrics.totalSize / (1024 * 1024);
    return totalSizeMB < this.config.maxMemoryMB;
  }

  // Destructor
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

// Singleton instance
export const advancedCache = new AdvancedCache();

// Export types
export type { CacheConfig, CacheItem, CacheMetrics, CacheLayer };
