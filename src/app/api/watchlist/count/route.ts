import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Only create Supabase client if environment variables are available
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return null; // Return null instead of throwing error
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient();
    
    // If Supabase is not configured, return mock count
    if (!supabase) {
      console.log('Supabase not configured, returning mock count');
      return NextResponse.json({
        count: 3, // Mock count from our mock data
        tier: 'premium',
        maxAllowed: -1 // Unlimited for premium
      });
    }
    
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

    // Get user membership tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = profile?.subscription_tier || 'free';
    
    // Free users can't access watchlist
    if (tier === 'free') {
      return NextResponse.json({ 
        count: 0,
        tier: 'free',
        message: 'Free users cannot access watchlist' 
      }, { status: 403 });
    }

    // Get count of active properties in watchlist
    const { count, error: countError } = await supabase
      .from('watchlist')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (countError) {
      console.error('Watchlist count error:', countError);
      return NextResponse.json({ error: 'Failed to get watchlist count' }, { status: 500 });
    }

    return NextResponse.json({
      count: count || 0,
      tier: tier,
      maxAllowed: tier === 'premium' ? -1 : 50 // -1 means unlimited
    });

  } catch (error) {
    console.error('Watchlist count error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 