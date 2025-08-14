import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

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
const mockData = {
  'property_investment': Math.floor(CONFIG.VALUATION.DEFAULT_BASE_VALUE * 0.8) + Math.floor(CONFIG.VALUATION.DEFAULT_BASE_VALUE * 0.4),
  'infrastructure_spend': Math.floor(CONFIG.VALUATION.DEFAULT_BASE_VALUE * 2.5) + Math.floor(CONFIG.VALUATION.DEFAULT_BASE_VALUE * 0.5),
  'construction_output': Math.floor(CONFIG.VALUATION.DEFAULT_BASE_VALUE * 1.2) + Math.floor(CONFIG.VALUATION.DEFAULT_BASE_VALUE * 0.3),
  'housing_starts': Math.floor(Math.random() * 50000) + 100000,
  'planning_applications': Math.floor(Math.random() * 100000) + 200000
};

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

    const data = mockData;

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