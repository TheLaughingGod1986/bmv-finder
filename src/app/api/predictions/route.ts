import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, applyRateLimitHeaders } from '@/lib/rateLimiter';
import defaultMarketConfig, { 
  calculateDataConfidence, 
  calculateValueRange, 
  getFallbackPropertyValue 
} from '@/lib/marketConfig';
import PredictiveModel from '@/lib/predictiveModel';
import { EnhancedPredictionModel } from '@/lib/enhancedPredictionModel';
import { mlPredictionEngine } from '../../../lib/mlPredictionEngine';
import { getOptimizedPriceIndicator, HpiData } from '@/utils/enhancedPriceIndicator';
import { esClient } from '@/lib/esClient';

const predictiveModel = new PredictiveModel();

export async function GET(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: rateLimitResult.error?.message || 'Rate limit exceeded' }, { status: rateLimitResult.error?.status || 429 }),
      rateLimitResult.headers
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');
    const number = searchParams.get('number');
    const propertyType = searchParams.get('propertyType');
    const bedrooms = searchParams.get('bedrooms');
    const price = searchParams.get('price');
    const predictionType = searchParams.get('type') || 'comprehensive'; // comprehensive, basic, enhanced, ml, price-indicator

    if (!postcode) {
      return NextResponse.json(
        { error: 'Postcode is required' },
        { status: 400 }
      );
    }

    let results: any = {};

    switch (predictionType) {
      case 'comprehensive':
        results = await performComprehensivePrediction(postcode, number);
        break;
      case 'basic':
        results = await performBasicPrediction(postcode, number);
        break;
      case 'enhanced':
        if (!number) {
          return NextResponse.json(
            { error: 'House number is required for enhanced prediction' },
            { status: 400 }
          );
        }
        results = await performEnhancedPrediction(postcode, number);
        break;
      case 'ml':
        results = await performMLPrediction(postcode, propertyType, bedrooms, price);
        break;
      case 'price-indicator':
        if (!propertyType || !price) {
          return NextResponse.json(
            { error: 'Property type and price are required for price indicator' },
            { status: 400 }
          );
        }
        results = await performPriceIndicatorPrediction(postcode, number, price);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid prediction type. Use: comprehensive, basic, enhanced, ml, or price-indicator' },
          { status: 400 }
        );
    }

    // Always apply property type adjustment regardless of method
    let finalPredictedValue = results.predictedValue;
    let propertyTypeAdjustment = 1.0;
    let adjustmentNote = '';
    
    try {
      const enhancedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/enhanced-property-search?postcode=${encodeURIComponent(postcode)}&includeRental=true&includeHPI=true&includeSoldPrices=true`);
      
      if (enhancedResponse.ok) {
        const enhancedData = await enhancedResponse.json();
        const property = enhancedData.data?.properties?.[0];
        
        if (property?.propertyType === 'Flat') {
          propertyTypeAdjustment = 0.7; // Flats 30% less than houses
          adjustmentNote = ' (Flat: 30% reduction applied)';
        } else if (property?.propertyType === 'Terraced') {
          propertyTypeAdjustment = 0.8; // Terraced 20% less than houses
          adjustmentNote = ' (Terraced: 20% reduction applied)';
        } else if (property?.propertyType === 'Semi-Detached') {
          propertyTypeAdjustment = 0.9; // Semi-detached 10% less than houses
          adjustmentNote = ' (Semi-Detached: 10% reduction applied)';
        } else if (property?.propertyType === 'Detached') {
          propertyTypeAdjustment = 1.1; // Detached 10% more than houses
          adjustmentNote = ' (Detached: 10% premium applied)';
        }
        
        if (propertyTypeAdjustment !== 1.0 && finalPredictedValue) {
          finalPredictedValue = Math.round(finalPredictedValue * propertyTypeAdjustment);
          console.log(`Applied property type adjustment: ${property.propertyType} -> factor ${propertyTypeAdjustment}, new value: ${finalPredictedValue}`);
        }
      }
    } catch (error) {
      console.error('Error applying property type adjustment:', error);
    }
    
    // Update the results with adjusted values
    if (finalPredictedValue !== results.predictedValue) {
      results.predictedValue = finalPredictedValue;
      if (results.valueRange?.min && results.valueRange?.max) {
        results.valueRange.min = Math.round(results.valueRange.min * propertyTypeAdjustment);
        results.valueRange.max = Math.round(results.valueRange.max * propertyTypeAdjustment);
      }
      results.note = (results.note || '') + adjustmentNote;
    }

    const response = NextResponse.json({
      success: true,
      predictionType,
      postcode: postcode.toUpperCase(),
      prediction: results
    });

    return applyRateLimitHeaders(response, rateLimitResult.headers);

  } catch (error) {
    console.error('Prediction error:', error);
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        error: 'Prediction failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return applyRateLimitHeaders(errorResponse, rateLimitResult.headers);
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: rateLimitResult.error?.message || 'Rate limit exceeded' }, { status: rateLimitResult.error?.status || 429 }),
      rateLimitResult.headers
    );
  }

  try {
    const body = await request.json();
    const { action, data, predictionType = 'comprehensive' } = body;

    // Handle ML-specific actions
    if (action === 'learn_from_outcome') {
      await mlPredictionEngine.learnFromOutcome(data.outcome);
      const response = NextResponse.json({ 
        success: true, 
        message: 'Successfully learned from outcome' 
      });
      return applyRateLimitHeaders(response, rateLimitResult.headers);
    }

    if (action === 'get_accuracy_metrics') {
      const metrics = mlPredictionEngine.getAccuracyMetrics();
      const response = NextResponse.json({ success: true, metrics });
      return applyRateLimitHeaders(response, rateLimitResult.headers);
    }

    // Handle prediction requests
    const { postcode, number, propertyType, bedrooms, price, currentValue, includeMarketInsights = false } = data;

    if (!postcode) {
      return NextResponse.json(
        { error: 'Postcode is required' },
        { status: 400 }
      );
    }

    let results: any = {};

    switch (predictionType) {
      case 'comprehensive':
        results = await performComprehensivePrediction(postcode, number);
        break;
      case 'basic':
        results = await performBasicPrediction(postcode, number);
        break;
      case 'enhanced':
        if (!number) {
          return NextResponse.json(
            { error: 'House number is required for enhanced prediction' },
            { status: 400 }
          );
        }
        results = await performEnhancedPrediction(postcode, number);
        break;
      case 'ml':
        results = await performMLPrediction(postcode, propertyType, bedrooms, price);
        break;
      case 'price-indicator':
        if (!propertyType || !price) {
          return NextResponse.json(
            { error: 'Property type and price are required for price indicator' },
            { status: 400 }
          );
        }
        results = await performPriceIndicatorPrediction(postcode, number, price);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid prediction type. Use: comprehensive, basic, enhanced, ml, or price-indicator' },
          { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      predictionType,
      postcode: postcode.toUpperCase(),
      prediction: results
    });

    return applyRateLimitHeaders(response, rateLimitResult.headers);

  } catch (error) {
    console.error('Prediction POST error:', error);
    const errorResponse = NextResponse.json(
      {
        success: false, 
        error: 'Prediction failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return applyRateLimitHeaders(errorResponse, rateLimitResult.headers);
  }
}

// Batch predictions endpoint
export async function PUT(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: rateLimitResult.error?.message || 'Rate limit exceeded' }, { status: rateLimitResult.error?.status || 429 }),
      rateLimitResult.headers
    );
  }

  try {
    const body = await request.json();
    const { properties, predictionType = 'basic' } = body;

    if (!properties || !Array.isArray(properties)) {
      return NextResponse.json(
        { error: 'Properties array is required' },
        { status: 400 }
      );
    }

    if (properties.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 properties allowed for batch prediction' },
        { status: 400 }
      );
    }

    const batchResults = await Promise.all(
      properties.map(async (property: any) => {
        try {
          const { postcode, number, propertyType, bedrooms, price, currentValue } = property;
          
          let results: any = {};
          
          switch (predictionType) {
            case 'comprehensive':
              results = await performComprehensivePrediction(postcode, number);
              break;
            case 'basic':
              results = await performBasicPrediction(postcode, number);
              break;
            case 'enhanced':
              if (number) {
                results = await performEnhancedPrediction(postcode, number);
              } else {
                results = { error: 'House number required for enhanced prediction' };
              }
              break;
            case 'ml':
              results = await performMLPrediction(postcode, propertyType, bedrooms, price);
              break;
            case 'price-indicator':
              if (propertyType && price) {
                results = await performPriceIndicatorPrediction(postcode, number, price);
              } else {
                results = { error: 'Property type and price required for price indicator' };
              }
              break;
            default:
              results = await performBasicPrediction(postcode, propertyType, currentValue, false);
          }

          return {
            postcode,
            success: !results.error,
            ...results
          };
        } catch (error) {
          return {
            postcode: property.postcode,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const response = NextResponse.json({
      success: true,
      predictionType,
      total: batchResults.length,
      successful: batchResults.filter(r => r.success).length,
      failed: batchResults.filter(r => !r.success).length,
      results: batchResults
    });

    return applyRateLimitHeaders(response, rateLimitResult.headers);

  } catch (error) {
    console.error('Error in batch prediction:', error);
    const errorResponse = NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return applyRateLimitHeaders(errorResponse, rateLimitResult.headers);
  }
}

// Comprehensive Prediction (combines all methods)
async function performComprehensivePrediction(postcode: string, number?: string): Promise<any> {
  try {
    // Fetch enhanced property data
    const enhancedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/enhanced-property-search?postcode=${encodeURIComponent(postcode)}&includeRental=true&includeHPI=true&includeSoldPrices=true`);
    
    if (!enhancedResponse.ok) {
      return {
        predictedValue: null,
        confidence: 0,
        valueRange: { min: null, max: null },
        method: 'comprehensive_fallback',
        dataQuality: 'low',
        note: 'Unable to fetch enhanced property data'
      };
    }

    const enhancedPropertyData = await enhancedResponse.json();
    
    if (!enhancedPropertyData.data?.properties || enhancedPropertyData.data.properties.length === 0) {
      return {
        predictedValue: null,
        confidence: 0,
        valueRange: { min: null, max: null },
        method: 'comprehensive_fallback',
        dataQuality: 'low',
        note: 'No property data available'
      };
    }

    // Find the specific property by number if provided
    let property = enhancedPropertyData.data.properties[0]; // Default to first property
    
    if (number) {
      const specificProperty = enhancedPropertyData.data.properties.find((p: any) => 
        p.address.includes(number) || 
        p.address.startsWith(number + ' ') ||
        p.address.startsWith(number + ',')
      );
      
      if (specificProperty) {
        property = specificProperty;
        console.log('Found specific property:', property.address);
      } else {
        console.log('Specific property not found, using first property:', property.address);
      }
    }
    
    // Log property details for debugging
    console.log('Selected property details:', {
      address: property.address,
      propertyType: property.propertyType,
      bedrooms: property.bedrooms,
      floorArea: property.floorArea,
      requestedNumber: number
    });
    
    // Get property valuation with property characteristics for accurate analysis
    const propertyValuationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/property-valuation?type=comprehensive&postcode=${encodeURIComponent(postcode)}&number=${encodeURIComponent(number || '')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postcode,
        propertyData: {
          propertyType: property.propertyType,
          bedrooms: property.bedrooms || property.habitableRooms,
          floorArea: property.floorArea,
          address: property.address
        },
        analysisType: 'comprehensive'
      })
    });
    
    let propertyValuationData = null;
    if (propertyValuationResponse.ok) {
      propertyValuationData = await propertyValuationResponse.json();
      console.log('Property valuation data:', propertyValuationData);
    }
    
    // Get market analysis
    const marketAnalysis = await getMarketAnalysis(postcode, number);
    
    // Calculate prediction using property-specific data
    let predictions: any[] = [];
    let totalWeight = 0;
    
    // 1. Property-specific sales data (highest weight)
    if (propertyValuationData?.marketAnalysis?.averagePrice > 0) {
      const propertySpecificPrice = propertyValuationData.marketAnalysis.averagePrice;
      const propertySpecificGrowth = propertyValuationData.marketAnalysis.yoyGrowth || marketAnalysis?.yoyGrowth || defaultMarketConfig.marketAnalysis.defaultYoYGrowth;
      
      predictions.push({
        value: Math.round(propertySpecificPrice * (1 + propertySpecificGrowth / 100)),
        weight: 0.5,
        source: 'property_specific_sales'
      });
      totalWeight += 0.5;
      console.log('Added property-specific sales prediction:', propertySpecificPrice);
    }
    
    // 2. Enhanced HPI Analysis with property characteristics
    if (enhancedPropertyData.hpiData?.yoyGrowth !== null) {
      const hpiPrediction = property.currentValue || property.estimatedValue || 0;
      if (hpiPrediction > 0) {
        const hpiAdjustedPrediction = hpiPrediction * (1 + enhancedPropertyData.hpiData.yoyGrowth / 100);
        predictions.push({
          value: hpiAdjustedPrediction,
          weight: 0.3,
          source: 'hpi_analysis'
        });
        totalWeight += 0.3;
      }
    }
    
    // 3. Market analysis fallback
    if (marketAnalysis?.averagePrice > 0 && (!propertyValuationData?.marketAnalysis?.averagePrice || propertyValuationData.marketAnalysis.averagePrice === 0)) {
      predictions.push({
        value: marketAnalysis.averagePrice,
        weight: 0.2,
        source: 'market_analysis_fallback'
      });
      totalWeight += 0.2;
    }
    
    // Calculate weighted average
    if (totalWeight === 0) {
      return {
        predictedValue: null,
        confidence: 0,
        valueRange: { min: null, max: null },
        method: 'comprehensive_fallback',
        dataQuality: 'low',
        note: 'No valid prediction data available'
      };
    }
    
    const weightedSum = predictions.reduce((sum, pred) => sum + (pred.value * pred.weight), 0);
    let predictedValue = Math.round(weightedSum / totalWeight);
    
    // Apply property type adjustments for final accuracy
    let propertyTypeAdjustment = 1.0;
    let adjustmentNote = '';
    
    console.log('Applying property type adjustment for:', property.propertyType);
    
    if (property.propertyType === 'Flat') {
      propertyTypeAdjustment = 0.75; // Flats 25% less than houses
      adjustmentNote = ' (Flat adjustment: 25% reduction)';
      console.log('Flat detected - applying 25% reduction');
    } else if (property.propertyType === 'Terraced') {
      propertyTypeAdjustment = 0.85; // Terraced 15% less than houses
      adjustmentNote = ' (Terraced adjustment: 15% reduction)';
      console.log('Terraced detected - applying 15% reduction');
    } else if (property.propertyType === 'Semi-Detached') {
      propertyTypeAdjustment = 0.95; // Semi-detached 5% less than houses
      adjustmentNote = ' (Semi-detached adjustment: 5% reduction)';
      console.log('Semi-detached detected - applying 5% reduction');
    } else if (property.propertyType === 'Detached') {
      propertyTypeAdjustment = 1.1; // Detached 10% more than houses
      adjustmentNote = ' (Detached adjustment: 10% premium)';
      console.log('Detached detected - applying 10% premium');
    } else if (property.propertyType === 'House') {
      propertyTypeAdjustment = 1.0; // Houses get no adjustment
      adjustmentNote = ' (House: no adjustment)';
      console.log('House detected - no adjustment needed');
    } else {
      console.log('Unknown property type:', property.propertyType, '- no adjustment applied');
    }
    
    // Apply the adjustment
    const originalValue = predictedValue;
    predictedValue = Math.round(predictedValue * propertyTypeAdjustment);
    console.log(`Property type adjustment: ${property.propertyType} -> factor ${propertyTypeAdjustment}`);
    console.log(`Final prediction: ${originalValue} -> ${predictedValue} (${Math.round(propertyTypeAdjustment * 100)}%)`);
    
    // Calculate confidence and value range
    const confidence = calculateDataConfidence(predictions.length, 'high');
    const valueRange = calculateValueRange(predictedValue, confidence);
    
    return {
      predictedValue,
      confidence,
      valueRange,
      method: 'property_specific_comprehensive',
      dataQuality: 'high',
      dataSources: predictions.map(p => p.source),
      note: `Based on property-specific data with ${Math.round(propertyTypeAdjustment * 100)}% property type adjustment${adjustmentNote}`
    };

  } catch (error) {
    console.error('Comprehensive prediction error:', error);
    return {
      predictedValue: null,
      confidence: 0,
      valueRange: { min: null, max: null },
      method: 'comprehensive_fallback',
      dataQuality: 'low',
      note: 'Error occurred during prediction calculation'
    };
  }
}

// Basic Prediction (original predictions functionality)
async function performBasicPrediction(postcode: string, number?: string): Promise<any> {
  try {
    // Fetch recent sales data to establish baseline
    const salesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/property-valuation?type=comprehensive&postcode=${encodeURIComponent(postcode)}&number=${encodeURIComponent(number || '')}`);
    
    if (!salesResponse.ok) {
      return {
        predictedValue: null,
        confidence: 0,
        valueRange: { min: null, max: null },
        method: 'basic_fallback',
        dataQuality: 'low',
        note: 'Unable to fetch sales data for prediction'
      };
    }

    const salesData = await salesResponse.json();
    
    const valuation = salesData.marketAnalysis || salesData.data?.marketAnalysis;
    if (!valuation?.yearlySales || valuation.yearlySales.length === 0) {
      return {
        predictedValue: null,
        confidence: 0,
        valueRange: { min: null, max: null },
        method: 'basic_fallback',
        dataQuality: 'low',
        note: 'No sales data available for prediction'
      };
    }

    // Use actual sales data for prediction
    const recentSales = valuation.yearlySales;
    const latestSale = recentSales[recentSales.length - 1];
    const baselineValue = latestSale.averagePrice || 0;
    
    if (baselineValue === 0) {
      return {
        predictedValue: null,
        confidence: 0,
        valueRange: { min: null, max: null },
        method: 'basic_fallback',
        dataQuality: 'low',
        note: 'No valid sales data for prediction'
      };
    }

    // Get property characteristics for adjustment
    const enhancedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/enhanced-property-search?postcode=${encodeURIComponent(postcode)}&includeRental=true&includeHPI=true&includeSoldPrices=true`);
    let propertyTypeAdjustment = 1.0;
    
    if (enhancedResponse.ok) {
      const enhancedData = await enhancedResponse.json();
      const property = enhancedData.data?.properties?.[0];
      
      console.log('Basic prediction: Property data:', {
        address: property?.address,
        propertyType: property?.propertyType,
        propertyTypeRaw: JSON.stringify(property?.propertyType),
        bedrooms: property?.bedrooms,
        floorArea: property?.floorArea
      });
      
      if (property?.propertyType === 'Flat') {
        propertyTypeAdjustment = 0.7; // Flats 30% less than houses
        console.log('Basic prediction: Flat detected - applying 30% reduction');
      } else if (property?.propertyType === 'Terraced') {
        propertyTypeAdjustment = 0.8; // Terraced 20% less than houses
      } else if (property?.propertyType === 'Semi-Detached') {
        propertyTypeAdjustment = 0.9; // Semi-detached 10% less than houses
      } else if (property?.propertyType === 'Detached') {
        propertyTypeAdjustment = 1.1; // Detached 10% more than houses
      }
      
      console.log('Basic prediction: Property type adjustment factor:', propertyTypeAdjustment);
    } else {
      console.log('Basic prediction: Failed to fetch enhanced property data');
    }

    // Apply conservative growth based on market conditions
    const growthRate = defaultMarketConfig.predictions.growthMultipliers.conservative;
    let predictedValue = Math.round(baselineValue * (1 + growthRate / 100));
    
    // Apply property type adjustment
    predictedValue = Math.round(predictedValue * propertyTypeAdjustment);
    console.log('Basic prediction: Final value after adjustment:', predictedValue, '(factor:', propertyTypeAdjustment, ')');
    
    // Calculate confidence and value range
    const confidence = calculateDataConfidence(recentSales.length, 'medium');
    const valueRange = calculateValueRange(predictedValue, confidence);
    
    return {
      predictedValue,
      confidence,
      valueRange,
      method: 'recent_sales_baseline_adjusted',
      dataQuality: 'medium',
      note: `Based on recent sales data with ${growthRate}% growth and property type adjustment (${propertyTypeAdjustment}x)`
    };

  } catch (error) {
    console.error('Basic prediction error:', error);
    return {
      predictedValue: null,
      confidence: 0,
      valueRange: { min: null, max: null },
      method: 'basic_fallback',
      dataQuality: 'low',
      note: 'Error occurred during prediction calculation'
    };
  }
}

