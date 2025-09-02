import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateQueryParams, validateAndSanitize, sanitizeInput } from './validationSchemas';

interface ValidationConfig {
  query?: z.ZodSchema<any>;
  body?: z.ZodSchema<any>;
  params?: z.ZodSchema<any>;
  sanitize?: boolean;
}

type ValidationResult<T = any> = {
  success: true;
  data: T;
} | {
  success: false;
  errors: string[];
  statusCode: number;
};

class ValidationMiddleware {
  // Validate request with multiple schemas
  validateRequest<T = any>(
    request: NextRequest,
    config: ValidationConfig
  ): ValidationResult<T> {
    const errors: string[] = [];
    const validatedData: any = {};

    // Validate query parameters
    if (config.query) {
      const queryResult = validateQueryParams(config.query, request.nextUrl.searchParams);
      if (!queryResult.success) {
        errors.push(...queryResult.errors.map(err => `Query: ${err}`));
      } else {
        validatedData.query = queryResult.data;
      }
    }

    // Validate request body (for POST/PUT requests)
    if (config.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      // Note: In Next.js API routes, body parsing is handled separately
      // This is a placeholder for future body validation
    }

    // Validate URL parameters
    if (config.params) {
      // Extract params from URL path
      const pathSegments = request.nextUrl.pathname.split('/').filter(Boolean);
      const paramsResult = validateAndSanitize(config.params, { pathSegments });
      if (!paramsResult.success) {
        errors.push(...paramsResult.errors.map(err => `Params: ${err}`));
      } else {
        validatedData.params = paramsResult.data;
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        statusCode: 400
      };
    }

    // Sanitize data if requested
    if (config.sanitize) {
      return {
        success: true,
        data: sanitizeInput(validatedData) as T
      };
    }

    return {
      success: true,
      data: validatedData as T
    };
  }

  // Create validation wrapper for API handlers
  withValidation<T = any>(
    config: ValidationConfig,
    handler: (req: NextRequest, validatedData: T) => Promise<NextResponse>
  ) {
    return async (req: NextRequest): Promise<NextResponse> => {
      const validation = this.validateRequest<T>(req, config);

      if (!validation.success) {
        return NextResponse.json({
          success: false,
          error: 'Validation failed',
          details: validation.errors,
          timestamp: new Date().toISOString()
        }, { status: validation.statusCode });
      }

      try {
        return await handler(req, validation.data);
      } catch (error) {
        console.error('Handler error after validation:', error);
        return NextResponse.json({
          success: false,
          error: 'Internal server error',
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    };
  }

  // Validate specific endpoint patterns
  validatePropertySearch(req: NextRequest): ValidationResult {
    return this.validateRequest(req, {
      query: z.object({
        postcode: z.string().regex(/^[A-Z]{1,2}[0-9]{1,2}[A-Z]?[0-9][A-Z]{2}$/i, 'Invalid postcode'),
        limit: z.coerce.number().int().min(1).max(1000).default(10),
        propertyType: z.enum(['D', 'S', 'T', 'F', 'O']).optional(),
        minPrice: z.coerce.number().min(0).optional(),
        maxPrice: z.coerce.number().min(0).optional(),
        bedrooms: z.coerce.number().int().min(0).max(20).optional(),
        months: z.coerce.number().int().min(1).max(120).default(12)
      }),
      sanitize: true
    });
  }

  validateRecentSales(req: NextRequest): ValidationResult {
    return this.validateRequest(req, {
      query: z.object({
        postcode: z.string().regex(/^[A-Z]{1,2}[0-9]{1,2}[A-Z]?[0-9][A-Z]{2}$/i, 'Invalid postcode'),
        limit: z.coerce.number().int().min(1).max(1000).default(10),
        months: z.coerce.number().int().min(1).max(120).default(12)
      }),
      sanitize: true
    });
  }

  validateHPI(req: NextRequest): ValidationResult {
    return this.validateRequest(req, {
      query: z.object({
        postcode: z.string().regex(/^[A-Z]{1,2}[0-9]{1,2}[A-Z]?[0-9][A-Z]{2}$/i, 'Invalid postcode'),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        months: z.coerce.number().int().min(1).max(120).default(12)
      }),
      sanitize: true
    });
  }
}

// Singleton instance
export const validationMiddleware = new ValidationMiddleware();

// Convenience functions
export function withValidation<T = any>(
  config: ValidationConfig,
  handler: (req: NextRequest, validatedData: T) => Promise<NextResponse>
) {
  return validationMiddleware.withValidation(config, handler);
}

export function validatePropertySearch(req: NextRequest) {
  return validationMiddleware.validatePropertySearch(req);
}

export function validateRecentSales(req: NextRequest) {
  return validationMiddleware.validateRecentSales(req);
}

export function validateHPI(req: NextRequest) {
  return validationMiddleware.validateHPI(req);
}

// Common validation error responses
export function createValidationErrorResponse(errors: string[]): NextResponse {
  return NextResponse.json({
    success: false,
    error: 'Validation failed',
    details: errors,
    timestamp: new Date().toISOString()
  }, { status: 400 });
}

export function createRateLimitErrorResponse(): NextResponse {
  return NextResponse.json({
    success: false,
    error: 'Rate limit exceeded',
    timestamp: new Date().toISOString()
  }, { status: 429 });
}
