import { NextRequest, NextResponse } from 'next/server';
import { deploymentManager } from '@/lib/documentation/deploymentManager';
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const configId = searchParams.get('configId');
    const environment = searchParams.get('environment');

    if (configId) {
      // Get specific configuration
      const config = deploymentManager.getConfig(configId);
      if (!config) {
        return NextResponse.json({
          success: false,
          error: 'Deployment configuration not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: config
      });
    } else {
      // Get all configurations
      let configs = deploymentManager.getAllConfigs();

      // Filter by environment if specified
      if (environment) {
        configs = configs.filter(config => config.environment === environment);
      }

      return NextResponse.json({
        success: true,
        data: configs,
        count: configs.length
      });
    }

  } catch (error) {
    console.error('Error fetching deployment configurations:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch deployment configurations'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { 
      name, 
      environment, 
      platform, 
      region, 
      domain, 
      ssl, 
      cdn, 
      monitoring, 
      backup, 
      scaling, 
      resources, 
      environmentVariables, 
      secrets, 
      healthChecks, 
      rollbackStrategy 
    } = body;

    if (!name || !environment || !platform || !region || !domain) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, environment, platform, region, domain'
      }, { status: 400 });
    }

    const config = {
      id: `config-${Date.now()}`,
      name,
      environment,
      platform,
      region,
      domain,
      ssl: ssl || false,
      cdn: cdn || false,
      monitoring: monitoring || false,
      backup: backup || false,
      scaling: scaling || {
        minInstances: 1,
        maxInstances: 3,
        autoScale: false,
      },
      resources: resources || {
        cpu: '1 vCPU',
        memory: '2GB',
        storage: '10GB',
      },
      environmentVariables: environmentVariables || {},
      secrets: secrets || [],
      healthChecks: healthChecks || [],
      rollbackStrategy: rollbackStrategy || {
        type: 'manual',
        threshold: 3,
        duration: 180,
        healthCheckFailures: 2,
        enabled: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const success = deploymentManager.addConfig(config);

    if (success) {
      return NextResponse.json({
        success: true,
        data: config,
        message: 'Deployment configuration created successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to create deployment configuration'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error creating deployment configuration:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create deployment configuration'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });