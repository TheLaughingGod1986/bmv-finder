import { NextRequest, NextResponse } from 'next/server';

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  database?: {
    status: string;
    version?: string;
    error?: string;
  };
  cache?: {
    status: string;
    error?: string;
  };
  memory?: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Basic health check
    const healthStatus: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };

    // Check database connectivity (if configured)
    if (process.env.ELASTICSEARCH_URL) {
      try {
        const { Client } = require('@elastic/elasticsearch');
        const client = new Client({
          node: process.env.ELASTICSEARCH_URL,
          auth: {
            username: process.env.ELASTICSEARCH_USERNAME || '',
            password: process.env.ELASTICSEARCH_PASSWORD || '',
          },
        });

        const info = await client.info();
        healthStatus.database = {
          status: 'connected',
          version: info.version.number,
        };
      } catch (error) {
        healthStatus.database = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Check Redis connectivity (if configured and available)
    if (process.env.REDIS_URL) {
      try {
        // Only check Redis if the module is available
        const redis = require('redis');
        if (redis) {
          const client = redis.createClient({
            url: process.env.REDIS_URL,
          });
          
          await client.connect();
          await client.ping();
          await client.disconnect();
          
          healthStatus.cache = {
            status: 'connected',
          };
        }
      } catch (error) {
        healthStatus.cache = {
          status: 'not configured',
          error: 'Redis module not available',
        };
      }
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    healthStatus.memory = {
      rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

export async function HEAD(request: NextRequest) {
  // Simple health check for load balancers
  return new NextResponse(null, { status: 200 });
} 