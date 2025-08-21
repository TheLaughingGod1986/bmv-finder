import { NextRequest, NextResponse } from 'next/server';
import { InvestmentRecommendationEngine } from '@/lib/investmentRecommendationEngine';

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

    // Get the base URL for server-side fetch calls
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3001';
    const baseUrl = `${protocol}://${host}`;

    // Fetch required data for investment analysis
    const [marketTrendsResponse, propertyResponse, valuationResponse] = await Promise.all([
      fetch(`${baseUrl}/api/market-trends?postcode=${encodeURIComponent(postcode)}`),
      fetch(`${baseUrl}/api/enhanced-property-search?postcode=${encodeURIComponent(postcode)}&includeRental=true&includeHPI=true&includeSoldPrices=true`),
      fetch(`${baseUrl}/api/property-valuation?type=comprehensive&postcode=${encodeURIComponent(postcode)}&number=${encodeURIComponent(number || '')}`)
    ]);

    if (!marketTrendsResponse.ok || !propertyResponse.ok || !valuationResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch required data for investment analysis' },
        { status: 500 }
      );
    }

    const [marketTrends, propertyData, valuationData] = await Promise.all([
      marketTrendsResponse.json(),
      propertyResponse.json(),
      valuationResponse.json()
    ]);

    // Find the specific property if number is provided
    let targetProperty = null;
    if (number && propertyData.data?.properties) {
      targetProperty = propertyData.data.properties.find((prop: any) => 
        prop.address.includes(number) || 
        prop.address.startsWith(number + ',') ||
        prop.address.startsWith(number + ' ')
      );
    }

    // Use the first property if no specific match found
    if (!targetProperty && propertyData.data?.properties?.length > 0) {
      targetProperty = propertyData.data.properties[0];
    }

    if (!targetProperty) {
      return NextResponse.json(
        { error: 'No property data found for analysis' },
        { status: 404 }
      );
    }

    // Add postcode to property data for the engine
    targetProperty.postcode = postcode;

    // Create investment recommendation engine
    console.log('Creating InvestmentRecommendationEngine with:', {
      marketTrends: !!marketTrends.data,
      targetProperty: !!targetProperty,
      valuationData: !!valuationData
    });
    
    const engine = new InvestmentRecommendationEngine(
      marketTrends.data,
      targetProperty,
      valuationData
    );

    console.log('Engine created successfully, generating recommendation...');

    // Generate recommendations
    const recommendation = engine.generateRecommendation();
    console.log('Recommendation generated:', recommendation);
    
    const strategies = engine.generateInvestmentStrategies();
    console.log('Strategies generated:', strategies.length);

    return NextResponse.json({
      success: true,
      data: {
        recommendation,
        strategies,
        analysis: {
          postcode,
          propertyAddress: targetProperty.address,
          propertyType: targetProperty.propertyType,
          bedrooms: targetProperty.bedrooms,
          epcRating: targetProperty.epcRating,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Investment recommendations API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate investment recommendations' },
      { status: 500 }
    );
  }
}
