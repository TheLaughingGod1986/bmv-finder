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
        error: 'Portfolio service not configured',
        message: 'Please configure Supabase environment variables'
      }, { status: 503 });
    }

    const body = await request.json();
    const { propertyData, userId } = body;

    if (!propertyData || !userId) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('portfolio_properties')
      .insert([{
        user_id: userId,
        property_data: propertyData,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Portfolio add error:', error);
      return NextResponse.json({ error: 'Failed to add property to portfolio' }, { status: 500 });
    }

    return NextResponse.json(data[0]);

  } catch (error) {
    console.error('Portfolio add API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
