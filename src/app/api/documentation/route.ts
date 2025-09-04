import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { apiDocumentationManager } from '@/lib/documentation/apiDocumentation';

// GET /api/documentation - Get API documentation
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const documentation = await apiDocumentationManager.generateAPIDocumentation();

    return NextResponse.json({
      success: true,
      documentation
    });
  } catch (error) {
    console.error('Error generating API documentation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/documentation - Generate new documentation
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const documentation = await apiDocumentationManager.generateAPIDocumentation();

    return NextResponse.json({
      success: true,
      documentation
    });
  } catch (error) {
    console.error('Error generating API documentation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
