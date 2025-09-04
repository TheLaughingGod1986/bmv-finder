import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { apiDocumentationManager } from '@/lib/documentation/apiDocumentation';

// GET /api/documentation/openapi - Get OpenAPI/Swagger documentation
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const documentation = await apiDocumentationManager.generateAPIDocumentation();
    const openAPISpec = apiDocumentationManager.exportToOpenAPI(documentation);

    return NextResponse.json(openAPISpec);
  } catch (error) {
    console.error('Error generating OpenAPI documentation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
