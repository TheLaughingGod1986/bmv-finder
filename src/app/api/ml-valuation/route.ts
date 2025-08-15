import { NextRequest, NextResponse } from 'next/server';
import { MLValuationModel, MLValuationFeatures, ExternalSignals } from '@/lib/mlValuationModel';
import { esClient } from '@/lib/esClient';
import { CONFIG } from '@/lib/config';

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


    // 1. Get property enrichment data (EPC data)
    const propertyData = await getPropertyEnrichmentData(postcode, number);

    // 2. Get sold prices for the property
    const soldPrices = await getSoldPrices(postcode, number);

    // 3. Get HPI data for the region
    const hpiData = await getHPIData(postcode);

    // 4. Get comparable sales
    const comparables = await getComparableSales(postcode, number, propertyData);

    // 5. Get external signals
    const externalSignals = await getExternalSignals(postcode, propertyData);

    // 6. Build features for the ML valuation model
    const features: MLValuationFeatures = {
      postcode,
      propertyType: soldPrices[0]?.property_type || 'T',
      bedrooms: propertyData?.bedrooms || 3,
      floorArea: propertyData?.floor_area_m2 || 100,
      epcRating: propertyData?.epc_rating || 'D',
      constructionYear: propertyData?.construction_year || 1990,
      tenure: soldPrices[0]?.tenure || 'F',
      lastSoldPrice: soldPrices[0]?.price,
      lastSoldDate: soldPrices[0]?.date,
      hpiData,
      externalSignals,
      comparables
    };

    // 7. Generate ML-enhanced valuation
    const valuation = await MLValuationModel.valueProperty(features);

    console.log('🎯 ML valuation completed:', {
      currentValue: valuation.currentValue,
      confidence: valuation.confidence,
      randomForestPrediction: valuation.randomForestPrediction,
      lstmPrediction: valuation.lstmPrediction,
      ensemblePrediction: valuation.ensemblePrediction
    });

    return NextResponse.json({
      success: true,
      valuation,
      metadata: {
        postcode,
        houseNumber: number,
        dataSources: {
          propertyEnrichment: !!propertyData,
          soldPrices: soldPrices.length,
          hpiData: hpiData.length,
          comparables: comparables.length,
          externalSignals: Object.keys(externalSignals).filter(key => externalSignals[key as keyof ExternalSignals]).length
        }
      }
    });

  } catch (error) {
    console.error('Error in ML valuation API:', error);
    return NextResponse.json(
      { error: 'Failed to generate ML-enhanced valuation' },
      { status: 500 }
    );
  }
}

/**
 * Get property enrichment data from EPC register
 */
async function getPropertyEnrichmentData(postcode: string, number: string) {
  try {
    // Call property enrichment service
    const serviceUrl = CONFIG.API.PROPERTY_ENRICHMENT_URL;
    const enrichmentResponse = await fetch(`${serviceUrl}/api/property-info?postcode=${postcode}&number=${number}`);

    if (enrichmentResponse.ok) {
      return await enrichmentResponse.json();
    }
    return null;
  } catch (error) {
    console.error('Property enrichment service error:', error);
    return null;
  }
}

/**
 * Get sold prices for the property
 */
async function getSoldPrices(postcode: string, number: string) {
  try {
    const response = await esClient.search({
      index: 'properties',
      body: {
        query: {
          bool: {
            must: [
              { match_phrase: { postcode: postcode } },
              { match_phrase: { house_number: number } }
            ]
          }
        },
        size: 10,
        sort: [{ dateOfTransfer: { order: 'desc' } }]
      }
    });

    return response.hits.hits.map(hit => hit._source as any);
  } catch (error) {
    console.error('Error fetching sold prices:', error);
    return [];
  }
}

/**
 * Get HPI data for the region
 */
async function getHPIData(postcode: string) {
  try {
    const region = getRegionFromPostcode(postcode);
    const response = await esClient.search({
      index: 'house_price_index',
      body: {
        query: {
          bool: {
            must: [
              { term: { region: region } }
            ]
          }
        },
        size: 100,
        sort: [{ date: { order: 'desc' } }]
      }
    });

    return response.hits.hits.map(hit => hit._source as any);
  } catch (error) {
    console.error('Error fetching HPI data:', error);
    return [];
  }
}

/**
 * Get comparable sales in the area
 */
async function getComparableSales(postcode: string, number: string, propertyData: any) {
  try {
    const postcodePrefix = postcode.substring(0, 4);
    const query: any = {
      bool: {
        must: [
          { prefix: { postcode: postcodePrefix } },
          { range: { price: { gte: 50000, lte: 1000000 } } }
        ],
        must_not: [
          { match_phrase: { house_number: number } }
        ]
      }
    };

    // Add property type filter if available
    if (propertyData?.property_type) {
      query.bool.must.push({ term: { property_type: propertyData.property_type } });
    }

    // Add bedroom filter if available
    if (propertyData?.bedrooms) {
      query.bool.must.push({ term: { bedrooms: propertyData.bedrooms } });
    }

    const response = await esClient.search({
      index: 'properties',
      body: {
        query,
        size: 20,
        sort: [{ dateOfTransfer: { order: 'desc' } }]
      }
    });

    return response.hits.hits.map(hit => hit._source as any);
  } catch (error) {
    console.error('Error fetching comparable sales:', error);
    return [];
  }
}

