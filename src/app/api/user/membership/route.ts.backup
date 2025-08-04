import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        tier: 'free', 
        authenticated: false,
        error: 'No token provided' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json({ 
        tier: 'free', 
        authenticated: false,
        error: 'Invalid token' 
      }, { status: 401 });
    }

    // Get user profile and subscription data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ 
        tier: 'free', 
        authenticated: true,
        error: 'Failed to fetch profile' 
      }, { status: 500 });
    }

    // Determine user tier
    let tier = 'free';
    let features = {
      canSaveProperties: false,
      canAccessWatchlist: false,
      canExportData: false,
      maxSavedProperties: 0,
      canUseAdvancedFeatures: false,
      currentSavedProperties: 0
    };

    if (profile?.subscription_tier) {
      tier = profile.subscription_tier;
      
      switch (tier) {
        case 'premium':
          features = {
            canSaveProperties: true,
            canAccessWatchlist: true,
            canExportData: true,
            maxSavedProperties: -1, // Unlimited
            canUseAdvancedFeatures: true,
            currentSavedProperties: 0
          };
          break;
        case 'mid-term':
          features = {
            canSaveProperties: true,
            canAccessWatchlist: true,
            canExportData: false,
            maxSavedProperties: 50,
            canUseAdvancedFeatures: false,
            currentSavedProperties: 0
          };
          break;
        case 'free':
        default:
          features = {
            canSaveProperties: false,
            canAccessWatchlist: false,
            canExportData: false,
            maxSavedProperties: 0,
            canUseAdvancedFeatures: false,
            currentSavedProperties: 0
          };
          break;
      }
    }

    // Get current watchlist count for free/mid-tier users
    if (tier !== 'premium') {
      const { count } = await supabase
        .from('watchlist')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      features.currentSavedProperties = count || 0;
    }

    return NextResponse.json({
      tier: tier,
      authenticated: true,
      features: features,
      user: {
        id: user.id,
        email: user.email,
        name: profile?.full_name || user.email?.split('@')[0] || 'User'
      }
    });

  } catch (error) {
    console.error('Membership check error:', error);
    return NextResponse.json({ 
      tier: 'free', 
      authenticated: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 