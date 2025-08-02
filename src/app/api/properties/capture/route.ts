import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function GET() {
  try {
    const { data: properties, error } = await supabase
      .from('watchlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching watchlist properties:', error);
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: properties?.length || 0,
      properties: properties || []
    });

  } catch (error) {
    console.error('Error in GET /api/properties/capture:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Get request body
    const propertyData = await request.json();
    
    console.log('BMV Finder API: Received property capture request:', propertyData);
    
    if (!propertyData || !propertyData.price || !propertyData.title) {
      return NextResponse.json({ error: 'Invalid property data' }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Insert into watchlist table with basic fields
    const { data, error } = await supabase
      .from('watchlist')
      .insert({
        title: propertyData.title,
        price: propertyData.price,
        address: propertyData.address || '',
        description: propertyData.description || '',
        bedrooms: propertyData.bedrooms || 0,
        bathrooms: propertyData.bathrooms || 0,
        property_type: propertyData.propertyType || propertyData.property_type || '',
        postcode: propertyData.postcode || '',
        original_url: propertyData.original_url || propertyData.url || 'https://example.com',
        source: propertyData.source || 'chrome-extension',
        images: propertyData.images || [],
        notes: propertyData.notes || '',
        status: 'active',
        captured_at: new Date().toISOString(),
        user_id: '00000000-0000-0000-0000-000000000000' // Default user ID for now
      })
      .select()
      .single();

    if (error) {
      console.error('Watchlist insert error:', error);
      return NextResponse.json({ error: 'Failed to save property: ' + error.message }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    console.log('BMV Finder API: Property captured successfully:', data);

    return NextResponse.json({
      success: true,
      message: 'Property captured successfully',
      property: data
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Property capture error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error as Error).message }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
}

// Helper function to extract price as number
function extractPrice(priceString: string): number {
  if (!priceString) return 0;
  
  // Remove currency symbols and commas, extract numbers
  const priceMatch = priceString.replace(/[£,]/g, '').match(/(\d+(?:\.\d+)?)/);
  return priceMatch ? parseFloat(priceMatch[1]) : 0;
}

// Helper function to extract number from string
function extractNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const numberMatch = value.match(/(\d+(?:\.\d+)?)/);
  return numberMatch ? parseFloat(numberMatch[1]) : 0;
}

// Function to create the watchlist table if it doesn't exist
async function createWatchlistTable() {
  const { error } = await supabase.rpc('create_watchlist_table', {});
  
  if (error) {
    console.error('Error creating watchlist table:', error);
    // If RPC doesn't exist, we'll need to create the table manually
    // For now, let's just log the error
  }
} 