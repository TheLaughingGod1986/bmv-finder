import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';

// Realistic market rates for different regions
const REGIONAL_MARKET_RATES = {
  'E12000001': { // North East
    rentalPerBedroom: 400,
    capRate: 0.065,
    constructionCostPerSqm: 1200,
    landValuePerSqm: 200,
    valuePerBedroom: 45000,
    valuePerSqm: 1800
  },
  'E12000002': { // North West
    rentalPerBedroom: 450,
    capRate: 0.07,
    constructionCostPerSqm: 1300,
    landValuePerSqm: 250,
    valuePerBedroom: 50000,
    valuePerSqm: 2000
  },
  'E12000003': { // Yorkshire and The Humber
    rentalPerBedroom: 420,
    capRate: 0.068,
    constructionCostPerSqm: 1250,
    landValuePerSqm: 220,
    valuePerBedroom: 48000,
    valuePerSqm: 1900
  },
  'E12000004': { // East Midlands
    rentalPerBedroom: 480,
    capRate: 0.072,
    constructionCostPerSqm: 1350,
    landValuePerSqm: 280,
    valuePerBedroom: 52000,
    valuePerSqm: 2100
  },
  'E12000005': { // West Midlands
    rentalPerBedroom: 460,
    capRate: 0.07,
    constructionCostPerSqm: 1300,
    landValuePerSqm: 260,
    valuePerBedroom: 50000,
    valuePerSqm: 2000
  },
  'E12000006': { // East of England
    rentalPerBedroom: 550,
    capRate: 0.075,
    constructionCostPerSqm: 1400,
    landValuePerSqm: 350,
    valuePerBedroom: 60000,
    valuePerSqm: 2400
  },
  'E12000007': { // London
    rentalPerBedroom: 1200,
    capRate: 0.045,
    constructionCostPerSqm: 2000,
    landValuePerSqm: 800,
    valuePerBedroom: 120000,
    valuePerSqm: 5000
  },
  'E12000008': { // South East
    rentalPerBedroom: 700,
    capRate: 0.06,
    constructionCostPerSqm: 1600,
    landValuePerSqm: 450,
    valuePerBedroom: 75000,
    valuePerSqm: 3000
  },
  'E12000009': { // South West
    rentalPerBedroom: 520,
    capRate: 0.065,
    constructionCostPerSqm: 1400,
    landValuePerSqm: 300,
    valuePerBedroom: 55000,
    valuePerSqm: 2200
  }
};

interface RentEstimationRequest {
  postcode: string;
  propertyType: string;
  bedrooms: number;
  price?: number;
  epcRating?: string;
  floorArea?: number;
}

interface RentEstimationResponse {
  monthlyRent: number;
  annualRent: number;
  grossYield: number;
  confidence: number;
  source: string;
  dataQuality: string;
  breakdown: {
    baseRent: number;
    adjustments: {
      propertyType: number;
      epcRating: number;
      location: number;
      marketConditions: number;
    };
    totalAdjustment: number;
  };
  marketComparison: {
    regionalAverage: number;
    propertyTypeAverage: number;
    bedroomAverage: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: RentEstimationRequest = await request.json();
    
    if (!body.postcode || !body.propertyType || !body.bedrooms) {
      return NextResponse.json(
        { success: false, error: 'Postcode, property type, and bedrooms are required' },
        { status: 400 }
      );
    }

    const estimation = await calculateRentEstimation(body);
    
    return NextResponse.json({
      success: true,
      estimation
    });

  } catch (error) {
    console.error('Rent estimation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate rent estimation' },
      { status: 500 }
    );
  }
}