// Enhanced Prediction (enhanced-prediction functionality)
async function performEnhancedPrediction(postcode: string, number: string) {
  try {
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

    return {
      prediction: {
        predictedValue: prediction.predictedValue,
        confidence: prediction.confidence,
        valueRange: prediction.valueRange,
        method: 'Enhanced Prediction Model'
      },
      features: {
        lastSoldPrice: features.lastSoldPrice,
        lastSoldDate: features.lastSoldDate,
        inflationRate: features.inflationRate,
        interestRate: features.interestRate,
        economicOutlook: features.economicOutlook
      },
      inflationMetrics
    };
  } catch (error) {
    console.error('Enhanced prediction error:', error);
    return {
      error: 'Enhanced prediction failed',
      prediction: null
    };
  }
}

// ML Prediction (ml-predictions functionality)
async function performMLPrediction(postcode: string, propertyType?: string, bedrooms?: string, price?: string): Promise<any> {
  try {
    // Fetch enhanced property data for ML features
    const enhancedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/enhanced-property-search?postcode=${encodeURIComponent(postcode)}&includeRental=true&includeHPI=true&includeSoldPrices=true`);
    
    if (!enhancedResponse.ok) {
      return {
        predictedValue: null,
        confidence: 0,
        valueRange: { min: null, max: null },
        method: 'ml_fallback',
        dataQuality: 'low',
        note: 'Unable to fetch property data for ML prediction'
      };
    }

    const enhancedPropertyData = await enhancedResponse.json();
    
    if (!enhancedPropertyData.data?.properties || enhancedPropertyData.data.properties.length === 0) {
      return {
        predictedValue: null,
        confidence: 0,
        valueRange: { min: null, max: null },
        method: 'ml_fallback',
        dataQuality: 'low',
        note: 'No property data available for ML prediction'
      };
    }

    const property = enhancedPropertyData.data.properties[0];
    
    // Prepare features for ML model
    const features = {
      postcode: postcode,
      propertyType: property.propertyType || 'Unknown',
      bedrooms: property.bedrooms || property.habitableRooms || 0,
      floorArea: property.floorArea || 0,
      currentValue: property.currentValue || property.estimatedValue || 0,
      lastSoldPrice: property.lastSoldPrice || 0,
      lastSoldDate: property.lastSoldDate || null,
      hpiGrowth: enhancedPropertyData.hpiData?.yoyGrowth || defaultMarketConfig.marketAnalysis.defaultYoYGrowth,
      rentalEstimate: enhancedPropertyData.rentalData?.monthly || 0,
      salesVolume: enhancedPropertyData.soldPriceData?.priceStats?.totalSales || 0,
      averagePrice: enhancedPropertyData.soldPriceData?.priceStats?.averagePrice || 0,
      inflationRate: defaultMarketConfig.economicIndicators.inflation.current,
      projectedInflation: defaultMarketConfig.economicIndicators.inflation.projected,
      projectedInterestRate: defaultMarketConfig.economicIndicators.interestRates.projected
    };

    // Calculate cumulative inflation impact
    if (features.lastSoldDate && features.lastSoldPrice > 0) {
      const soldDate = new Date(features.lastSoldDate);
      const currentDate = new Date();
      const yearsSinceSale = (currentDate.getTime() - soldDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      
      if (yearsSinceSale > 0) {
        let cumulative = 1;
        const inflationRates = [
          defaultMarketConfig.economicIndicators.inflation.current,
          defaultMarketConfig.economicIndicators.inflation.projected
        ];
        
        inflationRates.forEach(rate => {
          cumulative *= (1 + rate / 100);
        });
        
        features.inflationImpact = {
          yearsSinceSale: Math.round(yearsSinceSale * 100) / 100,
          cumulative: (cumulative - 1) * 100
        };
      }
    }

    // Use ML model for prediction
    const mlModel = new PredictiveModel();
    const mlPrediction = await mlModel.predict(features);
    
    if (!mlPrediction || mlPrediction.error) {
      // Fallback to enhanced prediction if ML fails
      return await performEnhancedPrediction(postcode, number);
    }

    // Calculate confidence based on data quality
    const confidence = calculateDataConfidence(
      Object.values(features).filter(v => v !== null && v !== undefined && v !== 0).length,
      'high'
    );
    
    // Calculate value range
    const valueRange = calculateValueRange(mlPrediction.predictedValue, confidence);
    
    return {
      predictedValue: Math.round(mlPrediction.predictedValue),
      confidence,
      valueRange,
      method: 'ml_model_prediction',
      dataQuality: 'high',
      features: Object.keys(features).filter(key => features[key] !== null && features[key] !== undefined),
      note: `ML model prediction using ${Object.keys(features).filter(key => features[key] !== null && features[key] !== undefined).length} features`
    };

  } catch (error) {
    console.error('ML prediction error:', error);
    return {
      predictedValue: null,
      confidence: 0,
      valueRange: { min: null, max: null },
      method: 'ml_fallback',
      dataQuality: 'low',
      note: 'Error occurred during ML prediction calculation'
    };
  }
}

// Price Indicator Prediction (enhanced-price-indicator functionality)
async function performPriceIndicatorPrediction(postcode: string, number?: string, price?: string): Promise<any> {
  try {
    if (!price) {
      return {
        predictedValue: null,
        confidence: 0,
        valueRange: { min: null, max: null },
        method: 'price_indicator_fallback',
        dataQuality: 'low',
        note: 'No price provided for price indicator prediction'
      };
    }

    const priceNum = parseFloat(price) || getFallbackPropertyValue(postcode, 'Unknown');
    
    // Fetch market analysis for growth calculation
    const marketResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/property-valuation?type=comprehensive&postcode=${encodeURIComponent(postcode)}&number=${encodeURIComponent(number || '')}`);
    
    let growthRate = defaultMarketConfig.predictions.growthMultipliers.moderate;
    let confidence = defaultMarketConfig.predictions.defaultConfidence;
    
    if (marketResponse.ok) {
      const marketData = await marketResponse.json();
      const valuation = marketData.marketAnalysis || marketData.data?.marketAnalysis;
      if (valuation?.yoyGrowth !== null && valuation?.yoyGrowth !== undefined) {
        growthRate = valuation.yoyGrowth;
        confidence = calculateDataConfidence(
          valuation.totalSales || 1,
          'medium'
        );
      }
    }

    // Calculate prediction based on price and growth
    const predictedValue = Math.round(priceNum * (1 + growthRate / 100));
    
    // Calculate value range
    const valueRange = calculateValueRange(predictedValue, confidence);
    
    return {
      predictedValue,
      confidence,
      valueRange,
      method: 'price_indicator_growth',
      dataQuality: confidence > defaultMarketConfig.dataQuality.confidenceThresholds.high ? 'high' : 'medium',
      note: `Based on provided price with ${growthRate}% market growth`
    };

  } catch (error) {
    console.error('Price indicator prediction error:', error);
    return {
      predictedValue: null,
      confidence: 0,
      valueRange: { min: null, max: null },
      method: 'price_indicator_fallback',
      dataQuality: 'low',
      note: 'Error occurred during price indicator prediction calculation'
    };
  }
}

