import { NextRequest, NextResponse } from 'next/server';

interface ComprehensiveValuationRequest {
  postcode: string;
  number: string;
  propertyType?: string;
}

interface ComprehensiveValuationResponse {
  success: boolean;
  data?: {
    summary: {
      finalValue: number;
      confidence: number;
      valueRange: {
        min: number;
        max: number;
      };
      lastUpdated: string;
    };
    marketAnalysis: {
      averagePrice: number;
      pricePerSqm: number;
      marketTrend: 'rising' | 'falling' | 'stable';
      growthRate: number;
      comparables: Array<{
        address: string;
        price: number;
        date: string;
        distance: number;
      }>;
    };
    propertyCharacteristics: {
      bedrooms: number;
      bathrooms: number;
      floorArea: number;
      propertyType: string;
      buildYear: number;
      epcRating: string;
    };
    investmentAnalysis: {
      rentalYield: number;
      monthlyRent: number;
      annualRent: number;
      roi: number;
      bmvScore: number;
    };
    futureProjections: {
      oneYear: number;
      threeYear: number;
      fiveYear: number;
      tenYear: number;
    };
    factors: {
      positive: string[];
      negative: string[];
      neutral: string[];
    };
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<ComprehensiveValuationResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');
    const number = searchParams.get('number');
    const propertyType = searchParams.get('propertyType') || 'House';

    if (!postcode || !number) {
      return NextResponse.json({
        success: false,
        error: 'Postcode and number are required'
      }, { status: 400 });
    }

    console.log(`🔍 Comprehensive Valuation Request: ${number} ${postcode}`);

    // Step 1: Fetch property characteristics and market data
    const [propertyResponse, marketResponse, salesResponse, hpiResponse] = await Promise.allSettled([
      fetch(`/api/enhanced-property-search?postcode=${encodeURIComponent(postcode)}&includeRental=true`),
      fetch(`/api/market-analysis/enhanced?postcode=${encodeURIComponent(postcode)}`),
      fetch(`/api/recent-sales?postcode=${encodeURIComponent(postcode)}&limit=20`),
      fetch(`/api/hpi/postcode?postcode=${encodeURIComponent(postcode)}`)
    ]);

    // Step 2: Extract and process data
    let propertyData: any = null;
    let marketData: any = null;
    let salesData: any = null;
    let hpiData: any = null;

    if (propertyResponse.status === 'fulfilled' && propertyResponse.value.ok) {
      propertyData = await propertyResponse.value.json();
    }
    if (marketResponse.status === 'fulfilled' && marketResponse.value.ok) {
      marketData = await marketResponse.value.json();
    }
    if (salesResponse.status === 'fulfilled' && salesResponse.value.ok) {
      salesData = await salesResponse.value.json();
    }
    if (hpiResponse.status === 'fulfilled' && hpiResponse.value.ok) {
      hpiData = await hpiResponse.value.json();
    }

    // Step 3: Calculate comprehensive valuation using multiple methods
    const valuation = calculateComprehensiveValuation({
      postcode,
      number,
      propertyType,
      propertyData,
      marketData,
      salesData,
      hpiData
    });

    console.log(`✅ Comprehensive Valuation Complete: ${number} ${postcode} = £${valuation.summary.finalValue.toLocaleString()}`);

    return NextResponse.json({
      success: true,
      data: valuation
    });

  } catch (error) {
    console.error('❌ Comprehensive Valuation Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

function calculateComprehensiveValuation(params: {
  postcode: string;
  number: string;
  propertyType: string;
  propertyData: any;
  marketData: any;
  salesData: any;
  hpiData: any;
}) {
  const { postcode, number, propertyType, propertyData, marketData, salesData, hpiData } = params;

  // Method 1: Comparable Sales Analysis
  const comparableValue = calculateComparableValue(salesData, propertyType);
  
  // Method 2: Market Trend Analysis
  const marketTrendValue = calculateMarketTrendValue(marketData, hpiData);
  
  // Method 3: Property Characteristics Analysis
  const characteristicsValue = calculateCharacteristicsValue(propertyData, propertyType);
  
  // Method 4: HPI-Adjusted Value
  const hpiAdjustedValue = calculateHPIAdjustedValue(hpiData, propertyType);

  // Combine all methods with intelligent weighting
  const weights = {
    comparables: 0.35,    // Most reliable - actual sales data
    marketTrend: 0.25,    // Current market conditions
    characteristics: 0.25, // Property-specific features
    hpi: 0.15             // Historical trend adjustment
  };

  const finalValue = Math.round(
    (comparableValue * weights.comparables) +
    (marketTrendValue * weights.marketTrend) +
    (characteristicsValue * weights.characteristics) +
    (hpiAdjustedValue * weights.hpi)
  );

  // Calculate confidence based on data quality
  const confidence = calculateConfidence(propertyData, salesData, marketData, hpiData);
  
  // Calculate value range based on confidence
  const valueRange = {
    min: Math.round(finalValue * (1 - (1 - confidence) * 0.15)),
    max: Math.round(finalValue * (1 + (1 - confidence) * 0.15))
  };

  // Extract property characteristics
  const propertyCharacteristics = extractPropertyCharacteristics(propertyData, propertyType);
  
  // Calculate investment metrics
  const investmentAnalysis = calculateInvestmentAnalysis(propertyData, finalValue);
  
  // Generate future projections
  const futureProjections = calculateFutureProjections(finalValue, hpiData, propertyType);
  
  // Analyze factors affecting value
  const factors = analyzeFactors(propertyData, salesData, marketData, hpiData);

  return {
    summary: {
      finalValue,
      confidence,
      valueRange,
      lastUpdated: new Date().toISOString()
    },
    marketAnalysis: {
      averagePrice: finalValue,
      pricePerSqm: propertyCharacteristics.floorArea > 0 ? finalValue / propertyCharacteristics.floorArea : 0,
      marketTrend: determineMarketTrend(hpiData),
      growthRate: calculateGrowthRate(hpiData),
      comparables: extractComparables(salesData)
    },
    propertyCharacteristics,
    investmentAnalysis,
    futureProjections,
    factors
  };
}

function calculateComparableValue(salesData: any, propertyType: string): number {
  if (!salesData?.data?.properties) return 250000; // Default fallback
  
  const relevantSales = salesData.data.properties
    .filter((sale: any) => sale.propertyType === propertyType)
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (relevantSales.length === 0) return 250000;
  
  const totalValue = relevantSales.reduce((sum: number, sale: any) => sum + sale.price, 0);
  return Math.round(totalValue / relevantSales.length);
}

function calculateMarketTrendValue(marketData: any, hpiData: any): number {
  if (!marketData?.data?.[0]?.averagePrice) return 250000;
  
  const baseValue = marketData.data[0].averagePrice;
  const hpiAdjustment = hpiData?.data?.growthRate || 0;
  
  return Math.round(baseValue * (1 + (hpiAdjustment / 100)));
}

function calculateCharacteristicsValue(propertyData: any, propertyType: string): number {
  if (!propertyData?.data?.properties?.[0]) return 250000;
  
  const property = propertyData.data.properties[0];
  let baseValue = 250000;
  
  // Adjust for bedrooms
  if (property.bedrooms) {
    baseValue += (property.bedrooms - 2) * 50000;
  }
  
  // Adjust for property type
  if (propertyType === 'Flat') baseValue *= 0.8;
  if (propertyType === 'Maisonette') baseValue *= 0.9;
  if (propertyType === 'Bungalow') baseValue *= 1.1;
  if (propertyType === 'Detached') baseValue *= 1.3;
  
  return Math.round(baseValue);
}

function calculateHPIAdjustedValue(hpiData: any, propertyType: string): number {
  if (!hpiData?.data?.currentValue) return 250000;
  
  const baseValue = hpiData.data.currentValue;
  const annualGrowth = hpiData.data.annualGrowth || 0;
  
  // Apply 2-year growth (typical holding period)
  return Math.round(baseValue * Math.pow(1 + (annualGrowth / 100), 2));
}

function calculateConfidence(propertyData: any, salesData: any, marketData: any, hpiData: any): number {
  let confidence = 0.5; // Base confidence
  
  // Data availability boosts confidence
  if (propertyData?.data) confidence += 0.1;
  if (salesData?.data?.properties?.length > 0) confidence += 0.2;
  if (marketData?.data?.length > 0) confidence += 0.1;
  if (hpiData?.data) confidence += 0.1;
  
  // Recent data boosts confidence
  if (salesData?.data?.properties?.length > 3) confidence += 0.1;
  
  return Math.min(confidence, 0.95);
}

function extractPropertyCharacteristics(propertyData: any, propertyType: string) {
  if (!propertyData?.data?.properties?.[0]) {
    return {
      bedrooms: 3,
      bathrooms: 1,
      floorArea: 100,
      propertyType,
      buildYear: 1990,
      epcRating: 'D'
    };
  }
  
  const property = propertyData.data.properties[0];
  return {
    bedrooms: property.bedrooms || 3,
    bathrooms: property.bathrooms || 1,
    floorArea: property.floorArea || 100,
    propertyType: property.propertyType || propertyType,
    buildYear: property.buildYear || 1990,
    epcRating: property.epcRating || 'D'
  };
}

function calculateInvestmentAnalysis(propertyData: any, currentValue: number) {
  if (!propertyData?.data?.properties?.[0]) {
    return {
      rentalYield: 5.0,
      monthlyRent: Math.round(currentValue * 0.05 / 12),
      annualRent: Math.round(currentValue * 0.05),
      roi: 8.0,
      bmvScore: 75
    };
  }
  
  const property = propertyData.data.properties[0];
  const monthlyRent = property.rentalEstimate?.monthly || property.rentalEstimate || Math.round(currentValue * 0.05 / 12);
  const annualRent = monthlyRent * 12;
  const rentalYield = (annualRent / currentValue) * 100;
  
  return {
    rentalYield: Math.round(rentalYield * 10) / 10,
    monthlyRent,
    annualRent,
    roi: Math.round((rentalYield + 3) * 10) / 10, // ROI = Yield + Capital Growth
    bmvScore: property.bmvScore || 75
  };
}

function calculateFutureProjections(currentValue: number, hpiData: any, propertyType: string): any {
  const annualGrowth = hpiData?.data?.annualGrowth || 3.0;
  const propertyTypeMultiplier = propertyType === 'Flat' ? 0.9 : propertyType === 'Detached' ? 1.1 : 1.0;
  
  return {
    oneYear: Math.round(currentValue * Math.pow(1 + (annualGrowth / 100), 1) * propertyTypeMultiplier),
    threeYear: Math.round(currentValue * Math.pow(1 + (annualGrowth / 100), 3) * propertyTypeMultiplier),
    fiveYear: Math.round(currentValue * Math.pow(1 + (annualGrowth / 100), 5) * propertyTypeMultiplier),
    tenYear: Math.round(currentValue * Math.pow(1 + (annualGrowth / 100), 10) * propertyTypeMultiplier)
  };
}

function analyzeFactors(propertyData: any, salesData: any, marketData: any, hpiData: any) {
  const factors = {
    positive: [] as string[],
    negative: [] as string[],
    neutral: [] as string[]
  };
  
  // Market conditions
  if (hpiData?.data?.annualGrowth > 5) factors.positive.push('Strong market growth');
  if (hpiData?.data?.annualGrowth < 0) factors.negative.push('Declining market');
  
  // Property characteristics
  if (propertyData?.data?.properties?.[0]?.bedrooms >= 4) factors.positive.push('Large family home');
  if (propertyData?.data?.properties?.[0]?.epcRating === 'A' || propertyData?.data?.properties?.[0]?.epcRating === 'B') {
    factors.positive.push('Energy efficient');
  }
  
  // Comparable sales
  if (salesData?.data?.properties?.length >= 5) factors.positive.push('Good comparable data');
  if (salesData?.data?.properties?.length < 3) factors.negative.push('Limited comparable data');
  
  return factors;
}

function determineMarketTrend(hpiData: any): 'rising' | 'falling' | 'stable' {
  if (!hpiData?.data?.annualGrowth) return 'stable';
  
  const growth = hpiData.data.annualGrowth;
  if (growth > 2) return 'rising';
  if (growth < -2) return 'falling';
  return 'stable';
}

function calculateGrowthRate(hpiData: any): number {
  return hpiData?.data?.annualGrowth || 3.0;
}

function extractComparables(salesData: any): Array<{address: string; price: number; date: string; distance: number}> {
  if (!salesData?.data?.properties) return [];
  
  return salesData.data.properties.slice(0, 5).map((sale: any) => ({
    address: sale.address || 'Unknown',
    price: sale.price || 0,
    date: sale.date || 'Unknown',
    distance: sale.distance || 0
  }));
}

