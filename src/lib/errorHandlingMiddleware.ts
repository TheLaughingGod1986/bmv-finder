import { NextRequest, NextResponse } from 'next/server';
import { apiPerformanceMonitor } from './apiPerformanceMonitor';

interface ErrorContext {
  endpoint: string;
  method: string;
  userAgent?: string;
  ip?: string;
  timestamp: number;
  error: Error;
  requestBody?: any;
  queryParams?: any;
}

interface ErrorResponse {
  success: false;
  error: string;
  errorId: string;
  timestamp: string;
  details?: any;
}

class ErrorHandlingMiddleware {
  private errorCounts = new Map<string, number>();
  private maxErrorCount = 100;

  // Generate unique error ID
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log error with context
  private logError(context: ErrorContext): void {
    const errorKey = `${context.method} ${context.endpoint}`;
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);

    console.error(`❌ API Error [${context.errorId}]:`, {
      endpoint: context.endpoint,
      method: context.method,
      error: context.error.message,
      stack: context.error.stack,
      userAgent: context.userAgent,
      ip: context.ip,
      timestamp: new Date(context.timestamp).toISOString(),
      errorCount: count + 1
    });

    // Track in performance monitor
    apiPerformanceMonitor.trackAPICall(
      context.endpoint,
      context.method,
      0, // No response time for errors
      500,
      context.userAgent,
      context.ip,
      context.error.message
    );
  }

  // Determine error severity
  private getErrorSeverity(error: Error, context: ErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    const errorKey = `${context.method} ${context.endpoint}`;
    const errorCount = this.errorCounts.get(errorKey) || 0;

    // Critical: Database connection errors, authentication failures
    if (error.message.includes('ECONNREFUSED') || 
        error.message.includes('authentication') ||
        error.message.includes('unauthorized')) {
      return 'critical';
    }

    // High: Frequent errors on same endpoint
    if (errorCount > 10) {
      return 'high';
    }

    // Medium: Validation errors, business logic errors
    if (error.message.includes('validation') || 
        error.message.includes('invalid') ||
        error.message.includes('not found')) {
      return 'medium';
    }

    return 'low';
  }

  // Create error response
  private createErrorResponse(
    error: Error, 
    context: ErrorContext, 
    statusCode: number = 500
  ): NextResponse<ErrorResponse> {
    const errorId = this.generateErrorId();
    const severity = this.getErrorSeverity(error, context);

    // Log the error
    this.logError({ ...context, errorId });

    // Determine user-friendly error message
    let userMessage = 'An unexpected error occurred';
    let details: any = undefined;

    if (error.message.includes('ECONNREFUSED')) {
      userMessage = 'Service temporarily unavailable';
      statusCode = 503;
    } else if (error.message.includes('validation')) {
      userMessage = 'Invalid request data';
      statusCode = 400;
    } else if (error.message.includes('not found')) {
      userMessage = 'Resource not found';
      statusCode = 404;
    } else if (error.message.includes('unauthorized')) {
      userMessage = 'Access denied';
      statusCode = 401;
    } else if (error.message.includes('rate limit')) {
      userMessage = 'Too many requests';
      statusCode = 429;
    }

    // Include details in development
    if (process.env.NODE_ENV === 'development') {
      details = {
        message: error.message,
        stack: error.stack,
        severity,
        context: {
          endpoint: context.endpoint,
          method: context.method,
          timestamp: new Date(context.timestamp).toISOString()
        }
      };
    }

    const response: ErrorResponse = {
      success: false,
      error: userMessage,
      errorId,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    };

    return NextResponse.json(response, { status: statusCode });
  }

  // Main error handling wrapper
  withErrorHandling(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest): Promise<NextResponse> => {
      const startTime = Date.now();
      const endpoint = req.nextUrl.pathname;
      const method = req.method;
      const userAgent = req.headers.get('user-agent') || undefined;
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;

      try {
        return await handler(req);
      } catch (error) {
        const context: ErrorContext = {
          endpoint,
          method,
          userAgent,
          ip,
          timestamp: startTime,
          error: error instanceof Error ? error : new Error(String(error)),
          queryParams: Object.fromEntries(req.nextUrl.searchParams)
        };

        return this.createErrorResponse(context.error, context);
      }
    };
  }

  // Get error statistics
  getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }

  // Clear error counts
  clearErrorCounts(): void {
    this.errorCounts.clear();
  }
}

// Singleton instance
export const errorHandlingMiddleware = new ErrorHandlingMiddleware();

// Convenience function
export function withErrorHandling(handler: (req: NextRequest) => Promise<NextResponse>) {
  return errorHandlingMiddleware.withErrorHandling(handler);
}