async function calculateRentEstimation(request: RentEstimationRequest): Promise<RentEstimationResponse> {
  const { postcode, propertyType, bedrooms, price, epcRating, floorArea } = request;
  
  // Get region from postcode
  const region = getRegionFromPostcode(postcode);
  const marketRates = REGIONAL_MARKET_RATES[region] || REGIONAL_MARKET_RATES['E12000001']; // Default to North East
  
  // Try to get rental data from Elasticsearch first
  const elasticsearchRent = await getElasticsearchRent(postcode, propertyType, bedrooms);
  
  if (elasticsearchRent) {
    return {
      monthlyRent: elasticsearchRent.monthlyRent,
      annualRent: elasticsearchRent.monthlyRent * 12,
      grossYield: price ? ((elasticsearchRent.monthlyRent * 12) / price * 100) : 0,
      confidence: elasticsearchRent.confidence,
      source: elasticsearchRent.source,
      dataQuality: elasticsearchRent.dataQuality,
      breakdown: {
        baseRent: elasticsearchRent.monthlyRent,
        adjustments: {
          propertyType: 0,
          epcRating: 0,
          location: 0,
          marketConditions: 0
        },
        totalAdjustment: 0
      },
      marketComparison: {
        regionalAverage: marketRates.rentalPerBedroom * bedrooms,
        propertyTypeAverage: marketRates.rentalPerBedroom * bedrooms,
        bedroomAverage: marketRates.rentalPerBedroom * bedrooms
      }
    };
  }
  
  // Fallback to market-based calculation
  const baseRent = bedrooms * marketRates.rentalPerBedroom;
  
  // Calculate adjustments
  const adjustments = calculateRentAdjustments(propertyType, epcRating, region, marketRates);
  const totalAdjustment = Object.values(adjustments).reduce((sum, adj) => sum + adj, 0);
  
  const monthlyRent = Math.round(baseRent * (1 + totalAdjustment));
  
  return {
    monthlyRent,
    annualRent: monthlyRent * 12,
    grossYield: price ? ((monthlyRent * 12) / price * 100) : 0,
    confidence: 0.6, // Medium confidence for market-based estimation
    source: `${region} market rates`,
    dataQuality: 'Estimated using regional market data',
    breakdown: {
      baseRent,
      adjustments,
      totalAdjustment
    },
    marketComparison: {
      regionalAverage: marketRates.rentalPerBedroom * bedrooms,
      propertyTypeAverage: marketRates.rentalPerBedroom * bedrooms,
      bedroomAverage: marketRates.rentalPerBedroom * bedrooms
    }
  };
}

async function getElasticsearchRent(postcode: string, propertyType: string, bedrooms: number) {
  try {
    const postcodeArea = postcode.split(' ')[0].substring(0, 4).toUpperCase();
    const region = getRegionFromPostcode(postcode);
    
    const rentalQuery = {
      bool: {
        must: [
          { term: { postcode_area: postcodeArea } },
          { term: { property_type: propertyType } },
          { term: { bedrooms: bedrooms } }
        ],
        should: [
          { term: { region_code: region } }
        ],
        minimum_should_match: 0
      }
    };

    console.log('Attempting to fetch rental data from Elasticsearch...');
    
    const response = await esClient.search({
      index: 'rental-data',
      body: {
        query: rentalQuery,
        size: 1,
        sort: [
          { confidence_score: { order: 'desc' } }
        ]
      }
    });

    const totalHits = typeof response.hits.total === 'number' ? response.hits.total : response.hits.total.value;
    if (totalHits > 0) {
      const rentalData = response.hits.hits[0]._source as any;
      
      console.log('Found Elasticsearch rental data:', {
        region: rentalData.region_name,
        propertyType: rentalData.property_type_label,
        bedrooms: rentalData.bedrooms,
        monthlyRent: rentalData.monthly_rent,
        confidence: rentalData.confidence_score
      });

      return {
        monthlyRent: rentalData.monthly_rent,
        confidence: rentalData.confidence_score,
        source: rentalData.data_source,
        dataQuality: rentalData.data_quality
      };
    }
    
    console.log('No Elasticsearch rental data found, using fallback calculation');
    return null;
    
  } catch (error) {
    console.warn('Elasticsearch connection failed, using fallback calculation:', error.message);
    return null;
  }
}

