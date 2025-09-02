import { performanceMonitor } from './performanceMonitor';

interface ErrorContext {
  userId?: string;
  endpoint?: string;
  method?: string;
  requestId?: string;
  timestamp: number;
  userAgent?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

interface ErrorLog {
  id: string;
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  handled: boolean;
  retryCount: number;
  maxRetries: number;
}

interface ErrorHandlerConfig {
  enableDetailedLogging: boolean;
  enableErrorReporting: boolean;
  enableRetryLogic: boolean;
  maxRetries: number;
  retryDelay: number;
  logErrorsToConsole: boolean;
  logErrorsToFile: boolean;
  errorLogFilePath?: string;
}

class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorLogs: ErrorLog[] = [];
  private maxErrorLogs = 1000;
  private retryStrategies = new Map<string, () => Promise<unknown>>();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableDetailedLogging: config.enableDetailedLogging ?? true,
      enableErrorReporting: config.enableErrorReporting ?? true,
      enableRetryLogic: config.enableRetryLogic ?? true,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      logErrorsToConsole: config.logErrorsToConsole ?? true,
      logErrorsToFile: config.logErrorsToFile ?? false,
      errorLogFilePath: config.errorLogFilePath
    };
  }

  // Main error handling method
  async handleError(
    error: Error,
    context: Partial<ErrorContext> = {},
    options: {
      severity?: 'low' | 'medium' | 'high' | 'critical';
      retryable?: boolean;
      retryStrategy?: () => Promise<unknown>;
    } = {}
  ): Promise<void> {
    const { severity = 'medium', retryable = false, retryStrategy } = options;
    
    // Create error context
    const errorContext: ErrorContext = {
      timestamp: Date.now(),
      ...context
    };

    // Generate unique error ID
    const errorId = this.generateErrorId();

    // Create error log entry
    const errorLog: ErrorLog = {
      id: errorId,
      error,
      context: errorContext,
      severity,
      handled: false,
      retryCount: 0,
      maxRetries: retryable ? this.config.maxRetries : 0
    };

    // Add to error logs
    this.addErrorLog(errorLog);

    // Log error based on configuration
    this.logError(errorLog);

    // Track error in performance monitor
    this.trackError(errorLog);

    // Handle retry logic if applicable
    if (retryable && retryStrategy && this.config.enableRetryLogic) {
      await this.handleRetry(errorLog, retryStrategy);
    }

    // Report error if enabled
    if (this.config.enableErrorReporting) {
      await this.reportError(errorLog);
    }

    // Mark as handled
    errorLog.handled = true;
  }

  // Retry logic for recoverable errors
  private async handleRetry(errorLog: ErrorLog, retryStrategy: () => Promise<unknown>): Promise<void> {
    if (errorLog.retryCount >= errorLog.maxRetries) {
      console.error(`Max retries exceeded for error ${errorLog.id}`);
      return;
    }

    try {
      // Exponential backoff delay
      const delay = this.config.retryDelay * Math.pow(2, errorLog.retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Attempt retry
      await retryStrategy();
      
      console.log(`Error ${errorLog.id} resolved after ${errorLog.retryCount + 1} retries`);
    } catch (retryError) {
      errorLog.retryCount++;
      console.warn(`Retry ${errorLog.retryCount} failed for error ${errorLog.id}:`, retryError);
      
      // Recursively retry if we haven't exceeded max retries
      if (errorLog.retryCount < errorLog.maxRetries) {
        await this.handleRetry(errorLog, retryStrategy);
      }
    }
  }

  // Error logging
  private logError(errorLog: ErrorLog): void {
    const { error, context, severity, retryCount } = errorLog;
    
    const logMessage = {
      timestamp: new Date(context.timestamp).toISOString(),
      errorId: errorLog.id,
      severity,
      message: error.message,
      stack: error.stack,
      context: {
        endpoint: context.endpoint,
        method: context.method,
        userId: context.userId,
        requestId: context.requestId,
        userAgent: context.userAgent,
        ip: context.ip,
        metadata: context.metadata
      },
      retryCount,
      handled: errorLog.handled
    };

    // Console logging
    if (this.config.logErrorsToConsole) {
      if (severity === 'critical' || severity === 'high') {
        console.error('🚨 CRITICAL ERROR:', logMessage);
      } else if (severity === 'medium') {
        console.warn('⚠️  ERROR:', logMessage);
      } else {
        console.log('ℹ️  INFO:', logMessage);
      }
    }

    // File logging (placeholder for production implementation)
    if (this.config.logErrorsToFile && this.config.errorLogFilePath) {
      this.logToFile(logMessage);
    }
  }

  // File logging implementation
  private logToFile(logMessage: unknown): void {
    // In production, you'd implement actual file logging here
    // For now, we'll just track that it was attempted
    console.log('📝 Error logged to file (placeholder implementation)');
  }

  // Error tracking in performance monitor
  private trackError(errorLog: ErrorLog): void {
    performanceMonitor.trackMetric(
      'error_occurrence',
      1,
      'count',
      {
        severity: errorLog.severity,
        errorType: errorLog.error.constructor.name,
        endpoint: errorLog.context.endpoint,
        handled: errorLog.handled
      }
    );
  }

  // Error reporting to external services
  private async reportError(errorLog: ErrorLog): Promise<void> {
    try {
      // In production, you'd send errors to services like Sentry, LogRocket, etc.
      const reportData = {
        errorId: errorLog.id,
        message: errorLog.error.message,
        stack: errorLog.error.stack,
        severity: errorLog.severity,
        context: errorLog.context,
        timestamp: errorLog.context.timestamp
      };

      // Placeholder for external error reporting
      console.log('📤 Error reported to external service (placeholder):', reportData);
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  // Error analysis and reporting
  getErrorReport(timeRange?: { start: number; end: number }): {
    totalErrors: number;
    errorsBySeverity: Record<string, number>;
    errorsByType: Record<string, number>;
    errorsByEndpoint: Record<string, number>;
    avgRetryCount: number;
    handledErrors: number;
    unhandledErrors: number;
    recommendations: string[];
  } {
    let filteredErrors = this.errorLogs;

    if (timeRange) {
      filteredErrors = filteredErrors.filter(error => 
        error.context.timestamp >= timeRange.start && error.context.timestamp <= timeRange.end
      );
    }

    if (filteredErrors.length === 0) {
      return {
        totalErrors: 0,
        errorsBySeverity: {},
        errorsByType: {},
        errorsByEndpoint: {},
        avgRetryCount: 0,
        handledErrors: 0,
        unhandledErrors: 0,
        recommendations: []
      };
    }

    // Analyze errors by various dimensions
    const errorsBySeverity: Record<string, number> = {};
    const errorsByType: Record<string, number> = {};
    const errorsByEndpoint: Record<string, number> = {};
    
    let totalRetryCount = 0;
    let handledErrors = 0;
    let unhandledErrors = 0;

    for (const error of filteredErrors) {
      // Severity analysis
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
      
      // Type analysis
      const errorType = error.error.constructor.name;
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
      
      // Endpoint analysis
      if (error.context.endpoint) {
        errorsByEndpoint[error.context.endpoint] = (errorsByEndpoint[error.context.endpoint] || 0) + 1;
      }
      
      // Retry analysis
      totalRetryCount += error.retryCount;
      
      // Handling analysis
      if (error.handled) {
        handledErrors++;
      } else {
        unhandledErrors++;
      }
    }

    const totalErrors = filteredErrors.length;
    const avgRetryCount = totalErrors > 0 ? totalRetryCount / totalErrors : 0;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (errorsBySeverity.critical > 0) {
      recommendations.push('Critical errors detected - immediate attention required');
    }
    
    if (errorsBySeverity.high > totalErrors * 0.1) {
      recommendations.push('High error rate detected - review error handling and retry logic');
    }
    
    if (avgRetryCount > 1) {
      recommendations.push('High retry count - consider improving error recovery mechanisms');
    }
    
    if (unhandledErrors > totalErrors * 0.2) {
      recommendations.push('Many unhandled errors - review error handling coverage');
    }

    return {
      totalErrors,
      errorsBySeverity,
      errorsByType,
      errorsByEndpoint,
      avgRetryCount: Math.round(avgRetryCount * 100) / 100,
      handledErrors,
      unhandledErrors,
      recommendations
    };
  }

  // Error recovery utilities
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: Partial<ErrorContext> = {},
    options: {
      severity?: 'low' | 'medium' | 'high' | 'critical';
      retryable?: boolean;
      fallback?: T;
    } = {}
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const { severity = 'medium', retryable = false, fallback } = options;
      
      await this.handleError(error as Error, context, { severity, retryable });
      
      if (fallback !== undefined) {
        return fallback;
      }
      
      throw error;
    }
  }

  // Retry wrapper for operations
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries,
    delay: number = this.config.retryDelay
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError!;
  }

  // Utility methods
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addErrorLog(errorLog: ErrorLog): void {
    this.errorLogs.push(errorLog);
    
    // Trim old logs if we exceed the limit
    if (this.errorLogs.length > this.maxErrorLogs) {
      this.errorLogs.splice(0, this.errorLogs.length - this.maxErrorLogs);
    }
  }

  // Configuration management
  updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): ErrorHandlerConfig {
    return { ...this.config };
  }

  // Clear error logs
  clearErrorLogs(): void {
    this.errorLogs = [];
  }

  // Get error logs for debugging
  getErrorLogs(): ErrorLog[] {
    return [...this.errorLogs];
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandler();

// Export types and utilities
export type { ErrorContext, ErrorLog, ErrorHandlerConfig };
export { ErrorHandler };

export default errorHandler;
