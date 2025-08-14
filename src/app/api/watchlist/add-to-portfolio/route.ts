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
        error: 'Watchlist add-to-portfolio service not configured',
        message: 'Please configure Supabase environment variables'
      }, { status: 503 });
    }

    const body = await request.json();
    const { propertyData, userId } = body;

    if (!propertyData || !userId) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // Check if property already exists in portfolio
    const { data: existing, error: checkError } = await supabase
      .from('portfolio_properties')
      .select('id')
      .eq('user_id', userId)
      .eq('property_id', propertyData.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Portfolio check error:', checkError);
      return NextResponse.json({ error: 'Failed to check portfolio' }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ error: 'Property already in portfolio' }, { status: 409 });
    }

    // Add property to portfolio
    const { data, error } = await supabase
      .from('portfolio_properties')
      .insert([{
        user_id: userId,
        property_id: propertyData.id,
        property_data: propertyData,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Portfolio add error:', error);
      return NextResponse.json({ error: 'Failed to add property to portfolio' }, { status: 500 });
    }

    // Remove from watchlist
    const { error: removeError } = await supabase
      .from('watchlist_properties')
      .delete()
      .eq('user_id', userId)
      .eq('property_id', propertyData.id);

    if (removeError) {
      console.error('Watchlist remove error:', removeError);
      // Don't fail the request if removing from watchlist fails
    }

    return NextResponse.json(data[0]);

  } catch (error) {
    console.error('Watchlist add-to-portfolio API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
