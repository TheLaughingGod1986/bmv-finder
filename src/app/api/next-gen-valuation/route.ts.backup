import { NextRequest, NextResponse } from 'next/server';
import { NextGenValuationModel, NextGenValuationFeatures } from '@/lib/nextGenValuationModel';
import { esClient } from '@/lib/esClient';

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

    // 3. Build features for the valuation model
    const features: NextGenValuationFeatures = {
      postcode,
      houseNumber: number,
      propertyType: soldPrices[0]?.property_type || 'T',
      bedrooms: propertyData?.bedrooms,
      floorArea: propertyData?.floor_area_m2,
      epcRating: propertyData?.epc_rating,
      lastSoldPrice: soldPrices[0]?.price,
      lastSoldDate: soldPrices[0]?.date,
      constructionYear: propertyData?.construction_year,
      tenure: soldPrices[0]?.tenure,
      newBuild: soldPrices[0]?.new_build === 'Y'
    };

    // 4. Generate comprehensive valuation
    const valuation = await NextGenValuationModel.valueProperty(features);

    console.log('🎯 Next-gen valuation completed:', {
      currentValue: valuation.currentValue,
      confidence: valuation.confidence,
      comparablesCount: valuation.comparables.length
    });

    return NextResponse.json({
      success: true,
      valuation,
      features,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataSources: [
          'Land Registry Sales Data',
          'EPC Energy Performance Data',
          'House Price Index (HPI)',
          'Local Market Analysis',
          'Property Characteristics'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Next-gen valuation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate comprehensive valuation', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Get property enrichment data from EPC register
 */
async function getPropertyEnrichmentData(postcode: string, number: string) {
  try {
    const response = await fetch(`${process.env.PROPERTY_ENRICHMENT_SERVICE_URL}/enrich`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postcode,
        houseNumber: number
      })
    });

    if (response.ok) {
      return await response.json();
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
              { match_phrase: { houseNumber: number } }
            ]
          }
        },
        size: 10,
        sort: [{ dateOfTransfer: { order: 'desc' } }]
      }
    });

    return response.hits.hits.map(hit => {
      const source = hit._source as any;
      return {
        price: source.price,
        date: source.dateOfTransfer,
        property_type: source.propertyType,
        tenure: source.tenure,
        new_build: source.newBuild
      };
    });
  } catch (error) {
    console.error('Error fetching sold prices:', error);
    return [];
  }
} 