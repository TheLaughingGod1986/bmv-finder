import { NextRequest, NextResponse } from 'next/server';
import { apiDocumentationManager } from '@/lib/documentation/apiDocumentationManager';
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('docId');

    if (!docId) {
      return NextResponse.json({
        success: false,
        error: 'docId parameter is required'
      }, { status: 400 });
    }

    const openAPISpec = apiDocumentationManager.generateOpenAPISpec(docId);

    if (!openAPISpec) {
      return NextResponse.json({
        success: false,
        error: 'Documentation not found or failed to generate OpenAPI spec'
      }, { status: 404 });
    }

    return NextResponse.json(openAPISpec, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Error generating OpenAPI specification:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate OpenAPI specification'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });

export const OPTIONS = async (request: NextRequest) => {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};