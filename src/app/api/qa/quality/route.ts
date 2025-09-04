import { NextRequest, NextResponse } from 'next/server';
import { qualityAssuranceManager } from '@/lib/testing/qualityAssurance';
import { requireAuth } from '@/middleware/auth';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');

    let issues = qualityAssuranceManager.getAllIssues();

    // Apply filters
    if (type) {
      issues = issues.filter(issue => issue.type === type);
    }
    if (severity) {
      issues = issues.filter(issue => issue.severity === severity);
    }
    if (status) {
      issues = issues.filter(issue => issue.status === status);
    }

    return NextResponse.json({
      success: true,
      data: issues,
      count: issues.length
    });

  } catch (error) {
    console.error('Error fetching quality issues:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch quality issues'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { type, severity, title, description, component, file, line, tags } = body;

    if (!type || !severity || !title || !description) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: type, severity, title, description'
      }, { status: 400 });
    }

    const issue = {
      id: `issue-${Date.now()}`,
      type,
      severity,
      title,
      description,
      component,
      file,
      line,
      status: 'OPEN' as const,
      reporter: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: tags || [],
      metadata: {},
    };

    const success = qualityAssuranceManager.addIssue(issue);

    if (success) {
      return NextResponse.json({
        success: true,
        data: issue,
        message: 'Quality issue created successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to create quality issue'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error creating quality issue:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create quality issue'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });