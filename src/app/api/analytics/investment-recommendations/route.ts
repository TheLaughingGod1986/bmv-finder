import { NextRequest, NextResponse } from 'next/server';
import { investmentRecommendationEngine } from '@/lib/analytics/investmentRecommendationEngine';
import { propertyAnalyticsEngine } from '@/lib/analytics/propertyAnalytics';
import { requireAuth } from '@/middleware/auth';

// POST /api/analytics/investment-recommendations - Generate investment recommendation
export const POST = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { propertyData, postcode, region, userProfile } = await request.json();

    if (!propertyData || !postcode || !region) {
      return NextResponse.json(
        { error: 'Property data, postcode, and region are required' },
        { status: 400 }
      );
    }

    // Generate property analytics and market intelligence
    const [propertyAnalytics, marketIntelligence] = await Promise.all([
      propertyAnalyticsEngine.generatePropertyAnalytics(propertyData, postcode, user.id),
      propertyAnalyticsEngine.generateMarketIntelligence(postcode, region, user.id)
    ]);

    // Generate investment recommendation
    const recommendation = await investmentRecommendationEngine.generateRecommendation(
      propertyAnalytics,
      marketIntelligence,
      userProfile,
      user.id
    );

    return NextResponse.json({
      success: true,
      recommendation,
      analytics: {
        property: propertyAnalytics,
        market: marketIntelligence
      }
    });
  } catch (error) {
    console.error('Error generating investment recommendation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/analytics/investment-recommendations/portfolio - Analyze portfolio
export const POST_PORTFOLIO = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { portfolioData } = await request.json();

    if (!portfolioData || !Array.isArray(portfolioData)) {
      return NextResponse.json(
        { error: 'Portfolio data array is required' },
        { status: 400 }
      );
    }

    const analysis = await investmentRecommendationEngine.analyzePortfolio(
      portfolioData,
      user.id
    );

    return NextResponse.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing portfolio:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/analytics/investment-recommendations/opportunities - Identify market opportunities
export const POST_OPPORTUNITIES = requireAuth(async (request: NextRequest, user: any) => {
  try {
    const { regions, investmentCriteria } = await request.json();

    if (!regions || !Array.isArray(regions) || !investmentCriteria) {
      return NextResponse.json(
        { error: 'Regions array and investment criteria are required' },
        { status: 400 }
      );
    }

    const opportunities = await investmentRecommendationEngine.identifyMarketOpportunities(
      regions,
      investmentCriteria,
      user.id
    );

    return NextResponse.json({
      success: true,
      opportunities
    });
  } catch (error) {
    console.error('Error identifying market opportunities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
