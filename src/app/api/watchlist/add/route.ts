import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Only create Supabase client if environment variables are available
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not configured');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get request body
    const propertyData = await request.json();
    
    if (!propertyData || !propertyData.price || !propertyData.title) {
      return NextResponse.json({ error: 'Invalid property data' }, { status: 400 });
    }

    // Check user membership and limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = profile?.subscription_tier || 'free';
    
    // Check if user can save properties
    if (tier === 'free') {
      return NextResponse.json({ 
        error: 'Free users cannot save properties. Please upgrade to save properties to your watchlist.' 
      }, { status: 403 });
    }

    // Check property limit for mid-tier users
    if (tier === 'mid-term') {
      const { count } = await supabase
        .from('watchlist')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (count && count >= 50) {
        return NextResponse.json({ 
          error: 'You have reached the maximum number of saved properties (50). Please upgrade to premium for unlimited saves.' 
        }, { status: 403 });
      }
    }

    // Check if property already exists in user's watchlist
    const { data: existingProperty } = await supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('original_url', propertyData.url)
      .single();

    if (existingProperty) {
      return NextResponse.json({ 
        error: 'This property is already in your watchlist' 
      }, { status: 409 });
    }

    // Prepare property data for insertion
    const watchlistItem = {
      user_id: user.id,
      title: propertyData.title,
      price: extractPrice(propertyData.price),
      address: propertyData.address || '',
      description: propertyData.description || '',
      bedrooms: extractNumber(propertyData.bedrooms),
      bathrooms: extractNumber(propertyData.bathrooms),
      property_type: propertyData.propertyType || '',
      tenure: propertyData.tenure || '',
      postcode: propertyData.postcode || '',
      latitude: propertyData.coordinates?.lat || null,
      longitude: propertyData.coordinates?.lng || null,
      original_url: propertyData.url,
      source: propertyData.source,
      agent_name: propertyData.agent || '',
      agent_phone: propertyData.agentPhone || '',
      images: propertyData.images || [],
      captured_at: propertyData.capturedAt || new Date().toISOString(),
      notes: '',
      status: 'active'
    };

    // Insert into watchlist
    const { data: savedProperty, error: insertError } = await supabase
      .from('watchlist')
      .insert(watchlistItem)
      .select()
      .single();

    if (insertError) {
      console.error('Watchlist insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save property' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Property added to watchlist successfully',
      property: savedProperty
    });

  } catch (error) {
    console.error('Watchlist add error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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