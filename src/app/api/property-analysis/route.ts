import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');
    const number = searchParams.get('number');

    if (!postcode) {
      return NextResponse.json(
        { error: 'Postcode is required' },
        { status: 400 }
      );
    }

    console.log('Property analysis request:', { postcode, number });

    // 1. Get property sales data for the postcode
    const salesQuery = {
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
    };

    const salesResponse = await esClient.search(salesQuery);
    const salesData = salesResponse.hits.hits.map(hit => hit._source);

    if (salesData.length === 0) {
      return NextResponse.json(
        { error: 'No property sales data found for this postcode' },
        { status: 404 }
      );
    }

    // 2. Get EPC data for the postcode
    let epcData = [];
    try {
      const epcQuery = {
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
      };
      const epcResponse = await esClient.search(epcQuery);
      epcData = epcResponse.hits.hits.map(hit => hit._source);
    } catch (error) {
      console.log('EPC data not accessible:', error);
    }

    // 3. Get HPI data for the region
    let hpiData = [];
    try {
      const region = getRegionFromPostcode(postcode);
      const hpiQuery = {
        index: 'house_price_index',
        size: 50,
        body: {
          query: {
            term: { region: region }
          },
          sort: [{ date: { order: 'desc' } }]
        }
      };
      const hpiResponse = await esClient.search(hpiQuery);
      hpiData = hpiResponse.hits.hits.map(hit => hit._source);
    } catch (error) {
      console.log('HPI data not accessible:', error);
    }

    // 4. Get rental price data for the region
    let rentalData = [];
    try {
      const region = getRegionFromPostcode(postcode);
      const rentalQuery = {
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
          },
          sort: [{ date: { order: 'desc' } }]
        }
      };
      const rentalResponse = await esClient.search(rentalQuery);
      rentalData = rentalResponse.hits.hits.map(hit => hit._source);
    } catch (error) {
      console.log('Rental data not accessible:', error);
    }

    // 5. Calculate market analysis
    const marketAnalysis = calculateMarketAnalysis(salesData, hpiData, rentalData);

    // 6. Find comparable properties
    const comparables = findComparableProperties(salesData, number);

    // 7. Calculate BMV score
    const bmvScore = calculateBMVScore(salesData, marketAnalysis);

    return NextResponse.json({
      success: true,
      postcode: postcode.toUpperCase(),
      analysis: {
        totalSales: salesData.length,
        dateRange: {
          earliest: salesData[salesData.length - 1]?.date_of_transfer,
          latest: salesData[0]?.date_of_transfer
        },
        priceStats: {
          min: Math.min(...salesData.map(p => p.price || 0)),
          max: Math.max(...salesData.map(p => p.price || 0)),
          average: Math.round(salesData.reduce((sum, p) => sum + (p.price || 0), 0) / salesData.length),
          median: calculateMedian(salesData.map(p => p.price || 0))
        },
        marketTrends: marketAnalysis,
        comparables: comparables,
        bmvScore: bmvScore,
        epcData: epcData.length > 0 ? {
          total: epcData.length,
          averageRating: calculateAverageEPCRating(epcData),
          energyEfficient: epcData.filter(e => e.current_energy_rating === 'A' || e.current_energy_rating === 'B').length
        } : null,
        hpiData: hpiData.length > 0 ? {
          total: hpiData.length,
          latestIndex: hpiData[0]?.index_value,
          yearOverYearGrowth: calculateYearOverYearGrowth(hpiData)
        } : null,
        rentalData: rentalData.length > 0 ? {
          total: rentalData.length,
          averageRent: Math.round(rentalData.reduce((sum, r) => sum + (r.value || 0), 0) / rentalData.length)
        } : null
      }
    });

  } catch (error) {
    console.error('Property analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Analysis failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Helper functions
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
  // East of England
  if (upperPostcode.startsWith('AL') || upperPostcode.startsWith('CB') || upperPostcode.startsWith('CM') || upperPostcode.startsWith('CO') || upperPostcode.startsWith('IP') || upperPostcode.startsWith('LU') || upperPostcode.startsWith('MK') || upperPostcode.startsWith('NN') || upperPostcode.startsWith('NR') || upperPostcode.startsWith('PE') || upperPostcode.startsWith('SG') || upperPostcode.startsWith('SS')) {
    return 'East of England';
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
