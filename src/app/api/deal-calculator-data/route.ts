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

    // 1. Validate and get postcode data from Postcodes.io
    let postcodeData = null;
    let region = null;
    
    if (postcode) {
      try {
        const postcodeResponse = await fetch(`https://postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
        if (postcodeResponse.ok) {
          const postcodeResult = await postcodeResponse.json();
          if (postcodeResult.result) {
            postcodeData = postcodeResult.result;
            region = postcodeData.region || postcodeData.admin_district;
            console.log('Postcode data from Postcodes.io:', { region, postcodeData });
          }
        }
      } catch (error) {
        console.log('Failed to fetch from Postcodes.io, using fallback');
      }
    }

    // 2. Get list of sold properties for selection
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
        
        // More sophisticated confidence calculation
        if (soldProperties.length >= 5) {
          confidence = 'very high';
        } else if (soldProperties.length >= 3) {
          confidence = 'high';
        } else if (soldProperties.length >= 1) {
          confidence = 'medium';
        } else {
          confidence = 'low';
        }
        
        // Boost confidence if we have regional data from Postcodes.io
        if (postcodeData && region) {
          if (confidence === 'low') confidence = 'medium';
          else if (confidence === 'medium') confidence = 'high';
        }
      }
    } catch (error) {
      console.log('No recent sales data available, using regional estimates');
    }

    // 3. Get rental estimation data using Postcodes.io region data
    let monthlyRent = null;
    let annualGrowth = 3; // Default 3%
    
    if (region) {
      const regionalRates = getRegionalRates(region);
      if (regionalRates) {
        monthlyRent = regionalRates.rentalPerBedroom * bedrooms;
        annualGrowth = regionalRates.annualGrowth || 3;
      }
    } else {
      // Fallback to postcode area if region not available
      const postcodeArea = postcode?.substring(0, 2).toUpperCase();
      const regionalRates = getRegionalRates(postcodeArea);
      if (regionalRates) {
        monthlyRent = regionalRates.rentalPerBedroom * bedrooms;
        annualGrowth = regionalRates.annualGrowth || 3;
      }
    }

    // 4. Get HPI growth data for the region from Postcodes.io data
    if (region) {
      try {
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
      } catch (error) {
        console.log('Using default growth rate');
      }
    }

    // 5. Calculate estimated value - more dynamic based on region and property type
    let estimatedValue = null;
    if (soldProperties.length > 0) {
      // Use average of sold properties
      const avgPrice = soldProperties.reduce((sum, prop) => sum + prop.price, 0) / soldProperties.length;
      estimatedValue = Math.round(avgPrice);
      console.log('Using sold properties average:', { avgPrice, estimatedValue, soldPropertiesCount: soldProperties.length });
    } else {
      // More sophisticated fallback based on region and property characteristics
      let basePricePerBedroom = 80000; // Default fallback
      
      if (region) {
        // Use regional data to estimate property values
        const regionalRates = getRegionalRates(region);
        if (regionalRates) {
          // Estimate property value based on rental yield (typically 4-6% for BTL)
          const estimatedRentalYield = 0.05; // 5% average
          const annualRent = regionalRates.rentalPerBedroom * bedrooms * 12;
          estimatedValue = Math.round(annualRent / estimatedRentalYield);
        } else {
          // Fallback to regional averages
          switch (region) {
            case 'London':
              basePricePerBedroom = 120000;
              break;
            case 'South East':
              basePricePerBedroom = 90000;
              break;
            case 'East of England':
              basePricePerBedroom = 85000;
              break;
            case 'South West':
              basePricePerBedroom = 80000;
              break;
            case 'West Midlands':
              basePricePerBedroom = 75000;
              break;
            case 'East Midlands':
              basePricePerBedroom = 75000;
              break;
            case 'North West':
              basePricePerBedroom = 70000;
              break;
            case 'Yorkshire and The Humber':
              basePricePerBedroom = 68000;
              break;
            case 'North East':
              basePricePerBedroom = 65000;
              break;
            case 'Scotland':
              basePricePerBedroom = 70000;
              break;
            case 'Wales':
              basePricePerBedroom = 75000;
              break;
            case 'Northern Ireland':
              basePricePerBedroom = 65000;
              break;
            default:
              basePricePerBedroom = 80000;
          }
          estimatedValue = bedrooms * basePricePerBedroom;
        }
      } else {
        // Fallback to postcode area if region not available
        const postcodeArea = postcode?.substring(0, 2).toUpperCase();
        switch (postcodeArea) {
          case 'N': // London
            basePricePerBedroom = 120000;
            break;
          case 'E': // East of England
            basePricePerBedroom = 85000;
            break;
          case 'W': // Wales
            basePricePerBedroom = 75000;
            break;
          case 'G': // Glasgow
            basePricePerBedroom = 70000;
            break;
          case 'L': // Liverpool
            basePricePerBedroom = 70000;
            break;
          case 'M': // Manchester
            basePricePerBedroom = 75000;
            break;
          case 'B': // Birmingham
            basePricePerBedroom = 75000;
            break;
          case 'S': // Sheffield
            basePricePerBedroom = 68000;
            break;
          default:
            basePricePerBedroom = 80000;
        }
        estimatedValue = bedrooms * basePricePerBedroom;
      }
      
      // Adjust for property type
      if (propertyType && propertyType !== 'Unknown') {
        switch (propertyType.toLowerCase()) {
          case 'detached':
            estimatedValue = Math.round(estimatedValue * 1.2);
            break;
          case 'semi-detached':
            estimatedValue = Math.round(estimatedValue * 1.1);
            break;
          case 'terraced':
            estimatedValue = Math.round(estimatedValue * 0.95);
            break;
          case 'flat':
          case 'apartment':
            estimatedValue = Math.round(estimatedValue * 0.9);
            break;
        }
      }
      
      // Adjust for square footage if available (we'll use a default assumption)
      // In a real implementation, this would come from the frontend inputs
      const avgSqFtPerBedroom = 150; // Average UK bedroom size
      const expectedSqFt = bedrooms * avgSqFtPerBedroom;
            // For now, assume average size - this could be enhanced later
    }
    
    console.log('Estimated value calculation:', { 
      region, 
      propertyType, 
      bedrooms, 
      estimatedValue, 
      soldPropertiesCount: soldProperties.length,
      postcodeData: !!postcodeData
    });
    
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
        lastUpdated: new Date().toISOString(),
        postcodeInfo: postcodeData ? {
          region: postcodeData.region,
          adminDistrict: postcodeData.admin_district,
          adminWard: postcodeData.admin_ward,
          parish: postcodeData.parish,
          latitude: postcodeData.latitude,
          longitude: postcodeData.longitude
        } : null
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

// Regional data helper functions - now using actual UK regions from Postcodes.io
function getRegionalRates(region: string) {
  const regionalRates: { [key: string]: { rentalPerBedroom: number; annualGrowth: number } } = {
    // England Regions
    'North East': { rentalPerBedroom: 420, annualGrowth: 2.1 },
    'North West': { rentalPerBedroom: 480, annualGrowth: 3.2 },
    'Yorkshire and The Humber': { rentalPerBedroom: 450, annualGrowth: 2.8 },
    'East Midlands': { rentalPerBedroom: 480, annualGrowth: 3.0 },
    'West Midlands': { rentalPerBedroom: 460, annualGrowth: 2.9 },
    'East of England': { rentalPerBedroom: 520, annualGrowth: 3.5 },
    'London': { rentalPerBedroom: 1200, annualGrowth: 4.2 },
    'South East': { rentalPerBedroom: 680, annualGrowth: 3.8 },
    'South West': { rentalPerBedroom: 520, annualGrowth: 3.1 },
    
    // Scotland
    'Scotland': { rentalPerBedroom: 480, annualGrowth: 2.7 },
    
    // Wales
    'Wales': { rentalPerBedroom: 520, annualGrowth: 2.9 },
    
    // Northern Ireland
    'Northern Ireland': { rentalPerBedroom: 450, annualGrowth: 2.5 },
    
    // Fallback for postcode areas if region not found
    'L': { rentalPerBedroom: 450, annualGrowth: 2.5 }, // Liverpool
    'M': { rentalPerBedroom: 500, annualGrowth: 3.2 }, // Manchester
    'B': { rentalPerBedroom: 480, annualGrowth: 2.8 }, // Birmingham
    'S': { rentalPerBedroom: 420, annualGrowth: 2.1 }, // Sheffield
    'N': { rentalPerBedroom: 1200, annualGrowth: 4.5 }, // London
    'E': { rentalPerBedroom: 700, annualGrowth: 3.8 }, // East of England
    'W': { rentalPerBedroom: 520, annualGrowth: 2.9 }, // Wales
    'G': { rentalPerBedroom: 480, annualGrowth: 2.7 }  // Glasgow
  };

  return regionalRates[region] || { rentalPerBedroom: 500, annualGrowth: 3.0 };
}
