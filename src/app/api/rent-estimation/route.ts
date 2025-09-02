import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';
import { 
  RentalPricesDocument,
  ElasticsearchResponse,
  extractSource,
  mapElasticsearchHits
} from '@/types/elasticsearch';
import { CONFIG } from '@/lib/config';

// Regional market rates (per month for 2-bed property)
const REGIONAL_MARKET_RATES = {
  [CONFIG.REGIONS.NORTH_EAST]: { // North East
    '1-bed': 450,
    '2-bed': 550,
    '3-bed': 650,
    '4-bed': 750,
    '5-bed': 850
  },
  [CONFIG.REGIONS.NORTH_WEST]: { // North West
    '1-bed': 500,
    '2-bed': 600,
    '3-bed': 700,
    '4-bed': 800,
    '5-bed': 900
  },
  [CONFIG.REGIONS.YORKSHIRE_HUMBER]: { // Yorkshire and The Humber
    '1-bed': 475,
    '2-bed': 575,
    '3-bed': 675,
    '4-bed': 775,
    '5-bed': 875
  },
  [CONFIG.REGIONS.EAST_MIDLANDS]: { // East Midlands
    '1-bed': 500,
    '2-bed': 600,
    '3-bed': 700,
    '4-bed': 800,
    '5-bed': 900
  },
  [CONFIG.REGIONS.WEST_MIDLANDS]: { // West Midlands
    '1-bed': 525,
    '2-bed': 625,
    '3-bed': 725,
    '4-bed': 825,
    '5-bed': 925
  },
  [CONFIG.REGIONS.EAST_ENGLAND]: { // East of England
    '1-bed': 550,
    '2-bed': 650,
    '3-bed': 750,
    '4-bed': 850,
    '5-bed': 950
  },
  [CONFIG.REGIONS.LONDON]: { // London
    '1-bed': 1200,
    '2-bed': 1500,
    '3-bed': 1800,
    '4-bed': 2200,
    '5-bed': 2600
  },
  [CONFIG.REGIONS.SOUTH_EAST]: { // South East
    '1-bed': 700,
    '2-bed': 800,
    '3-bed': 900,
    '4-bed': 1000,
    '5-bed': 1100
  },
  [CONFIG.REGIONS.SOUTH_WEST]: { // South West
    '1-bed': 600,
    '2-bed': 700,
    '3-bed': 800,
    '4-bed': 900,
    '5-bed': 1000
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
  const marketRates = REGIONAL_MARKET_RATES[region] || REGIONAL_MARKET_RATES[CONFIG.REGIONS.NORTH_EAST]; // Default to North East
  
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
        regionalAverage: marketRates['2-bed'] * bedrooms,
        propertyTypeAverage: marketRates['2-bed'] * bedrooms,
        bedroomAverage: marketRates['2-bed'] * bedrooms
      }
    };
  }
  
  // Fallback to market-based calculation
  const baseRent = bedrooms * marketRates['2-bed'];
  
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
      regionalAverage: marketRates['2-bed'] * bedrooms,
      propertyTypeAverage: marketRates['2-bed'] * bedrooms,
      bedroomAverage: marketRates['2-bed'] * bedrooms
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
              const rentalData = response.hits.hits[0]._source as RentalPricesDocument;
      
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
    
    return null;
    
  } catch (error) {
    console.warn('Elasticsearch connection failed, using fallback calculation:', error instanceof Error ? error.message : 'Unknown error');
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
      case CONFIG.REGIONS.LONDON: // London
        adjustments.location = 0.2;
        break;
      case CONFIG.REGIONS.SOUTH_EAST: // South East
        adjustments.location = 0.1;
        break;
      case CONFIG.REGIONS.EAST_ENGLAND: // East of England
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
    'NE': CONFIG.REGIONS.NORTH_EAST, // North East
    'SR': CONFIG.REGIONS.NORTH_EAST, // North East
    'DL': CONFIG.REGIONS.NORTH_EAST, // North East
    'CA': CONFIG.REGIONS.NORTH_WEST, // North West
    'LA': CONFIG.REGIONS.NORTH_WEST, // North West
    'PR': CONFIG.REGIONS.NORTH_WEST, // North West
    'BB': CONFIG.REGIONS.NORTH_WEST, // North West
    'OL': CONFIG.REGIONS.NORTH_WEST, // North West
    'BL': CONFIG.REGIONS.NORTH_WEST, // North West
    'SK': CONFIG.REGIONS.YORKSHIRE_HUMBER, // Yorkshire and The Humber
    'HD': CONFIG.REGIONS.YORKSHIRE_HUMBER, // Yorkshire and The Humber
    'HG': CONFIG.REGIONS.YORKSHIRE_HUMBER, // Yorkshire and The Humber
    'LS': CONFIG.REGIONS.YORKSHIRE_HUMBER, // Yorkshire and The Humber
    'S': CONFIG.REGIONS.YORKSHIRE_HUMBER,  // Yorkshire and The Humber
    'WF': CONFIG.REGIONS.YORKSHIRE_HUMBER, // Yorkshire and The Humber
    'YO': CONFIG.REGIONS.YORKSHIRE_HUMBER, // Yorkshire and The Humber
    'DE': CONFIG.REGIONS.EAST_MIDLANDS, // East Midlands
    'LE': CONFIG.REGIONS.EAST_MIDLANDS, // East Midlands
    'NG': CONFIG.REGIONS.EAST_MIDLANDS, // East Midlands
    'B': CONFIG.REGIONS.WEST_MIDLANDS,  // West Midlands
    'CV': CONFIG.REGIONS.WEST_MIDLANDS, // West Midlands
    'DY': CONFIG.REGIONS.WEST_MIDLANDS, // West Midlands
    'HR': CONFIG.REGIONS.WEST_MIDLANDS, // West Midlands
    'ST': CONFIG.REGIONS.WEST_MIDLANDS, // West Midlands
    'WS': CONFIG.REGIONS.WEST_MIDLANDS, // West Midlands
    'WR': CONFIG.REGIONS.WEST_MIDLANDS, // West Midlands
    'CB': CONFIG.REGIONS.EAST_ENGLAND, // East of England
    'CM': CONFIG.REGIONS.EAST_ENGLAND, // East of England
    'CO': CONFIG.REGIONS.EAST_ENGLAND, // East of England
    'IP': CONFIG.REGIONS.EAST_ENGLAND, // East of England
    'LU': CONFIG.REGIONS.EAST_ENGLAND, // East of England
    'MK': CONFIG.REGIONS.EAST_ENGLAND, // East of England
    'NN': CONFIG.REGIONS.EAST_ENGLAND, // East of England
    'PE': CONFIG.REGIONS.EAST_ENGLAND, // East of England
    'SG': CONFIG.REGIONS.EAST_ENGLAND, // East of England
    'SS': CONFIG.REGIONS.EAST_ENGLAND, // East of England
    'E': CONFIG.REGIONS.LONDON,  // London
    'EC': CONFIG.REGIONS.LONDON, // London
    'N': CONFIG.REGIONS.LONDON,  // London
    'NW': CONFIG.REGIONS.LONDON, // London
    'SE': CONFIG.REGIONS.LONDON, // London
    'SW': CONFIG.REGIONS.LONDON, // London
    'W': CONFIG.REGIONS.LONDON,  // London
    'WC': CONFIG.REGIONS.LONDON, // London
    'AL': CONFIG.REGIONS.SOUTH_EAST, // South East
    'BA': CONFIG.REGIONS.SOUTH_WEST, // South West
    'BH': CONFIG.REGIONS.SOUTH_WEST, // South West
    'BS': CONFIG.REGIONS.SOUTH_WEST, // South West
    'DT': CONFIG.REGIONS.SOUTH_WEST, // South West
    'EX': CONFIG.REGIONS.SOUTH_WEST, // South West
    'GL': CONFIG.REGIONS.SOUTH_WEST, // South West
    'PL': CONFIG.REGIONS.SOUTH_WEST, // South West
    'SN': CONFIG.REGIONS.SOUTH_WEST, // South West
    'SP': CONFIG.REGIONS.SOUTH_WEST, // South West
    'TA': CONFIG.REGIONS.SOUTH_WEST, // South West
    'TQ': CONFIG.REGIONS.SOUTH_WEST, // South West
    'TR': CONFIG.REGIONS.SOUTH_WEST  // South West
  };
  
  return regionMap[postcodeArea] || CONFIG.REGIONS.NORTH_EAST; // Default to North East
} 