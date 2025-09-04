import { NextRequest, NextResponse } from 'next/server';
import { qualityAssuranceManager } from '@/lib/testing/qualityAssurance';
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const issue = qualityAssuranceManager.getIssue(params.id);

    if (!issue) {
      return NextResponse.json({
        success: false,
        error: 'Quality issue not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: issue
    });

  } catch (error) {
    console.error('Error fetching quality issue:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch quality issue'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });

export const PUT = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json();
    const updates = body;

    const success = qualityAssuranceManager.updateIssue(params.id, updates);

    if (success) {
      const updatedIssue = qualityAssuranceManager.getIssue(params.id);
      return NextResponse.json({
        success: true,
        data: updatedIssue,
        message: 'Quality issue updated successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Quality issue not found'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Error updating quality issue:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update quality issue'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });
