import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { dataProtectionManager } from '@/lib/security/dataProtectionManager';

// POST /api/data-protection/breaches - Report data breach
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const {
      type,
      severity,
      description,
      affectedDataSubjects,
      affectedDataCategories,
      cause,
      impact
    } = await request.json();

    if (!type || !severity || !description || !affectedDataSubjects || !affectedDataCategories || !cause || !impact) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const breach = await dataProtectionManager.reportDataBreach(
      type,
      severity,
      description,
      affectedDataSubjects,
      affectedDataCategories,
      cause,
      impact
    );

    return NextResponse.json({
      success: true,
      breach
    });
  } catch (error) {
    console.error('Error reporting data breach:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// GET /api/data-protection/breaches - Get data breaches
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // This would need to be implemented in the data protection manager
    // For now, return empty array
    return NextResponse.json({
      success: true,
      breaches: []
    });
  } catch (error) {
    console.error('Error fetching data breaches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PUT /api/data-protection/breaches/[id] - Update data breach
export const PUT = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const breachId = searchParams.get('id');
    const updates = await request.json();

    if (!breachId) {
      return NextResponse.json(
        { error: 'Breach ID is required' },
        { status: 400 }
      );
    }

    const breach = await dataProtectionManager.updateDataBreach(breachId, updates);

    if (!breach) {
      return NextResponse.json(
        { error: 'Breach not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      breach
    });
  } catch (error) {
    console.error('Error updating data breach:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
