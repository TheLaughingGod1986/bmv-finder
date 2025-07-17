import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';

interface PropertyEnrichmentData {
  address: string;
  bedrooms: number | null;
  epc_rating: string | null;
  floor_area_m2: number | null;
  property_type: string | null;
  construction_year?: string;
  current_energy_rating?: string;
  potential_energy_rating?: string;
  epc_date?: string;
  certificate_id?: string;
}

interface SoldPriceData {
  price: number;
  date: string;
  property_type: string;
  new_build: boolean;
  estate_type: string;
  transaction_type: string;
}

interface HPIData {
  date: string;
  hpi_value: number;
  hpi_change: number;
  region: string;
}

interface DealAnalysis {
  property_info: PropertyEnrichmentData | null;
  sold_prices: SoldPriceData[];
  hpi_data: HPIData[];
  deal_metrics: {
    last_sold_price: number | null;
    hpi_adjusted_value: number | null;
    current_value_estimate: number | null;
    price_per_sqm: number | null;
    price_per_bedroom: number | null;
    deal_score: number; // 0-100, higher = better deal
    deal_rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Overpriced';
    analysis: string[];
  };
  market_insights: {
    average_price_per_sqm: number | null;
    average_price_per_bedroom: number | null;
    price_trend: 'rising' | 'falling' | 'stable';
    market_volatility: 'low' | 'medium' | 'high';
  };
}

