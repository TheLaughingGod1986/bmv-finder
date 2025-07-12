import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/rateLimiter';
import PredictiveModel from '@/lib/predictiveModel';
import { esClient } from '@/lib/esClient';

const predictiveModel = new PredictiveModel();

export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { postcode, propertyType, currentValue, includeMarketInsights = false } = body;

    if (!postcode) {
      return NextResponse.json(
        { error: 'Postcode is required' },
        { status: 400 }
      );
    }

    // Fetch historical HPI data for the postcode
    const hpiResponse = await fetch(`${req.nextUrl.origin}/api/hpi/postcode?postcode=${postcode}`);
    const hpiData = await hpiResponse.json();

    if (!hpiData.results || hpiData.results.length === 0) {
      return NextResponse.json(
        { error: 'No historical data available for this postcode' },
        { status: 404 }
      );
    }

    // Prepare features for prediction
    const features = {
      postcode,
      propertyType: propertyType || 'Unknown',
      region: hpiData.results[0]?.region || 'Unknown',
      currentValue,
      historicalData: hpiData.results.map((result: any) => ({
        date: result.date,
        index: result.index,
        year: result.year,
        month: result.month,
      })),
    };

    // Get prediction
    const prediction = await predictiveModel.predictPropertyValue(features);

    // Get market insights if requested
    let marketInsights = null;
    if (includeMarketInsights) {
      marketInsights = await predictiveModel.getMarketInsights(
        features.region,
        features.historicalData
      );
    }

    return NextResponse.json({
      postcode,
      prediction,
      marketInsights,
      dataPoints: features.historicalData.length,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in property prediction:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

// Batch predictions endpoint
export const PUT = withRateLimit(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { properties } = body;

    if (!properties || !Array.isArray(properties)) {
      return NextResponse.json(
        { error: 'Properties array is required' },
        { status: 400 }
      );
    }

    if (properties.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 properties allowed per batch' },
        { status: 400 }
      );
    }

    const results = [];
    
    for (const property of properties) {
      try {
        const hpiResponse = await fetch(`${req.nextUrl.origin}/api/hpi/postcode?postcode=${property.postcode}`);
        const hpiData = await hpiResponse.json();

        if (hpiData.results && hpiData.results.length > 0) {
          const features = {
            postcode: property.postcode,
            propertyType: property.propertyType || 'Unknown',
            region: hpiData.results[0]?.region || 'Unknown',
            currentValue: property.currentValue,
            historicalData: hpiData.results.map((result: any) => ({
              date: result.date,
              index: result.index,
              year: result.year,
              month: result.month,
            })),
          };

          const prediction = await predictiveModel.predictPropertyValue(features);
          results.push({ postcode: property.postcode, prediction, success: true });
        } else {
          results.push({ 
            postcode: property.postcode, 
            prediction: null, 
            success: false, 
            error: 'No historical data available' 
          });
        }
      } catch (error) {
        results.push({ 
          postcode: property.postcode, 
          prediction: null, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    const summary = {
      total: properties.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    };

    return NextResponse.json({
      summary,
      results,
      message: `Processed ${summary.successful}/${summary.total} predictions successfully`
    });

  } catch (error) {
    console.error('Error in batch predictions:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}); 