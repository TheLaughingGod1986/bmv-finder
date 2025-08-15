import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Only create Supabase client if environment variables are available
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return null; // Return null instead of throwing error
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    
    // If Supabase is not configured, return mock data
    if (!supabase) {
      return NextResponse.json({
        success: true,
        count: 0,
        properties: []
      });
    }
    
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
    }

    const supabase = createSupabaseClient();
    
    // If Supabase is not configured, return mock success
    if (!supabase) {
      
      // Create a mock property object
      const mockProperty = {
        id: Date.now().toString(),
        title: propertyData.title || 'Property',
        price: extractPrice(propertyData.price || '£0'),
        address: propertyData.address || 'Address not available',
        description: propertyData.description || '',
        bedrooms: propertyData.bedrooms || 0,
        bathrooms: propertyData.bathrooms || 0,
        property_type: propertyData.propertyType || propertyData.property_type || 'Property',
        tenure: propertyData.tenure || 'Unknown',
        postcode: propertyData.postcode || '',
        latitude: propertyData.latitude || null,
        longitude: propertyData.longitude || null,
        original_url: propertyData.original_url || propertyData.url || '',
        source: propertyData.source || 'chrome-extension',
        agent_name: propertyData.agent_name || 'Unknown Agent',
        agent_phone: propertyData.agent_phone || '',
        images: propertyData.images || ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&crop=center'],
        captured_at: new Date().toISOString(),
        notes: propertyData.notes || '',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        days_on_market: propertyData.days_on_market || 30,
        user_id: '00000000-0000-0000-0000-000000000000'
      };
      
      // Also add to watchlist via the watchlist API
      try {
        const watchlistResponse = await fetch(`${request.nextUrl.origin}/api/watchlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockProperty)
        });
        
        if (watchlistResponse.ok) {
          console.log('Property Intelligence Platform: Property also saved to watchlist storage');
        } else {
          console.error('Property Intelligence Platform: Failed to save to watchlist storage:', await watchlistResponse.text());
        }
      } catch (watchlistError) {
        console.error('Property Intelligence Platform: Error saving to watchlist storage:', watchlistError);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Property captured successfully (mock)',
        property: mockProperty
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
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
        } else {
        }
      } catch (authError) {
      }
    } else {
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
    const supabase = createSupabaseClient();
    
    // If Supabase is not configured, return mock success
    if (!supabase) {
      return NextResponse.json({
        success: true,
        message: 'Property updated successfully (mock)',
        property: { id: 'mock-id', updated_at: new Date().toISOString() }
      });
    }
    
    const updateData = await request.json();
    const { 
      id, 
      price, 
      title,
      address,
      description,
      bedrooms,
      bathrooms,
      property_type,
      tenure,
      postcode,
      agent_name,
      agent_phone,
      refurbishment_cost, 
      user_notes, 
      property_condition, 
      estimated_fair_value, 
      custom_rental_estimate, 
      status,
      mortgage_type,
      mortgage_rate,
      mortgage_term,
      offer_amount,
      offer_date,
      offer_status,
      days_on_market
    } = updateData;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const updateFields: any = {
      updated_at: new Date().toISOString()
    };

    // Add fields to update if they exist
    if (price !== undefined) updateFields.price = extractPrice(price);
    if (title !== undefined) updateFields.title = title;
    if (address !== undefined) updateFields.address = address;
    if (description !== undefined) updateFields.description = description;
    if (bedrooms !== undefined) updateFields.bedrooms = bedrooms;
    if (bathrooms !== undefined) updateFields.bathrooms = bathrooms;
    if (property_type !== undefined) updateFields.property_type = property_type;
    if (tenure !== undefined) updateFields.tenure = tenure;
    if (postcode !== undefined) updateFields.postcode = postcode;
    if (agent_name !== undefined) updateFields.agent_name = agent_name;
    if (agent_phone !== undefined) updateFields.agent_phone = agent_phone;
    if (refurbishment_cost !== undefined) updateFields.refurbishment_cost = refurbishment_cost;
    if (user_notes !== undefined) updateFields.user_notes = user_notes;
    if (property_condition !== undefined) updateFields.property_condition = property_condition;
    if (estimated_fair_value !== undefined) updateFields.estimated_fair_value = estimated_fair_value;
    if (custom_rental_estimate !== undefined) updateFields.custom_rental_estimate = custom_rental_estimate;
    if (status !== undefined) updateFields.status = status;
    if (mortgage_type !== undefined) updateFields.mortgage_type = mortgage_type;
    if (mortgage_rate !== undefined) updateFields.mortgage_rate = mortgage_rate;
    if (mortgage_term !== undefined) updateFields.mortgage_term = mortgage_term;
    if (offer_amount !== undefined) updateFields.offer_amount = offer_amount;
    if (offer_date !== undefined) updateFields.offer_date = offer_date;
    if (offer_status !== undefined) updateFields.offer_status = offer_status;
    if (days_on_market !== undefined) updateFields.days_on_market = days_on_market;

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
    const supabase = createSupabaseClient();
    
    // If Supabase is not configured, return mock success
    if (!supabase) {
      return NextResponse.json({
        success: true,
        message: 'Property deleted successfully (mock)'
      });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }


    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
    }


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
    return extractedPrice;
  }
  
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
  const supabase = createSupabaseClient();
  const { error } = await supabase.rpc('create_watchlist_table', {});
  
  if (error) {
    console.error('Error creating watchlist table:', error);
    // If RPC doesn't exist, we'll need to create the table manually
    // For now, let's just log the error
  }
} 