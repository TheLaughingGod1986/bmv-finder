import { NextRequest, NextResponse } from 'next/server';
import { integrationManager } from '@/lib/integrations/integrationManager';
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const provider = searchParams.get('provider');
    const status = searchParams.get('status');

    let integrations = integrationManager.getAllIntegrations();

    // Apply filters
    if (type) {
      integrations = integrations.filter(integration => integration.type === type);
    }
    if (provider) {
      integrations = integrations.filter(integration => integration.provider === provider);
    }
    if (status) {
      integrations = integrations.filter(integration => integration.status === status);
    }

    return NextResponse.json({
      success: true,
      data: integrations,
      count: integrations.length
    });

  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch integrations'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { name, type, provider, configuration, authentication, endpoints, dataMapping } = body;

    if (!name || !type || !provider || !endpoints) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, type, provider, endpoints'
      }, { status: 400 });
    }

    const integrationConfig = {
      id: `integration-${Date.now()}`,
      name,
      type,
      provider,
      status: 'INACTIVE' as const,
      configuration: configuration || {},
      authentication: authentication || { type: 'API_KEY', credentials: {} },
      endpoints,
      dataMapping: dataMapping || { sourceFields: [], targetFields: [] },
      errorHandling: {
        maxRetries: 3,
        retryDelay: 1000,
        fallbackStrategy: 'RETRY' as const,
      },
      monitoring: {
        enabled: true,
        healthCheckInterval: 300000,
        alertThresholds: {
          errorRate: 0.05,
          responseTime: 5000,
          availability: 0.95,
        },
      },
      createdAt: new Date().toISOString(),
    };

    const success = integrationManager.addIntegration(integrationConfig);

    if (success) {
      return NextResponse.json({
        success: true,
        data: integrationConfig,
        message: 'Integration created successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to create integration'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error creating integration:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create integration'
    }, { status: 500 });
  }
}, { requiredRole: 'admin' });