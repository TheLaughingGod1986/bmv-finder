import crypto from 'crypto';

export interface APIDocumentation {
  id: string;
  title: string;
  description: string;
  version: string;
  baseUrl: string;
  endpoints: APIEndpoint[];
  schemas: APISchema[];
  examples: APIExample[];
  authentication: AuthenticationInfo;
  rateLimiting: RateLimitInfo;
  errorCodes: ErrorCode[];
  changelog: ChangelogEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  summary: string;
  description: string;
  tags: string[];
  parameters: APIParameter[];
  requestBody?: RequestBody;
  responses: APIResponse[];
  examples: EndpointExample[];
  authentication: boolean;
  rateLimit?: RateLimitInfo;
  deprecated: boolean;
  since: string;
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
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

export interface RequestBody {
  description: string;
  required: boolean;
  content: ContentType[];
}

export interface ContentType {
  mediaType: string;
  schema: APISchema;
  example?: any;
}

export interface APIResponse {
  statusCode: number;
  description: string;
  content?: ContentType[];
  headers?: Record<string, string>;
}

export interface APISchema {
  id: string;
  name: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  description: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  example?: any;
  enum?: any[];
  format?: string;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  items?: APISchema;
}

export interface SchemaProperty {
  type: string;
  description: string;
  example?: any;
  format?: string;
  enum?: any[];
  default?: any;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  items?: APISchema;
}

export interface APIExample {
  id: string;
  title: string;
  description: string;
  endpoint: string;
  method: string;
  request: ExampleRequest;
  response: ExampleResponse;
  tags: string[];
}

export interface ExampleRequest {
  headers?: Record<string, string>;
  query?: Record<string, any>;
  path?: Record<string, any>;
  body?: any;
}

export interface ExampleResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: any;
}

export interface EndpointExample {
  title: string;
  description: string;
  request: ExampleRequest;
  response: ExampleResponse;
}

export interface AuthenticationInfo {
  type: 'bearer' | 'api_key' | 'oauth2' | 'basic';
  description: string;
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuth2Flow[];
  apiKeyLocation?: 'header' | 'query' | 'cookie';
  apiKeyName?: string;
}

export interface OAuth2Flow {
  type: 'authorizationCode' | 'implicit' | 'password' | 'clientCredentials';
  authorizationUrl: string;
  tokenUrl: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface RateLimitInfo {
  requests: number;
  window: string;
  description: string;
}

export interface ErrorCode {
  code: number;
  message: string;
  description: string;
  possibleCauses: string[];
  solutions: string[];
}

export interface ChangelogEntry {
  version: string;
  date: Date;
  changes: ChangeEntry[];
}

export interface ChangeEntry {
  type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
  description: string;
  endpoint?: string;
  breaking?: boolean;
}

export class APIDocumentationManager {
  private static instance: APIDocumentationManager;
  private documentation: Map<string, APIDocumentation> = new Map();
  private schemas: Map<string, APISchema> = new Map();
  private examples: Map<string, APIExample> = new Map();

  private constructor() {
    this.initializeDefaultDocumentation();
  }

  public static getInstance(): APIDocumentationManager {
    if (!APIDocumentationManager.instance) {
      APIDocumentationManager.instance = new APIDocumentationManager();
    }
    return APIDocumentationManager.instance;
  }

