import { z } from 'zod';

// Common validation schemas
export const postcodeSchema = z.string()
  .regex(/^[A-Z]{1,2}[0-9]{1,2}[A-Z]?[0-9][A-Z]{2}$/i, 'Invalid UK postcode format')
  .transform(val => val.toUpperCase().replace(/\s/g, ''));

export const priceSchema = z.number()
  .min(0, 'Price must be positive')
  .max(100000000, 'Price too high');

export const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(date => !isNaN(Date.parse(date)), 'Invalid date');

export const propertyTypeSchema = z.enum([
  'D', 'S', 'T', 'F', 'O', 'Other'
], {
  errorMap: () => ({ message: 'Invalid property type' })
});

export const bedroomsSchema = z.number()
  .int('Bedrooms must be an integer')
  .min(0, 'Bedrooms cannot be negative')
  .max(20, 'Too many bedrooms');

export const limitSchema = z.number()
  .int('Limit must be an integer')
  .min(1, 'Limit must be at least 1')
  .max(1000, 'Limit cannot exceed 1000');

export const monthsSchema = z.number()
  .int('Months must be an integer')
  .min(1, 'Months must be at least 1')
  .max(120, 'Months cannot exceed 120');

// API endpoint validation schemas
export const propertySearchSchema = z.object({
  postcode: postcodeSchema,
  limit: limitSchema.default(10),
  propertyType: propertyTypeSchema.optional(),
  minPrice: priceSchema.optional(),
  maxPrice: priceSchema.optional(),
  bedrooms: bedroomsSchema.optional(),
  months: monthsSchema.default(12)
});

export const recentSalesSchema = z.object({
  postcode: postcodeSchema,
  limit: limitSchema.default(10),
  months: monthsSchema.default(12)
});

export const hpiSchema = z.object({
  postcode: postcodeSchema,
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  months: monthsSchema.default(12)
});

export const portfolioSchema = z.object({
  name: z.string().min(1, 'Portfolio name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  properties: z.array(z.object({
    address: z.string().min(1, 'Address is required'),
    postcode: postcodeSchema,
    purchasePrice: priceSchema,
    purchaseDate: dateSchema,
    bedrooms: bedroomsSchema.optional(),
    propertyType: propertyTypeSchema.optional()
  })).optional()
});

export const valuationSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  postcode: postcodeSchema,
  bedrooms: bedroomsSchema.optional(),
  propertyType: propertyTypeSchema.optional(),
  floorArea: z.number().min(0, 'Floor area must be positive').optional(),
  garden: z.boolean().optional(),
  parking: z.boolean().optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional()
});

// Sanitization functions
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[&"']/g, (match) => {
      switch (match) {
        case '&': return '&amp;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        default: return match;
      }
    });
}

export function sanitizeNumber(input: any): number | null {
  if (typeof input === 'number') return input;
  if (typeof input === 'string') {
    const parsed = parseFloat(input);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function sanitizePostcode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Remove all non-alphanumeric characters
    .replace(/^([A-Z]{1,2})([0-9]{1,2})([A-Z]?)([0-9])([A-Z]{2})$/, '$1$2$3$4$5');
}

export function sanitizeDate(input: string): string | null {
  const date = new Date(input);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

// Validation helper functions
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: any,
  options: { stripUnknown?: boolean } = {}
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return {
      success: false,
      errors: ['Validation failed']
    };
  }
}

export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; errors: string[] } {
  const params: any = {};
  
  for (const [key, value] of searchParams.entries()) {
    // Convert string numbers to numbers
    if (!isNaN(Number(value)) && value !== '') {
      params[key] = Number(value);
    } else {
      params[key] = value;
    }
  }

  return validateAndSanitize(schema, params);
}

// Rate limiting validation
export function validateRateLimit(
  request: NextRequest,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  // This is a simplified rate limiting check
  // In production, you'd use Redis or a proper rate limiting service
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  // For now, always allow (implement proper rate limiting later)
  return {
    allowed: true,
    remaining: maxRequests - 1,
    resetTime: Date.now() + windowMs
  };
}

// Input sanitization middleware
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return sanitizeString(input);
  }
  
  if (typeof input === 'number') {
    return sanitizeNumber(input);
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}