// Helper Functions
async function getMarketAnalysis(postcode: string, number?: string) {
  try {
    // 1) Prefer the valuation API which returns full marketAnalysis (averagePrice, yearlySales, yoyGrowth, etc.)
    try {
      const valuationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/property-valuation?type=comprehensive&postcode=${encodeURIComponent(postcode)}&number=${encodeURIComponent(number || '')}`);
      if (valuationResponse.ok) {
        const valuationResult = await valuationResponse.json();
        const market = valuationResult.marketAnalysis || valuationResult.data?.marketAnalysis;
        if (market && (Array.isArray(market.yearlySales) || typeof market.averagePrice === 'number')) {
          // If yoyGrowth is missing, compute from last two years when available
          if ((market.yoyGrowth === undefined || market.yoyGrowth === null) && Array.isArray(market.yearlySales) && market.yearlySales.length >= 2) {
            const ys = market.yearlySales;
            const current = ys[ys.length - 1];
            const prev = ys[ys.length - 2];
            if (current?.averagePrice && prev?.averagePrice) {
              market.yoyGrowth = ((current.averagePrice - prev.averagePrice) / prev.averagePrice) * 100;
            }
          }
          return market;
        }
      }
    } catch (valuationError) {
      console.log('Property valuation API fetch failed:', valuationError);
    }

    // 2) Fallback to enhanced property search minimal insights
    try {
      const enhancedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/enhanced-property-search?postcode=${encodeURIComponent(postcode)}&includeRental=true&includeHPI=true&includeSoldPrices=true`);
      if (enhancedResponse.ok) {
        const enhancedResult = await enhancedResponse.json();
        if (enhancedResult.data?.properties?.length > 0) {
          const targetProperty = enhancedResult.data.properties.find((prop: any) => 
            (number && typeof prop.address === 'string' && (
              prop.address.includes(number) || 
              prop.address.startsWith(`${number},`) ||
              prop.address.startsWith(`${number} `)
            )) || true // allow any if number not provided
          );
          const yoyGrowth = targetProperty?.hpiData?.yoyGrowth;
          if (yoyGrowth !== undefined && yoyGrowth !== null) {
            return {
              marketTrend: yoyGrowth > 2 ? 'rising' : yoyGrowth < -2 ? 'falling' : 'stable',
              yoyGrowth: Math.round(yoyGrowth * 100) / 100,
              region: targetProperty?.hpiData?.regionLabel || 'Unknown',
              recentSalesCount: targetProperty?.soldPriceData?.recentSales?.length || 0
            } as any;
          }
        }
      }
    } catch (enhancedError) {
      console.log('Enhanced property data fetch failed:', enhancedError);
    }

    // No market data available
    return null;
  } catch (error) {
    console.error('Market analysis error:', error);
    return null;
  }
}

