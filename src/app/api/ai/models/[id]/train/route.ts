import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { mlModelManager } from '@/lib/ai/mlModelManager';

// POST /api/ai/models/[id]/train - Train ML model
export const POST = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { trainingData, options } = await request.json();

    if (!trainingData || !trainingData.features || !trainingData.labels) {
      return NextResponse.json(
        { error: 'Training data with features and labels is required' },
        { status: 400 }
      );
    }

    // Create training data
    const data = await mlModelManager.createTrainingData(
      params.id,
      trainingData.features,
      trainingData.labels,
      trainingData.split || { training: 0.7, validation: 0.2, test: 0.1 }
    );

    // Start training job
    const trainingJob = await mlModelManager.trainModel(params.id, data, options);

    return NextResponse.json({
      success: true,
      trainingJob
    });
  } catch (error) {
    console.error('Error training ML model:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
});