export async function GET(request: NextRequest) {
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

    console.log('🔍 Starting comprehensive property analysis:', { postcode, number });

    // 1. Get property enrichment data
    const propertyData = await getPropertyEnrichmentData(postcode, number);
    console.log('✅ Property enrichment data:', propertyData ? 'Found' : 'Not found');

    // 2. Get sold prices for the property
    const soldPrices = await getSoldPrices(postcode, number);
    console.log('✅ Sold prices found:', soldPrices.length);

    // 3. Get HPI data for the area
    const hpiData = await getHPIData(postcode);
    console.log('✅ HPI data found:', hpiData.length);

    // 4. Get market insights for comparison
    const marketInsights = await getMarketInsights(postcode, propertyData);

    // 5. Calculate deal analysis
    const dealAnalysis = calculateDealAnalysis(
      propertyData,
      soldPrices,
      hpiData,
      marketInsights
    );

    const response: DealAnalysis = {
      property_info: propertyData,
      sold_prices: soldPrices,
      hpi_data: hpiData,
      deal_metrics: dealAnalysis.deal_metrics,
      market_insights: dealAnalysis.market_insights
    };

    console.log('🎯 Deal analysis completed:', {
      deal_score: dealAnalysis.deal_metrics.deal_score,
      deal_rating: dealAnalysis.deal_metrics.deal_rating
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Property analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze property', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Get property enrichment data from the enrichment service
 */
async function getPropertyEnrichmentData(postcode: string, number: string): Promise<PropertyEnrichmentData | null> {
  try {
    const enrichmentServiceUrl = process.env.PROPERTY_ENRICHMENT_SERVICE_URL || 'http://localhost:3002';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(
      `${enrichmentServiceUrl}/api/property-info?postcode=${encodeURIComponent(postcode)}&number=${encodeURIComponent(number)}`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log('Property enrichment service returned:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.log('Property enrichment service error:', error);
    return null;
  }
}

/**
 * Get sold prices for the specific property
 */
async function getSoldPrices(postcode: string, number: string): Promise<SoldPriceData[]> {
  try {
    // Keep the original postcode format (with spaces) as that's how it's stored
    const normalizedPostcode = postcode.toUpperCase();
    const normalizedNumber = number.trim().toLowerCase();

    console.log(`🔍 Searching for sold prices: postcode="${normalizedPostcode}", number="${normalizedNumber}"`);

    const response = await esClient.search({
      index: 'properties',
      body: {
        query: {
          bool: {
            must: [
              { term: { postcode: normalizedPostcode } },
              { term: { paon: normalizedNumber } }
            ]
          }
        },
        sort: [{ dateOfTransfer: { order: 'desc' } }],
        size: 10
      }
    });

    console.log(`✅ Found ${response.hits.hits.length} sold prices for ${normalizedNumber} ${normalizedPostcode}`);

    return response.hits.hits.map(hit => {
      const source = hit._source as any;
      return {
        price: source.price,
        date: source.dateOfTransfer,
        property_type: source.propertyType,
        new_build: source.old_new === 'Y',
        estate_type: source.transactionCategory,
        transaction_type: source.transactionCategory
      };
    });
  } catch (error) {
    console.error('Error fetching sold prices:', error);
    return [];
  }
}

/**
 * Get HPI data for the area
 */
async function getHPIData(postcode: string): Promise<HPIData[]> {
  try {
    // Try to get region from properties index first
    const propertyResponse = await esClient.search({
      index: 'properties',
      body: {
        query: {
          bool: {
            must: [
              { prefix: { postcode: postcode.substring(0, 4) } }
            ]
          }
        },
        size: 1
      }
    });

    let region = 'England'; // Default
    if (propertyResponse.hits.hits.length > 0) {
      const property = propertyResponse.hits.hits[0]._source as any;
      region = property.county || 'England';
    }
    
    // Map English county names to Welsh HPI region names
    const countyToHpiRegionMap: { [key: string]: string } = {
      'TYNE AND WEAR': 'north-east',
      'NORTHUMBERLAND': 'north-east',
      'DURHAM': 'north-east',
      'CLEVELAND': 'north-east',
      'GREATER LONDON': 'london',
      'GREATER MANCHESTER': 'gorllewin-canolbarth-lloegr',
      'WEST MIDLANDS': 'gorllewin-canolbarth-lloegr',
      'WEST YORKSHIRE': 'yorkshire-and-the-humber',
      'KENT': 'de-orllewin-lloegr',
      'ESSEX': 'de-orllewin-lloegr',
      'HAMPSHIRE': 'de-orllewin-lloegr',
      'LANCASHIRE': 'gorllewin-canolbarth-lloegr',
      'SURREY': 'de-orllewin-lloegr',
      'MERSEYSIDE': 'gorllewin-canolbarth-lloegr',
      'NORTH YORKSHIRE': 'yorkshire-and-the-humber',
      'SOUTH YORKSHIRE': 'yorkshire-and-the-humber',
      'EAST YORKSHIRE': 'yorkshire-and-the-humber',
      'LINCOLNSHIRE': 'east-midlands',
      'NOTTINGHAMSHIRE': 'east-midlands',
      'DERBYSHIRE': 'east-midlands',
      'LEICESTERSHIRE': 'east-midlands',
      'NORTHAMPTONSHIRE': 'east-midlands',
      'CAMBRIDGESHIRE': 'east-of-england',
      'BEDFORDSHIRE': 'east-of-england'
    };

    // Get the correct HPI region name
    const hpiRegion = countyToHpiRegionMap[region] || region.toLowerCase().replace(/\s+/g, '-');
    
    console.log(`📊 Fetching HPI data for region: ${region} -> ${hpiRegion}`);
    
    const response = await esClient.search({
      index: 'house_price_index',
      body: {
        query: {
          bool: {
            should: [
              { term: { region: hpiRegion } },
              { term: { regionLabel: region } },
              { term: { region: 'england' } } // Fallback to England
            ]
          }
        },
        sort: [{ date: { order: 'desc' } }],
        size: 600 // Last 50 years of monthly data to cover historical sales
      }
    });

    console.log(`✅ Found ${response.hits.hits.length} HPI data points`);

    return response.hits.hits.map(hit => {
      const source = hit._source as any;
      return {
        date: source.date,
        hpi_value: source.hpiIndex,
        hpi_change: source.percentageChangeMonthly || 0,
        region: source.regionLabel
      };
    });
  } catch (error) {
    console.error('Error fetching HPI data:', error);
    return [];
  }
}

/**
 * Get market insights for comparison
 */
async function getMarketInsights(postcode: string, propertyData: PropertyEnrichmentData | null) {
  try {
    const normalizedPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    const postcodePrefix = normalizedPostcode.substring(0, 4);

    // Get recent sales in the same postcode area
    const response = await esClient.search({
      index: 'properties',
      body: {
        query: {
          bool: {
            must: [
              { prefix: { postcode: postcodePrefix } },
              { range: { dateOfTransfer: { gte: 'now-1y' } } }
            ],
            filter: propertyData?.property_type ? [
              { term: { propertyType: propertyData.property_type } }
            ] : []
          }
        },
        size: 100
      }
    });

    const sales = response.hits.hits.map(hit => hit._source as any);
    
    // Calculate averages
    const prices = sales.map(sale => sale.price);
    const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null;

    // Calculate price per sqm if we have floor area data
    let averagePricePerSqm = null;
    if (propertyData?.floor_area_m2) {
      const pricesPerSqm = sales
        .filter(sale => sale.floor_area_m2)
        .map(sale => sale.price / sale.floor_area_m2);
      
      if (pricesPerSqm.length > 0) {
        averagePricePerSqm = pricesPerSqm.reduce((a, b) => a + b, 0) / pricesPerSqm.length;
      }
    }

    // Calculate price per bedroom if we have bedroom data
    let averagePricePerBedroom = null;
    if (propertyData?.bedrooms) {
      const pricesPerBedroom = sales
        .filter(sale => sale.bedrooms)
        .map(sale => sale.price / sale.bedrooms);
      
      if (pricesPerBedroom.length > 0) {
        averagePricePerBedroom = pricesPerBedroom.reduce((a, b) => a + b, 0) / pricesPerBedroom.length;
      }
    }

    return {
      averagePrice,
      averagePricePerSqm,
      averagePricePerBedroom,
      salesCount: sales.length
    };
  } catch (error) {
    console.error('Error fetching market insights:', error);
    return {
      averagePrice: null,
      averagePricePerSqm: null,
      averagePricePerBedroom: null,
      salesCount: 0
    };
  }
}

/**
 * Calculate current value estimate using multiple methods
 */
function calculateCurrentValueEstimate(
  propertyData: PropertyEnrichmentData | null,
  soldPrices: SoldPriceData[],
  hpiData: HPIData[],
  marketInsights: any
): number | null {
  const estimates: number[] = [];
  const weights: number[] = [];

  // Method 1: HPI-adjusted value (if we have sold price and HPI data)
  if (soldPrices.length > 0 && hpiData.length > 0) {
    const lastSoldPrice = soldPrices[0].price;
    const lastSoldDate = soldPrices[0].date;
    
    const soldDate = new Date(lastSoldDate);
    const currentDate = new Date();
    
    // Find HPI data closest to sold date and current date
    const soldHPI = hpiData.find(hpi => new Date(hpi.date) >= soldDate) || hpiData[hpiData.length - 1];
    const currentHPI = hpiData[0];
    
    if (soldHPI && currentHPI) {
      const hpiMultiplier = currentHPI.hpi_value / soldHPI.hpi_value;
      const hpiAdjustedValue = lastSoldPrice * hpiMultiplier;
      estimates.push(hpiAdjustedValue);
      weights.push(0.4); // 40% weight for HPI method
    }
  }

  // Method 2: Market average price per sqm (if we have floor area)
  if (propertyData?.floor_area_m2 && marketInsights.averagePricePerSqm) {
    const sqmEstimate = propertyData.floor_area_m2 * marketInsights.averagePricePerSqm;
    estimates.push(sqmEstimate);
    weights.push(0.3); // 30% weight for sqm method
  }

  // Method 3: Market average price per bedroom (if we have bedrooms)
  if (propertyData?.bedrooms && marketInsights.averagePricePerBedroom) {
    const bedroomEstimate = propertyData.bedrooms * marketInsights.averagePricePerBedroom;
    estimates.push(bedroomEstimate);
    weights.push(0.2); // 20% weight for bedroom method
  }

  // Method 4: Market average price (fallback)
  if (marketInsights.averagePrice) {
    estimates.push(marketInsights.averagePrice);
    weights.push(0.1); // 10% weight for market average
  }

  // Calculate weighted average
  if (estimates.length === 0) {
    return null;
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const weightedSum = estimates.reduce((sum, estimate, index) => sum + (estimate * weights[index]), 0);
  
  return Math.round(weightedSum / totalWeight);
}

/**
 * Calculate comprehensive deal analysis
 */
function calculateDealAnalysis(
  propertyData: PropertyEnrichmentData | null,
  soldPrices: SoldPriceData[],
  hpiData: HPIData[],
  marketInsights: any
): { deal_metrics: any; market_insights: any } {
  const lastSoldPrice = soldPrices.length > 0 ? soldPrices[0].price : null;
  const lastSoldDate = soldPrices.length > 0 ? soldPrices[0].date : null;

  // Calculate HPI-adjusted value
  let hpiAdjustedValue = null;
  if (lastSoldPrice && lastSoldDate && hpiData.length > 0) {
    const soldDate = new Date(lastSoldDate);
    const currentDate = new Date();
    
    // Filter for the specific region (prefer regional data over England)
    const regionalHPIData = hpiData.filter(hpi => hpi.region !== 'England');
    const hpiDataToUse = regionalHPIData.length > 0 ? regionalHPIData : hpiData;
    
    // Find HPI data for the exact month of sale
    const soldYearMonth = lastSoldDate.substring(0, 7); // "2024-02"
    const soldHPI = hpiDataToUse.find(hpi => hpi.date === soldYearMonth) || 
                   hpiDataToUse.find(hpi => hpi.date >= soldYearMonth) || 
                   hpiDataToUse[hpiDataToUse.length - 1];
    
    // Find current HPI data (most recent)
    const currentHPI = hpiDataToUse[0];
    
    console.log(`🔍 HPI Calculation Debug:`);
    console.log(`   Sold date: ${lastSoldDate} (${soldYearMonth})`);
    console.log(`   Sold HPI: ${soldHPI?.hpi_value} (${soldHPI?.date})`);
    console.log(`   Current HPI: ${currentHPI?.hpi_value} (${currentHPI?.date})`);
    console.log(`   Region: ${currentHPI?.region}`);
    
    if (soldHPI && currentHPI && soldHPI.date !== currentHPI.date) {
      const hpiMultiplier = currentHPI.hpi_value / soldHPI.hpi_value;
      hpiAdjustedValue = lastSoldPrice * hpiMultiplier;
      console.log(`   HPI Multiplier: ${hpiMultiplier.toFixed(4)}`);
      console.log(`   Original Price: £${lastSoldPrice.toLocaleString()}`);
      console.log(`   HPI Adjusted Value: £${hpiAdjustedValue.toLocaleString()}`);
      console.log(`   Growth: ${((hpiMultiplier - 1) * 100).toFixed(2)}%`);
    } else {
      console.log(`   ⚠️  No HPI growth detected (same date or missing data)`);
      hpiAdjustedValue = lastSoldPrice;
    }
  }

  // Calculate current value estimate - prioritize HPI-adjusted value
  let currentValueEstimate = hpiAdjustedValue; // Use HPI-adjusted value as primary estimate
  
  // If no HPI data, fall back to other methods
  if (!currentValueEstimate) {
    currentValueEstimate = calculateCurrentValueEstimate(propertyData, soldPrices, hpiData, marketInsights);
  }

  // Calculate price per sqm and per bedroom
  const pricePerSqm = propertyData?.floor_area_m2 && lastSoldPrice 
    ? lastSoldPrice / propertyData.floor_area_m2 
    : null;
  
  const pricePerBedroom = propertyData?.bedrooms && lastSoldPrice 
    ? lastSoldPrice / propertyData.bedrooms 
    : null;

  // Calculate deal score (0-100)
  let dealScore = 50; // Start with neutral score
  const analysis: string[] = [];

  if (hpiAdjustedValue && lastSoldPrice) {
    const priceDifference = ((hpiAdjustedValue - lastSoldPrice) / hpiAdjustedValue) * 100;
    
    if (priceDifference > 20) {
      dealScore += 30;
      analysis.push(`Property sold ${priceDifference.toFixed(1)}% below HPI-adjusted value - excellent deal!`);
    } else if (priceDifference > 10) {
      dealScore += 20;
      analysis.push(`Property sold ${priceDifference.toFixed(1)}% below HPI-adjusted value - good deal`);
    } else if (priceDifference > 0) {
      dealScore += 10;
      analysis.push(`Property sold ${priceDifference.toFixed(1)}% below HPI-adjusted value`);
    } else if (priceDifference < -20) {
      dealScore -= 30;
      analysis.push(`Property sold ${Math.abs(priceDifference).toFixed(1)}% above HPI-adjusted value - overpaid`);
    } else if (priceDifference < -10) {
      dealScore -= 20;
      analysis.push(`Property sold ${Math.abs(priceDifference).toFixed(1)}% above HPI-adjusted value`);
    }
  }

  // Compare with market averages
  if (pricePerSqm && marketInsights.averagePricePerSqm) {
    const sqmDifference = ((marketInsights.averagePricePerSqm - pricePerSqm) / marketInsights.averagePricePerSqm) * 100;
    
    if (sqmDifference > 15) {
      dealScore += 20;
      analysis.push(`Price per sqm is ${sqmDifference.toFixed(1)}% below market average`);
    } else if (sqmDifference < -15) {
      dealScore -= 20;
      analysis.push(`Price per sqm is ${Math.abs(sqmDifference).toFixed(1)}% above market average`);
    }
  }

  if (pricePerBedroom && marketInsights.averagePricePerBedroom) {
    const bedroomDifference = ((marketInsights.averagePricePerBedroom - pricePerBedroom) / marketInsights.averagePricePerBedroom) * 100;
    
    if (bedroomDifference > 15) {
      dealScore += 15;
      analysis.push(`Price per bedroom is ${bedroomDifference.toFixed(1)}% below market average`);
    } else if (bedroomDifference < -15) {
      dealScore -= 15;
      analysis.push(`Price per bedroom is ${Math.abs(bedroomDifference).toFixed(1)}% above market average`);
    }
  }

  // Property type analysis
  if (propertyData?.property_type) {
    analysis.push(`Property type: ${propertyData.property_type}`);
  }

  // EPC rating analysis
  if (propertyData?.epc_rating) {
    const epcScore = propertyData.epc_rating.charCodeAt(0) - 65; // A=0, B=1, etc.
    if (epcScore <= 2) { // A or B rating
      dealScore += 10;
      analysis.push(`Excellent EPC rating (${propertyData.epc_rating}) - energy efficient`);
    } else if (epcScore >= 4) { // E, F, or G rating
      dealScore -= 10;
      analysis.push(`Poor EPC rating (${propertyData.epc_rating}) - may need energy improvements`);
    }
  }

  // Clamp score to 0-100
  dealScore = Math.max(0, Math.min(100, dealScore));

  // Determine deal rating
  let dealRating: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Overpriced';
  if (dealScore >= 80) dealRating = 'Excellent';
  else if (dealScore >= 60) dealRating = 'Good';
  else if (dealScore >= 40) dealRating = 'Fair';
  else if (dealScore >= 20) dealRating = 'Poor';
  else dealRating = 'Overpriced';

  // Market insights
  const priceTrend = hpiData.length >= 2 
    ? hpiData[0].hpi_change > 0.5 ? 'rising' 
    : hpiData[0].hpi_change < -0.5 ? 'falling' 
    : 'stable'
    : 'stable';

  const marketVolatility = hpiData.length >= 6
    ? Math.abs(hpiData.slice(0, 6).reduce((sum, hpi) => sum + hpi.hpi_change, 0)) > 5
      ? 'high'
      : Math.abs(hpiData.slice(0, 6).reduce((sum, hpi) => sum + hpi.hpi_change, 0)) > 2
        ? 'medium'
        : 'low'
    : 'medium';

  return {
    deal_metrics: {
      last_sold_price: lastSoldPrice,
      hpi_adjusted_value: hpiAdjustedValue,
      current_value_estimate: currentValueEstimate,
      price_per_sqm: pricePerSqm,
      price_per_bedroom: pricePerBedroom,
      deal_score: Math.round(dealScore),
      deal_rating: dealRating,
      analysis
    },
    market_insights: {
      average_price_per_sqm: marketInsights.averagePricePerSqm,
      average_price_per_bedroom: marketInsights.averagePricePerBedroom,
      price_trend: priceTrend,
      market_volatility: marketVolatility
    }
  };
} 