function getRegionFromPostcode(postcode: string): string {
  const upperPostcode = postcode.toUpperCase();
  
  // London
  if (
    upperPostcode.startsWith('E') || upperPostcode.startsWith('EC') ||
    (upperPostcode.startsWith('N') && !upperPostcode.startsWith('NE') && !upperPostcode.startsWith('NW') && /^N[0-9]/.test(upperPostcode)) ||
    upperPostcode.startsWith('NW') ||
    upperPostcode.startsWith('SE') || upperPostcode.startsWith('SW') ||
    upperPostcode.startsWith('W') || upperPostcode.startsWith('WC')
  ) {
    return 'London';
  }
  // North East
  if (upperPostcode.startsWith('NE') || upperPostcode.startsWith('SR') || upperPostcode.startsWith('DL') || upperPostcode.startsWith('TS')) {
    return 'North East';
  }
  // North West
  if (upperPostcode.startsWith('L') || upperPostcode.startsWith('M') || upperPostcode.startsWith('PR') || upperPostcode.startsWith('BB') || upperPostcode.startsWith('OL') || upperPostcode.startsWith('SK') || upperPostcode.startsWith('WA') || upperPostcode.startsWith('WN') || upperPostcode.startsWith('BL') || upperPostcode.startsWith('CA') || upperPostcode.startsWith('LA')) {
    return 'North West';
  }
  // Yorkshire and the Humber
  if (upperPostcode.startsWith('BD') || upperPostcode.startsWith('HD') || upperPostcode.startsWith('HG') || upperPostcode.startsWith('HX') || upperPostcode.startsWith('LS') || upperPostcode.startsWith('S') || upperPostcode.startsWith('WF') || upperPostcode.startsWith('YO')) {
    return 'Yorkshire and The Humber';
  }
  // East Midlands
  if (upperPostcode.startsWith('DE') || upperPostcode.startsWith('LE') || upperPostcode.startsWith('NG') || upperPostcode.startsWith('LN') || upperPostcode.startsWith('PE')) {
    return 'East Midlands';
  }
  // West Midlands
  if (upperPostcode.startsWith('B') || upperPostcode.startsWith('CV') || upperPostcode.startsWith('DY') || upperPostcode.startsWith('HR') || upperPostcode.startsWith('TF') || upperPostcode.startsWith('WS') || upperPostcode.startsWith('WV')) {
    return 'West Midlands Region';
  }
  // East of England
  if (upperPostcode.startsWith('AL') || upperPostcode.startsWith('CB') || upperPostcode.startsWith('CM') || upperPostcode.startsWith('CO') || upperPostcode.startsWith('IP') || upperPostcode.startsWith('LU') || upperPostcode.startsWith('MK') || upperPostcode.startsWith('NN') || upperPostcode.startsWith('NR') || upperPostcode.startsWith('PE') || upperPostcode.startsWith('SG') || upperPostcode.startsWith('SS')) {
    return 'East of England';
  }
  // South East
  if (upperPostcode.startsWith('BN') || upperPostcode.startsWith('BR') || upperPostcode.startsWith('CT') || upperPostcode.startsWith('DA') || upperPostcode.startsWith('GU') || upperPostcode.startsWith('HA') || upperPostcode.startsWith('HP') || upperPostcode.startsWith('KT') || upperPostcode.startsWith('ME') || upperPostcode.startsWith('MK') || upperPostcode.startsWith('OX') || upperPostcode.startsWith('RG') || upperPostcode.startsWith('RH') || upperPostcode.startsWith('SL') || upperPostcode.startsWith('SM') || upperPostcode.startsWith('SO') || upperPostcode.startsWith('TN') || upperPostcode.startsWith('TW')) {
    return 'South East';
  }
  // South West
  if (upperPostcode.startsWith('BA') || upperPostcode.startsWith('BH') || upperPostcode.startsWith('BS') || upperPostcode.startsWith('DT') || upperPostcode.startsWith('EX') || upperPostcode.startsWith('GL') || upperPostcode.startsWith('PL') || upperPostcode.startsWith('SN') || upperPostcode.startsWith('SP') || upperPostcode.startsWith('TA') || upperPostcode.startsWith('TR')) {
    return 'South West';
  }
  
  return 'England';
}

