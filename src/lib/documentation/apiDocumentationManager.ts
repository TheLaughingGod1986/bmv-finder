import { auditLogger } from '../audit/auditLogger';

export interface APIDocumentation {
  id: string;
  name: string;
  version: string;
  description: string;
  baseUrl: string;
  endpoints: APIEndpoint[];
  schemas: APISchema[];
  examples: APIExample[];
  authentication: APIAuthentication;
  rateLimiting: APIRateLimiting;
  errorCodes: APIErrorCode[];
  changelog: APIChangelogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  summary: string;
  description: string;
  tags: string[];
  parameters: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  examples: APIExample[];
  rateLimit?: number;
  authentication: boolean;
  permissions?: string[];
  deprecated: boolean;
  version: string;
}

export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required: boolean;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  format?: string;
  example?: any;
  enum?: any[];
  default?: any;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface APIRequestBody {
  description: string;
  required: boolean;
  content: {
    [mediaType: string]: {
      schema: any;
      examples?: { [key: string]: any };
    };
  };
}

export interface APIResponse {
  statusCode: number;
  description: string;
  content?: {
    [mediaType: string]: {
      schema: any;
      examples?: { [key: string]: any };
    };
  };
  headers?: { [key: string]: any };
}

export interface APISchema {
  name: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  description: string;
  properties?: { [key: string]: any };
  required?: string[];
  example?: any;
  enum?: any[];
  format?: string;
}

export interface APIExample {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  method: string;
  request?: {
    headers?: { [key: string]: string };
    body?: any;
    query?: { [key: string]: any };
  };
  response?: {
    statusCode: number;
    headers?: { [key: string]: string };
    body?: any;
  };
  tags: string[];
}

export interface APIAuthentication {
  type: 'bearer' | 'api-key' | 'oauth2' | 'basic';
  description: string;
  scheme?: string;
  bearerFormat?: string;
  flows?: {
    authorizationCode?: {
      authorizationUrl: string;
      tokenUrl: string;
      scopes: { [key: string]: string };
    };
    clientCredentials?: {
      tokenUrl: string;
      scopes: { [key: string]: string };
    };
  };
  apiKey?: {
    name: string;
    in: 'header' | 'query' | 'cookie';
  };
}

export interface APIRateLimiting {
  enabled: boolean;
  limits: {
    [tier: string]: {
      requests: number;
      window: string;
      burst?: number;
    };
  };
  headers: {
    limit: string;
    remaining: string;
    reset: string;
  };
}

export interface APIErrorCode {
  code: number;
  message: string;
  description: string;
  category: 'client' | 'server' | 'authentication' | 'authorization' | 'rate-limit';
  examples: {
    request?: any;
    response: any;
  }[];
}

export interface APIChangelogEntry {
  version: string;
  date: string;
  type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
  description: string;
  endpoints?: string[];
  breaking?: boolean;
}

export interface DocumentationConfig {
  theme: 'light' | 'dark' | 'auto';
  layout: 'sidebar' | 'tabs' | 'accordion';
  showExamples: boolean;
  showSchemas: boolean;
  showChangelog: boolean;
  enableTryIt: boolean;
  enableDownload: boolean;
  customCSS?: string;
}

export class APIDocumentationManager {
  private static instance: APIDocumentationManager;
  private documentation: Map<string, APIDocumentation> = new Map();
  private config: DocumentationConfig;

  public static getInstance(): APIDocumentationManager {
    if (!APIDocumentationManager.instance) {
      APIDocumentationManager.instance = new APIDocumentationManager();
    }
    return APIDocumentationManager.instance;
  }

  constructor() {
    this.config = {
      theme: 'auto',
      layout: 'sidebar',
      showExamples: true,
      showSchemas: true,
      showChangelog: true,
      enableTryIt: true,
      enableDownload: true,
    };
    this.initializeDefaultDocumentation();
  }

