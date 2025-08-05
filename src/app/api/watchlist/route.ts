import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// In-memory storage for captured properties (for development without Supabase)
// This will persist for the lifetime of the server process
let capturedProperties: any[] = [];

// Try to load from a simple file-based storage for persistence
const fs = require('fs');
const path = require('path');
const storageFile = path.join(process.cwd(), 'watchlist-storage.json');

// Load existing data on startup
try {
  if (fs.existsSync(storageFile)) {
    const data = fs.readFileSync(storageFile, 'utf8');
    capturedProperties = JSON.parse(data);
  }
} catch (error) {
  console.log('No existing watchlist storage found, starting fresh');
}

// Helper function to save to file
const saveToFile = () => {
  try {
    fs.writeFileSync(storageFile, JSON.stringify(capturedProperties, null, 2));
  } catch (error) {
    console.error('Failed to save watchlist data:', error);
  }
};

const mockWatchlistData = [
  {
    id: '1',
    title: '4 bedroom detached house for sale in Oakwood Drive, Manchester',
    price: 425000,
    address: 'Oakwood Drive, Didsbury, Manchester, M20',
    description: 'Spacious 4-bedroom detached family home in sought-after Didsbury area',
    bedrooms: 4,
    bathrooms: 2,
    property_type: 'Detached House',
    tenure: 'Freehold',
    postcode: 'M20 2XX',
    latitude: 53.4084,
    longitude: -2.2333,
    original_url: 'https://www.rightmove.co.uk/properties/160212584#/?channel=RES_BUY',
    source: 'Rightmove',
    agent_name: 'Your Move',
    agent_phone: '0161 123 4567',
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&crop=center'], // UK detached house
    captured_at: '2024-01-15T10:30:00Z',
    notes: 'Great family home with excellent schools nearby',
    status: 'active',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    refurbishment_cost: 8000,
    property_condition: 'Good',
    days_on_market: 45,
    user_id: '00000000-0000-0000-0000-000000000000'
  },
  {
    id: '2',
    title: '3 bedroom semi-detached house for sale in Victoria Road, Birmingham',
    price: 285000,
    address: 'Victoria Road, Edgbaston, Birmingham, B15',
    description: 'Victorian semi-detached house with period features and modern updates',
    bedrooms: 3,
    bathrooms: 1,
    property_type: 'Semi-Detached House',
    tenure: 'Freehold',
    postcode: 'B15 3XX',
    latitude: 52.4862,
    longitude: -1.8904,
    original_url: 'https://www.zoopla.co.uk/for-sale/details/12345678',
    source: 'Zoopla',
    agent_name: 'Connells',
    agent_phone: '0121 987 6543',
    images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop&crop=center'], // UK semi-detached
    captured_at: '2024-01-14T14:20:00Z',
    notes: 'Excellent location near transport links and amenities',
    status: 'active',
    created_at: '2024-01-14T14:20:00Z',
    updated_at: '2024-01-14T14:20:00Z',
    refurbishment_cost: 12000,
    property_condition: 'Fair',
    days_on_market: 67,
    user_id: '00000000-0000-0000-0000-000000000000'
  },
  {
    id: '3',
    title: '2 bedroom apartment for sale in Canary Wharf, London',
    price: 495000,
    address: 'Canary Wharf, Tower Hamlets, London, E14',
    description: 'Modern riverside apartment with stunning city views',
    bedrooms: 2,
    bathrooms: 1,
    property_type: 'Apartment',
    tenure: 'Leasehold',
    postcode: 'E14 5XX',
    latitude: 51.5055,
    longitude: -0.0235,
    original_url: 'https://www.onthemarket.com/details/87654321',
    source: 'OnTheMarket',
    agent_name: 'Savills',
    agent_phone: '020 456 7890',
    images: ['https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400&h=300&fit=crop&crop=center'], // UK apartment interior
    captured_at: '2024-01-13T09:15:00Z',
    notes: 'Perfect for young professionals or investors',
    status: 'active',
    created_at: '2024-01-13T10:30:00Z',
    updated_at: '2024-01-13T10:30:00Z',
    refurbishment_cost: 3000,
    property_condition: 'Excellent',
    days_on_market: 23,
    user_id: '00000000-0000-0000-0000-000000000000'
  },
  {
    id: '4',
    title: '3 bedroom terraced house for sale in Clifton Road, Bristol',
    price: 375000,
    address: 'Clifton Road, Clifton, Bristol, BS8',
    description: 'Beautiful Victorian terraced house in sought-after Clifton area',
    bedrooms: 3,
    bathrooms: 1,
    property_type: 'Terraced House',
    tenure: 'Freehold',
    postcode: 'BS8 4XX',
    latitude: 51.4545,
    longitude: -2.5879,
    original_url: 'https://www.rightmove.co.uk/properties/160212585#/?channel=RES_BUY',
    source: 'Rightmove',
    agent_name: 'Sanderson Young',
    agent_phone: '0117 223 4567',
    images: ['https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=400&h=300&fit=crop&crop=center'], // UK terraced house
    captured_at: '2024-01-12T16:45:00Z',
    notes: 'Period features, great location near university',
    status: 'active',
    created_at: '2024-01-12T16:45:00Z',
    updated_at: '2024-01-12T16:45:00Z',
    refurbishment_cost: 15000,
    property_condition: 'Good',
    days_on_market: 34,
    user_id: '00000000-0000-0000-0000-000000000000'
  },
  {
    id: '5',
    title: '1 bedroom flat for sale in Princes Street, Edinburgh',
    price: 245000,
    address: 'Princes Street, Edinburgh, EH2',
    description: 'Modern first-floor flat in prime Edinburgh location',
    bedrooms: 1,
    bathrooms: 1,
    property_type: 'Flat',
    tenure: 'Leasehold',
    postcode: 'EH2 1XX',
    latitude: 55.9533,
    longitude: -3.1883,
    original_url: 'https://www.zoopla.co.uk/for-sale/details/12345679',
    source: 'Zoopla',
    agent_name: 'Rook Matthews Sayer',
    agent_phone: '0131 285 1234',
    images: ['https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400&h=300&fit=crop&crop=center'], // UK flat interior
    captured_at: '2024-01-11T11:20:00Z',
    notes: 'Perfect starter home or investment property',
    status: 'active',
    created_at: '2024-01-11T11:20:00Z',
    updated_at: '2024-01-11T11:20:00Z',
    refurbishment_cost: 2000,
    property_condition: 'Excellent',
    days_on_market: 18,
    user_id: '00000000-0000-0000-0000-000000000000'
  },
  {
    id: '6',
    title: '5 bedroom detached house for sale in Richmond Hill, Bath',
    price: 875000,
    address: 'Richmond Hill, Bath, BA1',
    description: 'Stunning Georgian townhouse with period features and modern amenities',
    bedrooms: 5,
    bathrooms: 3,
    property_type: 'Detached House',
    tenure: 'Freehold',
    postcode: 'BA1 5XX',
    latitude: 51.3758,
    longitude: -2.3599,
    original_url: 'https://www.rightmove.co.uk/properties/160212586#/?channel=RES_BUY',
    source: 'Rightmove',
    agent_name: 'Knight Frank',
    agent_phone: '01225 123 4567',
    images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&crop=center'], // UK Georgian house
    captured_at: '2024-01-10T14:30:00Z',
    notes: 'Luxury family home in historic Bath',
    status: 'active',
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-10T14:30:00Z',
    refurbishment_cost: 25000,
    property_condition: 'Excellent',
    days_on_market: 12,
    user_id: '00000000-0000-0000-0000-000000000000'
  },
  {
    id: '7',
    title: '2 bedroom cottage for sale in Cotswold Lane, Cheltenham',
    price: 325000,
    address: 'Cotswold Lane, Cheltenham, GL50',
    description: 'Charming stone cottage in the heart of the Cotswolds',
    bedrooms: 2,
    bathrooms: 1,
    property_type: 'Cottage',
    tenure: 'Freehold',
    postcode: 'GL50 3XX',
    latitude: 51.8994,
    longitude: -2.0783,
    original_url: 'https://www.zoopla.co.uk/for-sale/details/12345680',
    source: 'Zoopla',
    agent_name: 'Strutt & Parker',
    agent_phone: '01242 123 4567',
    images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop&crop=center'], // UK cottage
    captured_at: '2024-01-09T09:45:00Z',
    notes: 'Perfect weekend retreat or holiday let',
    status: 'active',
    created_at: '2024-01-09T09:45:00Z',
    updated_at: '2024-01-09T09:45:00Z',
    refurbishment_cost: 8000,
    property_condition: 'Good',
    days_on_market: 28,
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
    
    // If Supabase is not configured, return mock data + captured properties
    if (!supabase) {
      const allProperties = [...mockWatchlistData, ...capturedProperties];
      return NextResponse.json({
        success: true,
        count: allProperties.length,
        properties: allProperties
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

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    
    // If Supabase is not configured, add to in-memory storage
    if (!supabase) {
      const propertyData = await request.json();
      
      // Add the captured property to in-memory storage
      const newProperty = {
        id: Date.now().toString(),
        ...propertyData,
        captured_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
        user_id: '00000000-0000-0000-0000-000000000000'
      };
      
      capturedProperties.push(newProperty);
      saveToFile(); // Save to file for persistence
      
      return NextResponse.json({
        success: true,
        message: 'Property added to watchlist',
        property: newProperty
      });
    }
    
    // If Supabase is configured, use the real database
    const propertyData = await request.json();
    const { data, error } = await supabase
      .from('watchlist')
      .insert([propertyData])
      .select()
      .single();
      
    if (error) {
      console.error('Watchlist insert error:', error);
      return NextResponse.json({ error: 'Failed to add property to watchlist' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Property added to watchlist',
      property: data
    });
    
  } catch (error) {
    console.error('Watchlist POST error:', error);
    return NextResponse.json({ error: 'Failed to add property to watchlist' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    
    // If Supabase is not configured, update in-memory storage
    if (!supabase) {
      const updateData = await request.json();
      const { id, ...updateFields } = updateData;
      
      if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
      }
      
      // Find and update the property in both mock data and captured properties
      let updatedProperty = null;
      
      // Update in mock data
      const mockIndex = mockWatchlistData.findIndex(p => p.id === id);
      if (mockIndex !== -1) {
        mockWatchlistData[mockIndex] = {
          ...mockWatchlistData[mockIndex],
          ...updateFields,
          updated_at: new Date().toISOString()
        };
        updatedProperty = mockWatchlistData[mockIndex];
      }
      
      // Update in captured properties
      const capturedIndex = capturedProperties.findIndex(p => p.id === id);
      if (capturedIndex !== -1) {
        capturedProperties[capturedIndex] = {
          ...capturedProperties[capturedIndex],
          ...updateFields,
          updated_at: new Date().toISOString()
        };
        updatedProperty = capturedProperties[capturedIndex];
      }
      
      if (!updatedProperty) {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
      }
      
      saveToFile(); // Save to file for persistence
      
      return NextResponse.json({
        success: true,
        message: 'Property updated successfully (mock)',
        property: updatedProperty
      });
    }
    
    // If Supabase is configured, use the real database
    const updateData = await request.json();
    const { id, ...updateFields } = updateData;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('watchlist')
      .update({
        ...updateFields,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Watchlist update error:', error);
      return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Property updated successfully',
      property: data
    });
    
  } catch (error) {
    console.error('Watchlist PUT error:', error);
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    // If Supabase is not configured, delete from in-memory storage
    if (!supabase) {
      // Remove from mock data
      const mockIndex = mockWatchlistData.findIndex(p => p.id === id);
      if (mockIndex !== -1) {
        mockWatchlistData.splice(mockIndex, 1);
      }
      
      // Remove from captured properties
      const capturedIndex = capturedProperties.findIndex(p => p.id === id);
      if (capturedIndex !== -1) {
        capturedProperties.splice(capturedIndex, 1);
        saveToFile(); // Save to file for persistence
      }
      
      return NextResponse.json({
        success: true,
        message: 'Property deleted successfully (mock)'
      });
    }
    
    // If Supabase is configured, use the real database
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Watchlist delete error:', error);
      return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Property deleted successfully'
    });
    
  } catch (error) {
    console.error('Watchlist DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
  }
} 