async function fetchHpiData(region: string): Promise<HpiData[]> {
  try {
    const response = await esClient.search({
      index: 'house_price_index',
      size: 50,
      body: {
        query: {
          term: { region: region.toLowerCase() }
        },
        sort: [{ date: { order: 'desc' } }]
      }
    });

    return response.hits.hits.map(hit => hit._source as HpiData);
  } catch (error) {
    console.error('Error fetching HPI data:', error);
    return [];
  }
}

async function fetchComparableProperties(postcode: string, propertyType: string, bedrooms?: number) {
  try {
    const query: any = {
      bool: {
        must: [
          { match_phrase: { postcode: postcode.toUpperCase() } },
          { term: { property_type: propertyType } }
        ]
      }
    };

    if (bedrooms) {
      query.bool.must.push({ term: { epc_bedrooms: bedrooms } });
    }

    const response = await esClient.search({
      index: 'recent_sales',
      size: 20,
      body: {
        query,
        sort: [{ date_of_transfer: { order: 'desc' } }]
      }
    });

    return response.hits.hits.map(hit => hit._source);
  } catch (error) {
    console.error('Error fetching comparable properties:', error);
    return [];
  }
}

function calculateInflationMetrics(features: any, prediction: any) {
  if (!features.lastSoldPrice || !features.inflationData) {
    return null;
  }

  const inflationAdjustedPrice = features.lastSoldPrice * (1 + features.inflationData[features.inflationData.length - 1]?.cumulative / 100);
  const inflationImpact = ((inflationAdjustedPrice - features.lastSoldPrice) / features.lastSoldPrice) * 100;

  return {
    inflationAdjustedPrice: Math.round(inflationAdjustedPrice),
    inflationImpact: Math.round(inflationImpact * 100) / 100,
    cumulativeInflation: features.inflationData[features.inflationData.length - 1]?.cumulative || 0,
    inflationData: features.inflationData
  };
} 