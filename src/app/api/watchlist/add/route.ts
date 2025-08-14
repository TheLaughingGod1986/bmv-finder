import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

// Only create client if we have valid credentials
const supabase = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseKey !== 'placeholder-key'
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is properly configured
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Watchlist service not configured',
        message: 'Please configure Supabase environment variables'
      }, { status: 503 });
    }

    const body = await request.json();
    const { propertyData, userId } = body;

    if (!propertyData || !userId) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // Check if property already exists in watchlist
    const { data: existing, error: checkError } = await supabase
      .from('watchlist_properties')
      .select('id')
      .eq('user_id', userId)
      .eq('property_id', propertyData.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Watchlist check error:', checkError);
      return NextResponse.json({ error: 'Failed to check watchlist' }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ error: 'Property already in watchlist' }, { status: 409 });
    }

    // Add property to watchlist
    const { data, error } = await supabase
      .from('watchlist_properties')
      .insert([{
        user_id: userId,
        property_id: propertyData.id,
        property_data: propertyData,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Watchlist add error:', error);
      return NextResponse.json({ error: 'Failed to add property to watchlist' }, { status: 500 });
    }

    return NextResponse.json(data[0]);

  } catch (error) {
    console.error('Watchlist add API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
