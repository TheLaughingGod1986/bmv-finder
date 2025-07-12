interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private configs: Map<string, RateLimitConfig>;

  constructor() {
    this.configs = new Map([
      ['free', { windowMs: 60000, maxRequests: 10, message: 'Rate limit exceeded for free tier' }],
      ['pro', { windowMs: 60000, maxRequests: 100, message: 'Rate limit exceeded for pro tier' }],
      ['elite', { windowMs: 60000, maxRequests: 500, message: 'Rate limit exceeded for elite tier' }],
      ['default', { windowMs: 60000, maxRequests: 10, message: 'Rate limit exceeded' }],
    ]);
  }

  isAllowed(identifier: string, tier: string = 'default'): { allowed: boolean; remaining: number; resetTime: number } {
    const config = this.configs.get(tier) || this.configs.get('default')!;
    const key = `${identifier}:${tier}`;
    const now = Date.now();

    let entry = this.limits.get(key);
    
    // If no entry exists or window has expired, create new entry
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs
      };
      this.limits.set(key, entry);
    }

    // Check if request is allowed
    const allowed = entry.count < config.maxRequests;
    
    if (allowed) {
      entry.count++;
    }

    return {
      allowed,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }

  getRemaining(identifier: string, tier: string = 'default'): { remaining: number; resetTime: number } {
    const config = this.configs.get(tier) || this.configs.get('default')!;
    const key = `${identifier}:${tier}`;
    const now = Date.now();

    const entry = this.limits.get(key);
    
    if (!entry || now > entry.resetTime) {
      return {
        remaining: config.maxRequests,
        resetTime: now + config.windowMs
      };
    }

    return {
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }

  reset(identifier: string, tier: string = 'default'): void {
    const key = `${identifier}:${tier}`;
    this.limits.delete(key);
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  // Get rate limit headers
  getHeaders(identifier: string, tier: string = 'default'): Record<string, string> {
    const { remaining, resetTime } = this.getRemaining(identifier, tier);
    const config = this.configs.get(tier) || this.configs.get('default')!;
    
    return {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(resetTime).toISOString(),
      'X-RateLimit-Window': config.windowMs.toString(),
    };
  }
}

// Create singleton instance
export const rateLimiter = new RateLimiter();

// Clean up expired entries every minute
setInterval(() => {
  rateLimiter.cleanup();
}, 60000);

// Rate limiting middleware for Next.js API routes
export function withRateLimit(handler: Function) {
  return async (req: any, res: any) => {
    // Handle different request object structures (Express vs Next.js App Router)
    const identifier = req.headers?.['x-forwarded-for'] || 
                      req.connection?.remoteAddress || 
                      req.socket?.remoteAddress ||
                      'unknown';
    const userTier = req.headers?.['x-user-tier'] || 'default';
    
    const { allowed, remaining, resetTime } = rateLimiter.isAllowed(identifier, userTier);
    
    // Add rate limit headers
    const headers = rateLimiter.getHeaders(identifier, userTier);
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    if (!allowed) {
      const config = rateLimiter['configs'].get(userTier) || rateLimiter['configs'].get('default')!;
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: config.message,
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
      });
    }

    return handler(req, res);
  };
}

export default RateLimiter; 