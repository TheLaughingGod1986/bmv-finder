import { NextRequest, NextResponse } from 'next/server';
import { esClient } from '@/lib/esClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');
    const address = searchParams.get('address');
    const bedrooms = parseInt(searchParams.get('bedrooms') || '3');
    const propertyType = searchParams.get('propertyType') || 'detached';

    if (!postcode && !address) {
      return NextResponse.json({ 
        error: 'Missing postcode or address parameter' 
      }, { status: 400 });
    }

    console.log('Deal calculator data request:', { postcode, address, bedrooms, propertyType });

    // 1. Get list of sold properties for selection
    let soldProperties = [];
    let confidence = 'low';
    
    try {
      const salesResponse = await esClient.search({
        index: 'recent_sales',
        size: 20,
        query: {
          bool: {
            must: [
              { match: { postcode: postcode || '' } },
              { range: { bedrooms: { gte: Math.max(1, bedrooms - 1), lte: bedrooms + 1 } } }
            ]
          }
        },
        sort: [{ date: { order: 'desc' } }]
      });

      if (salesResponse.hits.hits.length > 0) {
        soldProperties = salesResponse.hits.hits.map(hit => ({
          id: hit._id,
          address: hit._source.address || 'Unknown Address',
          postcode: hit._source.postcode,
          price: hit._source.price,
          date: hit._source.date,
          bedrooms: hit._source.bedrooms,
          propertyType: hit._source.property_type || 'Unknown',
          squareFootage: hit._source.square_footage || 0
        }));
        confidence = soldProperties.length >= 3 ? 'high' : soldProperties.length >= 1 ? 'medium' : 'low';
      }
    } catch (error) {
      console.log('No recent sales data available, using regional estimates');
    }

    // 2. Get rental estimation data
    let monthlyRent = null;
    let annualGrowth = 3; // Default 3%
    
    try {
      // Use regional rental data based on postcode area
      const postcodeArea = postcode?.substring(0, 2).toUpperCase();
      const regionalRates = getRegionalRates(postcodeArea);
      
      if (regionalRates) {
        monthlyRent = regionalRates.rentalPerBedroom * bedrooms;
        annualGrowth = regionalRates.annualGrowth || 3;
      }
    } catch (error) {
      console.log('Using default rental and growth values');
    }

    // 3. Get HPI growth data for the region
    try {
      const region = getRegionFromPostcode(postcode || '');
      if (region) {
        const hpiResponse = await esClient.search({
          index: 'house_price_index',
          size: 2,
          query: { term: { region: region } },
          sort: [{ date: { order: 'desc' } }]
        });

        if (hpiResponse.hits.hits.length >= 2) {
          const latest = hpiResponse.hits.hits[0]._source;
          const previous = hpiResponse.hits.hits[1]._source;
          
          if (latest.hpiIndex && previous.hpiIndex) {
            const growth = ((latest.hpiIndex - previous.hpiIndex) / previous.hpiIndex) * 100;
            annualGrowth = Math.round(growth * 100) / 100; // Round to 2 decimal places
          }
        }
      }
    } catch (error) {
      console.log('Using default growth rate');
    }

    // 4. Fallback to reasonable defaults if no data available
    let estimatedValue = null;
    if (soldProperties.length > 0) {
      // Use average of sold properties
      const avgPrice = soldProperties.reduce((sum, prop) => sum + prop.price, 0) / soldProperties.length;
      estimatedValue = Math.round(avgPrice);
    } else {
      estimatedValue = bedrooms * 80000; // £80k per bedroom as fallback
    }

    if (!monthlyRent) {
      monthlyRent = bedrooms * 500; // £500 per bedroom as fallback
    }

    return NextResponse.json({
      success: true,
      data: {
        soldProperties,
        estimatedValue: Math.round(estimatedValue),
        monthlyRent: Math.round(monthlyRent),
        annualGrowth: Math.round(annualGrowth * 100) / 100,
        confidence,
        source: 'API',
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Deal calculator data error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch deal calculator data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Regional data helper functions
function getRegionalRates(postcodeArea: string) {
  const regionalRates: { [key: string]: { rentalPerBedroom: number; annualGrowth: number } } = {
    'L': { rentalPerBedroom: 450, annualGrowth: 2.5 }, // Liverpool
    'M': { rentalPerBedroom: 500, annualGrowth: 3.2 }, // Manchester
    'B': { rentalPerBedroom: 480, annualGrowth: 2.8 }, // Birmingham
    'S': { rentalPerBedroom: 420, annualGrowth: 2.1 }, // Sheffield
    'L': { rentalPerBedroom: 450, annualGrowth: 2.5 }, // Leeds
    'N': { rentalPerBedroom: 1200, annualGrowth: 4.5 }, // London
    'E': { rentalPerBedroom: 700, annualGrowth: 3.8 }, // East of England
    'W': { rentalPerBedroom: 520, annualGrowth: 2.9 }, // Wales
    'G': { rentalPerBedroom: 480, annualGrowth: 2.7 }, // Glasgow
    'E': { rentalPerBedroom: 420, annualGrowth: 2.3 }  // Edinburgh
  };

  return regionalRates[postcodeArea] || { rentalPerBedroom: 500, annualGrowth: 3.0 };
}

function getRegionFromPostcode(postcode: string): string | null {
  const postcodeArea = postcode.substring(0, 2).toUpperCase();
  
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
    'EN': 'London',
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
    'SG': 'East of England',
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
    'SY': 'Wales',
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

  return regionMap[postcodeArea] || null;
}
