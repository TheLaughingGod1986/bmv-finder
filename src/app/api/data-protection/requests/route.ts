import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { dataProtectionManager } from '@/lib/security/dataProtectionManager';

// POST /api/data-protection/requests - Create data subject request
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { type, description, verificationMethod } = await request.json();

    if (!type || !description) {
      return NextResponse.json(
        { error: 'Type and description are required' },
        { status: 400 }
      );
    }

    const dataSubjectRequest = await dataProtectionManager.createDataSubjectRequest(
      user.id,
      type,
      description,
      verificationMethod
    );

    return NextResponse.json({
      success: true,
      request: dataSubjectRequest
    });
  } catch (error) {
    console.error('Error creating data subject request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// GET /api/data-protection/requests - Get data subject requests
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions for all requests
    const isAdmin = user?.role?.id === 'admin';
    
    if (isAdmin) {
      // Admin can see all requests
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      
      // This would need to be implemented in the data protection manager
      // For now, return empty array
      return NextResponse.json({
        success: true,
        requests: []
      });
    } else {
      // Regular users can only see their own requests
      // This would need to be implemented in the data protection manager
      // For now, return empty array
      return NextResponse.json({
        success: true,
        requests: []
      });
    }
  } catch (error) {
    console.error('Error fetching data subject requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PUT /api/data-protection/requests/[id] - Process data subject request
export const PUT = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');
    const { status, response } = await request.json();

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Request ID and status are required' },
        { status: 400 }
      );
    }

    const success = await dataProtectionManager.processDataSubjectRequest(
      requestId,
      status,
      response
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Request processed successfully'
    });
  } catch (error) {
    console.error('Error processing data subject request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
