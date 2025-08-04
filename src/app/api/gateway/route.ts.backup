import { NextRequest, NextResponse } from 'next/server';

interface GatewayConfig {
  [key: string]: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    transform?: (data: any) => any;
  };
}

// Configuration for all your backend services
const SERVICES: GatewayConfig = {
  // Property Services
  'property-es': {
    url: process.env.PROPERTY_SERVICE_URL || 'http://localhost:3000/api/property-es',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  },
  'property-csv': {
    url: process.env.PROPERTY_SERVICE_URL || 'http://localhost:3000/api/property-csv',
    method: 'GET',
    headers: {}
  },
  'property-trend': {
    url: process.env.PROPERTY_SERVICE_URL || 'http://localhost:3000/api/property-trend',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  },
  'property-history': {
    url: process.env.PROPERTY_SERVICE_URL || 'http://localhost:3000/api/property-history',
    method: 'GET',
    headers: {}
  },
  'enhance-properties': {
    url: process.env.PROPERTY_SERVICE_URL || 'http://localhost:3000/api/enhance-properties',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  },
  'recent-sales': {
    url: process.env.PROPERTY_SERVICE_URL || 'http://localhost:3000/api/recent-sales',
    method: 'GET',
    headers: {}
  },
  'what-should-i-pay': {
    url: process.env.PROPERTY_SERVICE_URL || 'http://localhost:3000/api/what-should-i-pay',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  },
  'top-roi': {
    url: process.env.PROPERTY_SERVICE_URL || 'http://localhost:3000/api/top-roi',
    method: 'GET',
    headers: {}
  },
  
  // HPI Services
  'hpi': {
    url: process.env.HPI_SERVICE_URL || 'http://localhost:3000/api/hpi',
    method: 'GET',
    headers: {}
  },
  'hpi-postcode': {
    url: process.env.HPI_SERVICE_URL || 'http://localhost:3000/api/hpi/postcode',
    method: 'GET',
    headers: {}
  },
  'hpi-date-range': {
    url: process.env.HPI_SERVICE_URL || 'http://localhost:3000/api/hpi/date-range',
    method: 'GET',
    headers: {}
  },
  'test-hpi-fetch': {
    url: process.env.HPI_SERVICE_URL || 'http://localhost:3000/api/test-hpi-fetch',
    method: 'GET',
    headers: {}
  },
  
  // BMV Scoring Services
  'enhanced-bmv-score': {
    url: process.env.BMV_SERVICE_URL || 'http://localhost:3000/api/enhanced-bmv-score',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  },
  'suggest-postcodes': {
    url: process.env.BMV_SERVICE_URL || 'http://localhost:3000/api/suggest-postcodes',
    method: 'GET',
    headers: {}
  },
  
  // User Management Services
  'profile-usage': {
    url: process.env.USER_SERVICE_URL || 'http://localhost:3000/api/profile-usage',
    method: 'GET',
    headers: {}
  },
  'increment-usage': {
    url: process.env.USER_SERVICE_URL || 'http://localhost:3000/api/increment-usage',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  },
  'create-checkout-session': {
    url: process.env.USER_SERVICE_URL || 'http://localhost:3000/api/create-checkout-session',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  },
  'create-customer-portal-session': {
    url: process.env.USER_SERVICE_URL || 'http://localhost:3000/api/create-customer-portal-session',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  },
  
  // Analytics & Monitoring Services
  'summary': {
    url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3000/api/summary',
    method: 'GET',
    headers: {}
  },
  'analytics': {
    url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3000/api/analytics',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  },
  'monitoring': {
    url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3000/api/monitoring',
    method: 'GET',
    headers: {}
  },
  
  // External Integrations
  'stripe-webhook': {
    url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3000/api/stripe-webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  },
  'search': {
    url: process.env.SEARCH_SERVICE_URL || 'http://localhost:3000/api/search',
    method: 'GET',
    headers: {}
  },
  
  // System Services
  'last-updated': {
    url: process.env.SYSTEM_SERVICE_URL || 'http://localhost:3000/api/last-updated',
    method: 'GET',
    headers: {}
  }
};

// Rate limiting configuration
const RATE_LIMITS = {
  // Property Services (higher limits for core functionality)
  'property-es': { requests: 200, window: 60000 }, // 200 requests per minute
  'property-csv': { requests: 50, window: 60000 }, // 50 requests per minute
  'property-trend': { requests: 100, window: 60000 },
  'property-history': { requests: 100, window: 60000 },
  'enhance-properties': { requests: 50, window: 60000 },
  'recent-sales': { requests: 150, window: 60000 },
  'what-should-i-pay': { requests: 100, window: 60000 },
  'top-roi': { requests: 50, window: 60000 },
  
  // HPI Services
  'hpi': { requests: 300, window: 60000 }, // 300 requests per minute
  'hpi-postcode': { requests: 200, window: 60000 },
  'hpi-date-range': { requests: 100, window: 60000 },
  'test-hpi-fetch': { requests: 50, window: 60000 },
  
  // BMV Scoring Services
  'enhanced-bmv-score': { requests: 100, window: 60000 },
  'suggest-postcodes': { requests: 500, window: 60000 }, // High limit for autocomplete
  
  // User Management Services
  'profile-usage': { requests: 1000, window: 60000 }, // 1000 requests per minute
  'increment-usage': { requests: 500, window: 60000 },
  'create-checkout-session': { requests: 100, window: 60000 },
  'create-customer-portal-session': { requests: 100, window: 60000 },
  
  // Analytics & Monitoring Services
  'summary': { requests: 200, window: 60000 },
  'analytics': { requests: 500, window: 60000 },
  'monitoring': { requests: 100, window: 60000 },
  
  // External Integrations
  'stripe-webhook': { requests: 1000, window: 60000 }, // High limit for webhooks
  'search': { requests: 200, window: 60000 },
  
  // System Services
  'last-updated': { requests: 100, window: 60000 }
};

// Simple in-memory rate limiter (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(service: string, userId?: string): boolean {
  const key = `${service}:${userId || 'anonymous'}`;
  const now = Date.now();
  const limit = RATE_LIMITS[service as keyof typeof RATE_LIMITS];
  
  if (!limit) return true;
  
  const current = rateLimitStore.get(key);
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + limit.window });
    return true;
  }
  
  if (current.count >= limit.requests) {
    return false;
  }
  
  current.count++;
  return true;
}