  private initializeDefaultDocumentation(): void {
    // Property Search API Documentation
    const propertySearchAPI: APIDocumentation = {
      id: 'property-search-api',
      name: 'Property Search API',
      version: '1.0.0',
      description: 'Comprehensive property search and analysis API for BMV property discovery',
      baseUrl: '/api',
      endpoints: [
        {
          id: 'search-properties',
          path: '/property-search',
          method: 'GET',
          summary: 'Search for properties',
          description: 'Search for properties based on location, price range, and other criteria',
          tags: ['Properties', 'Search'],
          parameters: [
            {
              name: 'location',
              in: 'query',
              required: true,
              description: 'Location to search (postcode, area, or coordinates)',
              type: 'string',
              example: 'SW1A 1AA',
            },
            {
              name: 'radius',
              in: 'query',
              required: false,
              description: 'Search radius in miles',
              type: 'number',
              default: 5,
              min: 0.1,
              max: 50,
            },
            {
              name: 'minPrice',
              in: 'query',
              required: false,
              description: 'Minimum property price',
              type: 'number',
              example: 100000,
            },
            {
              name: 'maxPrice',
              in: 'query',
              required: false,
              description: 'Maximum property price',
              type: 'number',
              example: 500000,
            },
            {
              name: 'propertyType',
              in: 'query',
              required: false,
              description: 'Type of property',
              type: 'string',
              enum: ['flat', 'house', 'terraced', 'semi-detached', 'detached'],
            },
            {
              name: 'bedrooms',
              in: 'query',
              required: false,
              description: 'Number of bedrooms',
              type: 'number',
              min: 1,
              max: 10,
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              description: 'Maximum number of results',
              type: 'number',
              default: 20,
              min: 1,
              max: 100,
            },
            {
              name: 'offset',
              in: 'query',
              required: false,
              description: 'Number of results to skip',
              type: 'number',
              default: 0,
              min: 0,
            },
          ],
          responses: [
            {
              statusCode: 200,
              description: 'Successful property search',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Property' },
                      },
                      pagination: { $ref: '#/components/schemas/Pagination' },
                      total: { type: 'number' },
                    },
                  },
                },
              },
            },
            {
              statusCode: 400,
              description: 'Bad request - invalid parameters',
            },
            {
              statusCode: 401,
              description: 'Unauthorized - authentication required',
            },
            {
              statusCode: 429,
              description: 'Too many requests - rate limit exceeded',
            },
          ],
          examples: [],
          rateLimit: 100,
          authentication: true,
          permissions: ['property.search'],
          deprecated: false,
          version: '1.0.0',
        },
        {
          id: 'property-valuation',
          path: '/property-valuation',
          method: 'POST',
          summary: 'Get property valuation',
          description: 'Get comprehensive property valuation and analysis',
          tags: ['Properties', 'Valuation'],
          parameters: [],
          requestBody: {
            description: 'Property details for valuation',
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    address: { type: 'string' },
                    postcode: { type: 'string' },
                    propertyType: { type: 'string' },
                    bedrooms: { type: 'number' },
                    bathrooms: { type: 'number' },
                    floorArea: { type: 'number' },
                    landArea: { type: 'number' },
                    yearBuilt: { type: 'number' },
                    condition: { type: 'string' },
                  },
                  required: ['address', 'postcode', 'propertyType'],
                },
              },
            },
          },
          responses: [
            {
              statusCode: 200,
              description: 'Successful property valuation',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/PropertyValuation' },
                    },
                  },
                },
              },
            },
          ],
          examples: [],
          rateLimit: 25,
          authentication: true,
          permissions: ['property.valuation'],
          deprecated: false,
          version: '1.0.0',
        },
      ],
      schemas: [
        {
          name: 'Property',
          type: 'object',
          description: 'Property information',
          properties: {
            id: { type: 'string' },
            address: { type: 'string' },
            postcode: { type: 'string' },
            price: { type: 'number' },
            propertyType: { type: 'string' },
            bedrooms: { type: 'number' },
            bathrooms: { type: 'number' },
            floorArea: { type: 'number' },
            landArea: { type: 'number' },
            yearBuilt: { type: 'number' },
            condition: { type: 'string' },
            bmvScore: { type: 'number' },
            confidence: { type: 'number' },
            images: {
              type: 'array',
              items: { type: 'string' },
            },
            features: {
              type: 'array',
              items: { type: 'string' },
            },
            location: {
              type: 'object',
              properties: {
                latitude: { type: 'number' },
                longitude: { type: 'number' },
                region: { type: 'string' },
                localAuthority: { type: 'string' },
              },
            },
          },
          required: ['id', 'address', 'postcode', 'price', 'propertyType'],
        },
        {
          name: 'PropertyValuation',
          type: 'object',
          description: 'Property valuation results',
          properties: {
            estimatedValue: { type: 'number' },
            confidence: { type: 'number' },
            valueRange: {
              type: 'object',
              properties: {
                min: { type: 'number' },
                max: { type: 'number' },
              },
            },
            bmvScore: { type: 'number' },
            marketAnalysis: { $ref: '#/components/schemas/MarketAnalysis' },
            comparableProperties: {
              type: 'array',
              items: { $ref: '#/components/schemas/Property' },
            },
            investmentMetrics: {
              type: 'object',
              properties: {
                rentalYield: { type: 'number' },
                capitalGrowth: { type: 'number' },
                totalReturn: { type: 'number' },
              },
            },
          },
          required: ['estimatedValue', 'confidence', 'bmvScore'],
        },
        {
          name: 'MarketAnalysis',
          type: 'object',
          description: 'Market analysis data',
          properties: {
            region: { type: 'string' },
            averagePrice: { type: 'number' },
            priceGrowth: { type: 'number' },
            salesVolume: { type: 'number' },
            daysOnMarket: { type: 'number' },
            marketTrend: { type: 'string', enum: ['rising', 'falling', 'stable'] },
          },
        },
        {
          name: 'Pagination',
          type: 'object',
          description: 'Pagination information',
          properties: {
            limit: { type: 'number' },
            offset: { type: 'number' },
            total: { type: 'number' },
            hasMore: { type: 'boolean' },
          },
        },
      ],
      examples: [
        {
          id: 'search-properties-example',
          name: 'Search Properties Example',
          description: 'Example of searching for properties in London',
          endpoint: '/property-search',
          method: 'GET',
          request: {
            query: {
              location: 'SW1A 1AA',
              radius: 5,
              minPrice: 300000,
              maxPrice: 800000,
              propertyType: 'flat',
              bedrooms: 2,
              limit: 10,
            },
          },
          response: {
            statusCode: 200,
            body: {
              success: true,
              data: [
                {
                  id: 'prop-123',
                  address: '123 Westminster Street',
                  postcode: 'SW1A 1AA',
                  price: 450000,
                  propertyType: 'flat',
                  bedrooms: 2,
                  bathrooms: 1,
                  bmvScore: 85,
                  confidence: 92,
                },
              ],
              pagination: {
                limit: 10,
                offset: 0,
                total: 1,
                hasMore: false,
              },
            },
          },
          tags: ['example', 'search'],
        },
      ],
      authentication: {
        type: 'bearer',
        description: 'JWT Bearer token authentication',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      rateLimiting: {
        enabled: true,
        limits: {
          free: { requests: 100, window: '1h' },
          premium: { requests: 1000, window: '1h' },
          elite: { requests: 5000, window: '1h' },
        },
        headers: {
          limit: 'X-RateLimit-Limit',
          remaining: 'X-RateLimit-Remaining',
          reset: 'X-RateLimit-Reset',
        },
      },
      errorCodes: [
        {
          code: 400,
          message: 'Bad Request',
          description: 'The request was invalid or cannot be served',
          category: 'client',
          examples: [
            {
              response: {
                success: false,
                error: 'Invalid location parameter',
                code: 400,
              },
            },
          ],
        },
        {
          code: 401,
          message: 'Unauthorized',
          description: 'Authentication is required and has failed or has not been provided',
          category: 'authentication',
          examples: [
            {
              response: {
                success: false,
                error: 'Authentication required',
                code: 401,
              },
            },
          ],
        },
        {
          code: 429,
          message: 'Too Many Requests',
          description: 'Rate limit exceeded',
          category: 'rate-limit',
          examples: [
            {
              response: {
                success: false,
                error: 'Rate limit exceeded',
                code: 429,
                retryAfter: 3600,
              },
            },
          ],
        },
      ],
      changelog: [
        {
          version: '1.0.0',
          date: '2024-01-15',
          type: 'added',
          description: 'Initial release of Property Search API',
          endpoints: ['/property-search', '/property-valuation'],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.documentation.set(propertySearchAPI.id, propertySearchAPI);

    // User Management API Documentation
    const userManagementAPI: APIDocumentation = {
      id: 'user-management-api',
      name: 'User Management API',
      version: '1.0.0',
      description: 'User authentication, profile management, and account operations',
      baseUrl: '/api',
      endpoints: [
        {
          id: 'user-register',
          path: '/auth/register',
          method: 'POST',
          summary: 'Register new user',
          description: 'Create a new user account',
          tags: ['Authentication', 'Users'],
          parameters: [],
          requestBody: {
            description: 'User registration data',
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    phone: { type: 'string' },
                    acceptTerms: { type: 'boolean' },
                  },
                  required: ['email', 'password', 'firstName', 'lastName', 'acceptTerms'],
                },
              },
            },
          },
          responses: [
            {
              statusCode: 201,
              description: 'User created successfully',
            },
            {
              statusCode: 400,
              description: 'Invalid registration data',
            },
            {
              statusCode: 409,
              description: 'User already exists',
            },
          ],
          examples: [],
          authentication: false,
          deprecated: false,
          version: '1.0.0',
        },
        {
          id: 'user-login',
          path: '/auth/login',
          method: 'POST',
          summary: 'User login',
          description: 'Authenticate user and return access token',
          tags: ['Authentication', 'Users'],
          parameters: [],
          requestBody: {
            description: 'Login credentials',
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                    rememberMe: { type: 'boolean' },
                  },
                  required: ['email', 'password'],
                },
              },
            },
          },
          responses: [
            {
              statusCode: 200,
              description: 'Login successful',
            },
            {
              statusCode: 401,
              description: 'Invalid credentials',
            },
          ],
          examples: [],
          authentication: false,
          deprecated: false,
          version: '1.0.0',
        },
      ],
      schemas: [
        {
          name: 'User',
          type: 'object',
          description: 'User information',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['free', 'premium', 'elite', 'admin'] },
            tier: { type: 'string', enum: ['free', 'premium', 'elite'] },
            status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            lastLoginAt: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'email', 'firstName', 'lastName', 'role', 'tier'],
        },
      ],
      examples: [],
      authentication: {
        type: 'bearer',
        description: 'JWT Bearer token authentication',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      rateLimiting: {
        enabled: true,
        limits: {
          default: { requests: 100, window: '1h' },
          login: { requests: 5, window: '15m' },
        },
        headers: {
          limit: 'X-RateLimit-Limit',
          remaining: 'X-RateLimit-Remaining',
          reset: 'X-RateLimit-Reset',
        },
      },
      errorCodes: [
        {
          code: 400,
          message: 'Bad Request',
          description: 'Invalid request data',
          category: 'client',
          examples: [
            {
              response: {
                success: false,
                error: 'Invalid email format',
                code: 400,
              },
            },
          ],
        },
        {
          code: 401,
          message: 'Unauthorized',
          description: 'Authentication failed',
          category: 'authentication',
          examples: [
            {
              response: {
                success: false,
                error: 'Invalid credentials',
                code: 401,
              },
            },
          ],
        },
      ],
      changelog: [
        {
          version: '1.0.0',
          date: '2024-01-15',
          type: 'added',
          description: 'Initial release of User Management API',
          endpoints: ['/auth/register', '/auth/login'],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.documentation.set(userManagementAPI.id, userManagementAPI);
  }

  // Add API documentation
  public addDocumentation(doc: APIDocumentation): boolean {
    try {
      this.documentation.set(doc.id, doc);

      auditLogger.logSystemEvent('api_documentation_created', {
        docId: doc.id,
        name: doc.name,
        version: doc.version,
        endpointCount: doc.endpoints.length,
      });

      return true;
    } catch (error) {
      console.error('Error adding API documentation:', error);
      return false;
    }
  }

  // Get API documentation
  public getDocumentation(id: string): APIDocumentation | null {
    return this.documentation.get(id) || null;
  }

  // Get all API documentation
  public getAllDocumentation(): APIDocumentation[] {
    return Array.from(this.documentation.values());
  }

  // Update API documentation
  public updateDocumentation(id: string, updates: Partial<APIDocumentation>): boolean {
    try {
      const existing = this.documentation.get(id);
      if (!existing) {
        return false;
      }

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      this.documentation.set(id, updated);

      auditLogger.logSystemEvent('api_documentation_updated', {
        docId: id,
        updates: Object.keys(updates),
      });

      return true;
    } catch (error) {
      console.error('Error updating API documentation:', error);
      return false;
    }
  }

  // Generate OpenAPI specification
  public generateOpenAPISpec(docId: string): any {
    const doc = this.documentation.get(docId);
    if (!doc) {
      return null;
    }

    const openAPISpec = {
      openapi: '3.0.0',
      info: {
        title: doc.name,
        version: doc.version,
        description: doc.description,
      },
      servers: [
        {
          url: doc.baseUrl,
          description: 'Production server',
        },
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    };

    // Add endpoints
    doc.endpoints.forEach(endpoint => {
      const path = endpoint.path;
      if (!openAPISpec.paths[path]) {
        openAPISpec.paths[path] = {};
      }

      openAPISpec.paths[path][endpoint.method.toLowerCase()] = {
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags,
        parameters: endpoint.parameters.map(param => ({
          name: param.name,
          in: param.in,
          required: param.required,
          description: param.description,
          schema: {
            type: param.type,
            format: param.format,
            enum: param.enum,
            default: param.default,
            minimum: param.min,
            maximum: param.max,
            pattern: param.pattern,
          },
          example: param.example,
        })),
        requestBody: endpoint.requestBody,
        responses: endpoint.responses.reduce((acc, response) => {
          acc[response.statusCode] = {
            description: response.description,
            content: response.content,
            headers: response.headers,
          };
          return acc;
        }, {} as any),
        security: endpoint.authentication ? [{ bearerAuth: [] }] : [],
        deprecated: endpoint.deprecated,
      };
    });

    // Add schemas
    doc.schemas.forEach(schema => {
      openAPISpec.components.schemas[schema.name] = {
        type: schema.type,
        description: schema.description,
        properties: schema.properties,
        required: schema.required,
        example: schema.example,
        enum: schema.enum,
        format: schema.format,
      };
    });

    return openAPISpec;
  }

  // Generate documentation HTML
  public generateDocumentationHTML(docId: string): string {
    const doc = this.documentation.get(docId);
    if (!doc) {
      return '<p>Documentation not found</p>';
    }

    let html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${doc.name} - API Documentation</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: #2563eb; color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 2.5rem; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; }
          .content { padding: 30px; }
          .endpoint { margin-bottom: 40px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .endpoint-header { display: flex; align-items: center; margin-bottom: 15px; }
          .method { padding: 4px 12px; border-radius: 4px; font-weight: bold; margin-right: 15px; }
          .method.get { background: #10b981; color: white; }
          .method.post { background: #3b82f6; color: white; }
          .method.put { background: #f59e0b; color: white; }
          .method.delete { background: #ef4444; color: white; }
          .path { font-family: monospace; font-size: 1.1rem; font-weight: bold; }
          .description { color: #6b7280; margin: 10px 0; }
          .parameters { margin: 20px 0; }
          .parameter { margin: 10px 0; padding: 10px; background: #f9fafb; border-radius: 4px; }
          .parameter-name { font-weight: bold; font-family: monospace; }
          .parameter-type { color: #6b7280; font-size: 0.9rem; }
          .parameter-required { color: #ef4444; font-size: 0.8rem; }
          .responses { margin: 20px 0; }
          .response { margin: 10px 0; padding: 10px; border-left: 4px solid #10b981; background: #f0fdf4; }
          .response.error { border-left-color: #ef4444; background: #fef2f2; }
          .code-block { background: #1f2937; color: #f9fafb; padding: 15px; border-radius: 4px; font-family: monospace; overflow-x: auto; }
          .tag { display: inline-block; background: #e5e7eb; color: #374151; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; margin: 2px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${doc.name}</h1>
            <p>${doc.description}</p>
            <p>Version: ${doc.version} | Base URL: ${doc.baseUrl}</p>
          </div>
          <div class="content">
    `;

    // Add endpoints
    doc.endpoints.forEach(endpoint => {
      html += `
        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</span>
            <span class="path">${endpoint.path}</span>
          </div>
          <h3>${endpoint.summary}</h3>
          <p class="description">${endpoint.description}</p>
          
          ${endpoint.tags.length > 0 ? `
            <div>
              ${endpoint.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          ` : ''}
          
          ${endpoint.parameters.length > 0 ? `
            <div class="parameters">
              <h4>Parameters</h4>
              ${endpoint.parameters.map(param => `
                <div class="parameter">
                  <div class="parameter-name">${param.name}</div>
                  <div class="parameter-type">${param.in} - ${param.type}</div>
                  ${param.required ? '<div class="parameter-required">Required</div>' : ''}
                  <div>${param.description}</div>
                  ${param.example ? `<div><strong>Example:</strong> ${param.example}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <div class="responses">
            <h4>Responses</h4>
            ${endpoint.responses.map(response => `
              <div class="response ${response.statusCode >= 400 ? 'error' : ''}">
                <strong>${response.statusCode}</strong> - ${response.description}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    html += `
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  // Get documentation configuration
  public getConfig(): DocumentationConfig {
    return this.config;
  }

  // Update documentation configuration
  public updateConfig(config: Partial<DocumentationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Export documentation
  public exportDocumentation(docId: string, format: 'json' | 'yaml' | 'html'): string | null {
    const doc = this.documentation.get(docId);
    if (!doc) {
      return null;
    }

    switch (format) {
      case 'json':
        return JSON.stringify(doc, null, 2);
      case 'yaml':
        // Simple YAML conversion (in production, use a proper YAML library)
        return this.convertToYAML(doc);
      case 'html':
        return this.generateDocumentationHTML(docId);
      default:
        return null;
    }
  }

  // Convert to YAML (simplified)
  private convertToYAML(obj: any, indent = 0): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    if (Array.isArray(obj)) {
      obj.forEach(item => {
        yaml += `${spaces}- ${this.convertToYAML(item, indent + 1)}\n`;
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          yaml += `${spaces}${key}:\n${this.convertToYAML(value, indent + 1)}`;
        } else {
          yaml += `${spaces}${key}: ${value}\n`;
        }
      });
    } else {
      yaml += `${obj}\n`;
    }

    return yaml;
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// Export singleton instance
export const apiDocumentationManager = APIDocumentationManager.getInstance();
