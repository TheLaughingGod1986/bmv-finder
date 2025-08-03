import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Mock data for development when Supabase is not configured
const mockWatchlistData = [
  {
    id: '1',
    title: 'Modern 2-Bed Apartment',
    price: 189950,
    address: '15 Ambergate Way, Manchester',
    description: 'Beautiful modern apartment with great investment potential',
    bedrooms: 2,
    bathrooms: 1,
    property_type: 'Apartment',
    tenure: 'Leasehold',
    postcode: 'M1 2AB',
    latitude: 53.4808,
    longitude: -2.2426,
    original_url: 'https://example.com/property1',
    source: 'Rightmove',
    agent_name: 'ABC Estate Agents',
    agent_phone: '0161 123 4567',
    images: ['https://via.placeholder.com/400x300'],
    captured_at: '2024-01-15T10:30:00Z',
    notes: 'Great location, good rental yield potential',
    status: 'active',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    refurbishment_cost: 5000,
    property_condition: 'Good',
    days_on_market: 45,
    user_id: '00000000-0000-0000-0000-000000000000'
  },
  {
    id: '2',
    title: 'Victorian Terrace House',
    price: 129950,
    address: '23 Lowbiggin, Liverpool',
    description: 'Charming Victorian terrace with period features',
    bedrooms: 3,
    bathrooms: 1,
    property_type: 'House',
    tenure: 'Freehold',
    postcode: 'L1 3CD',
    latitude: 53.4084,
    longitude: -2.9916,
    original_url: 'https://example.com/property2',
    source: 'Zoopla',
    agent_name: 'XYZ Properties',
    agent_phone: '0151 987 6543',
    images: ['https://via.placeholder.com/400x300'],
    captured_at: '2024-01-14T14:20:00Z',
    notes: 'Needs some renovation but great potential',
    status: 'active',
    created_at: '2024-01-14T14:20:00Z',
    updated_at: '2024-01-14T14:20:00Z',
    refurbishment_cost: 15000,
    property_condition: 'Fair',
    days_on_market: 67,
    user_id: '00000000-0000-0000-0000-000000000000'
  },
  {
    id: '3',
    title: 'New Build Studio',
    price: 95000,
    address: '7 Riverside Court, Birmingham',
    description: 'Modern studio apartment in prime location',
    bedrooms: 1,
    bathrooms: 1,
    property_type: 'Studio',
    tenure: 'Leasehold',
    postcode: 'B1 4EF',
    latitude: 52.4862,
    longitude: -1.8904,
    original_url: 'https://example.com/property3',
    source: 'OnTheMarket',
    agent_name: 'City Homes',
    agent_phone: '0121 456 7890',
    images: ['https://via.placeholder.com/400x300'],
    captured_at: '2024-01-13T09:15:00Z',
    notes: 'Perfect for first-time investors',
    status: 'active',
    created_at: '2024-01-13T09:15:00Z',
    updated_at: '2024-01-13T09:15:00Z',
    refurbishment_cost: 0,
    property_condition: 'Excellent',
    days_on_market: 23,
    user_id: '00000000-0000-0000-0000-000000000000'
  }
];

// Only create Supabase client if environment variables are available
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return null; // Return null instead of throwing error
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    
    // If Supabase is not configured, return mock data
    if (!supabase) {
      console.log('Supabase not configured, returning mock data');
      return NextResponse.json({
        success: true,
        count: mockWatchlistData.length,
        properties: mockWatchlistData
      });
    }
    
    // Get current user from authorization header if available
    const authHeader = request.headers.get('authorization');
    let userId = '00000000-0000-0000-0000-000000000000'; // Default user ID
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (!error && user) {
          userId = user.id;
        }
      } catch (authError) {
        console.log('Auth error, using default user ID:', authError);
      }
    }

    // Fetch properties for the user (or default user if not authenticated)
    const { data: properties, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching watchlist:', error);
      return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: properties?.length || 0,
      properties: properties || []
    });

  } catch (error) {
    console.error('Watchlist API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 