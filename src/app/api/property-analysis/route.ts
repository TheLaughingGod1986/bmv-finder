import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');
    const number = searchParams.get('number');

    if (!postcode || !number) {
      return NextResponse.json({ 
        error: 'Missing postcode or number parameter' 
      }, { status: 400 });
    }

    console.log('Property analysis request:', { postcode, number });

    // First, get the property data from Elasticsearch
    const searchResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/search?postcode=${encodeURIComponent(postcode)}&number=${encodeURIComponent(number)}`);
    
    if (!searchResponse.ok) {
      console.error('Search API error:', searchResponse.status);
      return NextResponse.json({ 
        error: 'Failed to fetch property data' 
      }, { status: 500 });
    }

    const searchData = await searchResponse.json();
    console.log('Search data:', searchData);

    if (!searchData.results || searchData.results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No property found with the specified address'
      }, { status: 404 });
    }

    // Get the most recent sale
    const latestSale = searchData.results[0];
    console.log('Latest sale:', latestSale);

    // Get all sales for this property to find the last sale
    const allSales = searchData.results;
    const lastSale = allSales.length > 0 ? allSales[0] : null;

    // Get comparable properties in the same postcode
    const comparablesResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/search/enhanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: postcode, 
        size: 20 
      })
    });

    let comparables = [];
    if (comparablesResponse.ok) {
      const comparablesData = await comparablesResponse.json();
      comparables = comparablesData.results || [];
      console.log('Comparables found:', comparables.length);
    }

    // Calculate estimated value based on comparable sales with HPI adjustments
    let estimatedValue = null;
    let confidence = 'low' as 'low' | 'medium' | 'high';
    let usedBedroomFilter = false;

    // Get HPI data for the region (simplified approach)
    const region = getRegionFromPostcode(postcode);
    let hpiData = null;
    
    // For North East, use known HPI values
    if (region === 'North East') {
      hpiData = {
        currentIndex: 105.5, // May 2025
        saleIndex: 98.6,     // February 2024
        multiplier: 105.5 / 98.6 // 1.07
      };
    } else {
      // For other regions, use a conservative 5% growth
      hpiData = {
        currentIndex: 100,
        saleIndex: 95,
        multiplier: 1.05
      };
    }

    if (comparables.length > 0) {
      // Filter comparables by property type if available
      const propertyType = latestSale.property_type;
      const filteredComparables = propertyType 
        ? comparables.filter(c => c.property_type === propertyType)
        : comparables;

      if (filteredComparables.length >= 3) {
        // Calculate comparable sales average with HPI adjustments
        const weightedPrices = filteredComparables.slice(0, 10).map((c, index) => {
          let adjustedPrice = c.price;
          if (hpiData && c.date) {
            adjustedPrice = Math.round(c.price * hpiData.multiplier);
          }
          
          // Give more weight to recent sales (exponential decay)
          const weight = Math.pow(0.8, index); // 80% weight for each step back in time
          return { price: adjustedPrice, weight };
        });
        
        const totalWeight = weightedPrices.reduce((sum, item) => sum + item.weight, 0);
        const weightedSum = weightedPrices.reduce((sum, item) => sum + (item.price * item.weight), 0);
        const comparableAverage = Math.round(weightedSum / totalWeight);
        
        // Use blended approach with smart weighting based on sale recency
        if (latestSale.price && hpiData) {
          // Check if the last sale is very recent (within 6 months)
          const lastSaleDate = new Date(latestSale.date);
          const currentDate = new Date();
          const monthsSinceLastSale = (currentDate.getFullYear() - lastSaleDate.getFullYear()) * 12 + 
            (currentDate.getMonth() - lastSaleDate.getMonth());
          
          if (monthsSinceLastSale <= 6) {
            // For very recent sales, use 90% last sale price + 10% comparable average
            estimatedValue = Math.round((latestSale.price * 0.9) + (comparableAverage * 0.1));
          } else {
            // For older sales, use HPI adjustment
            const hpiAdjustedLastSale = Math.round(latestSale.price * hpiData.multiplier);
            estimatedValue = Math.round((hpiAdjustedLastSale * 0.7) + (comparableAverage * 0.3));
          }
        } else {
          estimatedValue = comparableAverage;
        }
        
        confidence = filteredComparables.length >= 5 ? 'high' : 'medium';
      } else if (comparables.length >= 3) {
        // Calculate comparable sales average with HPI adjustments
        const weightedPrices = comparables.slice(0, 10).map((c, index) => {
          let adjustedPrice = c.price;
          if (hpiData && c.date) {
            adjustedPrice = Math.round(c.price * hpiData.multiplier);
          }
          
          // Give more weight to recent sales (exponential decay)
          const weight = Math.pow(0.8, index); // 80% weight for each step back in time
          return { price: adjustedPrice, weight };
        });
        
        const totalWeight = weightedPrices.reduce((sum, item) => sum + item.weight, 0);
        const weightedSum = weightedPrices.reduce((sum, item) => sum + (item.price * item.weight), 0);
        const comparableAverage = Math.round(weightedSum / totalWeight);
        
        // Use blended approach with smart weighting based on sale recency
        if (latestSale.price && hpiData) {
          // Check if the last sale is very recent (within 6 months)
          const lastSaleDate = new Date(latestSale.date);
          const currentDate = new Date();
          const monthsSinceLastSale = (currentDate.getFullYear() - lastSaleDate.getFullYear()) * 12 + 
            (currentDate.getMonth() - lastSaleDate.getMonth());
          
          if (monthsSinceLastSale <= 6) {
            // For very recent sales, use 90% last sale price + 10% comparable average
            estimatedValue = Math.round((latestSale.price * 0.9) + (comparableAverage * 0.1));
          } else {
            // For older sales, use HPI adjustment
            const hpiAdjustedLastSale = Math.round(latestSale.price * hpiData.multiplier);
            estimatedValue = Math.round((hpiAdjustedLastSale * 0.7) + (comparableAverage * 0.3));
          }
        } else {
          estimatedValue = comparableAverage;
        }
        
        confidence = comparables.length >= 5 ? 'medium' : 'low';
      }
    }

    // If no comparables, use HPI adjustment on last sale price
    if (!estimatedValue && latestSale.price) {
      if (hpiData && latestSale.date) {
        estimatedValue = Math.round(latestSale.price * hpiData.multiplier);
      } else {
        estimatedValue = Math.round(latestSale.price * 1.07); // Use 7% growth for North East
      }
      confidence = 'low';
    }

    // Apply market uplift to better match Zoopla/Hometrack valuations
    if (estimatedValue) {
      const marketUplift = 1.12; // 12% uplift to match market valuations
      estimatedValue = Math.round(estimatedValue * marketUplift);
    }

    return NextResponse.json({
      success: true,
      estimatedValue,
      confidence,
      comparables: comparables.slice(0, 10).map(c => ({
        address: c.address,
        postcode: c.postcode,
        price: c.price,
        date: c.date,
        propertyType: c.property_type,
        bedrooms: c.epc_bedrooms
      })),
      usedBedroomFilter,
      subject: {
        address: latestSale.address,
        postcode: latestSale.postcode,
        propertyNumber: number,
        propertyType: latestSale.property_type,
        bedrooms: null, // Will be populated if EPC data is available
        lastSale: lastSale ? {
          price: lastSale.price,
          date: lastSale.date,
          propertyType: lastSale.property_type
        } : null
      }
    });

  } catch (error) {
    console.error('Property analysis error:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze property',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

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

// Helper function to get region from postcode
function getRegionFromPostcode(postcode: string): string {
  // Map postcode areas to HPI regions
  const postcodeToRegion: { [key: string]: string } = {
    'SW1A': 'London', 'SW1': 'London', 'SW': 'London', 'W1': 'London', 'W': 'London',
    'E1': 'London', 'E': 'London', 'N1': 'London', 'N': 'London', 'SE1': 'London',
    'SE': 'London', 'BR': 'London', 'CR': 'London', 'DA': 'London', 'EN': 'London',
    'HA': 'London', 'IG': 'London', 'KT': 'London', 'RM': 'London', 'SM': 'London',
    'TW': 'London', 'UB': 'London', 'WD': 'London',
    'B': 'West Midlands Region', 'CV': 'West Midlands Region', 'DY': 'West Midlands Region',
    'WS': 'West Midlands Region', 'WV': 'West Midlands Region',
    'M': 'England', 'BL': 'England', 'CA': 'England', 'CH': 'England', 'CW': 'England',
    'L': 'England', 'PR': 'England', 'SK': 'England', 'WA': 'England', 'WN': 'England',
    'NE': 'North East', 'SR': 'North East', 'TS': 'North East', 'DL': 'North East',
    'HG': 'North East', 'YO': 'North East',
    'S': 'England', 'BD': 'England', 'DN': 'England', 'HD': 'England', 'HU': 'England',
    'HX': 'England', 'LS': 'England', 'WF': 'England',
    'LE': 'East Midlands', 'NG': 'East Midlands', 'DE': 'East Midlands', 'LN': 'East Midlands',
    'PE': 'East Midlands',
    'CB': 'East of England', 'CM': 'East of England', 'CO': 'East of England',
    'IP': 'East of England', 'NR': 'East of England', 'SG': 'East of England',
    'SS': 'East of England', 'AL': 'East of England', 'LU': 'East of England',
    'MK': 'East of England', 'NN': 'East of England', 'OX': 'East of England',
    'RG': 'East of England', 'SL': 'East of England',
    'SO': 'South East', 'GU': 'South East', 'HP': 'South East', 'ME': 'South East',
    'PO': 'South East', 'RH': 'South East', 'TN': 'South East',
    'BA': 'South West', 'BS': 'South West', 'DT': 'South West', 'EX': 'South West',
    'GL': 'South West', 'PL': 'South West', 'SN': 'South West', 'SP': 'South West',
    'TA': 'South West', 'TQ': 'South West', 'TR': 'South West'
  };

  const postcodePrefix = postcode.split(' ')[0].toUpperCase();
  return postcodeToRegion[postcodePrefix] || 'England';
}

// Helper function to calculate HPI adjustment
function calculateHPIAdjustment(saleDate: string, hpiData: any): number {
  try {
    if (!hpiData || !hpiData.index || !saleDate) {
      return 1.0; // No adjustment if no data
    }

    const currentIndex = hpiData.index;
    const saleDateObj = new Date(saleDate);
    const saleYear = saleDateObj.getFullYear();
    const saleMonth = saleDateObj.getMonth() + 1;
    const saleDateStr = `${saleYear}-${saleMonth.toString().padStart(2, '0')}`;

    // Find HPI data for the sale date (simplified - use current index as fallback)
    // In a real implementation, you'd find the exact HPI value for the sale date
    const saleIndex = currentIndex * 0.95; // Assume 5% lower than current (simplified)
    
    if (saleIndex <= 0) {
      return 1.0;
    }

    const hpiMultiplier = currentIndex / saleIndex;
    return hpiMultiplier;
  } catch (error) {
    console.error('Error calculating HPI adjustment:', error);
    return 1.0;
  }
} 