  // Documentation Management
  async generateAPIDocumentation(): Promise<APIDocumentation> {
    const documentation: APIDocumentation = {
      id: crypto.randomUUID(),
      title: 'BMV Finder API Documentation',
      description: 'Comprehensive API documentation for the BMV Finder property intelligence platform',
      version: '1.0.0',
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://bmv-finder.vercel.app',
      endpoints: await this.generateEndpoints(),
      schemas: await this.generateSchemas(),
      examples: await this.generateExamples(),
      authentication: this.getAuthenticationInfo(),
      rateLimiting: this.getRateLimitInfo(),
      errorCodes: this.getErrorCodes(),
      changelog: this.getChangelog(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.documentation.set(documentation.id, documentation);
    return documentation;
  }

  // Endpoint Generation
  private async generateEndpoints(): Promise<APIEndpoint[]> {
    const endpoints: APIEndpoint[] = [
      // Authentication Endpoints
      {
        id: crypto.randomUUID(),
        path: '/api/auth/login',
        method: 'POST',
        summary: 'User Login',
        description: 'Authenticate user with email and password',
        tags: ['Authentication'],
        parameters: [],
        requestBody: {
          description: 'Login credentials',
          required: true,
          content: [{
            mediaType: 'application/json',
            schema: this.getSchema('LoginRequest'),
            example: {
              email: 'user@example.com',
              password: 'password123'
            }
          }]
        },
        responses: [
          {
            statusCode: 200,
            description: 'Login successful',
            content: [{
              mediaType: 'application/json',
              schema: this.getSchema('LoginResponse')
            }]
          },
          {
            statusCode: 401,
            description: 'Invalid credentials'
          }
        ],
        examples: [{
          title: 'Successful Login',
          description: 'Example of a successful login request',
          request: {
            body: {
              email: 'user@example.com',
              password: 'password123'
            }
          },
          response: {
            statusCode: 200,
            body: {
              success: true,
              user: {
                id: 'user-123',
                email: 'user@example.com',
                name: 'John Doe'
              },
              token: 'jwt-token-here'
            }
          }
        }],
        authentication: false,
        deprecated: false,
        since: '1.0.0'
      },

      // Property Search Endpoints
      {
        id: crypto.randomUUID(),
        path: '/api/property-search',
        method: 'GET',
        summary: 'Search Properties',
        description: 'Search for properties with various filters and criteria',
        tags: ['Properties', 'Search'],
        parameters: [
          {
            name: 'postcode',
            in: 'query',
            required: false,
            description: 'Postcode to search within',
            type: 'string',
            example: 'SW1A 1AA'
          },
          {
            name: 'radius',
            in: 'query',
            required: false,
            description: 'Search radius in miles',
            type: 'number',
            example: 5,
            minimum: 1,
            maximum: 50
          },
          {
            name: 'minPrice',
            in: 'query',
            required: false,
            description: 'Minimum property price',
            type: 'number',
            example: 100000
          },
          {
            name: 'maxPrice',
            in: 'query',
            required: false,
            description: 'Maximum property price',
            type: 'number',
            example: 500000
          },
          {
            name: 'propertyType',
            in: 'query',
            required: false,
            description: 'Type of property',
            type: 'string',
            enum: ['House', 'Flat', 'Terraced', 'Semi-Detached', 'Detached']
          },
          {
            name: 'bedrooms',
            in: 'query',
            required: false,
            description: 'Number of bedrooms',
            type: 'number',
            minimum: 1,
            maximum: 10
          },
          {
            name: 'page',
            in: 'query',
            required: false,
            description: 'Page number for pagination',
            type: 'number',
            example: 1,
            minimum: 1
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'Number of results per page',
            type: 'number',
            example: 20,
            minimum: 1,
            maximum: 100
          }
        ],
        responses: [
          {
            statusCode: 200,
            description: 'Search results',
            content: [{
              mediaType: 'application/json',
              schema: this.getSchema('PropertySearchResponse')
            }]
          },
          {
            statusCode: 400,
            description: 'Invalid search parameters'
          },
          {
            statusCode: 429,
            description: 'Rate limit exceeded'
          }
        ],
        examples: [{
          title: 'Basic Property Search',
          description: 'Search for properties in a specific postcode',
          request: {
            query: {
              postcode: 'SW1A 1AA',
              radius: 5,
              minPrice: 200000,
              maxPrice: 600000,
              propertyType: 'House',
              bedrooms: 3
            }
          },
          response: {
            statusCode: 200,
            body: {
              success: true,
              results: [
                {
                  id: 'prop-123',
                  address: '123 Example Street, London',
                  postcode: 'SW1A 1AA',
                  price: 450000,
                  bedrooms: 3,
                  bathrooms: 2,
                  propertyType: 'House',
                  bmvScore: 85,
                  estimatedValue: 425000,
                  potentialSavings: 25000
                }
              ],
              pagination: {
                page: 1,
                limit: 20,
                total: 1,
                totalPages: 1
              }
            }
          }
        }],
        authentication: true,
        rateLimit: {
          requests: 100,
          window: '1 hour',
          description: '100 requests per hour for authenticated users'
        },
        deprecated: false,
        since: '1.0.0'
      },

      // Portfolio Endpoints
      {
        id: crypto.randomUUID(),
        path: '/api/portfolio',
        method: 'GET',
        summary: 'Get User Portfolio',
        description: 'Retrieve user\'s property portfolio with performance metrics',
        tags: ['Portfolio'],
        parameters: [],
        responses: [
          {
            statusCode: 200,
            description: 'Portfolio data',
            content: [{
              mediaType: 'application/json',
              schema: this.getSchema('PortfolioResponse')
            }]
          },
          {
            statusCode: 401,
            description: 'Unauthorized'
          }
        ],
        examples: [{
          title: 'Get Portfolio',
          description: 'Retrieve user portfolio with performance metrics',
          request: {},
          response: {
            statusCode: 200,
            body: {
              success: true,
              portfolio: {
                id: 'portfolio-123',
                name: 'My Property Portfolio',
                properties: [
                  {
                    id: 'prop-123',
                    address: '123 Example Street',
                    purchasePrice: 400000,
                    currentValue: 450000,
                    totalReturn: 12.5,
                    annualReturn: 4.2
                  }
                ],
                totalValue: 450000,
                totalReturn: 12.5,
                annualReturn: 4.2
              }
            }
          }
        }],
        authentication: true,
        deprecated: false,
        since: '1.0.0'
      },

      // Watchlist Endpoints
      {
        id: crypto.randomUUID(),
        path: '/api/watchlist',
        method: 'GET',
        summary: 'Get Watchlist',
        description: 'Retrieve user\'s property watchlist',
        tags: ['Watchlist'],
        parameters: [],
        responses: [
          {
            statusCode: 200,
            description: 'Watchlist data',
            content: [{
              mediaType: 'application/json',
              schema: this.getSchema('WatchlistResponse')
            }]
          }
        ],
        examples: [{
          title: 'Get Watchlist',
          description: 'Retrieve user watchlist',
          request: {},
          response: {
            statusCode: 200,
            body: {
              success: true,
              watchlist: [
                {
                  id: 'watch-123',
                  propertyId: 'prop-123',
                  address: '123 Example Street',
                  addedAt: '2024-01-15T10:30:00Z',
                  notes: 'Great investment opportunity'
                }
              ]
            }
          }
        }],
        authentication: true,
        deprecated: false,
        since: '1.0.0'
      },

      // Analytics Endpoints
      {
        id: crypto.randomUUID(),
        path: '/api/analytics/property',
        method: 'POST',
        summary: 'Property Analytics',
        description: 'Get detailed analytics for a specific property',
        tags: ['Analytics'],
        parameters: [],
        requestBody: {
          description: 'Property data for analysis',
          required: true,
          content: [{
            mediaType: 'application/json',
            schema: this.getSchema('PropertyAnalyticsRequest')
          }]
        },
        responses: [
          {
            statusCode: 200,
            description: 'Property analytics',
            content: [{
              mediaType: 'application/json',
              schema: this.getSchema('PropertyAnalyticsResponse')
            }]
          }
        ],
        examples: [{
          title: 'Property Analytics',
          description: 'Get comprehensive analytics for a property',
          request: {
            body: {
              propertyId: 'prop-123',
              address: '123 Example Street',
              postcode: 'SW1A 1AA',
              propertyType: 'House',
              bedrooms: 3
            }
          },
          response: {
            statusCode: 200,
            body: {
              success: true,
              analytics: {
                investmentScore: 85,
                rentalYield: 4.2,
                capitalGrowth: 3.5,
                riskAssessment: 'Low',
                marketTrend: 'Rising',
                recommendations: [
                  'Strong investment potential',
                  'Good rental yield for the area'
                ]
              }
            }
          }
        }],
        authentication: true,
        deprecated: false,
        since: '1.0.0'
      }
    ];

    return endpoints;
  }

  // Schema Generation
  private async generateSchemas(): Promise<APISchema[]> {
    const schemas: APISchema[] = [
      {
        id: 'LoginRequest',
        name: 'LoginRequest',
        type: 'object',
        description: 'User login request',
        properties: {
          email: {
            type: 'string',
            description: 'User email address',
            format: 'email',
            example: 'user@example.com'
          },
          password: {
            type: 'string',
            description: 'User password',
            format: 'password',
            example: 'password123'
          }
        },
        required: ['email', 'password']
      },
      {
        id: 'LoginResponse',
        name: 'LoginResponse',
        type: 'object',
        description: 'User login response',
        properties: {
          success: {
            type: 'boolean',
            description: 'Login success status',
            example: true
          },
          user: {
            type: 'object',
            description: 'User information',
            properties: {
              id: {
                type: 'string',
                description: 'User ID',
                example: 'user-123'
              },
              email: {
                type: 'string',
                description: 'User email',
                example: 'user@example.com'
              },
              name: {
                type: 'string',
                description: 'User name',
                example: 'John Doe'
              }
            }
          },
          token: {
            type: 'string',
            description: 'JWT authentication token',
            example: 'jwt-token-here'
          }
        }
      },
      {
        id: 'PropertySearchResponse',
        name: 'PropertySearchResponse',
        type: 'object',
        description: 'Property search results',
        properties: {
          success: {
            type: 'boolean',
            description: 'Search success status',
            example: true
          },
          results: {
            type: 'array',
            description: 'Array of property results',
            items: {
              type: 'object',
              description: 'Property information',
              properties: {
                id: {
                  type: 'string',
                  description: 'Property ID',
                  example: 'prop-123'
                },
                address: {
                  type: 'string',
                  description: 'Property address',
                  example: '123 Example Street, London'
                },
                postcode: {
                  type: 'string',
                  description: 'Property postcode',
                  example: 'SW1A 1AA'
                },
                price: {
                  type: 'number',
                  description: 'Property price',
                  example: 450000
                },
                bedrooms: {
                  type: 'number',
                  description: 'Number of bedrooms',
                  example: 3
                },
                bathrooms: {
                  type: 'number',
                  description: 'Number of bathrooms',
                  example: 2
                },
                propertyType: {
                  type: 'string',
                  description: 'Type of property',
                  example: 'House'
                },
                bmvScore: {
                  type: 'number',
                  description: 'Below Market Value score',
                  example: 85
                },
                estimatedValue: {
                  type: 'number',
                  description: 'Estimated property value',
                  example: 425000
                },
                potentialSavings: {
                  type: 'number',
                  description: 'Potential savings',
                  example: 25000
                }
              }
            }
          },
          pagination: {
            type: 'object',
            description: 'Pagination information',
            properties: {
              page: {
                type: 'number',
                description: 'Current page',
                example: 1
              },
              limit: {
                type: 'number',
                description: 'Results per page',
                example: 20
              },
              total: {
                type: 'number',
                description: 'Total results',
                example: 1
              },
              totalPages: {
                type: 'number',
                description: 'Total pages',
                example: 1
              }
            }
          }
        }
      }
    ];

    return schemas;
  }

  // Example Generation
  private async generateExamples(): Promise<APIExample[]> {
    const examples: APIExample[] = [
      {
        id: crypto.randomUUID(),
        title: 'Complete Property Search Workflow',
        description: 'End-to-end example of searching for properties and adding to watchlist',
        endpoint: '/api/property-search',
        method: 'GET',
        request: {
          headers: {
            'Authorization': 'Bearer jwt-token-here',
            'Content-Type': 'application/json'
          },
          query: {
            postcode: 'SW1A 1AA',
            radius: 5,
            minPrice: 200000,
            maxPrice: 600000,
            propertyType: 'House',
            bedrooms: 3
          }
        },
        response: {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: true,
            results: [
              {
                id: 'prop-123',
                address: '123 Example Street, London',
                postcode: 'SW1A 1AA',
                price: 450000,
                bedrooms: 3,
                bathrooms: 2,
                propertyType: 'House',
                bmvScore: 85,
                estimatedValue: 425000,
                potentialSavings: 25000
              }
            ],
            pagination: {
              page: 1,
              limit: 20,
              total: 1,
              totalPages: 1
            }
          }
        },
        tags: ['Properties', 'Search', 'Workflow']
      }
    ];

    return examples;
  }

  // Helper Methods
  private getSchema(name: string): APISchema {
    const schema = this.schemas.get(name);
    if (!schema) {
      return {
        id: name,
        name,
        type: 'object',
        description: `${name} schema`
      };
    }
    return schema;
  }

  private getAuthenticationInfo(): AuthenticationInfo {
    return {
      type: 'bearer',
      description: 'JWT Bearer token authentication',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    };
  }

  private getRateLimitInfo(): RateLimitInfo {
    return {
      requests: 1000,
      window: '1 hour',
      description: '1000 requests per hour for authenticated users'
    };
  }

  private getErrorCodes(): ErrorCode[] {
    return [
      {
        code: 400,
        message: 'Bad Request',
        description: 'The request was invalid or cannot be served',
        possibleCauses: [
          'Invalid request parameters',
          'Missing required fields',
          'Invalid data format'
        ],
        solutions: [
          'Check request parameters',
          'Ensure all required fields are provided',
          'Validate data format'
        ]
      },
      {
        code: 401,
        message: 'Unauthorized',
        description: 'Authentication is required and has failed or has not been provided',
        possibleCauses: [
          'Missing authentication token',
          'Invalid or expired token',
          'Insufficient permissions'
        ],
        solutions: [
          'Provide valid authentication token',
          'Check token expiration',
          'Verify user permissions'
        ]
      },
      {
        code: 403,
        message: 'Forbidden',
        description: 'The request was valid but the server is refusing action',
        possibleCauses: [
          'Insufficient permissions',
          'Account restrictions',
          'Resource access denied'
        ],
        solutions: [
          'Check user permissions',
          'Contact administrator',
          'Verify account status'
        ]
      },
      {
        code: 404,
        message: 'Not Found',
        description: 'The requested resource could not be found',
        possibleCauses: [
          'Invalid endpoint URL',
          'Resource does not exist',
          'Incorrect resource ID'
        ],
        solutions: [
          'Check endpoint URL',
          'Verify resource exists',
          'Use correct resource ID'
        ]
      },
      {
        code: 429,
        message: 'Too Many Requests',
        description: 'Rate limit exceeded',
        possibleCauses: [
          'Too many requests in time window',
          'API quota exceeded',
          'Rate limit policy violation'
        ],
        solutions: [
          'Wait before making more requests',
          'Upgrade API plan',
          'Implement request throttling'
        ]
      },
      {
        code: 500,
        message: 'Internal Server Error',
        description: 'An unexpected error occurred on the server',
        possibleCauses: [
          'Server configuration issue',
          'Database connection problem',
          'Unexpected application error'
        ],
        solutions: [
          'Try again later',
          'Contact support',
          'Check system status'
        ]
      }
    ];
  }

  private getChangelog(): ChangelogEntry[] {
    return [
      {
        version: '1.0.0',
        date: new Date('2024-01-15'),
        changes: [
          {
            type: 'added',
            description: 'Initial API release with core property search functionality',
            breaking: false
          },
          {
            type: 'added',
            description: 'User authentication and authorization',
            breaking: false
          },
          {
            type: 'added',
            description: 'Property portfolio management',
            breaking: false
          },
          {
            type: 'added',
            description: 'Watchlist functionality',
            breaking: false
          },
          {
            type: 'added',
            description: 'Property analytics and insights',
            breaking: false
          }
        ]
      }
    ];
  }

  private initializeDefaultDocumentation(): void {
    // Initialize with default schemas
    const defaultSchemas: APISchema[] = [
      {
        id: 'ErrorResponse',
        name: 'ErrorResponse',
        type: 'object',
        description: 'Standard error response format',
        properties: {
          success: {
            type: 'boolean',
            description: 'Success status',
            example: false
          },
          error: {
            type: 'string',
            description: 'Error message',
            example: 'Invalid request parameters'
          },
          code: {
            type: 'number',
            description: 'Error code',
            example: 400
          }
        }
      }
    ];

    defaultSchemas.forEach(schema => {
      this.schemas.set(schema.id, schema);
    });
  }

  // Public Methods
  getDocumentation(id: string): APIDocumentation | null {
    return this.documentation.get(id) || null;
  }

  getAllDocumentation(): APIDocumentation[] {
    return Array.from(this.documentation.values());
  }

  getSchemaById(id: string): APISchema | null {
    return this.schemas.get(id) || null;
  }

  getAllSchemas(): APISchema[] {
    return Array.from(this.schemas.values());
  }

  getExampleById(id: string): APIExample | null {
    return this.examples.get(id) || null;
  }

  getAllExamples(): APIExample[] {
    return Array.from(this.examples.values());
  }

  // Export to OpenAPI/Swagger format
  exportToOpenAPI(documentation: APIDocumentation): any {
    const openAPI = {
      openapi: '3.0.0',
      info: {
        title: documentation.title,
        description: documentation.description,
        version: documentation.version
      },
      servers: [
        {
          url: documentation.baseUrl,
          description: 'Production server'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    };

    // Add endpoints to paths
    documentation.endpoints.forEach(endpoint => {
      if (!openAPI.paths[endpoint.path]) {
        openAPI.paths[endpoint.path] = {};
      }
      
      openAPI.paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags,
        parameters: endpoint.parameters,
        requestBody: endpoint.requestBody,
        responses: endpoint.responses.reduce((acc, response) => {
          acc[response.statusCode.toString()] = {
            description: response.description,
            content: response.content
          };
          return acc;
        }, {} as any),
        security: endpoint.authentication ? [{ bearerAuth: [] }] : []
      };
    });

    // Add schemas to components
    documentation.schemas.forEach(schema => {
      openAPI.components.schemas[schema.name] = {
        type: schema.type,
        description: schema.description,
        properties: schema.properties,
        required: schema.required,
        example: schema.example
      };
    });

    return openAPI;
  }
}

// Export singleton instance
export const apiDocumentationManager = APIDocumentationManager.getInstance();
