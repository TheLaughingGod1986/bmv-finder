import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/auth';
import { mlModelManager } from '@/lib/ai/mlModelManager';

// POST /api/ai/models/[id]/predict - Make prediction with ML model
export const POST = requireAuth(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const { features, options } = await request.json();

    if (!features || typeof features !== 'object') {
      return NextResponse.json(
        { error: 'Features are required' },
        { status: 400 }
      );
    }

    const predictionRequest = {
      modelId: params.id,
      features,
      options
    };

    const result = await mlModelManager.makePrediction(predictionRequest);

    return NextResponse.json({
      success: true,
      prediction: result
    });
  } catch (error) {
    console.error('Error making prediction:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
});