/**
 * Get external signals for the area
 */
async function getExternalSignals(postcode: string, propertyData: any): Promise<ExternalSignals> {
  const signals: ExternalSignals = {
    // High predictive power signals
    interestRates: 5.25, // Current Bank of England base rate
    inflation: 3.2, // Current UK CPI
    
    // Medium predictive power signals
    epcScore: propertyData?.epc_rating || 'D',
    floorArea: propertyData?.floor_area_m2 || 0,
    timeToSell: 45, // Average days on market (would come from real estate data)
    planningApplications: 12, // Local planning activity (would come from local authority data)
    
    // Lower predictive power signals
    schoolCatchments: ['Primary School A', 'Secondary School B'], // Would come from DfE API
    crimeRate: 45, // Crimes per 1000 people (would come from Police API)
    broadbandSpeed: 67 // Mbps (would come from Ofcom data)
  };

  // In a production system, these would be fetched from real APIs:
  // - Bank of England API for interest rates
  // - ONS API for inflation data
  // - Local authority APIs for planning applications
  // - DfE API for school catchment data
  // - Police API for crime statistics
  // - Ofcom API for broadband speeds

  return signals;
}

/**
 * Get region from postcode
 */
function getRegionFromPostcode(postcode: string): string {
  const prefix = postcode.substring(0, 2).toUpperCase();
  
  const regionMap: { [key: string]: string } = {
    'AB': 'Scotland',
    'AL': 'East of England',
    'B': 'West Midlands',
    'BA': 'South West',
    'BB': 'North West',
    'BD': 'Yorkshire and The Humber',
    'BH': 'South West',
    'BL': 'North West',
    'BN': 'South East',
    'BR': 'London',
    'BS': 'South West',
    'BT': 'Northern Ireland',
    'CA': 'North West',
    'CB': 'East of England',
    'CF': 'Wales',
    'CH': 'North West',
    'CM': 'East of England',
    'CO': 'East of England',
    'CR': 'London',
    'CT': 'South East',
    'CV': 'West Midlands',
    'CW': 'North West',
    'DA': 'South East',
    'DD': 'Scotland',
    'DE': 'East Midlands',
    'DG': 'Scotland',
    'DH': 'North East',
    'DL': 'Yorkshire and The Humber',
    'DN': 'Yorkshire and The Humber',
    'DT': 'South West',
    'DY': 'West Midlands',
    'E': 'London',
    'EC': 'London',
    'EH': 'Scotland',
    'EN': 'East of England',
    'EX': 'South West',
    'FK': 'Scotland',
    'FY': 'North West',
    'G': 'Scotland',
    'GL': 'South West',
    'GU': 'South East',
    'HA': 'London',
    'HD': 'Yorkshire and The Humber',
    'HG': 'Yorkshire and The Humber',
    'HP': 'South East',
    'HR': 'West Midlands',
    'HS': 'Scotland',
    'HU': 'Yorkshire and The Humber',
    'HX': 'Yorkshire and The Humber',
    'IG': 'London',
    'IP': 'East of England',
    'IV': 'Scotland',
    'KA': 'Scotland',
    'KT': 'South East',
    'KW': 'Scotland',
    'KY': 'Scotland',
    'L': 'North West',
    'LA': 'North West',
    'LD': 'Wales',
    'LE': 'East Midlands',
    'LL': 'Wales',
    'LN': 'East Midlands',
    'LS': 'Yorkshire and The Humber',
    'LU': 'East of England',
    'M': 'North West',
    'ME': 'South East',
    'MK': 'South East',
    'ML': 'Scotland',
    'N': 'London',
    'NE': 'North East',
    'NG': 'East Midlands',
    'NN': 'East Midlands',
    'NP': 'Wales',
    'NR': 'East of England',
    'NW': 'London',
    'OL': 'North West',
    'OX': 'South East',
    'PA': 'Scotland',
    'PE': 'East of England',
    'PH': 'Scotland',
    'PL': 'South West',
    'PO': 'South East',
    'PR': 'North West',
    'RG': 'South East',
    'RH': 'South East',
    'RM': 'London',
    'S': 'Yorkshire and The Humber',
    'SA': 'Wales',
    'SE': 'London',
    'SG': 'South East',
    'SK': 'East Midlands',
    'SL': 'South East',
    'SM': 'London',
    'SN': 'South West',
    'SO': 'South East',
    'SP': 'South West',
    'SR': 'North East',
    'SS': 'East of England',
    'ST': 'West Midlands',
    'SW': 'London',
    'SY': 'West Midlands',
    'TA': 'South West',
    'TD': 'Scotland',
    'TF': 'West Midlands',
    'TN': 'South East',
    'TQ': 'South West',
    'TR': 'South West',
    'TS': 'North East',
    'TW': 'London',
    'UB': 'London',
    'W': 'London',
    'WA': 'North West',
    'WC': 'London',
    'WD': 'East of England',
    'WF': 'Yorkshire and The Humber',
    'WN': 'North West',
    'WR': 'West Midlands',
    'WS': 'West Midlands',
    'WV': 'West Midlands',
    'YO': 'Yorkshire and The Humber',
    'ZE': 'Scotland'
  };

  return regionMap[prefix] || 'United Kingdom';
} 