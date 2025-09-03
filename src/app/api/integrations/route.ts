import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { integrationManager } from '@/lib/integrations/integrationManager';

// GET /api/integrations - Get all integrations
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as any;
    const activeOnly = searchParams.get('activeOnly') === 'true';

    let integrations;
    if (type) {
      integrations = integrationManager.getIntegrationsByType(type);
    } else if (activeOnly) {
      integrations = integrationManager.getActiveIntegrations();
    } else {
      integrations = Array.from(integrationManager['integrations'].values());
    }

    return NextResponse.json({
      success: true,
      integrations
    });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/integrations - Create new integration
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const integrationData = await request.json();

    if (!integrationData.name || !integrationData.type || !integrationData.provider) {
      return NextResponse.json(
        { error: 'Name, type, and provider are required' },
        { status: 400 }
      );
    }

    const integration = await integrationManager.createIntegration(integrationData);

    return NextResponse.json({
      success: true,
      integration
    });
  } catch (error) {
    console.error('Error creating integration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});