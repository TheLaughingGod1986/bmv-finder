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
    try {
      // Handle different request object structures (Express vs Next.js App Router)
      const identifier = req.headers?.['x-forwarded-for'] || 
                        req.connection?.remoteAddress || 
                        req.socket?.remoteAddress ||
                        'unknown';
      const userTier = req.headers?.['x-user-tier'] || 'default';
      
      const { allowed, remaining, resetTime } = rateLimiter.isAllowed(identifier, userTier);
      
      // Add rate limit headers - only if res object exists and has setHeader method
      if (res && typeof res.setHeader === 'function') {
        const headers = rateLimiter.getHeaders(identifier, userTier);
        Object.entries(headers).forEach(([key, value]) => {
          try {
            res.setHeader(key, value);
          } catch (error) {
            console.warn(`Could not set rate limit header ${key}:`, error);
          }
        });
      }

      if (!allowed) {
        const config = rateLimiter['configs'].get(userTier) || rateLimiter['configs'].get('default')!;
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: config.message,
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
        });
      }

      return handler(req, res);
    } catch (error) {
      console.error('Rate limiter error:', error);
      // If rate limiting fails, allow the request to proceed
      return handler(req, res);
    }
  };
}

// Next.js App Router specific rate limiter
export function checkRateLimit(request: Request): { allowed: boolean; headers: Record<string, string>; error?: any } {
  try {
    const identifier = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') ||
                      'unknown';
    const userTier = request.headers.get('x-user-tier') || 'default';
    
    const { allowed, remaining, resetTime } = rateLimiter.isAllowed(identifier, userTier);
    const headers = rateLimiter.getHeaders(identifier, userTier);
    
    if (!allowed) {
      const config = rateLimiter['configs'].get(userTier) || rateLimiter['configs'].get('default')!;
      return {
        allowed: false,
        headers,
        error: {
          status: 429,
          message: 'Rate limit exceeded',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
        }
      };
    }
    
    return { allowed: true, headers };
  } catch (error) {
    console.error('Rate limiter error:', error);
    // If rate limiting fails, allow the request to proceed
    return { allowed: true, headers: {} };
  }
}

// Helper function to apply rate limit headers to NextResponse
export function applyRateLimitHeaders(response: Response, headers: Record<string, string>): Response {
  const newResponse = new Response(response.body, response);
  Object.entries(headers).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  return newResponse;
}

export default RateLimiter; 