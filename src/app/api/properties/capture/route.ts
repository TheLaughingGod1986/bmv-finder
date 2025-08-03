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
    
    if (!propertyData || !propertyData.title) {
      return NextResponse.json({ error: 'Invalid property data - title is required' }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Ensure price exists, default to 0 if not provided
    if (!propertyData.price) {
      propertyData.price = '£0';
      console.log('BMV Finder API: No price provided, defaulting to £0');
    }

    // Try to get authenticated user ID from authorization header
    let userId = '00000000-0000-0000-0000-000000000000'; // Default user ID
    const authHeader = request.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (!error && user) {
          userId = user.id;
          console.log('BMV Finder API: Using authenticated user ID:', userId);
        } else {
          console.log('BMV Finder API: Invalid token, using default user ID');
        }
      } catch (authError) {
        console.log('BMV Finder API: Auth error, using default user ID:', authError);
      }
    } else {
      console.log('BMV Finder API: No authorization header, using default user ID');
    }

    // Check if property already exists for this user and URL (excluding deleted properties)
    const existingProperty = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .eq('original_url', propertyData.original_url || propertyData.url || 'https://example.com')
      .neq('status', 'deleted')
      .single();

    if (existingProperty.data) {
      console.log('BMV Finder API: Property already exists, updating instead');
      
      // Update existing property with new data
      const { data, error } = await supabase
        .from('watchlist')
        .update({
          title: propertyData.title,
          price: extractPrice(propertyData.price),
          address: propertyData.address || '',
          description: propertyData.description || '',
          bedrooms: propertyData.bedrooms || 0,
          bathrooms: propertyData.bathrooms || 0,
          property_type: propertyData.propertyType || propertyData.property_type || '',
          postcode: propertyData.postcode || '',
          source: propertyData.source || 'chrome-extension',
          images: propertyData.images || [],
          notes: propertyData.notes || '',
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProperty.data.id)
        .select()
        .single();

      if (error) {
        console.error('Watchlist update error:', error);
        return NextResponse.json({ error: 'Failed to update property: ' + error.message }, { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        });
      }

      console.log('BMV Finder API: Property updated successfully:', data);

      return NextResponse.json({
        success: true,
        message: 'Property updated successfully',
        property: data
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Insert new property into watchlist table
    const { data, error } = await supabase
      .from('watchlist')
      .insert({
        title: propertyData.title,
        price: extractPrice(propertyData.price), // Use the helper function to convert price
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
        user_id: userId
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

export async function PUT(request: NextRequest) {
  try {
    const updateData = await request.json();
    const { id, price, refurbishment_cost, user_notes, property_condition, estimated_fair_value, custom_rental_estimate, status } = updateData;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    console.log('BMV Finder API: Updating property:', { id, ...updateData });

    const updateFields: any = {
      updated_at: new Date().toISOString()
    };

    // Add fields to update if they exist
    if (price !== undefined) updateFields.price = extractPrice(price);
    // Note: These columns may not exist yet, so we'll skip them for now
    // if (refurbishment_cost !== undefined) updateFields.refurbishment_cost = refurbishment_cost;
    // if (user_notes !== undefined) updateFields.user_notes = user_notes;
    // if (property_condition !== undefined) updateFields.property_condition = property_condition;
    // if (estimated_fair_value !== undefined) updateFields.estimated_fair_value = estimated_fair_value;
    // if (custom_rental_estimate !== undefined) updateFields.custom_rental_estimate = custom_rental_estimate;
    if (status !== undefined) updateFields.status = status;

    const { data, error } = await supabase
      .from('watchlist')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: 'Failed to update property: ' + error.message }, { status: 500 });
    }

    console.log('BMV Finder API: Property updated successfully:', data);

    return NextResponse.json({
      success: true,
      message: 'Property updated successfully',
      property: data
    });

  } catch (error) {
    console.error('Property update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    console.log('BMV Finder API: Deleting property:', id);

    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
    }

    console.log('BMV Finder API: Property deleted successfully:', id);

    return NextResponse.json({
      success: true,
      message: 'Property deleted successfully'
    });

  } catch (error) {
    console.error('Property delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to extract price as number
function extractPrice(priceString: string | number): number {
  if (!priceString) return 0;
  
  // If it's already a number, return it
  if (typeof priceString === 'number') return priceString;
  
  // Convert to string and clean up
  let price = priceString.toString();
  
  // Remove currency symbols, commas, and spaces
  price = price.replace(/[£$,€\s]/g, '');
  
  // Extract the first number found
  const priceMatch = price.match(/(\d+(?:\.\d+)?)/);
  
  if (priceMatch) {
    const extractedPrice = parseFloat(priceMatch[1]);
    console.log('BMV Finder API: Extracted price:', extractedPrice, 'from:', priceString);
    return extractedPrice;
  }
  
  console.log('BMV Finder API: Could not extract price from:', priceString);
  return 0;
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