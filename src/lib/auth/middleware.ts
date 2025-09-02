import { NextRequest, NextResponse } from 'next/server';
import { authService, Permission, UserRole } from './productionAuth';

// Middleware configuration
export interface AuthMiddlewareConfig {
  requireAuth?: boolean;
  requiredPermissions?: Permission[];
  requiredRole?: UserRole;
  allowGuests?: boolean;
}

// Default middleware configuration
const DEFAULT_CONFIG: AuthMiddlewareConfig = {
  requireAuth: true,
  allowGuests: false
};

// Authentication middleware factory
export function createAuthMiddleware(config: AuthMiddlewareConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
    try {
      // Skip authentication if not required
      if (!finalConfig.requireAuth) {
        return null;
      }

      // Get current user
      const user = await authService.getCurrentUser(request);

      // Handle unauthenticated requests
      if (!user) {
        if (finalConfig.allowGuests) {
          return null; // Allow guest access
        }

        return NextResponse.json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }, { status: 401 });
      }

      // Check role requirements
      if (finalConfig.requiredRole && user.role !== finalConfig.requiredRole) {
        // Check if user has higher role (admin can access everything)
        if (user.role !== UserRole.ADMIN) {
          return NextResponse.json({
            success: false,
            error: `Role '${finalConfig.requiredRole}' required`,
            code: 'INSUFFICIENT_ROLE'
          }, { status: 403 });
        }
      }

      // Check permission requirements
      if (finalConfig.requiredPermissions && finalConfig.requiredPermissions.length > 0) {
        const hasAllPermissions = finalConfig.requiredPermissions.every(permission =>
          user.permissions.includes(permission)
        );

        if (!hasAllPermissions) {
          return NextResponse.json({
            success: false,
            error: 'Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSIONS',
            required: finalConfig.requiredPermissions,
            userPermissions: user.permissions
          }, { status: 403 });
        }
      }

      // Add user to request headers for downstream handlers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', user.id);
      requestHeaders.set('x-user-email', user.email);
      requestHeaders.set('x-user-role', user.role);
      requestHeaders.set('x-user-permissions', JSON.stringify(user.permissions));

      // Create new request with user headers
      const modifiedRequest = new NextRequest(request.url, {
        method: request.method,
        headers: requestHeaders,
        body: request.body
      });

      return null; // Continue to next middleware/handler
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json({
        success: false,
        error: 'Authentication middleware error',
        code: 'AUTH_MIDDLEWARE_ERROR'
      }, { status: 500 });
    }
  };
}

// Pre-configured middleware instances
export const requireAuth = createAuthMiddleware({
  requireAuth: true,
  allowGuests: false
});

export const requirePremium = createAuthMiddleware({
  requireAuth: true,
  requiredRole: UserRole.PREMIUM
});

export const requireAdmin = createAuthMiddleware({
  requireAuth: true,
  requiredRole: UserRole.ADMIN
});

export const requirePortfolioAccess = createAuthMiddleware({
  requireAuth: true,
  requiredPermissions: [Permission.READ_PORTFOLIO]
});

export const requirePortfolioWrite = createAuthMiddleware({
  requireAuth: true,
  requiredPermissions: [Permission.WRITE_PORTFOLIO]
});

export const requireAnalyticsAccess = createAuthMiddleware({
  requireAuth: true,
  requiredPermissions: [Permission.READ_ANALYTICS]
});

export const requireAPI = createAuthMiddleware({
  requireAuth: true,
  requiredPermissions: [Permission.API_ACCESS]
});

export const allowGuests = createAuthMiddleware({
  requireAuth: false,
  allowGuests: true
});

// Utility function to extract user from request headers
export function getUserFromRequest(request: NextRequest): {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
} | null {
  try {
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    const userRole = request.headers.get('x-user-role') as UserRole;
    const userPermissions = request.headers.get('x-user-permissions');

    if (!userId || !userEmail || !userRole || !userPermissions) {
      return null;
    }

    return {
      id: userId,
      email: userEmail,
      role: userRole,
      permissions: JSON.parse(userPermissions)
    };
  } catch (error) {
    return null;
  }
}

// Higher-order function to wrap API handlers with authentication
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: any, ...args: T) => Promise<NextResponse>,
  config: AuthMiddlewareConfig = {}
) {
  const middleware = createAuthMiddleware(config);

  return async function(request: NextRequest, ...args: T): Promise<NextResponse> {
    // Run authentication middleware
    const middlewareResponse = await middleware(request);
    if (middlewareResponse) {
      return middlewareResponse;
    }

    // Extract user from headers
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found in request',
        code: 'USER_NOT_FOUND'
      }, { status: 500 });
    }

    // Call the original handler with user context
    return handler(request, user, ...args);
  };
}

// Rate limiting middleware
export class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetTime) {
      // Create new record or reset expired record
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const record = this.requests.get(identifier);
    if (!record) return this.maxRequests;
    return Math.max(0, this.maxRequests - record.count);
  }

  getResetTime(identifier: string): number {
    const record = this.requests.get(identifier);
    return record ? record.resetTime : Date.now() + this.windowMs;
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Rate limiting middleware
export function withRateLimit(
  windowMs: number = 60000,
  maxRequests: number = 100
) {
  const limiter = new RateLimiter(windowMs, maxRequests);

  return async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
    const identifier = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

    if (!limiter.isAllowed(identifier)) {
      const resetTime = limiter.getResetTime(identifier);
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter
      }, { 
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime.toString()
        }
      });
    }

    // Add rate limit headers
    const remaining = limiter.getRemainingRequests(identifier);
    const resetTime = limiter.getResetTime(identifier);

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetTime.toString());

    return null;
  };
}

// Combined auth and rate limiting middleware
export function withAuthAndRateLimit(
  authConfig: AuthMiddlewareConfig = {},
  rateLimitConfig: { windowMs?: number; maxRequests?: number } = {}
) {
  const authMiddleware = createAuthMiddleware(authConfig);
  const rateLimitMiddleware = withRateLimit(
    rateLimitConfig.windowMs,
    rateLimitConfig.maxRequests
  );

  return async function combinedMiddleware(request: NextRequest): Promise<NextResponse | null> {
    // Run rate limiting first
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Then run authentication
    return authMiddleware(request);
  };
}
