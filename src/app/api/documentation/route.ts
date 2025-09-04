import { NextRequest, NextResponse } from 'next/server';
import { apiDocumentationManager } from '@/lib/documentation/apiDocumentationManager';
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') as 'json' | 'yaml' | 'html' | null;
    const docId = searchParams.get('docId');

    if (docId) {
      // Get specific documentation
      const doc = apiDocumentationManager.getDocumentation(docId);
      if (!doc) {
        return NextResponse.json({
          success: false,
          error: 'Documentation not found'
        }, { status: 404 });
      }

      if (format) {
        // Export in specific format
        const exported = apiDocumentationManager.exportDocumentation(docId, format);
        if (!exported) {
          return NextResponse.json({
            success: false,
            error: 'Failed to export documentation'
          }, { status: 500 });
        }

        const contentType = format === 'html' ? 'text/html' : 
                           format === 'yaml' ? 'text/yaml' : 'application/json';

        return new NextResponse(exported, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${doc.name}-${doc.version}.${format}"`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: doc
      });
    } else {
      // Get all documentation
      const docs = apiDocumentationManager.getAllDocumentation();
      return NextResponse.json({
        success: true,
        data: docs,
        count: docs.length
      });
    }

  } catch (error) {
    console.error('Error fetching API documentation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch API documentation'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { name, version, description, baseUrl, endpoints, schemas, examples, authentication, rateLimiting, errorCodes, changelog } = body;

    if (!name || !version || !description || !baseUrl) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, version, description, baseUrl'
      }, { status: 400 });
    }

    const doc = {
      id: `doc-${Date.now()}`,
      name,
      version,
      description,
      baseUrl,
      endpoints: endpoints || [],
      schemas: schemas || [],
      examples: examples || [],
      authentication: authentication || {
        type: 'bearer',
        description: 'JWT Bearer token authentication',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      rateLimiting: rateLimiting || {
        enabled: true,
        limits: {
          default: { requests: 100, window: '1h' },
        },
        headers: {
          limit: 'X-RateLimit-Limit',
          remaining: 'X-RateLimit-Remaining',
          reset: 'X-RateLimit-Reset',
        },
      },
      errorCodes: errorCodes || [],
      changelog: changelog || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const success = apiDocumentationManager.addDocumentation(doc);

    if (success) {
      return NextResponse.json({
        success: true,
        data: doc,
        message: 'API documentation created successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to create API documentation'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error creating API documentation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create API documentation'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });