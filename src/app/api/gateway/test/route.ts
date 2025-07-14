import { NextRequest, NextResponse } from 'next/server';

// Test data for different services
const TEST_DATA = {
  'property-es': {
    searchTerm: 'SW11 1DS',
    filters: { priceRange: { min: 200000, max: 500000 } }
  },
  'enhanced-bmv-score': {
    postcode: 'SW11 1DS',
    propertyData: {
      price: 450000,
      propertyType: 'T',
      dateOfTransfer: '2024-01-15'
    }
  },
  'hpi-postcode': {
    postcode: 'SW11 1DS'
  },
  'suggest-postcodes': {
    q: 'SW1'
  },
  'profile-usage': {
    userId: 'test-user-123'
  },
  'increment-usage': {
    userId: 'test-user-123',
    type: 'search'
  }
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get('service');
  
  if (!service) {
    return NextResponse.json({
      error: 'Service parameter required',
      availableServices: Object.keys(TEST_DATA)
    });
  }

  if (!TEST_DATA[service as keyof typeof TEST_DATA]) {
    return NextResponse.json({
      error: `Service '${service}' not found in test data`,
      availableServices: Object.keys(TEST_DATA)
    });
  }

  try {
    // Test the service through the gateway
    const testData = TEST_DATA[service as keyof typeof TEST_DATA];
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/gateway`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        service,
        action: 'test',
        data: testData
      })
    });

    const result = await response.json();

    return NextResponse.json({
      service,
      status: response.status,
      success: response.ok,
      result: result,
      testData: testData
    });

  } catch (error) {
    return NextResponse.json({
      service,
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { service, testAll = false } = body;

    if (testAll) {
      // Test all services
      const results = {};
      
      for (const [serviceName, testData] of Object.entries(TEST_DATA)) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/gateway`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              service: serviceName,
              action: 'test',
              data: testData
            })
          });

          const result = await response.json();
          
          results[serviceName] = {
            status: response.status,
            success: response.ok,
            result: result
          };
        } catch (error) {
          results[serviceName] = {
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false
          };
        }
      }

      return NextResponse.json({
        message: 'All services tested',
        results,
        summary: {
          total: Object.keys(TEST_DATA).length,
          successful: Object.values(results).filter((r: any) => r.success).length,
          failed: Object.values(results).filter((r: any) => !r.success).length
        }
      });
    }

    if (!service) {
      return NextResponse.json({
        error: 'Service parameter required or set testAll to true',
        availableServices: Object.keys(TEST_DATA)
      });
    }

    // Test specific service
    return await GET(request);

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    });
  }
} 