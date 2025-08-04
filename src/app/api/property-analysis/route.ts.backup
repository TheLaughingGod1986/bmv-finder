import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { postcode, propertyType, price, bedrooms } = await request.json();

    // Enhanced rental estimation based on multiple factors
    const baseRentPerMonth = calculateRealisticRent(postcode, propertyType, price, bedrooms);
    const estimatedMonthlyRent = Math.round(baseRentPerMonth);
    const grossYield = ((estimatedMonthlyRent * 12) / price * 100).toFixed(1);

    // Simple market value estimation
    const estimatedMarketValue = price * 1.05; // Assume 5% below market
    const bmvPercentage = ((estimatedMarketValue - price) / estimatedMarketValue * 100).toFixed(1);

    // Value growth forecast (simple model)
    const annualGrowthRate = 0.03; // 3% annual growth
    const growthForecast = {
      '1_year': Math.round(price * Math.pow(1 + annualGrowthRate, 1)),
      '3_years': Math.round(price * Math.pow(1 + annualGrowthRate, 3)),
      '5_years': Math.round(price * Math.pow(1 + annualGrowthRate, 5)),
      '10_years': Math.round(price * Math.pow(1 + annualGrowthRate, 10))
    };

    // BMV Score calculation
    let bmvScore = 'E';
    if (parseFloat(bmvPercentage) >= 20) bmvScore = 'A';
    else if (parseFloat(bmvPercentage) >= 10) bmvScore = 'B';
    else if (parseFloat(bmvPercentage) >= 5) bmvScore = 'C';
    else if (parseFloat(bmvPercentage) >= 0) bmvScore = 'D';

    return NextResponse.json({
      success: true,
      analysis: {
        estimatedMonthlyRent,
        grossYield: parseFloat(grossYield),
        netYield: parseFloat(grossYield) * 0.7, // Assume 30% expenses
        bmvPercentage: parseFloat(bmvPercentage),
        bmvScore,
        estimatedMarketValue: Math.round(estimatedMarketValue),
        growthForecast,
        investmentMetrics: {
          breakEvenMonths: Math.round(price / (estimatedMonthlyRent * 0.7)), // Assuming 30% expenses
          fiveYearROI: ((growthForecast['5_years'] - price + (estimatedMonthlyRent * 12 * 5 * 0.7)) / price * 100).toFixed(1)
        }
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Property analysis error:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze property' 
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 

// Enhanced rental calculation function
function calculateRealisticRent(postcode: string, propertyType: string, price: number, bedrooms: number = 2) {
  // Base rental yield varies by region and property type
  const baseYieldRates = {
    'NE5': { // Newcastle area
      'flat': 0.0055,      // 6.6% annual yield
      'apartment': 0.0055, // 6.6% annual yield
      'house': 0.0048,     // 5.76% annual yield
      'semi-detached': 0.0045, // 5.4% annual yield
      'detached': 0.0042,  // 5.04% annual yield
      'terraced': 0.0052   // 6.24% annual yield
    },
    'NE1': { // Newcastle city centre
      'flat': 0.0062,      // 7.44% annual yield
      'apartment': 0.0062, // 7.44% annual yield
      'house': 0.0055,     // 6.6% annual yield
      'semi-detached': 0.0052, // 6.24% annual yield
      'detached': 0.0048,  // 5.76% annual yield
      'terraced': 0.0058   // 6.96% annual yield
    },
    'default': { // Default rates for other areas
      'flat': 0.0050,      // 6% annual yield
      'apartment': 0.0050, // 6% annual yield
      'house': 0.0045,     // 5.4% annual yield
      'semi-detached': 0.0042, // 5.04% annual yield
      'detached': 0.0040,  // 4.8% annual yield
      'terraced': 0.0048   // 5.76% annual yield
    }
  };

  // Get postcode prefix (first 3-4 characters)
  const postcodePrefix = postcode.substring(0, 4).toUpperCase();
  const areaRates = baseYieldRates[postcodePrefix as keyof typeof baseYieldRates] || baseYieldRates.default;
  
  // Get property type (normalize to lowercase)
  const type = propertyType?.toLowerCase() || 'house';
  const baseYield = areaRates[type as keyof typeof areaRates] || areaRates.house;

  // Bedroom multiplier (more bedrooms = higher rent per property)
  const bedroomMultipliers = {
    1: 0.7,   // 1 bed = 70% of base
    2: 1.0,   // 2 bed = 100% of base
    3: 1.3,   // 3 bed = 130% of base
    4: 1.5,   // 4 bed = 150% of base
    5: 1.7,   // 5 bed = 170% of base
    6: 1.9    // 6+ bed = 190% of base
  };

  const bedroomMultiplier = bedroomMultipliers[bedrooms as keyof typeof bedroomMultipliers] || 1.0;

  // Calculate monthly rent
  const monthlyRent = price * baseYield * bedroomMultiplier;

  // Add some market variation (±10%)
  const variation = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1

  return monthlyRent * variation;
} 