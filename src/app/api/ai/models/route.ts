import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { mlModelManager } from '@/lib/ai/mlModelManager';

// GET /api/ai/models - Get all ML models
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const models = mlModelManager.getModels();
    const stats = mlModelManager.getModelStats();

    return NextResponse.json({
      success: true,
      models,
      stats
    });
  } catch (error) {
    console.error('Error fetching ML models:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/ai/models - Create new ML model
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { name, type, features, hyperparameters } = await request.json();

    if (!name || !type || !features || !Array.isArray(features)) {
      return NextResponse.json(
        { error: 'Name, type, and features are required' },
        { status: 400 }
      );
    }

    const model = await mlModelManager.createModel(name, type, features, hyperparameters);

    return NextResponse.json({
      success: true,
      model
    });
  } catch (error) {
    console.error('Error creating ML model:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
