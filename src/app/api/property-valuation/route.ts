import { NextRequest, NextResponse } from 'next/server';
import { BMVScoreEngine } from '../../../lib/bmvScoreEngine';
import { SoldPrice } from '../../../../types/sold-price';
import { esClient } from '@/lib/esClient';
import { checkRateLimit, applyRateLimitHeaders } from '@/lib/rateLimiter';

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
    const analysisType = searchParams.get('type') || 'comprehensive'; // comprehensive, bmv-only, market-only

    if (!postcode) {
      return NextResponse.json(
        { error: 'Postcode is required' },
        { status: 400 }
      );
    }

    console.log('Property valuation request:', { postcode, number, analysisType });

    let results: any = {};

    switch (analysisType) {
      case 'comprehensive':
        results = await performComprehensiveAnalysis(postcode, number);
        break;
      case 'bmv-only':
        results = await performBMVAnalysis(postcode, number);
        break;
      case 'market-only':
        results = await performMarketAnalysis(postcode, number);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid analysis type. Use: comprehensive, bmv-only, or market-only' },
          { status: 400 }
        );
    }

    const response = NextResponse.json({
      success: true,
      analysisType,
      postcode: postcode.toUpperCase(),
      ...results
    });

    return applyRateLimitHeaders(response, rateLimitResult.headers);

  } catch (error) {
    console.error('Property valuation error:', error);
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        error: 'Valuation failed',
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
    const { postcode, propertyData, analysisType = 'comprehensive' } = await request.json();

    if (!postcode || !propertyData) {
      return NextResponse.json(
        { error: 'Postcode and property data are required' },
        { status: 400 }
      );
    }

    let results: any = {};

    switch (analysisType) {
      case 'comprehensive':
        results = await performComprehensiveAnalysis(postcode, undefined, propertyData);
        break;
      case 'bmv-only':
        results = await performBMVAnalysis(postcode, undefined, propertyData);
        break;
      case 'market-only':
        results = await performMarketAnalysis(postcode, undefined, propertyData);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid analysis type. Use: comprehensive, bmv-only, or market-only' },
          { status: 400 }
        );
    }

    const response = NextResponse.json({
      success: true,
      analysisType,
      postcode: postcode.toUpperCase(),
      ...results
    });

    return applyRateLimitHeaders(response, rateLimitResult.headers);

  } catch (error) {
    console.error('Property valuation POST error:', error);
    const errorResponse = NextResponse.json(
      { 
        success: false, 
        error: 'Valuation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return applyRateLimitHeaders(errorResponse, rateLimitResult.headers);
  }
}

// Comprehensive Analysis (combines BMV scoring and market analysis)
async function performComprehensiveAnalysis(postcode: string, number?: string, propertyData?: any) {
  // Get property sales data for the postcode
  const salesData = await getPropertySalesData(postcode);
  
  if (salesData.length === 0) {
    return {
      error: 'No property sales data found for this postcode'
    };
  }

  // Get EPC data for the postcode
  const epcData = await getEPCData(postcode);
  
  // Get HPI data for the region
  const hpiData = await getHPIData(postcode);
  
  // Get rental price data for the region
  const rentalData = await getRentalData(postcode);

  // Perform market analysis
  const marketAnalysis = calculateMarketAnalysis(salesData, hpiData, rentalData);
  
  // Find comparable properties
  const comparables = findComparableProperties(salesData, number);
  
  // Calculate BMV score
  const bmvScore = calculateBMVScore(salesData, marketAnalysis);
  
  // If we have property data, perform enhanced BMV scoring
  let enhancedBMVData = null;
  if (propertyData) {
    const allProperties: SoldPrice[] = salesData.map((prop: any) => ({
      postcode: prop.postcode,
      dateOfTransfer: prop.date_of_transfer || new Date().toISOString().split('T')[0],
      price: prop.price || 250000,
      propertyType: prop.property_type || 'T',
      duration: prop.tenure || 'F',
      old_new: 'N',
      paon: prop.paon || 'Sample Property',
      street: prop.street || 'Sample Street',
      locality: prop.locality || '',
      town: prop.town || '',
      district: prop.district || '',
      county: prop.county || '',
      category: 'A',
      recordStatus: 'A'
    }));

    const sampleProperty: SoldPrice = {
      ...propertyData,
      postcode: postcode.toUpperCase(),
      dateOfTransfer: propertyData.dateOfTransfer || new Date().toISOString().split('T')[0],
      price: propertyData.price || 250000,
      propertyType: propertyData.propertyType || 'T',
      duration: propertyData.duration || 'F',
      old_new: propertyData.old_new || 'N',
      paon: propertyData.paon || 'Sample Property',
      street: propertyData.street || 'Sample Street',
      locality: propertyData.locality || '',
      town: propertyData.town || '',
      district: propertyData.district || '',
      county: propertyData.county || '',
      category: propertyData.category || 'A',
      recordStatus: propertyData.recordStatus || 'A'
    };

    enhancedBMVData = await BMVScoreEngine.calculateBMVScore(sampleProperty, allProperties);
  }

  return {
    marketAnalysis: {
      yearlySales: marketAnalysis.yearlySales,
      growthRates: marketAnalysis.growthRates,
      overallGrowth: marketAnalysis.overallGrowth,
      totalSales: salesData.length,
      averagePrice: Math.round(salesData.reduce((sum, sale) => sum + (sale.price || 0), 0) / salesData.length),
      medianPrice: calculateMedian(salesData.map(sale => sale.price || 0)),
      priceRange: {
        min: Math.min(...salesData.map(sale => sale.price || 0)),
        max: Math.max(...salesData.map(sale => sale.price || 0))
      }
    },
    epcAnalysis: {
      totalProperties: epcData.length,
      averageRating: calculateAverageEPCRating(epcData),
      energyEfficientCount: epcData.filter(e => ['A', 'B', 'C'].includes(e.current_energy_rating)).length,
      ratingDistribution: epcData.reduce((acc, e) => {
        const rating = e.current_energy_rating || 'Unknown';
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      }, {} as any)
    },
    hpiAnalysis: {
      currentIndex: hpiData[0]?.index_value || 100,
      yoyGrowth: calculateYearOverYearGrowth(hpiData),
      trend: hpiData.length > 1 ? 
        (hpiData[0]?.index_value > hpiData[1]?.index_value ? 'rising' : 'falling') : 'stable',
      lastUpdated: hpiData[0]?.date || new Date().toISOString()
    },
    rentalAnalysis: {
      averageRental: rentalData.length > 0 ? 
        Math.round(rentalData.reduce((sum, r) => sum + (r.rental_price || 0), 0) / rentalData.length) : 0,
      rentalYield: rentalData.length > 0 ? 
        (rentalData.reduce((sum, r) => sum + (r.rental_price || 0), 0) / rentalData.length) / 
        (salesData.reduce((sum, sale) => sum + (sale.price || 0), 0) / salesData.length) * 12 * 100 : 0
    },
    bmvAnalysis: {
      basicScore: bmvScore,
      enhancedScore: enhancedBMVData?.bmvScore || bmvScore,
      category: enhancedBMVData ? 
        BMVScoreEngine.getBMVCategory(enhancedBMVData.bmvScore) : 
        getBMVCategory(bmvScore),
      marketValue: enhancedBMVData?.marketValue || 0,
      askingPrice: enhancedBMVData?.askingPrice || 0,
      rentalYield: enhancedBMVData?.rentalYield || 0,
      areaGrowth: enhancedBMVData?.areaGrowth || marketAnalysis.overallGrowth
    },
    comparables: comparables,
    recommendations: generateRecommendations(bmvScore, marketAnalysis, hpiData)
  };
}

// BMV Analysis Only
async function performBMVAnalysis(postcode: string, number?: string, propertyData?: any) {
  const salesData = await getPropertySalesData(postcode);
  
  if (salesData.length === 0) {
    return {
      error: 'No property sales data found for this postcode'
    };
  }

  if (!propertyData) {
    return {
      error: 'Property data is required for BMV analysis'
    };
  }

  const allProperties: SoldPrice[] = salesData.map((prop: any) => ({
    postcode: prop.postcode,
    dateOfTransfer: prop.date_of_transfer || new Date().toISOString().split('T')[0],
    price: prop.price || 250000,
    propertyType: prop.property_type || 'T',
    duration: prop.tenure || 'F',
    old_new: 'N',
    paon: prop.paon || 'Sample Property',
    street: prop.street || 'Sample Street',
    locality: prop.locality || '',
    town: prop.town || '',
    district: prop.district || '',
    county: prop.county || '',
    category: 'A',
    recordStatus: 'A'
  }));

  const sampleProperty: SoldPrice = {
    ...propertyData,
    postcode: postcode.toUpperCase(),
    dateOfTransfer: propertyData.dateOfTransfer || new Date().toISOString().split('T')[0],
    price: propertyData.price || 250000,
    propertyType: propertyData.propertyType || 'T',
    duration: propertyData.duration || 'F',
    old_new: propertyData.old_new || 'N',
    paon: propertyData.paon || 'Sample Property',
    street: propertyData.street || 'Sample Street',
    locality: propertyData.locality || '',
    town: propertyData.town || '',
    district: propertyData.district || '',
    county: propertyData.county || '',
    category: propertyData.category || 'A',
    recordStatus: propertyData.recordStatus || 'A'
  };

  const enhancedBMVData = await BMVScoreEngine.calculateBMVScore(sampleProperty, allProperties);
  const traditionalBMVData = BMVScoreEngine.calculateBMVScoreSync(sampleProperty, allProperties);

  const enhancedCategory = BMVScoreEngine.getBMVCategory(enhancedBMVData.bmvScore);
  const traditionalCategory = BMVScoreEngine.getBMVCategory(traditionalBMVData.bmvScore);

  const scoreImprovement = enhancedBMVData.bmvScore - traditionalBMVData.bmvScore;
  const growthImprovement = enhancedBMVData.areaGrowth - traditionalBMVData.areaGrowth;

  return {
    enhanced: {
      bmvScore: enhancedBMVData.bmvScore,
      category: enhancedCategory,
      marketValue: enhancedBMVData.marketValue,
      askingPrice: enhancedBMVData.askingPrice,
      rentalYield: enhancedBMVData.rentalYield,
      areaGrowth: enhancedBMVData.areaGrowth,
      postcodeYield: enhancedBMVData.postcodeYield,
      postcodeGrowth: enhancedBMVData.postcodeGrowth
    },
    traditional: {
      bmvScore: traditionalBMVData.bmvScore,
      category: traditionalCategory,
      marketValue: traditionalBMVData.marketValue,
      askingPrice: traditionalBMVData.askingPrice,
      rentalYield: traditionalBMVData.rentalYield,
      areaGrowth: traditionalBMVData.areaGrowth,
      postcodeYield: traditionalBMVData.postcodeYield,
      postcodeGrowth: traditionalBMVData.postcodeGrowth
    },
    improvement: {
      scoreImprovement,
      growthImprovement,
      percentageImprovement: traditionalBMVData.bmvScore > 0 ? 
        (scoreImprovement / traditionalBMVData.bmvScore) * 100 : 0
    }
  };
}

// Market Analysis Only
async function performMarketAnalysis(postcode: string, number?: string) {
  const salesData = await getPropertySalesData(postcode);
  
  if (salesData.length === 0) {
    return {
      error: 'No property sales data found for this postcode'
    };
  }

  const epcData = await getEPCData(postcode);
  const hpiData = await getHPIData(postcode);
  const rentalData = await getRentalData(postcode);

  const marketAnalysis = calculateMarketAnalysis(salesData, hpiData, rentalData);
  const comparables = findComparableProperties(salesData, number);

  // Calculate time-weighted average price (prioritizing recent sales)
  const calculateTimeWeightedAveragePrice = (salesData: any[]) => {
    if (salesData.length === 0) return 0;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Filter to only include sales from the last 5 years
    const recentSales = salesData.filter(sale => {
      const saleYear = new Date(sale.date_of_transfer || sale.dateOfTransfer || sale.date).getFullYear();
      return currentYear - saleYear <= 5;
    });
    
    if (recentSales.length === 0) {
      // If no recent sales, use the most recent sale price
      const sortedSales = salesData.sort((a, b) => 
        new Date(b.date_of_transfer || b.dateOfTransfer || b.date).getTime() - 
        new Date(a.date_of_transfer || a.dateOfTransfer || a.date).getTime()
      );
      return sortedSales[0]?.price || 0;
    }
    
    // Calculate time-weighted average for recent sales
    let totalWeightedPrice = 0;
    let totalWeight = 0;
    
    recentSales.forEach(sale => {
      const saleDate = new Date(sale.date_of_transfer || sale.dateOfTransfer || sale.date);
      const yearsAgo = (now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      const weight = Math.max(0.1, 1 - (yearsAgo / 5)); // More recent = higher weight
      
      totalWeightedPrice += (sale.price || 0) * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? Math.round(totalWeightedPrice / totalWeight) : 0;
  };

  return {
    marketAnalysis: {
      yearlySales: marketAnalysis.yearlySales,
      growthRates: marketAnalysis.growthRates,
      overallGrowth: marketAnalysis.overallGrowth,
      totalSales: salesData.length,
      averagePrice: calculateTimeWeightedAveragePrice(salesData),
      medianPrice: calculateMedian(salesData.map(sale => sale.price || 0)),
      priceRange: {
        min: Math.min(...salesData.map(sale => sale.price || 0)),
        max: Math.max(...salesData.map(sale => sale.price || 0))
      }
    },
    epcAnalysis: {
      totalProperties: epcData.length,
      averageRating: calculateAverageEPCRating(epcData),
      energyEfficientCount: epcData.filter(e => ['A', 'B', 'C'].includes(e.current_energy_rating)).length,
      ratingDistribution: epcData.reduce((acc, e) => {
        const rating = e.current_energy_rating || 'Unknown';
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      }, {} as any)
    },
    hpiAnalysis: {
      currentIndex: hpiData[0]?.index_value || 100,
      yoyGrowth: calculateYearOverYearGrowth(hpiData),
      trend: hpiData.length > 1 ? 
        (hpiData[0]?.index_value > hpiData[1]?.index_value ? 'rising' : 'falling') : 'stable',
      lastUpdated: hpiData[0]?.date || new Date().toISOString()
    },
    rentalAnalysis: {
      averageRental: rentalData.length > 0 ? 
        Math.round(rentalData.reduce((sum, r) => sum + (r.rental_price || 0), 0) / rentalData.length) : 0,
      rentalYield: rentalData.length > 0 ? 
        (rentalData.reduce((sum, r) => sum + (r.rental_price || 0), 0) / rentalData.length) / 
        (salesData.reduce((sum, sale) => sum + (sale.price || 0), 0) / salesData.length) * 12 * 100 : 0
    },
    comparables: comparables
  };
}

// Helper Functions
async function getPropertySalesData(postcode: string) {
  try {
    const response = await esClient.search({
      index: 'recent_sales',
      size: 100,
      body: {
        query: {
          bool: {
            must: [
              { match_phrase: { postcode: postcode.toUpperCase() } }
            ]
          }
        },
        sort: [{ date_of_transfer: { order: 'desc' } }]
      }
    });
    return response.hits.hits.map(hit => hit._source);
  } catch (error) {
    console.log('Property sales data not accessible:', error);
    return [];
  }
}

async function getEPCData(postcode: string) {
  try {
    const response = await esClient.search({
      index: 'epc_data',
      size: 50,
      body: {
        query: {
          bool: {
            must: [
              { match_phrase: { postcode: postcode.toUpperCase() } }
            ]
          }
        }
      }
    });
    return response.hits.hits.map(hit => hit._source);
  } catch (error) {
    console.log('EPC data not accessible:', error);
    return [];
  }
}

async function getHPIData(postcode: string) {
  try {
    const region = getRegionFromPostcode(postcode);
    const response = await esClient.search({
      index: 'house_price_index',
      size: 50,
      body: {
        query: {
          term: { region: region }
        },
        sort: [{ date: { order: 'desc' } }]
      }
    });
    return response.hits.hits.map(hit => hit._source);
  } catch (error) {
    console.log('HPI data not accessible:', error);
    return [];
  }
}

async function getRentalData(postcode: string) {
  try {
    const region = getRegionFromPostcode(postcode);
    const response = await esClient.search({
      index: 'rental_prices',
      size: 50,
      body: {
        query: {
          bool: {
            should: [
              { term: { geography: region } },
              { term: { geo_code: region } }
            ]
          }
        }
      }
    });
    return response.hits.hits.map(hit => hit._source);
  } catch (error) {
    console.log('Rental data not accessible:', error);
    return [];
  }
}

function getRegionFromPostcode(postcode: string): string {
  const upperPostcode = postcode.toUpperCase();
  
  // London
  if (upperPostcode.startsWith('E') || upperPostcode.startsWith('EC') || 
      upperPostcode.startsWith('N') || upperPostcode.startsWith('NW') || 
      upperPostcode.startsWith('SE') || upperPostcode.startsWith('SW') || 
      upperPostcode.startsWith('W') || upperPostcode.startsWith('WC')) {
    return 'london';
  }
  
  // South East
  if (upperPostcode.startsWith('BN') || upperPostcode.startsWith('BR') || 
      upperPostcode.startsWith('CT') || upperPostcode.startsWith('DA') || 
      upperPostcode.startsWith('GU') || upperPostcode.startsWith('HA') || 
      upperPostcode.startsWith('HP') || upperPostcode.startsWith('KT') || 
      upperPostcode.startsWith('ME') || upperPostcode.startsWith('MK') || 
      upperPostcode.startsWith('OX') || upperPostcode.startsWith('RG') || 
      upperPostcode.startsWith('RH') || upperPostcode.startsWith('SL') || 
      upperPostcode.startsWith('SM') || upperPostcode.startsWith('SO') || 
      upperPostcode.startsWith('TN') || upperPostcode.startsWith('TW')) {
    return 'de-orllewin-lloegr';
  }
  
  // South West
  if (upperPostcode.startsWith('BA') || upperPostcode.startsWith('BH') || 
      upperPostcode.startsWith('BS') || upperPostcode.startsWith('DT') || 
      upperPostcode.startsWith('EX') || upperPostcode.startsWith('GL') || 
      upperPostcode.startsWith('PL') || upperPostcode.startsWith('SN') || 
      upperPostcode.startsWith('SP') || upperPostcode.startsWith('TA') || 
      upperPostcode.startsWith('TR')) {
    return 'de-orllewin-lloegr';
  }
  
  // East of England
  if (upperPostcode.startsWith('AL') || upperPostcode.startsWith('CB') || 
      upperPostcode.startsWith('CM') || upperPostcode.startsWith('CO') || 
      upperPostcode.startsWith('IP') || upperPostcode.startsWith('LU') || 
      upperPostcode.startsWith('NR') || upperPostcode.startsWith('SG') || 
      upperPostcode.startsWith('SS')) {
    return 'de-orllewin-lloegr';
  }
  
  // East Midlands
  if (upperPostcode.startsWith('DE') || upperPostcode.startsWith('LE') || 
      upperPostcode.startsWith('LN') || upperPostcode.startsWith('NG') || 
      upperPostcode.startsWith('NN') || upperPostcode.startsWith('PE') || 
      upperPostcode.startsWith('S')) {
    return 'East Midlands';
  }
  
  // West Midlands
  if (upperPostcode.startsWith('B') || upperPostcode.startsWith('CV') || 
      upperPostcode.startsWith('DY') || upperPostcode.startsWith('HR') || 
      upperPostcode.startsWith('TF') || upperPostcode.startsWith('WS') || 
      upperPostcode.startsWith('WV')) {
    return 'gorllewin-canolbarth-lloegr';
  }
  
  // Yorkshire and The Humber
  if (upperPostcode.startsWith('BD') || upperPostcode.startsWith('DN') || 
      upperPostcode.startsWith('HD') || upperPostcode.startsWith('HG') || 
      upperPostcode.startsWith('HU') || upperPostcode.startsWith('HX') || 
      upperPostcode.startsWith('LS') || upperPostcode.startsWith('S') || 
      upperPostcode.startsWith('WF') || upperPostcode.startsWith('YO')) {
    return 'yorkshire-and-the-humber';
  }
  
  // North West
  if (upperPostcode.startsWith('BB') || upperPostcode.startsWith('BL') || 
      upperPostcode.startsWith('CA') || upperPostcode.startsWith('CH') || 
      upperPostcode.startsWith('CW') || upperPostcode.startsWith('FY') || 
      upperPostcode.startsWith('L') || upperPostcode.startsWith('LA') || 
      upperPostcode.startsWith('M') || upperPostcode.startsWith('OL') || 
      upperPostcode.startsWith('PR') || upperPostcode.startsWith('SK') || 
      upperPostcode.startsWith('WA') || upperPostcode.startsWith('WN')) {
    return 'gorllewin-canolbarth-lloegr';
  }
  
  // North East
  if (upperPostcode.startsWith('DH') || upperPostcode.startsWith('DL') || 
      upperPostcode.startsWith('NE') || upperPostcode.startsWith('SR') || 
      upperPostcode.startsWith('TS')) {
    return 'north-east';
  }
  
  // Default to England if no match
  return 'England';
}

function calculateMarketAnalysis(salesData: any[], hpiData: any[], rentalData: any[]) {
  // Group sales by year
  const yearlySales = salesData.reduce((acc, sale) => {
    const year = new Date(sale.date_of_transfer).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(sale);
    return acc;
  }, {});

  // Calculate year-over-year growth
  const years = Object.keys(yearlySales).sort();
  const growthRates = [];
  
  for (let i = 1; i < years.length; i++) {
    const currentYear = parseInt(years[i]);
    const prevYear = parseInt(years[i - 1]);
    const currentAvg = yearlySales[currentYear].reduce((sum, sale) => sum + (sale.price || 0), 0) / yearlySales[currentYear].length;
    const prevAvg = yearlySales[prevYear].reduce((sum, sale) => sum + (sale.price || 0), 0) / yearlySales[prevYear].length;
    
    if (prevAvg > 0) {
      growthRates.push({
        year: currentYear,
        growth: ((currentAvg - prevAvg) / prevAvg) * 100
      });
    }
  }

  return {
    yearlySales: Object.keys(yearlySales).map(year => ({
      year: parseInt(year),
      count: yearlySales[year].length,
      averagePrice: Math.round(yearlySales[year].reduce((sum, sale) => sum + (sale.price || 0), 0) / yearlySales[year].length)
    })),
    growthRates,
    overallGrowth: growthRates.length > 0 ? 
      growthRates.reduce((sum, rate) => sum + rate.growth, 0) / growthRates.length : 0
  };
}

function findComparableProperties(salesData: any[], targetNumber?: string) {
  // If we have a specific property number, try to find similar properties
  if (targetNumber) {
    // Find properties with similar characteristics
    const targetProperty = salesData.find(sale => 
      sale.paon && sale.paon.toString().includes(targetNumber)
    );
    
    if (targetProperty) {
      // Find properties with similar price range (±20%)
      const priceRange = targetProperty.price * 0.2;
      const minPrice = targetProperty.price - priceRange;
      const maxPrice = targetProperty.price + priceRange;
      
      return salesData
        .filter(sale => 
          sale.price >= minPrice && 
          sale.price <= maxPrice && 
          sale.transaction_id !== targetProperty.transaction_id
        )
        .slice(0, 5)
        .map(sale => ({
          address: sale.full_address || `${sale.paon || ''} ${sale.street || ''}, ${sale.postcode}`.trim(),
          postcode: sale.postcode,
          price: sale.price,
          date: sale.date_of_transfer,
          propertyType: sale.property_type,
          bedrooms: sale.epc_bedrooms || null
        }));
    }
  }
  
  // Return recent sales as comparables
  return salesData.slice(0, 5).map(sale => ({
    address: sale.full_address || `${sale.paon || ''} ${sale.street || ''}, ${sale.postcode}`.trim(),
    postcode: sale.postcode,
    price: sale.price,
    date: sale.date_of_transfer,
    propertyType: sale.property_type,
    bedrooms: sale.epc_bedrooms || null
  }));
}

function calculateBMVScore(salesData: any[], marketAnalysis: any) {
  // Simple BMV scoring based on market trends
  const recentPrices = salesData.slice(0, 10).map(sale => sale.price);
  const averagePrice = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
  
  // Calculate volatility
  const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - averagePrice, 2), 0) / recentPrices.length;
  const volatility = Math.sqrt(variance) / averagePrice;
  
  // Calculate growth potential
  const growthPotential = marketAnalysis.overallGrowth;
  
  // Simple scoring algorithm
  let score = 50; // Base score
  
  // Adjust for growth potential
  if (growthPotential > 5) score += 20;
  else if (growthPotential > 0) score += 10;
  else if (growthPotential < -5) score -= 20;
  
  // Adjust for volatility (lower volatility = more stable = better score)
  if (volatility < 0.1) score += 15;
  else if (volatility > 0.2) score -= 15;
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getBMVCategory(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  if (score >= 20) return 'Below Average';
  return 'Poor';
}

function calculateMedian(values: number[]): number {
  const sorted = values.sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  return sorted[middle];
}

function calculateAverageEPCRating(epcData: any[]): string {
  const ratings = epcData
    .map(e => e.current_energy_rating)
    .filter(r => r && r !== 'Unknown');
  
  if (ratings.length === 0) return 'Unknown';
  
  const ratingValues = ratings.map(r => {
    switch (r) {
      case 'A': return 7; case 'B': return 6; case 'C': return 5;
      case 'D': return 4; case 'E': return 3; case 'F': return 2; case 'G': return 1;
      default: return 4;
    }
  });
  
  const average = ratingValues.reduce((sum, val) => sum + val, 0) / ratingValues.length;
  
  if (average >= 6.5) return 'A';
  if (average >= 5.5) return 'B';
  if (average >= 4.5) return 'C';
  if (average >= 3.5) return 'D';
  if (average >= 2.5) return 'E';
  if (average >= 1.5) return 'F';
  return 'G';
}

function calculateYearOverYearGrowth(hpiData: any[]): number {
  if (hpiData.length < 2) return 0;
  
  const current = hpiData[0]?.index_value;
  const previous = hpiData.find(h => h.date !== hpiData[0]?.date)?.index_value;
  
  if (!current || !previous) return 0;
  
  return ((current - previous) / previous) * 100;
}

function generateRecommendations(bmvScore: number, marketAnalysis: any, hpiData: any[]) {
  const recommendations = [];
  
  if (bmvScore >= 70) {
    recommendations.push('High BMV score indicates strong investment potential');
  } else if (bmvScore <= 30) {
    recommendations.push('Low BMV score suggests caution - consider other areas');
  }
  
  if (marketAnalysis.overallGrowth > 5) {
    recommendations.push('Strong market growth trend - good timing for investment');
  } else if (marketAnalysis.overallGrowth < -2) {
    recommendations.push('Market showing decline - consider waiting or negotiating better prices');
  }
  
  if (hpiData.length > 0 && hpiData[0]?.index_value > 100) {
    recommendations.push('HPI above baseline - market may be at peak');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Market conditions are neutral - standard due diligence recommended');
  }
  
  return recommendations;
}