async function forwardRequest(
  service: string,
  method: string,
  body?: any,
  queryParams?: Record<string, string>
): Promise<Response> {
  const serviceConfig = SERVICES[service];
  if (!serviceConfig) {
    throw new Error(`Unknown service: ${service}`);
  }
  
  // Build URL with query parameters
  let url = serviceConfig.url;
  if (queryParams && Object.keys(queryParams).length > 0) {
    const params = new URLSearchParams(queryParams);
    url += `?${params.toString()}`;
  }
  
  // Prepare request options
  const options: RequestInit = {
    method: serviceConfig.method,
    headers: {
      ...serviceConfig.headers,
      'X-Forwarded-For': 'gateway',
      'X-Service': service
    }
  };
  
  // Add body for POST/PUT requests
  if (body && ['POST', 'PUT', 'PATCH'].includes(serviceConfig.method)) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    
    // Handle different response types
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Apply transformation if configured
    if (serviceConfig.transform) {
      data = serviceConfig.transform(data);
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`Gateway error for service ${service}:`, error);
    return NextResponse.json(
      { error: 'Service temporarily unavailable', service },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { service, action, data, query } = body;
    
    // Validate request
    if (!service || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: service, action' },
        { status: 400 }
      );
    }
    
    // Check rate limiting
    const userId = request.headers.get('x-user-id');
    if (!checkRateLimit(service, userId || undefined)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    // Route to appropriate service
    const result = await forwardRequest(service, 'POST', data, query);
    return result;
    
  } catch (error) {
    console.error('Gateway error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');
    const action = searchParams.get('action');
    
    // Validate request
    if (!service || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters: service, action' },
        { status: 400 }
      );
    }
    
    // Check rate limiting
    const userId = request.headers.get('x-user-id');
    if (!checkRateLimit(service, userId || undefined)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    // Convert searchParams to query object
    const query: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'service' && key !== 'action') {
        query[key] = value;
      }
    });
    
    // Route to appropriate service
    const result = await forwardRequest(service, 'GET', undefined, query);
    return result;
    
  } catch (error) {
    console.error('Gateway error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 