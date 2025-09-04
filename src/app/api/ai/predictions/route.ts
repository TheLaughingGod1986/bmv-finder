import { NextRequest, NextResponse } from 'next/server';
import { predictiveAnalyticsEngine } from '@/lib/ai/predictiveAnalytics';
import { requireAuth } from '@/middleware/auth';

export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { propertyId, region, timeframe, includeScenarios, includeRiskFactors } = body;

    if (!timeframe) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: timeframe'
      }, { status: 400 });
    }

    const results: any = {};

    // Generate property price prediction
    if (propertyId) {
      const pricePrediction = await predictiveAnalyticsEngine.predictPropertyPrice({
        propertyId,
        timeframe,
        includeScenarios,
        includeRiskFactors,
      });
      results.pricePrediction = pricePrediction;
    }

    // Generate market forecast
    if (region) {
      const marketForecast = await predictiveAnalyticsEngine.generateMarketForecast(
        region,
        timeframe as '1_YEAR' | '3_YEAR' | '5_YEAR'
      );
      results.marketForecast = marketForecast;

      // Get investment timing recommendation
      const investmentTiming = await predictiveAnalyticsEngine.getInvestmentTiming(region);
      results.investmentTiming = investmentTiming;
    }

    // Generate rental yield prediction
    if (propertyId) {
      const rentalForecast = await predictiveAnalyticsEngine.predictRentalYield(
        propertyId,
        timeframe as '1_YEAR' | '3_YEAR' | '5_YEAR'
      );
      results.rentalForecast = rentalForecast;
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: 'Predictive analytics generated successfully'
    });

  } catch (error) {
    console.error('Error generating predictive analytics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate predictive analytics'
    }, { status: 500 });
  }
}, { requiredRole: 'user' });
