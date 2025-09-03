import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { dataProtectionManager } from '@/lib/security/dataProtectionManager';

// POST /api/data-protection/consent - Record consent
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { purpose, dataCategories, method } = await request.json();

    if (!purpose || !dataCategories || !Array.isArray(dataCategories)) {
      return NextResponse.json(
        { error: 'Purpose and data categories are required' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const consent = await dataProtectionManager.recordConsent(
      user.id,
      purpose,
      dataCategories,
      method || 'EXPLICIT',
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      consent
    });
  } catch (error) {
    console.error('Error recording consent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// DELETE /api/data-protection/consent - Withdraw consent
export const DELETE = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { consentId, reason } = await request.json();

    if (!consentId) {
      return NextResponse.json(
        { error: 'Consent ID is required' },
        { status: 400 }
      );
    }

    const success = await dataProtectionManager.withdrawConsent(consentId, reason);

    if (!success) {
      return NextResponse.json(
        { error: 'Consent not found or already withdrawn' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Consent withdrawn successfully'
    });
  } catch (error) {
    console.error('Error withdrawing consent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// GET /api/data-protection/consent - Check consent status
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const purpose = searchParams.get('purpose');
    const dataCategories = searchParams.get('dataCategories')?.split(',');

    if (!purpose || !dataCategories) {
      return NextResponse.json(
        { error: 'Purpose and data categories are required' },
        { status: 400 }
      );
    }

    const hasConsent = dataProtectionManager.hasValidConsent(
      user.id,
      purpose,
      dataCategories
    );

    return NextResponse.json({
      success: true,
      hasConsent
    });
  } catch (error) {
    console.error('Error checking consent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
