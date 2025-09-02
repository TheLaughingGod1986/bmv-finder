// Comprehensive integration manager for third-party APIs and external services

import { advancedCache } from './advancedCache';

interface IntegrationConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  rateLimit: {
    requests: number;
    window: number; // seconds
  };
  cacheTimeout: number; // seconds
  enabled: boolean;
  headers?: Record<string, string>;
}

interface IntegrationResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  cached?: boolean;
  timestamp: string;
  integration: string;
}

interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  limit: number;
}

interface IntegrationMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  lastRequest: string;
  rateLimitHits: number;
}

class IntegrationManager {
  private integrations: Map<string, IntegrationConfig> = new Map();
  private rateLimiters: Map<string, { count: number; resetTime: number }> = new Map();
  private metrics: Map<string, IntegrationMetrics> = new Map();
  private requestQueues: Map<string, Promise<any>[]> = new Map();

  constructor() {
    this.initializeIntegrations();
    this.startMetricsCleanup();
  }

  // Initialize all integrations
  private initializeIntegrations(): void {
    // Rightmove API
    this.addIntegration({
      name: 'rightmove',
      baseUrl: 'https://api.rightmove.co.uk',
      apiKey: process.env.RIGHTMOVE_API_KEY,
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: { requests: 100, window: 60 },
      cacheTimeout: 300, // 5 minutes
      enabled: !!process.env.RIGHTMOVE_API_KEY,
      headers: {
        'User-Agent': 'PropertyIntelligence/1.0',
        'Accept': 'application/json'
      }
    });

    // Zoopla API
    this.addIntegration({
      name: 'zoopla',
      baseUrl: 'https://api.zoopla.co.uk',
      apiKey: process.env.ZOOPLA_API_KEY,
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: { requests: 50, window: 60 },
      cacheTimeout: 300,
      enabled: !!process.env.ZOOPLA_API_KEY,
      headers: {
        'User-Agent': 'PropertyIntelligence/1.0',
        'Accept': 'application/json'
      }
    });

    // Land Registry API
    this.addIntegration({
      name: 'landregistry',
      baseUrl: 'https://landregistry.data.gov.uk',
      timeout: 15000,
      retryAttempts: 2,
      retryDelay: 2000,
      rateLimit: { requests: 200, window: 60 },
      cacheTimeout: 3600, // 1 hour
      enabled: true,
      headers: {
        'Accept': 'application/json'
      }
    });

    // Postcode API
    this.addIntegration({
      name: 'postcodes',
      baseUrl: 'https://api.postcodes.io',
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 1000,
      rateLimit: { requests: 1000, window: 60 },
      cacheTimeout: 86400, // 24 hours
      enabled: true,
      headers: {
        'Accept': 'application/json'
      }
    });

    // Google Maps API
    this.addIntegration({
      name: 'googlemaps',
      baseUrl: 'https://maps.googleapis.com/maps/api',
      apiKey: process.env.GOOGLE_MAPS_API_KEY,
      timeout: 10000,
      retryAttempts: 2,
      retryDelay: 1000,
      rateLimit: { requests: 100, window: 60 },
      cacheTimeout: 3600,
      enabled: !!process.env.GOOGLE_MAPS_API_KEY,
      headers: {
        'Accept': 'application/json'
      }
    });

    // Transport for London API
    this.addIntegration({
      name: 'tfl',
      baseUrl: 'https://api.tfl.gov.uk',
      apiKey: process.env.TFL_API_KEY,
      timeout: 8000,
      retryAttempts: 2,
      retryDelay: 1000,
      rateLimit: { requests: 500, window: 60 },
      cacheTimeout: 1800, // 30 minutes
      enabled: !!process.env.TFL_API_KEY,
      headers: {
        'Accept': 'application/json'
      }
    });

    // School Performance API
    this.addIntegration({
      name: 'schools',
      baseUrl: 'https://education.data.gov.uk',
      timeout: 10000,
      retryAttempts: 2,
      retryDelay: 1000,
      rateLimit: { requests: 100, window: 60 },
      cacheTimeout: 7200, // 2 hours
      enabled: true,
      headers: {
        'Accept': 'application/json'
      }
    });

    // Crime Data API
    this.addIntegration({
      name: 'crime',
      baseUrl: 'https://data.police.uk/api',
      timeout: 10000,
      retryAttempts: 2,
      retryDelay: 1000,
      rateLimit: { requests: 100, window: 60 },
      cacheTimeout: 3600,
      enabled: true,
      headers: {
        'Accept': 'application/json'
      }
    });
  }

  // Add integration configuration
  private addIntegration(config: IntegrationConfig): void {
    this.integrations.set(config.name, config);
    this.metrics.set(config.name, {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      lastRequest: '',
      rateLimitHits: 0
    });
    this.requestQueues.set(config.name, []);
  }

