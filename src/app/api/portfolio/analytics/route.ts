import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

// Only create client if we have valid credentials
const supabase = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseKey !== 'placeholder-key'
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is properly configured
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Portfolio analytics service not configured',
        message: 'Please configure Supabase environment variables'
      }, { status: 503 });
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Fetch user's portfolio properties for analytics
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolio_properties')
      .select('*')
      .eq('user_id', user.id);

    if (portfolioError) {
      console.error('Portfolio analytics fetch error:', portfolioError);
      return NextResponse.json({ error: 'Failed to fetch portfolio analytics' }, { status: 500 });
    }

    // Calculate basic analytics
    const totalProperties = portfolio?.length || 0;
    const totalValue = portfolio?.reduce((sum, prop) => {
      const value = prop.property_data?.price || 0;
      return sum + value;
    }, 0) || 0;

    const analytics = {
      totalProperties,
      totalValue,
      averageValue: totalProperties > 0 ? totalValue / totalProperties : 0,
      propertyTypes: portfolio?.reduce((types, prop) => {
        const type = prop.property_data?.propertyType || 'Unknown';
        types[type] = (types[type] || 0) + 1;
        return types;
      }, {} as Record<string, number>) || {}
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Portfolio analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
