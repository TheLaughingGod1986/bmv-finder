import { NextRequest, NextResponse } from 'next/server';

// ONS API base URL and endpoints
const ONS_BASE_URL = 'https://api.ons.gov.uk';

// Helper function to fetch ONS data
async function fetchONSData(endpoint: string) {
  try {
    const response = await fetch(`${ONS_BASE_URL}${endpoint}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`ONS API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching ONS data:', error);
    return null;
  }
}

// Mock data for demonstration (since ONS API requires specific dataset IDs)
function getMockONSData(postcode: string) {
  const areaCode = postcode.replace(/\s+/g, '').toUpperCase();
  
  return {
    demographics: {
      totalPopulation: Math.floor(Math.random() * 50000) + 10000,
      ageDistribution: {
        '0-15': Math.floor(Math.random() * 20) + 10,
        '16-24': Math.floor(Math.random() * 15) + 8,
        '25-34': Math.floor(Math.random() * 25) + 15,
        '35-44': Math.floor(Math.random() * 20) + 12,
        '45-54': Math.floor(Math.random() * 18) + 10,
        '55-64': Math.floor(Math.random() * 15) + 8,
        '65+': Math.floor(Math.random() * 12) + 6,
      },
      householdTypes: {
        'Single person': Math.floor(Math.random() * 30) + 15,
        'Couple with children': Math.floor(Math.random() * 25) + 12,
        'Couple without children': Math.floor(Math.random() * 20) + 10,
        'Single parent': Math.floor(Math.random() * 15) + 8,
        'Other': Math.floor(Math.random() * 10) + 5,
      },
      ethnicity: {
        'White': Math.floor(Math.random() * 60) + 30,
        'Asian': Math.floor(Math.random() * 20) + 10,
        'Black': Math.floor(Math.random() * 15) + 8,
        'Mixed': Math.floor(Math.random() * 10) + 5,
        'Other': Math.floor(Math.random() * 5) + 2,
      }
    },
    employment: {
      employmentRate: Math.floor(Math.random() * 20) + 70, // 70-90%
      unemploymentRate: Math.floor(Math.random() * 8) + 2, // 2-10%
      majorIndustries: [
        { name: 'Professional Services', percentage: Math.floor(Math.random() * 25) + 15 },
        { name: 'Retail', percentage: Math.floor(Math.random() * 20) + 10 },
        { name: 'Healthcare', percentage: Math.floor(Math.random() * 15) + 8 },
        { name: 'Education', percentage: Math.floor(Math.random() * 12) + 6 },
        { name: 'Manufacturing', percentage: Math.floor(Math.random() * 10) + 5 },
      ],
      averageIncome: Math.floor(Math.random() * 20000) + 25000, // £25k-45k
    },
    population: {
      total: Math.floor(Math.random() * 50000) + 10000,
      density: Math.floor(Math.random() * 5000) + 1000, // per km²
      growthRate: (Math.random() * 4 - 2).toFixed(1), // -2% to +2%
      recentChanges: {
        '2020': Math.floor(Math.random() * 1000) - 500,
        '2021': Math.floor(Math.random() * 1000) - 500,
        '2022': Math.floor(Math.random() * 1000) - 500,
        '2023': Math.floor(Math.random() * 1000) - 500,
      }
    },
    growth: {
      housePriceGrowth: {
        '1_year': (Math.random() * 15 - 5).toFixed(1), // -5% to +10%
        '3_year': (Math.random() * 25 - 10).toFixed(1), // -10% to +15%
        '5_year': (Math.random() * 35 - 15).toFixed(1), // -15% to +20%
      },
      economicGrowth: {
        'GDP_growth': (Math.random() * 6 - 2).toFixed(1), // -2% to +4%
        'business_growth': (Math.random() * 10 - 3).toFixed(1), // -3% to +7%
      },
      investment: {
        'new_businesses': Math.floor(Math.random() * 50) + 10,
        'property_investment': Math.floor(Math.random() * 1000000) + 500000,
        'infrastructure_spend': Math.floor(Math.random() * 5000000) + 1000000,
      }
    },
    areaInfo: {
      postcode: postcode,
      areaCode: areaCode,
      region: 'North East', // Mock region
      localAuthority: 'Newcastle upon Tyne',
      coordinates: {
        lat: 54.9783 + (Math.random() - 0.5) * 0.1,
        lng: -1.6178 + (Math.random() - 0.5) * 0.1,
      }
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get('postcode');

    if (!postcode) {
      return NextResponse.json(
        { error: 'Postcode parameter is required' },
        { status: 400 }
      );
    }

    // For now, return mock data since ONS API requires specific dataset access
    // In production, you would:
    // 1. Register for ONS API access
    // 2. Use specific dataset IDs (e.g., 'mid-year-pop-est', 'labour-market-statistics')
    // 3. Map postcodes to ONS area codes
    // 4. Fetch real data from endpoints like:
    //    - /dataset/mid-year-pop-est/editions/mid-2020-april-2021-geography/versions/1
    //    - /dataset/labour-market-statistics/editions/time-series/versions/1

    const data = getMockONSData(postcode);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      data,
      source: 'ONS UK Economic Data API (Mock data for demonstration)',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('ONS API route error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ONS data' },
      { status: 500 }
    );
  }
} 