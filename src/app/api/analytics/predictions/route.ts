import { NextRequest, NextResponse } from 'next/server';
import { predictiveAnalyticsEngine } from '@/lib/analytics/predictiveAnalytics';
import { requireAuth } from '@/middleware/auth';

// POST /api/analytics/predictions/price - Generate price prediction
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { propertyData, marketData } = await request.json();

    if (!propertyData) {
      return NextResponse.json(
        { error: 'Property data is required' },
        { status: 400 }
      );
    }

    const prediction = await predictiveAnalyticsEngine.generatePricePrediction(
      propertyData,
      marketData,
      user.id
    );

    return NextResponse.json({
      success: true,
      prediction
    });
  } catch (error) {
    console.error('Error generating price prediction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/analytics/predictions/rental - Generate rental prediction
export const POST_RENTAL = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { propertyData, marketData } = await request.json();

    if (!propertyData) {
      return NextResponse.json(
        { error: 'Property data is required' },
        { status: 400 }
      );
    }

    const prediction = await predictiveAnalyticsEngine.generateRentalPrediction(
      propertyData,
      marketData,
      user.id
    );

    return NextResponse.json({
      success: true,
      prediction
    });
  } catch (error) {
    console.error('Error generating rental prediction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/analytics/predictions/market-trend - Generate market trend prediction
export const POST_MARKET_TREND = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { region, postcode, timeframe } = await request.json();

    if (!region || !postcode || !timeframe) {
      return NextResponse.json(
        { error: 'Region, postcode, and timeframe are required' },
        { status: 400 }
      );
    }

    const prediction = await predictiveAnalyticsEngine.generateMarketTrendPrediction(
      region,
      postcode,
      timeframe,
      user.id
    );

    return NextResponse.json({
      success: true,
      prediction
    });
  } catch (error) {
    console.error('Error generating market trend prediction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/analytics/predictions/risk-assessment - Generate risk assessment
export const POST_RISK_ASSESSMENT = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { propertyData, marketData } = await request.json();

    if (!propertyData) {
      return NextResponse.json(
        { error: 'Property data is required' },
        { status: 400 }
      );
    }

    const assessment = await predictiveAnalyticsEngine.generateRiskAssessment(
      propertyData,
      marketData,
      user.id
    );

    return NextResponse.json({
      success: true,
      assessment
    });
  } catch (error) {
    console.error('Error generating risk assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// GET /api/analytics/predictions/models - Get available prediction models
export const GET = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const models = predictiveAnalyticsEngine.getModels();

    return NextResponse.json({
      success: true,
      models
    });
  } catch (error) {
    console.error('Error fetching prediction models:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/analytics/predictions/retrain - Retrain a prediction model
export const POST_RETRAIN = requireAuth(async (request: NextRequest, user: any) => {
  try {
    // Check if user has admin permissions
    if (!user || user.role?.id !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { modelId, trainingData } = await request.json();

    if (!modelId || !trainingData) {
      return NextResponse.json(
        { error: 'Model ID and training data are required' },
        { status: 400 }
      );
    }

    const success = await predictiveAnalyticsEngine.retrainModel(modelId, trainingData);

    return NextResponse.json({
      success,
      message: success ? 'Model retrained successfully' : 'Failed to retrain model'
    });
  } catch (error) {
    console.error('Error retraining model:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
