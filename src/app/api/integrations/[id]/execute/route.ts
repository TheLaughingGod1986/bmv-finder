import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { integrationManager } from '@/lib/integrations/integrationManager';

// POST /api/integrations/[id]/execute - Execute API request
export const POST = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { method, endpoint, data, headers } = await request.json();

    if (!method || !endpoint) {
      return NextResponse.json(
        { error: 'Method and endpoint are required' },
        { status: 400 }
      );
    }

    const result = await integrationManager.executeApiRequest(
      params.id,
      method,
      endpoint,
      data,
      headers
    );

    return NextResponse.json({
      success: result.success,
      data: result.data,
      error: result.error,
      statusCode: result.statusCode
    });
  } catch (error) {
    console.error('Error executing API request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
