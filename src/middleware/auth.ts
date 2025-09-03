import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';
import { auditLogger } from '@/lib/audit/auditLogger';

export interface AuthMiddlewareOptions {
  requiredPermissions?: string[];
  requiredRole?: string;
  requiredTier?: string;
  allowAnonymous?: boolean;
}

export function withAuth(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Get current user
      const user = await getCurrentUser(request);
      
      // Check if authentication is required
      if (!options.allowAnonymous && !user) {
        await auditLogger.logPermissionDenied('anonymous', 'api', 'access', {
          path: request.nextUrl.pathname,
          method: request.method
        });
        
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Check if user is active
      if (user && !user.isActive) {
        await auditLogger.logPermissionDenied(user.id, 'api', 'access', {
          path: request.nextUrl.pathname,
          method: request.method,
          reason: 'account_inactive'
        });
        
        return NextResponse.json(
          { error: 'Account is inactive' },
          { status: 403 }
        );
      }

      // Check required role
      if (options.requiredRole && user && user.role.id !== options.requiredRole) {
        await auditLogger.logPermissionDenied(user.id, 'api', 'access', {
          path: request.nextUrl.pathname,
          method: request.method,
          reason: 'insufficient_role',
          requiredRole: options.requiredRole,
          userRole: user.role.id
        });
        
        return NextResponse.json(
          { error: 'Insufficient role permissions' },
          { status: 403 }
        );
      }

      // Check required tier
      if (options.requiredTier && user && user.tier !== options.requiredTier) {
        await auditLogger.logPermissionDenied(user.id, 'api', 'access', {
          path: request.nextUrl.pathname,
          method: request.method,
          reason: 'insufficient_tier',
          requiredTier: options.requiredTier,
          userTier: user.tier
        });
        
        return NextResponse.json(
          { error: 'Insufficient tier permissions' },
          { status: 403 }
        );
      }

      // Check required permissions
      if (options.requiredPermissions && user) {
        const hasAllPermissions = options.requiredPermissions.every(permission =>
          user.role.permissions.some(p => p.id === permission)
        );

        if (!hasAllPermissions) {
          await auditLogger.logPermissionDenied(user.id, 'api', 'access', {
            path: request.nextUrl.pathname,
            method: request.method,
            reason: 'insufficient_permissions',
            requiredPermissions: options.requiredPermissions,
            userPermissions: user.role.permissions.map(p => p.id)
          });
          
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      // Log successful access
      if (user) {
        await auditLogger.logDataAccess(
          user.id,
          'api',
          request.nextUrl.pathname,
          request.method.toLowerCase(),
          {
            path: request.nextUrl.pathname,
            method: request.method,
            userAgent: request.headers.get('user-agent'),
            ip: request.ip || request.headers.get('x-forwarded-for')
          }
        );
      }

      // Call the original handler with the authenticated user
      return await handler(request, user);
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      await auditLogger.logSystemEvent('auth_middleware_error', {
        path: request.nextUrl.pathname,
        method: request.method,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'high');
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Convenience functions for common auth patterns
export const requireAuth = (handler: (request: NextRequest, user: any) => Promise<NextResponse>) =>
  withAuth(handler, { allowAnonymous: false });

export const requireAdmin = (handler: (request: NextRequest, user: any) => Promise<NextResponse>) =>
  withAuth(handler, { requiredRole: 'admin' });

export const requireElite = (handler: (request: NextRequest, user: any) => Promise<NextResponse>) =>
  withAuth(handler, { requiredTier: 'elite' });

export const requirePermission = (permission: string) =>
  (handler: (request: NextRequest, user: any) => Promise<NextResponse>) =>
    withAuth(handler, { requiredPermissions: [permission] });

export const allowAnonymous = (handler: (request: NextRequest, user: any) => Promise<NextResponse>) =>
  withAuth(handler, { allowAnonymous: true });