function calculateRentAdjustments(propertyType: string, epcRating?: string, region?: string, marketRates?: any) {
  const adjustments = {
    propertyType: 0,
    epcRating: 0,
    location: 0,
    marketConditions: 0
  };
  
  // Property type adjustments
  switch (propertyType.toLowerCase()) {
    case 'detached':
      adjustments.propertyType = 0.1; // 10% premium
      break;
    case 'semi-detached':
      adjustments.propertyType = 0.05; // 5% premium
      break;
    case 'terraced':
      adjustments.propertyType = 0; // No adjustment
      break;
    case 'flat':
    case 'apartment':
      adjustments.propertyType = -0.05; // 5% discount
      break;
    default:
      adjustments.propertyType = 0;
  }
  
  // EPC rating adjustments
  if (epcRating) {
    switch (epcRating.toUpperCase()) {
      case 'A': adjustments.epcRating = 0.1; break;
      case 'B': adjustments.epcRating = 0.05; break;
      case 'C': adjustments.epcRating = 0; break;
      case 'D': adjustments.epcRating = -0.05; break;
      case 'E': adjustments.epcRating = -0.1; break;
      case 'F': adjustments.epcRating = -0.15; break;
      case 'G': adjustments.epcRating = -0.2; break;
      default: adjustments.epcRating = 0;
    }
  }
  
  // Location adjustments (based on region)
  if (region) {
    switch (region) {
      case 'E12000007': // London
        adjustments.location = 0.2;
        break;
      case 'E12000008': // South East
        adjustments.location = 0.1;
        break;
      case 'E12000006': // East of England
        adjustments.location = 0.05;
        break;
      default:
        adjustments.location = 0;
    }
  }
  
  // Market conditions (seasonal adjustment)
  const month = new Date().getMonth();
  if (month >= 5 && month <= 8) { // Summer months
    adjustments.marketConditions = 0.02; // 2% premium
  } else if (month >= 11 || month <= 1) { // Winter months
    adjustments.marketConditions = -0.02; // 2% discount
  }
  
  return adjustments;
}

function getRegionFromPostcode(postcode: string): string {
  // Extract region code from postcode
  const postcodeArea = postcode.split(' ')[0].substring(0, 2).toUpperCase();
  
  // Map postcode areas to regions
  const regionMap: { [key: string]: string } = {
    'NE': 'E12000001', // North East
    'SR': 'E12000001', // North East
    'DL': 'E12000001', // North East
    'CA': 'E12000002', // North West
    'LA': 'E12000002', // North West
    'PR': 'E12000002', // North West
    'BB': 'E12000002', // North West
    'OL': 'E12000002', // North West
    'BL': 'E12000002', // North West
    'SK': 'E12000003', // Yorkshire and The Humber
    'HD': 'E12000003', // Yorkshire and The Humber
    'HG': 'E12000003', // Yorkshire and The Humber
    'LS': 'E12000003', // Yorkshire and The Humber
    'S': 'E12000003',  // Yorkshire and The Humber
    'WF': 'E12000003', // Yorkshire and The Humber
    'YO': 'E12000003', // Yorkshire and The Humber
    'DE': 'E12000004', // East Midlands
    'LE': 'E12000004', // East Midlands
    'NG': 'E12000004', // East Midlands
    'B': 'E12000005',  // West Midlands
    'CV': 'E12000005', // West Midlands
    'DY': 'E12000005', // West Midlands
    'HR': 'E12000005', // West Midlands
    'ST': 'E12000005', // West Midlands
    'WS': 'E12000005', // West Midlands
    'WR': 'E12000005', // West Midlands
    'CB': 'E12000006', // East of England
    'CM': 'E12000006', // East of England
    'CO': 'E12000006', // East of England
    'IP': 'E12000006', // East of England
    'LU': 'E12000006', // East of England
    'MK': 'E12000006', // East of England
    'NN': 'E12000006', // East of England
    'PE': 'E12000006', // East of England
    'SG': 'E12000006', // East of England
    'SS': 'E12000006', // East of England
    'E': 'E12000007',  // London
    'EC': 'E12000007', // London
    'N': 'E12000007',  // London
    'NW': 'E12000007', // London
    'SE': 'E12000007', // London
    'SW': 'E12000007', // London
    'W': 'E12000007',  // London
    'WC': 'E12000007', // London
    'AL': 'E12000008', // South East
    'BA': 'E12000009', // South West
    'BH': 'E12000009', // South West
    'BS': 'E12000009', // South West
    'DT': 'E12000009', // South West
    'EX': 'E12000009', // South West
    'GL': 'E12000009', // South West
    'PL': 'E12000009', // South West
    'SN': 'E12000009', // South West
    'SP': 'E12000009', // South West
    'TA': 'E12000009', // South West
    'TQ': 'E12000009', // South West
    'TR': 'E12000009'  // South West
  };
  
  return regionMap[postcodeArea] || 'E12000001'; // Default to North East
} 