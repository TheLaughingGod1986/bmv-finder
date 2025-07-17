import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rateLimiter';
import { EnhancedPredictionModel } from '@/lib/enhancedPredictionModel';

export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');
    const number = searchParams.get('number');

    if (!postcode || !number) {
      return NextResponse.json(
        { error: 'Postcode and house number are required' },
        { status: 400 }
      );
    }

    console.log('🔮 Starting enhanced property prediction with inflation:', { postcode, number });

    // Get enhanced property features with inflation data
    const features = await EnhancedPredictionModel.getEnhancedFeatures(postcode, number);
    
    // Add current economic data
    features.inflationRate = 3.2; // Current UK inflation rate (2024)
    features.interestRate = 5.25; // Current UK base rate
    features.economicOutlook = {
      projectedInflation: 2.0, // Projected for 2025
      projectedInterestRate: 4.5, // Projected for 2025
      marketSentiment: 'neutral' as const
    };

    // Calculate cumulative inflation data
    if (features.lastSoldDate) {
      const soldYear = new Date(features.lastSoldDate).getFullYear();
      const currentYear = new Date().getFullYear();
      const inflationData = [];
      let cumulative = 1.0;
      
      for (let year = soldYear; year <= currentYear; year++) {
        const rate = EnhancedPredictionModel['INFLATION_DATA'][year] || 2.0;
        cumulative *= (1 + rate / 100);
        inflationData.push({
          year,
          rate,
          cumulative: (cumulative - 1) * 100
        });
      }
      
      features.inflationData = inflationData;
    }

    // Get prediction using enhanced model
    const prediction = await EnhancedPredictionModel.predictPropertyValue(features);

    // Calculate inflation-adjusted metrics
    const inflationMetrics = calculateInflationMetrics(features, prediction);

    return NextResponse.json({
      success: true,
      postcode,
      number,
      prediction: {
        ...prediction,
        inflationMetrics
      },
      features: {
        lastSoldPrice: features.lastSoldPrice,
        lastSoldDate: features.lastSoldDate,
        inflationRate: features.inflationRate,
        interestRate: features.interestRate,
        economicOutlook: features.economicOutlook
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Enhanced prediction error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate enhanced prediction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

/**
 * Calculate inflation-specific metrics
 */
function calculateInflationMetrics(features: any, prediction: any) {
  const metrics: any = {};
  
  if (features.lastSoldPrice && features.lastSoldDate) {
    const soldYear = new Date(features.lastSoldDate).getFullYear();
    const currentYear = new Date().getFullYear();
    
    // Calculate real vs nominal growth
    const nominalGrowth = ((prediction.predictedValue - features.lastSoldPrice) / features.lastSoldPrice) * 100;
    
    // Calculate inflation-adjusted growth
    let cumulativeInflation = 1.0;
    for (let year = soldYear; year < currentYear; year++) {
      const inflationRate = EnhancedPredictionModel['INFLATION_DATA'][year] || 2.0;
      cumulativeInflation *= (1 + inflationRate / 100);
    }
    
    const inflationAdjustedPrice = features.lastSoldPrice * cumulativeInflation;
    const realGrowth = ((prediction.predictedValue - inflationAdjustedPrice) / inflationAdjustedPrice) * 100;
    
    metrics.nominalGrowth = nominalGrowth;
    metrics.realGrowth = realGrowth;
    metrics.inflationAdjustedPrice = inflationAdjustedPrice;
    metrics.cumulativeInflation = (cumulativeInflation - 1) * 100;
    metrics.yearsSinceSale = currentYear - soldYear;
    
    // Determine if growth is real or just inflation
    if (realGrowth > 0) {
      metrics.growthType = 'real';
      metrics.growthExplanation = `Property has grown ${realGrowth.toFixed(1)}% in real terms (above inflation)`;
    } else {
      metrics.growthType = 'inflation-only';
      metrics.growthExplanation = `Property growth of ${nominalGrowth.toFixed(1)}% is mostly due to inflation`;
    }
  }
  
  return metrics;
} 