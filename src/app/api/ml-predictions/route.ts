import { NextRequest, NextResponse } from 'next/server';
import { mlPredictionEngine } from '../../../lib/mlPredictionEngine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'generate_predictions':
        const predictions = await mlPredictionEngine.generatePredictions(data.features);
        return NextResponse.json({ success: true, predictions });

      case 'learn_from_outcome':
        await mlPredictionEngine.learnFromOutcome(data.outcome);
        return NextResponse.json({ success: true, message: 'Successfully learned from outcome' });

      case 'get_accuracy_metrics':
        const metrics = mlPredictionEngine.getAccuracyMetrics();
        return NextResponse.json({ success: true, metrics });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('ML API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const metrics = mlPredictionEngine.getAccuracyMetrics();
    return NextResponse.json({ success: true, metrics });
  } catch (error) {
    console.error('ML API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 