  // Make API request with rate limiting, caching, and error handling
  async makeRequest<T = any>(
    integrationName: string,
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      params?: Record<string, any>;
      body?: any;
      headers?: Record<string, string>;
      cacheKey?: string;
      bypassCache?: boolean;
    } = {}
  ): Promise<IntegrationResponse<T>> {
    const config = this.integrations.get(integrationName);
    if (!config || !config.enabled) {
      return {
        success: false,
        error: `Integration ${integrationName} not available`,
        timestamp: new Date().toISOString(),
        integration: integrationName
      };
    }

    const startTime = Date.now();
    const cacheKey = options.cacheKey || `${integrationName}:${endpoint}:${JSON.stringify(options.params || {})}`;

    try {
      // Check cache first
      if (!options.bypassCache) {
        const cached = await advancedCache.get<IntegrationResponse<T>>(cacheKey);
        if (cached) {
          this.updateMetrics(integrationName, Date.now() - startTime, true, true);
          return { ...cached, cached: true };
        }
      }

      // Check rate limit
      if (!this.checkRateLimit(integrationName)) {
        this.updateMetrics(integrationName, Date.now() - startTime, false, false, true);
        return {
          success: false,
          error: 'Rate limit exceeded',
          timestamp: new Date().toISOString(),
          integration: integrationName
        };
      }

      // Make request
      const response = await this.executeRequest<T>(config, endpoint, options);
      const responseTime = Date.now() - startTime;

      // Cache successful response
      if (response.success && response.data) {
        await advancedCache.set(cacheKey, response, config.cacheTimeout);
      }

      this.updateMetrics(integrationName, responseTime, response.success, false);
      return response;

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(integrationName, responseTime, false, false);

      return {
        success: false,
        error: error.message || 'Request failed',
        timestamp: new Date().toISOString(),
        integration: integrationName
      };
    }
  }

  // Execute HTTP request
  private async executeRequest<T>(
    config: IntegrationConfig,
    endpoint: string,
    options: any
  ): Promise<IntegrationResponse<T>> {
    const url = new URL(endpoint, config.baseUrl);
    
    // Add query parameters
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Add API key if required
    if (config.apiKey && !url.searchParams.has('key') && !url.searchParams.has('api_key')) {
      url.searchParams.append('key', config.apiKey);
    }

    const headers = {
      ...config.headers,
      ...options.headers
    };

    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
      signal: AbortSignal.timeout(config.timeout)
    };

    if (options.body) {
      requestOptions.body = typeof options.body === 'string' 
        ? options.body 
        : JSON.stringify(options.body);
      
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 0; attempt <= config.retryAttempts; attempt++) {
      try {
        const response = await fetch(url.toString(), requestOptions);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${data.message || response.statusText}`);
        }

        return {
          success: true,
          data,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
          integration: config.name
        };

      } catch (error: any) {
        lastError = error;
        
        if (attempt < config.retryAttempts) {
          await this.delay(config.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  // Check rate limit
  private checkRateLimit(integrationName: string): boolean {
    const config = this.integrations.get(integrationName);
    if (!config) return false;

    const now = Date.now();
    const limiter = this.rateLimiters.get(integrationName) || { count: 0, resetTime: now + config.rateLimit.window * 1000 };

    // Reset if window has passed
    if (now >= limiter.resetTime) {
      limiter.count = 0;
      limiter.resetTime = now + config.rateLimit.window * 1000;
    }

    // Check if limit exceeded
    if (limiter.count >= config.rateLimit.requests) {
      return false;
    }

    // Increment counter
    limiter.count++;
    this.rateLimiters.set(integrationName, limiter);
    return true;
  }

  // Update metrics
  private updateMetrics(
    integrationName: string,
    responseTime: number,
    success: boolean,
    cached: boolean,
    rateLimited: boolean = false
  ): void {
    const metrics = this.metrics.get(integrationName);
    if (!metrics) return;

    metrics.totalRequests++;
    if (success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
    }

    if (rateLimited) {
      metrics.rateLimitHits++;
    }

    // Update average response time
    metrics.averageResponseTime = 
      (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) / metrics.totalRequests;

    // Update cache hit rate
    const totalCacheableRequests = metrics.totalRequests - metrics.rateLimitHits;
    if (totalCacheableRequests > 0) {
      const currentCacheHits = Math.floor(metrics.cacheHitRate * totalCacheableRequests / 100);
      const newCacheHits = cached ? currentCacheHits + 1 : currentCacheHits;
      metrics.cacheHitRate = (newCacheHits / totalCacheableRequests) * 100;
    }

    metrics.lastRequest = new Date().toISOString();
    this.metrics.set(integrationName, metrics);
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private startMetricsCleanup(): void {
    // Clean up old rate limit data every hour
    setInterval(() => {
      const now = Date.now();
      this.rateLimiters.forEach((limiter, name) => {
        if (now >= limiter.resetTime) {
          this.rateLimiters.delete(name);
        }
      });
    }, 60 * 60 * 1000);
  }

  // Public methods for specific integrations

  // Rightmove integration
  async getRightmoveProperties(params: {
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    bedrooms?: number;
    radius?: number;
  }): Promise<IntegrationResponse> {
    return this.makeRequest('rightmove', '/properties', {
      params: {
        location: params.location,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        propertyType: params.propertyType,
        bedrooms: params.bedrooms,
        radius: params.radius || 1
      },
      cacheKey: `rightmove:${JSON.stringify(params)}`
    });
  }

  // Zoopla integration
  async getZooplaProperties(params: {
    postcode?: string;
    area?: string;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    bedrooms?: number;
  }): Promise<IntegrationResponse> {
    return this.makeRequest('zoopla', '/property_listings', {
      params: {
        postcode: params.postcode,
        area: params.area,
        min_price: params.minPrice,
        max_price: params.maxPrice,
        property_type: params.propertyType,
        bedrooms: params.bedrooms
      },
      cacheKey: `zoopla:${JSON.stringify(params)}`
    });
  }

  // Postcode lookup
  async getPostcodeInfo(postcode: string): Promise<IntegrationResponse> {
    return this.makeRequest('postcodes', `/postcodes/${postcode}`, {
      cacheKey: `postcode:${postcode}`
    });
  }

  // Reverse geocoding
  async getPostcodeFromCoordinates(lat: number, lng: number): Promise<IntegrationResponse> {
    return this.makeRequest('postcodes', '/postcodes', {
      params: { lat, lon: lng },
      cacheKey: `reverse:${lat},${lng}`
    });
  }

  // Google Maps integration
  async getNearbyPlaces(lat: number, lng: number, type: string, radius: number = 1000): Promise<IntegrationResponse> {
    return this.makeRequest('googlemaps', '/place/nearbysearch/json', {
      params: {
        location: `${lat},${lng}`,
        type,
        radius
      },
      cacheKey: `places:${lat},${lng}:${type}:${radius}`
    });
  }

  // Transport for London integration
  async getNearbyStations(lat: number, lng: number, radius: number = 1000): Promise<IntegrationResponse> {
    return this.makeRequest('tfl', '/StopPoint', {
      params: {
        lat,
        lon: lng,
        radius,
        stopTypes: 'NaptanMetroStation,NaptanRailStation,NaptanBusCoachStation'
      },
      cacheKey: `stations:${lat},${lng}:${radius}`
    });
  }

  // School data integration
  async getNearbySchools(lat: number, lng: number, radius: number = 2000): Promise<IntegrationResponse> {
    return this.makeRequest('schools', '/schools', {
      params: {
        lat,
        lng,
        radius,
        limit: 20
      },
      cacheKey: `schools:${lat},${lng}:${radius}`
    });
  }

  // Crime data integration
  async getCrimeData(lat: number, lng: number, date?: string): Promise<IntegrationResponse> {
    const crimeDate = date || new Date().toISOString().split('T')[0];
    return this.makeRequest('crime', '/crimes-street/all-crime', {
      params: {
        lat,
        lng,
        date: crimeDate
      },
      cacheKey: `crime:${lat},${lng}:${crimeDate}`
    });
  }

  // Land Registry integration
  async getLandRegistryData(postcode: string, fromDate?: string, toDate?: string): Promise<IntegrationResponse> {
    const from = fromDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const to = toDate || new Date().toISOString().split('T')[0];
    
    return this.makeRequest('landregistry', '/ppd', {
      params: {
        postcode,
        from,
        to,
        limit: 100
      },
      cacheKey: `landregistry:${postcode}:${from}:${to}`
    });
  }

  // Get integration metrics
  getMetrics(integrationName?: string): Map<string, IntegrationMetrics> | IntegrationMetrics | null {
    if (integrationName) {
      return this.metrics.get(integrationName) || null;
    }
    return this.metrics;
  }

  // Get integration status
  getIntegrationStatus(): Record<string, { enabled: boolean; config: IntegrationConfig }> {
    const status: Record<string, { enabled: boolean; config: IntegrationConfig }> = {};
    
    this.integrations.forEach((config, name) => {
      status[name] = {
        enabled: config.enabled,
        config: {
          ...config,
          apiKey: config.apiKey ? '***' : undefined
        }
      };
    });

    return status;
  }

  // Clear cache for specific integration
  async clearCache(integrationName: string): Promise<void> {
    const keys = await advancedCache.getKeys();
    const integrationKeys = keys.filter(key => key.startsWith(`${integrationName}:`));
    
    for (const key of integrationKeys) {
      await advancedCache.delete(key);
    }
  }

  // Test integration connectivity
  async testIntegration(integrationName: string): Promise<{ success: boolean; error?: string; responseTime?: number }> {
    const config = this.integrations.get(integrationName);
    if (!config) {
      return { success: false, error: 'Integration not found' };
    }

    const startTime = Date.now();
    
    try {
      // Simple health check endpoint
      const response = await this.makeRequest(integrationName, '/health', {
        bypassCache: true
      });

      return {
        success: response.success,
        error: response.error,
        responseTime: Date.now() - startTime
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }
}

// Singleton instance
export const integrationManager = new IntegrationManager();

// Export types
export type { IntegrationConfig, IntegrationResponse, RateLimitInfo, IntegrationMetrics };
