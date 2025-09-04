import { NextRequest, NextResponse } from 'next/server';
import { securityManager } from '@/lib/security/securityManager';
import { requireAuth } from '@/middleware/auth';
import { userManagement } from '@/lib/auth/userManagement';

export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    const hasAdminPermission = await userManagement.userHasPermission(user.id, 'admin.system');
    if (!hasAdminPermission) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions'
      }, { status: 403 });
    }

    // Get IP rules
    const ipRules = await securityManager.getIPRules();

    return NextResponse.json({
      success: true,
      data: ipRules
    });

  } catch (error) {
    console.error('Error fetching IP rules:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch IP rules'
    }, { status: 500 });
  }
}, { requiredRole: 'admin' });

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    const hasAdminPermission = await userManagement.userHasPermission(user.id, 'admin.system');
    if (!hasAdminPermission) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions'
      }, { status: 403 });
    }

    const body = await request.json();
    const { ipAddress, type, reason, expiresAt } = body;

    if (!ipAddress || !type || !reason) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: ipAddress, type, reason'
      }, { status: 400 });
    }

    // Add IP rule
    const ipRule = await securityManager.addIPRule({
      ipAddress,
      type,
      reason,
      createdBy: user.id,
      expiresAt,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      data: ipRule,
      message: 'IP rule added successfully'
    });

  } catch (error) {
    console.error('Error adding IP rule:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add IP rule'
    }, { status: 500 });
  }
}, { requiredRole: 'admin' });